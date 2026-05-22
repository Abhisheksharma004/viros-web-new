import pool from "@/lib/db";
import {
    ensureEmployeeAttendanceTable,
    getAttendanceByDate,
    type AttendanceDayRecord,
    type AttendanceStatus,
} from "@/lib/employeeAttendance";
import {
    ensureEmployeeLeaveDataReady,
    leaveRequestStatusLabel,
    mapLeaveRequestRowToApi,
    type EmployeeLeaveRequestRow,
    type LeaveDayType,
    type LeaveRequestStatus,
} from "@/lib/employeeLeave";

const REQUESTS_TABLE = "employee_leave_requests";
const ATTENDANCE_TABLE = "employee_attendance";

export type LeaveRequestForAttendance = ReturnType<typeof mapLeaveRequestRowToApi>;

export type AttendanceDayRecordWithLeave = AttendanceDayRecord & {
    leaveRequestStatus?: LeaveRequestStatus;
};

export function expandDateRange(startIso: string, endIso: string): string[] {
    if (!startIso || !endIso) return [];
    const start = new Date(startIso + "T12:00:00");
    const end = new Date(endIso + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

    const dates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
        dates.push(
            `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`,
        );
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

function leaveNote(request: LeaveRequestForAttendance): string {
    return `Leave: ${request.policy_code} (${request.request_id})`;
}

function attendanceStatusFromLeave(dayType: LeaveDayType): AttendanceStatus {
    return dayType === "full" ? "leave" : "half-day";
}

function hasPunchData(record: AttendanceDayRecord): boolean {
    return Boolean(record.checkIn || record.checkOut || record.checkInProof || record.checkOutProof);
}

/** Approved full-day leave blocks check-in for that date. */
export function isFullDayLeaveBlocking(
    request: LeaveRequestForAttendance,
    dateIso: string,
): boolean {
    if (request.status !== "approved" || request.day_type !== "full") return false;
    return dateIso >= request.start_date && dateIso <= request.end_date;
}

export async function fetchLeaveRequestsOverlappingMonth(
    employeeId: string,
    year: number,
    month: number,
): Promise<LeaveRequestForAttendance[]> {
    await ensureEmployeeLeaveDataReady();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [rows] = await pool.query<EmployeeLeaveRequestRow[]>(
        `SELECT * FROM ${REQUESTS_TABLE}
         WHERE employee_id = ?
           AND status IN ('pending', 'l1_approved', 'approved')
           AND start_date <= ?
           AND end_date >= ?
         ORDER BY start_date ASC, id ASC`,
        [employeeId.trim(), end, start],
    );

    return rows.map(mapLeaveRequestRowToApi);
}

export function mergeLeaveRequestsIntoAttendanceRecords(
    records: AttendanceDayRecord[],
    leaveRequests: LeaveRequestForAttendance[],
): AttendanceDayRecordWithLeave[] {
    const byDate = new Map<string, AttendanceDayRecordWithLeave>(
        records.map((r) => [r.date, { ...r }]),
    );

    for (const request of leaveRequests) {
        const dates = expandDateRange(request.start_date, request.end_date);
        const targetStatus = attendanceStatusFromLeave(request.day_type);
        const statusLabel = leaveRequestStatusLabel(
            request.status,
            request.rejected_at_stage ?? undefined,
        );
        const note = `${statusLabel}: ${request.policy_name} (${request.request_id})`;

        for (const dateIso of dates) {
            const existing = byDate.get(dateIso);
            if (existing && hasPunchData(existing)) continue;

            if (request.status === "approved") {
                if (existing?.status === "present" || existing?.status === "late") continue;
                byDate.set(dateIso, {
                    date: dateIso,
                    status: targetStatus,
                    checkIn: existing?.checkIn,
                    checkOut: existing?.checkOut,
                    hours: existing?.hours,
                    note: existing?.note ?? note,
                    checkInProof: existing?.checkInProof,
                    checkOutProof: existing?.checkOutProof,
                });
                continue;
            }

            if (existing?.status === "leave" || existing?.status === "half-day") continue;
            if (existing?.status === "present" || existing?.status === "late") continue;

            byDate.set(dateIso, {
                date: dateIso,
                status: targetStatus,
                note,
                leaveRequestStatus: request.status,
            });
        }
    }

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function findLeaveBlockingCheckIn(
    employeeId: string,
    dateIso: string,
): Promise<{ policyName: string; requestId: string } | null> {
    await ensureEmployeeLeaveDataReady();
    const [rows] = await pool.query(
        `SELECT policy_name, request_id, start_date, end_date, day_type, status
         FROM ${REQUESTS_TABLE}
         WHERE employee_id = ?
           AND status = 'approved'
           AND day_type = 'full'
           AND start_date <= ?
           AND end_date >= ?
         LIMIT 1`,
        [employeeId.trim(), dateIso, dateIso],
    );
    const row = (rows as { policy_name: string; request_id: string }[])[0];
    if (!row) return null;
    return {
        policyName: String(row.policy_name ?? ""),
        requestId: String(row.request_id ?? ""),
    };
}

export async function getTodayLeaveInfo(
    employeeId: string,
    dateIso: string,
): Promise<{
    blocking: boolean;
    status: LeaveRequestStatus;
    policyName: string;
    requestId: string;
    dayType: LeaveDayType;
    message: string;
} | null> {
    await ensureEmployeeLeaveDataReady();
    const [rows] = await pool.query(
        `SELECT policy_name, request_id, day_type, status
         FROM ${REQUESTS_TABLE}
         WHERE employee_id = ?
           AND status IN ('pending', 'l1_approved', 'approved')
           AND start_date <= ?
           AND end_date >= ?
         ORDER BY FIELD(status, 'approved', 'l1_approved', 'pending')
         LIMIT 1`,
        [employeeId.trim(), dateIso, dateIso],
    );
    const row = (
        rows as {
            policy_name: string;
            request_id: string;
            day_type: LeaveDayType;
            status: LeaveRequestStatus;
        }[]
    )[0];
    if (!row) return null;

    const policyName = String(row.policy_name ?? "");
    const requestId = String(row.request_id ?? "");
    const dayType = row.day_type;
    const status = row.status;
    const blocking = status === "approved" && dayType === "full";
    const statusLabel = leaveRequestStatusLabel(status);

    let message = `${statusLabel} leave (${policyName})`;
    if (blocking) {
        message = `You are on approved leave today (${policyName}). Check-in is not available.`;
    } else if (dayType !== "full") {
        message = `${statusLabel} half-day leave (${policyName}). You may still check in for your working half.`;
    }

    return { blocking, status, policyName, requestId, dayType, message };
}

export async function syncApprovedLeaveToAttendance(
    employeeId: string,
    request: LeaveRequestForAttendance,
): Promise<void> {
    if (request.status !== "approved") return;
    await ensureEmployeeAttendanceTable();

    const status = attendanceStatusFromLeave(request.day_type);
    const note = leaveNote(request);
    const dates = expandDateRange(request.start_date, request.end_date);

    for (const dateIso of dates) {
        const existing = await getAttendanceByDate(employeeId, dateIso);
        if (existing?.check_in_at) continue;

        if (existing) {
            await pool.query(
                `UPDATE ${ATTENDANCE_TABLE}
                 SET status = ?, note = ?
                 WHERE id = ? AND check_in_at IS NULL`,
                [status, note, existing.id],
            );
        } else {
            await pool.query(
                `INSERT INTO ${ATTENDANCE_TABLE}
                 (employee_id, attendance_date, status, note)
                 VALUES (?, ?, ?, ?)`,
                [employeeId.trim(), dateIso, status, note],
            );
        }
    }
}

export async function clearSyncedLeaveAttendance(
    employeeId: string,
    request: LeaveRequestForAttendance,
): Promise<void> {
    await ensureEmployeeAttendanceTable();
    const dates = expandDateRange(request.start_date, request.end_date);
    const notePattern = `%(${request.request_id})%`;

    for (const dateIso of dates) {
        const existing = await getAttendanceByDate(employeeId, dateIso);
        if (!existing?.check_in_at && existing?.note?.includes(request.request_id)) {
            await pool.query(`DELETE FROM ${ATTENDANCE_TABLE} WHERE id = ?`, [existing.id]);
        }
    }

    await pool.query(
        `DELETE FROM ${ATTENDANCE_TABLE}
         WHERE employee_id = ?
           AND attendance_date >= ?
           AND attendance_date <= ?
           AND check_in_at IS NULL
           AND status IN ('leave', 'half-day')
           AND note LIKE ?`,
        [employeeId.trim(), request.start_date, request.end_date, notePattern],
    );
}
