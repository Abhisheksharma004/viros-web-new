import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { toDateOnlyString } from "@/lib/dateOnly";
import {
    ensureAdminLeaveModule,
    mapOrgSettingsRowToApi,
    mapPolicyRowToApi,
    type AdminLeaveOrgSettingsRow,
    type AdminLeavePolicyRow,
} from "@/lib/adminLeavePolicies";
import {
    clearSyncedLeaveAttendance,
    syncApprovedLeaveToAttendance,
} from "@/lib/attendanceLeaveSync";
import {
    collectLeaveRequestErrors,
    countLeaveDays,
    validateLeaveRequest,
    type ValidateLeaveInput,
} from "@/lib/leaveValidation";

export { countLeaveDays, validateLeaveRequest, type ValidateLeaveInput, collectLeaveRequestErrors };

const REQUESTS_TABLE = "employee_leave_requests";

export type LeaveDayType = "full" | "first-half" | "second-half";
export type LeaveRequestStatus =
    | "pending"
    | "l1_approved"
    | "approved"
    | "rejected"
    | "cancelled";

export type LeaveRejectionStage = "l1" | "l2";

export const LEAVE_REQUEST_STATUSES: LeaveRequestStatus[] = [
    "pending",
    "l1_approved",
    "approved",
    "rejected",
    "cancelled",
];

export function leaveRequestStatusLabel(
    status: LeaveRequestStatus,
    rejectedAtStage?: LeaveRejectionStage | null,
): string {
    if (status === "rejected" && rejectedAtStage) {
        const short =
            rejectedAtStage === "l1" ? "Rejected at L1" : "Rejected at L2";
        return short;
    }
    switch (status) {
        case "pending":
            return "Pending L1";
        case "l1_approved":
            return "L1 Approved";
        case "approved":
            return "L2 Approved";
        case "rejected":
            return "Rejected";
        case "cancelled":
            return "Cancelled";
        default:
            return status;
    }
}

export type EmployeeLeavePolicy = ReturnType<typeof mapPolicyRowToApi>;
export type EmployeeLeaveOrgSettings = ReturnType<typeof mapOrgSettingsRowToApi>;

export type EmployeeLeaveRequestRow = RowDataPacket & {
    id: number;
    request_id: string | null;
    employee_id: string;
    policy_id: number;
    policy_code: string;
    policy_name: string;
    start_date: string | Date;
    end_date: string | Date;
    days: number;
    day_type: LeaveDayType;
    reason: string;
    attachment_name: string | null;
    status: LeaveRequestStatus;
    rejected_at_stage: LeaveRejectionStage | null;
    rejection_reason: string | null;
    applied_on: string | Date;
};

/** Calendar date as YYYY-MM-DD (avoids UTC shift on MySQL DATE values). */
function toDateIso(raw: string | Date | null | undefined): string {
    return toDateOnlyString(raw);
}

let ensureRequestsPromise: Promise<void> | null = null;
let leaveSchemaReady = false;
let requestIdBackfillDone = false;

async function getRequestTableColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${REQUESTS_TABLE}`);
    return new Set(rows.map((r) => String(r.Field)));
}

const LEAVE_REQUEST_ID_PREFIX = "VEL";
const LEAVE_REQUEST_ID_PATTERN = /^VEL\d{6}$/;

/** VEL + mmyy (4 digits) e.g. VEL0526 */
export function leaveRequestIdPrefix(appliedOn: string | Date): string {
    const applied = toDateIso(appliedOn);
    const d = applied ? new Date(applied + "T12:00:00") : new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${LEAVE_REQUEST_ID_PREFIX}${mm}${yy}`;
}

/** Format: VEL + mmyy + 2-digit serial — e.g. VEL052601 */
export function formatLeaveRequestId(appliedOn: string | Date, serial: number): string {
    const prefix = leaveRequestIdPrefix(appliedOn);
    if (!Number.isFinite(serial) || serial < 1 || serial > 99) {
        throw new Error("Leave request serial must be between 01 and 99 for the month.");
    }
    return `${prefix}${String(serial).padStart(2, "0")}`;
}

async function allocateNextLeaveRequestId(appliedOn: string | Date): Promise<string> {
    const prefix = leaveRequestIdPrefix(appliedOn);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT request_id FROM ${REQUESTS_TABLE}
         WHERE request_id LIKE ?
         ORDER BY request_id DESC
         LIMIT 1`,
        [`${prefix}%`],
    );
    let next = 1;
    const last = rows[0]?.request_id;
    if (typeof last === "string" && last.startsWith(prefix) && last.length >= prefix.length + 2) {
        const parsed = parseInt(last.slice(prefix.length), 10);
        if (Number.isFinite(parsed) && parsed >= 1) next = parsed + 1;
    }
    return formatLeaveRequestId(appliedOn, next);
}

async function backfillLeaveRequestIds() {
    if (requestIdBackfillDone) return;

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, applied_on, request_id FROM ${REQUESTS_TABLE}
         WHERE request_id IS NULL
            OR TRIM(request_id) = ''
            OR request_id NOT REGEXP '^VEL[0-9]{6}$'
         ORDER BY applied_on ASC, id ASC`,
    );
    if (!rows.length) {
        requestIdBackfillDone = true;
        return;
    }

    const [velRows] = await pool.query<RowDataPacket[]>(
        `SELECT request_id FROM ${REQUESTS_TABLE} WHERE request_id REGEXP '^VEL[0-9]{6}$'`,
    );
    const maxSerialByPrefix = new Map<string, number>();
    for (const row of velRows) {
        const id = String(row.request_id ?? "");
        if (!LEAVE_REQUEST_ID_PATTERN.test(id)) continue;
        const prefix = id.slice(0, 7);
        const serial = parseInt(id.slice(7), 10);
        if (Number.isFinite(serial)) {
            maxSerialByPrefix.set(prefix, Math.max(maxSerialByPrefix.get(prefix) ?? 0, serial));
        }
    }

    for (const row of rows) {
        const appliedOn = row.applied_on;
        const prefix = leaveRequestIdPrefix(appliedOn as string | Date);
        const next = (maxSerialByPrefix.get(prefix) ?? 0) + 1;
        if (next > 99) continue;
        maxSerialByPrefix.set(prefix, next);
        const requestId = formatLeaveRequestId(appliedOn as string | Date, next);
        await pool.query(`UPDATE ${REQUESTS_TABLE} SET request_id = ? WHERE id = ?`, [
            requestId,
            row.id,
        ]);
    }
    requestIdBackfillDone = true;
}

async function runEnsureEmployeeLeaveRequestsTable() {
    await ensureAdminLeaveModule();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${REQUESTS_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id VARCHAR(32) NULL,
            employee_id VARCHAR(64) NOT NULL,
            policy_id INT NOT NULL,
            policy_code VARCHAR(8) NOT NULL,
            policy_name VARCHAR(255) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days DECIMAL(6,2) NOT NULL,
            day_type ENUM('full', 'first-half', 'second-half') NOT NULL DEFAULT 'full',
            reason TEXT NOT NULL,
            attachment_name VARCHAR(500) NULL,
            status ENUM('pending', 'l1_approved', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
            rejected_at_stage ENUM('l1', 'l2') NULL,
            rejection_reason TEXT NULL,
            applied_on DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_employee_leave_requests_employee (employee_id),
            INDEX idx_employee_leave_requests_policy (policy_id),
            INDEX idx_employee_leave_requests_status (status)
        )
    `);

    let columns = await getRequestTableColumns();

    if (!columns.has("request_id")) {
        await pool.query(
            `ALTER TABLE ${REQUESTS_TABLE} ADD COLUMN request_id VARCHAR(32) NULL AFTER id`,
        );
        columns = await getRequestTableColumns();
    }

    await backfillLeaveRequestIds();

    try {
        await pool.query(
            `ALTER TABLE ${REQUESTS_TABLE} MODIFY COLUMN request_id VARCHAR(32) NOT NULL`,
        );
    } catch {
        // Column may already be NOT NULL
    }

    try {
        await pool.query(
            `CREATE UNIQUE INDEX idx_employee_leave_requests_request_id ON ${REQUESTS_TABLE} (request_id)`,
        );
    } catch {
        // Index may already exist
    }

    try {
        await pool.query(
            `ALTER TABLE ${REQUESTS_TABLE}
             MODIFY COLUMN status ENUM('pending', 'l1_approved', 'approved', 'rejected', 'cancelled')
             NOT NULL DEFAULT 'pending'`,
        );
    } catch {
        // ENUM may already include l1_approved
    }

    columns = await getRequestTableColumns();
    if (!columns.has("rejected_at_stage")) {
        await pool.query(
            `ALTER TABLE ${REQUESTS_TABLE}
             ADD COLUMN rejected_at_stage ENUM('l1', 'l2') NULL AFTER status`,
        );
        columns = await getRequestTableColumns();
    }
    if (!columns.has("rejection_reason")) {
        await pool.query(
            `ALTER TABLE ${REQUESTS_TABLE} ADD COLUMN rejection_reason TEXT NULL AFTER rejected_at_stage`,
        );
    }

    await pool.query(
        `UPDATE ${REQUESTS_TABLE}
         SET rejected_at_stage = 'l1'
         WHERE status = 'rejected' AND rejected_at_stage IS NULL`,
    );
}

export async function ensureEmployeeLeaveRequestsTable() {
    if (leaveSchemaReady) return;
    if (!ensureRequestsPromise) {
        ensureRequestsPromise = runEnsureEmployeeLeaveRequestsTable()
            .then(() => {
                leaveSchemaReady = true;
            })
            .catch((err) => {
                ensureRequestsPromise = null;
                throw err;
            });
    }
    await ensureRequestsPromise;
}

/** Call once per request before leave reads/writes (avoids parallel ensure + connection spikes). */
export async function ensureEmployeeLeaveDataReady(): Promise<void> {
    await ensureEmployeeLeaveRequestsTable();
}

export function mapLeaveRequestRowToApi(row: EmployeeLeaveRequestRow) {
    const applied = toDateIso(row.applied_on);
    const storedRequestId =
        typeof row.request_id === "string" && row.request_id.trim()
            ? row.request_id.trim()
            : formatLeaveRequestId(applied, Math.min(99, Math.max(1, Number(row.id) || 1)));
    return {
        id: row.id,
        request_id: storedRequestId,
        employee_id: row.employee_id,
        policy_id: row.policy_id,
        policy_code: row.policy_code,
        policy_name: row.policy_name,
        start_date: toDateIso(row.start_date),
        end_date: toDateIso(row.end_date),
        days: Number(row.days) || 0,
        day_type: row.day_type,
        reason: row.reason ?? "",
        attachment_name: row.attachment_name ?? "",
        status: row.status,
        rejected_at_stage:
            row.rejected_at_stage === "l1" || row.rejected_at_stage === "l2"
                ? row.rejected_at_stage
                : null,
        rejection_reason:
            typeof row.rejection_reason === "string" && row.rejection_reason.trim()
                ? row.rejection_reason.trim()
                : null,
        applied_on: applied,
    };
}

function isoToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function fetchActivePolicies(): Promise<EmployeeLeavePolicy[]> {
    const [rows] = await pool.query(
        `SELECT * FROM admin_leave_policies WHERE is_active = 1 ORDER BY name ASC`,
    );
    return (rows as AdminLeavePolicyRow[]).map(mapPolicyRowToApi);
}

export async function fetchOrgSettings(): Promise<EmployeeLeaveOrgSettings> {
    const [rows] = await pool.query(
        "SELECT * FROM admin_leave_org_settings WHERE id = 1 LIMIT 1",
    );
    const row = (rows as AdminLeaveOrgSettingsRow[])[0];
    if (!row) {
        return mapOrgSettingsRowToApi({
            id: 1,
            fiscal_year_start_month: 4,
            default_min_notice_days: 2,
            max_consecutive_days_default: 15,
            allow_half_day: 1,
            count_weekends_in_leave: 0,
            notification_emails: "[]",
        } as AdminLeaveOrgSettingsRow);
    }
    return mapOrgSettingsRowToApi(row);
}

export async function fetchEmployeeJoiningDate(employeeId: string): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT joining_date FROM admin_employees WHERE employee_id = ? LIMIT 1",
        [employeeId],
    );
    const raw = rows[0]?.joining_date;
    if (!raw) return null;
    return toDateIso(raw);
}

function yearStartIso(fiscalStartMonth: number) {
    const today = isoToday();
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    const startYear = m >= fiscalStartMonth ? y : y - 1;
    return `${startYear}-${String(fiscalStartMonth).padStart(2, "0")}-01`;
}

export async function fetchUsedDaysByPolicy(
    employeeId: string,
    fiscalStartMonth: number,
): Promise<Map<number, number>> {
    const from = yearStartIso(fiscalStartMonth);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT policy_id, COALESCE(SUM(days), 0) AS used
         FROM ${REQUESTS_TABLE}
         WHERE employee_id = ?
           AND status IN ('pending', 'l1_approved', 'approved')
           AND start_date >= ?
         GROUP BY policy_id`,
        [employeeId, from],
    );
    const map = new Map<number, number>();
    for (const row of rows) {
        map.set(Number(row.policy_id), Number(row.used) || 0);
    }
    return map;
}

export async function computeUsedDays(
    employeeId: string,
    policyId: number,
    fiscalStartMonth: number,
): Promise<number> {
    const map = await fetchUsedDaysByPolicy(employeeId, fiscalStartMonth);
    return map.get(policyId) ?? 0;
}

export async function fetchEmployeeRequests(employeeId: string, limit = 50) {
    const [rows] = await pool.query(
        `SELECT * FROM ${REQUESTS_TABLE}
         WHERE employee_id = ?
         ORDER BY applied_on DESC, id DESC
         LIMIT ?`,
        [employeeId, limit],
    );
    return (rows as EmployeeLeaveRequestRow[]).map(mapLeaveRequestRowToApi);
}

export type InsertLeaveRequestInput = {
    employeeId: string;
    policyId: number;
    policyCode: string;
    policyName: string;
    startDate: string;
    endDate: string;
    days: number;
    dayType: LeaveDayType;
    reason: string;
    attachmentName?: string;
    appliedOn?: string;
};

export async function insertEmployeeLeaveRequest(input: InsertLeaveRequestInput) {
    await ensureEmployeeLeaveDataReady();
    const appliedOn = input.appliedOn ?? isoToday();
    const requestId = await allocateNextLeaveRequestId(appliedOn);

    const [result] = await pool.query(
        `INSERT INTO ${REQUESTS_TABLE}
         (request_id, employee_id, policy_id, policy_code, policy_name, start_date, end_date, days, day_type, reason, attachment_name, status, applied_on)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
            requestId,
            input.employeeId,
            input.policyId,
            input.policyCode,
            input.policyName,
            input.startDate,
            input.endDate,
            input.days,
            input.dayType,
            input.reason,
            input.attachmentName?.trim() || null,
            appliedOn,
        ],
    );

    const insertId = Number((result as ResultSetHeader).insertId);
    if (!Number.isFinite(insertId) || insertId < 1) {
        throw new Error("Failed to create leave request");
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [insertId],
    );
    const row = rows[0] as EmployeeLeaveRequestRow | undefined;
    if (!row) {
        throw new Error("Leave request created but could not be loaded");
    }
    const created = mapLeaveRequestRowToApi(row);
    const { notifyLeaveSubmitted } = await import("@/lib/employeeNotifications");
    void notifyLeaveSubmitted({
        id: created.id,
        employee_id: created.employee_id,
        policy_name: created.policy_name,
        start_date: created.start_date,
        end_date: created.end_date,
        days: created.days,
    });
    return created;
}

const LEAVE_REQUEST_JOIN_EMPLOYEE = `
    SELECT lr.*,
           COALESCE(e.full_name, lr.employee_id) AS employee_name,
           COALESCE(e.department, '') AS department,
           COALESCE(e.designation, '') AS designation
    FROM ${REQUESTS_TABLE} lr
    LEFT JOIN admin_employees e ON e.employee_id = lr.employee_id
`;

export type AdminLeaveRequestApi = ReturnType<typeof mapLeaveRequestRowToApi> & {
    employee_name: string;
    department: string;
    designation: string;
};

function mapAdminLeaveRequestRow(row: RowDataPacket): AdminLeaveRequestApi {
    const base = mapLeaveRequestRowToApi(row as EmployeeLeaveRequestRow);
    return {
        ...base,
        employee_name: String(row.employee_name ?? base.employee_id),
        department: String(row.department ?? ""),
        designation: String(row.designation ?? ""),
    };
}

export async function fetchAllLeaveRequestsForAdmin(options?: {
    status?: LeaveRequestStatus | "all";
    search?: string;
    limit?: number;
}): Promise<AdminLeaveRequestApi[]> {
    await ensureEmployeeLeaveDataReady();
    const limit = Math.min(500, Math.max(1, options?.limit ?? 200));
    let sql = `${LEAVE_REQUEST_JOIN_EMPLOYEE} WHERE 1=1`;
    const params: unknown[] = [];

    if (options?.status && options.status !== "all") {
        sql += " AND lr.status = ?";
        params.push(options.status);
    }

    const search = options?.search?.trim();
    if (search) {
        sql += ` AND (
            lr.request_id LIKE ?
            OR lr.employee_id LIKE ?
            OR lr.policy_name LIKE ?
            OR lr.policy_code LIKE ?
            OR e.full_name LIKE ?
            OR e.department LIKE ?
        )`;
        const q = `%${search}%`;
        params.push(q, q, q, q, q, q);
    }

    sql += " ORDER BY lr.applied_on DESC, lr.id DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map(mapAdminLeaveRequestRow);
}

export async function fetchAdminLeaveRequestById(id: number): Promise<AdminLeaveRequestApi | null> {
    await ensureEmployeeLeaveDataReady();
    const [rows] = await pool.query<RowDataPacket[]>(
        `${LEAVE_REQUEST_JOIN_EMPLOYEE} WHERE lr.id = ? LIMIT 1`,
        [id],
    );
    const row = rows[0];
    return row ? mapAdminLeaveRequestRow(row) : null;
}

export async function fetchLeaveRequestStatsForAdmin() {
    await ensureEmployeeLeaveDataReady();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT status, COUNT(*) AS cnt FROM ${REQUESTS_TABLE} GROUP BY status`,
    );
    const counts = {
        pending: 0,
        l1_approved: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0,
    };
    for (const row of rows) {
        const status = String(row.status) as LeaveRequestStatus;
        const cnt = Number(row.cnt) || 0;
        if (status === "pending") counts.pending = cnt;
        else if (status === "l1_approved") counts.l1_approved = cnt;
        else if (status === "approved") counts.approved = cnt;
        else if (status === "rejected") counts.rejected = cnt;
        else if (status === "cancelled") counts.cancelled = cnt;
        counts.total += cnt;
    }
    return counts;
}

const STATUS_TRANSITIONS: Record<LeaveRequestStatus, LeaveRequestStatus[]> = {
    pending: ["l1_approved", "rejected", "cancelled"],
    l1_approved: ["approved", "rejected", "cancelled"],
    approved: ["cancelled"],
    rejected: [],
    cancelled: [],
};

export async function updateLeaveRequestStatus(
    id: number,
    nextStatus: LeaveRequestStatus,
    options?: { rejectionReason?: string },
): Promise<AdminLeaveRequestApi> {
    await ensureEmployeeLeaveDataReady();
    if (!LEAVE_REQUEST_STATUSES.includes(nextStatus)) {
        throw new Error("Invalid status");
    }

    const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT status FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    const current = existing[0]?.status as LeaveRequestStatus | undefined;
    if (!current) {
        throw new Error("Leave request not found");
    }

    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(nextStatus)) {
        throw new Error(`Cannot change status from ${current} to ${nextStatus}`);
    }

    // Validate cumulative policy limit when approving
    if (nextStatus === "l1_approved" || nextStatus === "approved") {
        const targetReq = await fetchAdminLeaveRequestById(id);
        if (targetReq) {
            const policies = await fetchActivePolicies();
            const policy = policies.find(
                (p) => p.id === targetReq.policy_id || p.code === targetReq.policy_code,
            );
            if (policy) {
                const settings = await fetchOrgSettings();
                const joiningDate = await fetchEmployeeJoiningDate(targetReq.employee_id);
                const employeeRequests = await fetchEmployeeRequests(targetReq.employee_id, 200);

                const validationErrors = collectLeaveRequestErrors({
                    policy,
                    settings,
                    joiningDate,
                    startDate: targetReq.start_date,
                    endDate: targetReq.end_date,
                    dayType: targetReq.day_type as LeaveDayType,
                    requestedDays: Number(targetReq.days) || 0,
                    balanceRemaining: policy.days_per_year || 999,
                    existingRequests: employeeRequests.map((r) => ({
                        id: r.id,
                        policy_id: r.policy_id,
                        policy_code: r.policy_code,
                        days: r.days,
                        day_type: r.day_type,
                        start_date: r.start_date,
                        end_date: r.end_date,
                        status: r.status,
                    })),
                    attachmentName: targetReq.attachment_name || undefined,
                    reason: targetReq.reason,
                    currentRequestId: id,
                });

                if (validationErrors.length > 0) {
                    throw new Error(`Cannot approve leave request: ${validationErrors[0]}`);
                }
            }
        }
    }

    let rejectedAtStage: LeaveRejectionStage | null = null;
    let rejectionReason: string | null = null;
    if (nextStatus === "rejected") {
        if (current === "pending") rejectedAtStage = "l1";
        else if (current === "l1_approved") rejectedAtStage = "l2";
        const reason = options?.rejectionReason?.trim() ?? "";
        if (!reason) {
            throw new Error(
                `Rejection reason is required when rejecting at ${rejectedAtStage === "l2" ? "L2" : "L1"}.`,
            );
        }
        rejectionReason = reason;
    }

    await pool.query(
        `UPDATE ${REQUESTS_TABLE}
         SET status = ?, rejected_at_stage = ?, rejection_reason = ? WHERE id = ?`,
        [nextStatus, rejectedAtStage, rejectionReason, id],
    );
    const updated = await fetchAdminLeaveRequestById(id);
    if (!updated) {
        throw new Error("Leave request updated but could not be loaded");
    }

    if (nextStatus === "approved") {
        await syncApprovedLeaveToAttendance(updated.employee_id, updated);
    } else if (
        (nextStatus === "rejected" || nextStatus === "cancelled") &&
        current === "approved"
    ) {
        await clearSyncedLeaveAttendance(updated.employee_id, updated);
    }

    const { notifyLeaveStatusUpdated } = await import("@/lib/employeeNotifications");
    void notifyLeaveStatusUpdated({
        id: updated.id,
        employee_id: updated.employee_id,
        request_id: updated.request_id,
        policy_name: updated.policy_name,
        start_date: updated.start_date,
        end_date: updated.end_date,
        status: updated.status,
        rejected_at_stage: updated.rejected_at_stage,
    });

    return updated;
}

export type UpdateEmployeeLeaveInput = {
    id: number;
    employeeId: string;
    policyId: number;
    startDate: string;
    endDate: string;
    days: number;
    dayType: LeaveDayType;
    reason: string;
    attachmentName?: string;
};

export async function updateEmployeeLeaveRequest(input: UpdateEmployeeLeaveInput) {
    await ensureEmployeeLeaveDataReady();
    const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id, employee_id, status FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [input.id],
    );
    const row = existing[0];
    if (!row || String(row.employee_id) !== input.employeeId) {
        throw new Error("Leave request not found");
    }
    const currentStatus = row.status as LeaveRequestStatus;
    if (currentStatus !== "pending" && currentStatus !== "l1_approved") {
        throw new Error("This leave request can no longer be edited.");
    }

    const policies = await fetchActivePolicies();
    const policy = policies.find((p) => p.id === input.policyId);
    if (!policy) {
        throw new Error("Leave type not found or inactive");
    }

    await pool.query(
        `UPDATE ${REQUESTS_TABLE}
         SET policy_id = ?, policy_code = ?, policy_name = ?, start_date = ?, end_date = ?, days = ?, day_type = ?, reason = ?, attachment_name = ?
         WHERE id = ? AND employee_id = ?`,
        [
            policy.id,
            policy.code,
            policy.name,
            input.startDate,
            input.endDate,
            input.days,
            input.dayType,
            input.reason,
            input.attachmentName?.trim() || null,
            input.id,
            input.employeeId,
        ],
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [input.id],
    );
    return mapLeaveRequestRowToApi(updatedRows[0] as EmployeeLeaveRequestRow);
}

export async function withdrawEmployeeLeaveRequest(employeeId: string, id: number) {
    await ensureEmployeeLeaveDataReady();
    const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id, employee_id, status FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    const row = existing[0];
    const reqEmpId = String(row?.employee_id || "").trim().toLowerCase();
    const sessEmpId = String(employeeId || "").trim().toLowerCase();
    if (reqEmpId !== sessEmpId && !sessEmpId.endsWith(reqEmpId) && !reqEmpId.endsWith(sessEmpId)) {
        throw new Error("Leave request not found");
    }
    const current = String(row.status || "").toLowerCase() as LeaveRequestStatus;
    if (current !== "pending" && current !== "l1_approved" && current !== "approved") {
        throw new Error("This request can no longer be withdrawn.");
    }

    await pool.query(
        `UPDATE ${REQUESTS_TABLE}
         SET status = 'cancelled', rejected_at_stage = NULL, rejection_reason = NULL
         WHERE id = ?`,
        [id],
    );

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${REQUESTS_TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    const updated = rows[0] as EmployeeLeaveRequestRow | undefined;
    if (!updated) {
        throw new Error("Leave request withdrawn but could not be loaded");
    }
    return mapLeaveRequestRowToApi(updated);
}

