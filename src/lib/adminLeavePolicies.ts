import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const POLICIES_TABLE = "admin_leave_policies";
const SETTINGS_TABLE = "admin_leave_org_settings";
export const SETTINGS_ROW_ID = 1;

export const ACCRUAL_CYCLES = ["yearly", "monthly", "none"] as const;
export type AccrualCycle = (typeof ACCRUAL_CYCLES)[number];

export type AdminLeavePolicyRow = RowDataPacket & {
    id: number;
    code: string;
    name: string;
    description: string | null;
    days_per_year: number;
    accrual_cycle: AccrualCycle;
    carry_forward_enabled: number;
    carry_forward_max: number;
    half_day_allowed: number;
    document_required: number;
    min_notice_days: number;
    max_consecutive_days: number;
    requires_approval: number;
    paid: number;
    is_active: number;
    all_months_applicable: number;
    applicable_months: string;
    applicable_from_joining: number;
    months_after_joining: number;
    max_days_per_request: number;
    min_days_per_request: number;
    enforce_remaining_balance_cap: number;
    must_use_full_balance_when_low: number;
    full_balance_threshold_days: number;
    max_requests_per_month: number;
    max_requests_per_year: number;
    min_gap_days_between_requests: number;
    weekdays_only: number;
    allow_backdated_leave: number;
    max_advance_booking_days: number;
};

export type AdminLeaveOrgSettingsRow = RowDataPacket & {
    id: number;
    fiscal_year_start_month: number;
    default_min_notice_days: number;
    max_consecutive_days_default: number;
    allow_half_day: number;
    count_weekends_in_leave: number;
    notification_emails: string | unknown;
};

const MAX_NOTIFICATION_EMAILS = 30;

let ensurePoliciesPromise: Promise<void> | null = null;
let ensureSettingsPromise: Promise<void> | null = null;

function parseNum(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function parseBool(value: unknown): boolean {
    return value !== false && value !== 0 && value !== "0";
}

export function parseApplicableMonthsJson(raw: unknown): number[] {
    if (Array.isArray(raw)) {
        return raw.map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
    }
    if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                return parsed.map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
            }
        } catch {
            return [];
        }
    }
    return [];
}

export function serializeApplicableMonths(months: number[], allMonths: boolean): string {
    if (allMonths) return "[]";
    const unique = Array.from(new Set(months.filter((m) => m >= 1 && m <= 12))).sort((a, b) => a - b);
    return JSON.stringify(unique);
}

async function runEnsureAdminLeavePoliciesTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${POLICIES_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(8) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            days_per_year DECIMAL(8,2) NOT NULL DEFAULT 0,
            accrual_cycle ENUM('yearly', 'monthly', 'none') NOT NULL DEFAULT 'yearly',
            carry_forward_enabled TINYINT(1) NOT NULL DEFAULT 0,
            carry_forward_max INT NOT NULL DEFAULT 0,
            half_day_allowed TINYINT(1) NOT NULL DEFAULT 1,
            document_required TINYINT(1) NOT NULL DEFAULT 0,
            min_notice_days INT NOT NULL DEFAULT 0,
            max_consecutive_days INT NOT NULL DEFAULT 1,
            requires_approval TINYINT(1) NOT NULL DEFAULT 1,
            paid TINYINT(1) NOT NULL DEFAULT 1,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            all_months_applicable TINYINT(1) NOT NULL DEFAULT 1,
            applicable_months JSON NOT NULL,
            applicable_from_joining TINYINT(1) NOT NULL DEFAULT 0,
            months_after_joining INT NOT NULL DEFAULT 0,
            max_days_per_request DECIMAL(6,2) NOT NULL DEFAULT 1,
            min_days_per_request DECIMAL(6,2) NOT NULL DEFAULT 0,
            enforce_remaining_balance_cap TINYINT(1) NOT NULL DEFAULT 1,
            must_use_full_balance_when_low TINYINT(1) NOT NULL DEFAULT 0,
            full_balance_threshold_days DECIMAL(6,2) NOT NULL DEFAULT 0,
            max_requests_per_month INT NOT NULL DEFAULT 0,
            max_requests_per_year INT NOT NULL DEFAULT 0,
            min_gap_days_between_requests INT NOT NULL DEFAULT 0,
            weekdays_only TINYINT(1) NOT NULL DEFAULT 0,
            allow_backdated_leave TINYINT(1) NOT NULL DEFAULT 0,
            max_advance_booking_days INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_leave_policies_code (code)
        )
    `);
}

export function parseNotificationEmailsJson(raw: unknown): string[] {
    let list: unknown[] = [];
    if (Array.isArray(raw)) {
        list = raw;
    } else if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) list = parsed;
        } catch {
            list = raw.split(/[,;\s]+/).filter(Boolean);
        }
    }

    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of list) {
        const email = typeof item === "string" ? item.trim().toLowerCase() : "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        if (seen.has(email)) continue;
        seen.add(email);
        out.push(email);
        if (out.length >= MAX_NOTIFICATION_EMAILS) break;
    }
    return out;
}

export function serializeNotificationEmails(emails: string[]): string {
    return JSON.stringify(parseNotificationEmailsJson(emails));
}

async function migrateLeaveOrgSettingsColumns() {
    const [cols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${SETTINGS_TABLE}`);
    const names = new Set(cols.map((c) => String(c.Field)));
    if (!names.has("notification_emails")) {
        await pool.query(
            `ALTER TABLE ${SETTINGS_TABLE}
             ADD COLUMN notification_emails JSON NOT NULL DEFAULT ('[]')
             AFTER count_weekends_in_leave`,
        );
    }
}

async function runEnsureAdminLeaveOrgSettingsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
            id INT PRIMARY KEY,
            fiscal_year_start_month INT NOT NULL DEFAULT 4,
            default_min_notice_days INT NOT NULL DEFAULT 2,
            max_consecutive_days_default INT NOT NULL DEFAULT 15,
            allow_half_day TINYINT(1) NOT NULL DEFAULT 1,
            count_weekends_in_leave TINYINT(1) NOT NULL DEFAULT 0,
            notification_emails JSON NOT NULL DEFAULT ('[]'),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    await migrateLeaveOrgSettingsColumns();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM ${SETTINGS_TABLE} WHERE id = ? LIMIT 1`,
        [SETTINGS_ROW_ID],
    );
    if (rows.length === 0) {
        await pool.query(
            `INSERT INTO ${SETTINGS_TABLE}
             (id, fiscal_year_start_month, default_min_notice_days, max_consecutive_days_default, allow_half_day, count_weekends_in_leave, notification_emails)
             VALUES (?, 4, 2, 15, 1, 0, '[]')`,
            [SETTINGS_ROW_ID],
        );
    }
}

export async function ensureAdminLeavePoliciesTable() {
    if (!ensurePoliciesPromise) {
        ensurePoliciesPromise = runEnsureAdminLeavePoliciesTable().catch((err) => {
            ensurePoliciesPromise = null;
            throw err;
        });
    }
    await ensurePoliciesPromise;
}

export async function ensureAdminLeaveOrgSettingsTable() {
    if (!ensureSettingsPromise) {
        ensureSettingsPromise = runEnsureAdminLeaveOrgSettingsTable().catch((err) => {
            ensureSettingsPromise = null;
            throw err;
        });
    }
    await ensureSettingsPromise;
}

export async function ensureAdminLeaveModule() {
    await ensureAdminLeavePoliciesTable();
    await ensureAdminLeaveOrgSettingsTable();
}

export function mapPolicyRowToApi(row: AdminLeavePolicyRow) {
    const allMonths = Boolean(row.all_months_applicable);
    const months = parseApplicableMonthsJson(row.applicable_months);
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description ?? "",
        days_per_year: Number(row.days_per_year) || 0,
        accrual_cycle: row.accrual_cycle,
        carry_forward_enabled: Boolean(row.carry_forward_enabled),
        carry_forward_max: Number(row.carry_forward_max) || 0,
        half_day_allowed: Boolean(row.half_day_allowed),
        document_required: Boolean(row.document_required),
        min_notice_days: Number(row.min_notice_days) || 0,
        max_consecutive_days: Number(row.max_consecutive_days) || 1,
        requires_approval: Boolean(row.requires_approval),
        paid: Boolean(row.paid),
        is_active: Boolean(row.is_active),
        all_months_applicable: allMonths,
        applicable_months: allMonths ? [] : months,
        applicable_from_joining: Boolean(row.applicable_from_joining),
        months_after_joining: Number(row.months_after_joining) || 0,
        max_days_per_request: Number(row.max_days_per_request) || 0,
        min_days_per_request: Number(row.min_days_per_request) || 0,
        enforce_remaining_balance_cap: Boolean(row.enforce_remaining_balance_cap),
        must_use_full_balance_when_low: Boolean(row.must_use_full_balance_when_low),
        full_balance_threshold_days: Number(row.full_balance_threshold_days) || 0,
        max_requests_per_month: Number(row.max_requests_per_month) || 0,
        max_requests_per_year: Number(row.max_requests_per_year) || 0,
        min_gap_days_between_requests: Number(row.min_gap_days_between_requests) || 0,
        weekdays_only: Boolean(row.weekdays_only),
        allow_backdated_leave: Boolean(row.allow_backdated_leave),
        max_advance_booking_days: Number(row.max_advance_booking_days) || 0,
    };
}

export function mapOrgSettingsRowToApi(row: AdminLeaveOrgSettingsRow) {
    return {
        fiscal_year_start_month: Number(row.fiscal_year_start_month) || 4,
        default_min_notice_days: Number(row.default_min_notice_days) || 0,
        max_consecutive_days_default: Number(row.max_consecutive_days_default) || 1,
        allow_half_day: Boolean(row.allow_half_day),
        count_weekends_in_leave: Boolean(row.count_weekends_in_leave),
        notification_emails: parseNotificationEmailsJson(row.notification_emails),
    };
}

export function parsePolicyBody(body: Record<string, unknown>) {
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const accrualCycle = ACCRUAL_CYCLES.includes(body.accrual_cycle as AccrualCycle)
        ? (body.accrual_cycle as AccrualCycle)
        : "yearly";
    const allMonthsApplicable = parseBool(body.all_months_applicable);
    const applicableMonths = parseApplicableMonthsJson(body.applicable_months);
    const carryForwardEnabled = parseBool(body.carry_forward_enabled);
    const mustUseFullBalanceWhenLow = parseBool(body.must_use_full_balance_when_low);
    const applicableFromJoining = parseBool(body.applicable_from_joining);

    return {
        code,
        name,
        description,
        daysPerYear: Math.max(0, parseNum(body.days_per_year)),
        accrualCycle,
        carryForwardEnabled,
        carryForwardMax: carryForwardEnabled ? Math.max(0, parseNum(body.carry_forward_max)) : 0,
        halfDayAllowed: parseBool(body.half_day_allowed),
        documentRequired: parseBool(body.document_required),
        minNoticeDays: Math.max(0, parseNum(body.min_notice_days)),
        maxConsecutiveDays: Math.max(1, parseNum(body.max_consecutive_days, 1)),
        requiresApproval: parseBool(body.requires_approval),
        paid: parseBool(body.paid),
        isActive: parseBool(body.is_active),
        allMonthsApplicable,
        applicableMonthsJson: serializeApplicableMonths(applicableMonths, allMonthsApplicable),
        applicableFromJoining,
        monthsAfterJoining: applicableFromJoining
            ? Math.max(0, parseNum(body.months_after_joining))
            : 0,
        maxDaysPerRequest: Math.max(0.5, parseNum(body.max_days_per_request, 0.5)),
        minDaysPerRequest: Math.max(0, parseNum(body.min_days_per_request)),
        enforceRemainingBalanceCap: parseBool(body.enforce_remaining_balance_cap),
        mustUseFullBalanceWhenLow,
        fullBalanceThresholdDays: mustUseFullBalanceWhenLow
            ? Math.max(0, parseNum(body.full_balance_threshold_days))
            : 0,
        maxRequestsPerMonth: Math.max(0, parseNum(body.max_requests_per_month)),
        maxRequestsPerYear: Math.max(0, parseNum(body.max_requests_per_year)),
        minGapDaysBetweenRequests: Math.max(0, parseNum(body.min_gap_days_between_requests)),
        weekdaysOnly: parseBool(body.weekdays_only),
        allowBackdatedLeave: parseBool(body.allow_backdated_leave),
        maxAdvanceBookingDays: Math.max(0, parseNum(body.max_advance_booking_days)),
    };
}

export function parseOrgSettingsBody(body: Record<string, unknown>) {
    const month = parseNum(body.fiscal_year_start_month, 4);
    return {
        fiscalYearStartMonth: month >= 1 && month <= 12 ? month : 4,
        defaultMinNoticeDays: Math.max(0, parseNum(body.default_min_notice_days)),
        maxConsecutiveDaysDefault: Math.max(1, parseNum(body.max_consecutive_days_default, 1)),
        allowHalfDay: parseBool(body.allow_half_day),
        countWeekendsInLeave: parseBool(body.count_weekends_in_leave),
        notificationEmailsJson: serializeNotificationEmails(
            parseNotificationEmailsJson(body.notification_emails),
        ),
    };
}

export const POLICY_INSERT_COLUMNS = `
    code, name, description, days_per_year, accrual_cycle,
    carry_forward_enabled, carry_forward_max, half_day_allowed, document_required,
    min_notice_days, max_consecutive_days, requires_approval, paid, is_active,
    all_months_applicable, applicable_months, applicable_from_joining, months_after_joining,
    max_days_per_request, min_days_per_request, enforce_remaining_balance_cap,
    must_use_full_balance_when_low, full_balance_threshold_days,
    max_requests_per_month, max_requests_per_year, min_gap_days_between_requests,
    weekdays_only, allow_backdated_leave, max_advance_booking_days
`;

export function policyInsertValues(parsed: ReturnType<typeof parsePolicyBody>) {
    return [
        parsed.code,
        parsed.name,
        parsed.description || null,
        parsed.daysPerYear,
        parsed.accrualCycle,
        parsed.carryForwardEnabled ? 1 : 0,
        parsed.carryForwardMax,
        parsed.halfDayAllowed ? 1 : 0,
        parsed.documentRequired ? 1 : 0,
        parsed.minNoticeDays,
        parsed.maxConsecutiveDays,
        parsed.requiresApproval ? 1 : 0,
        parsed.paid ? 1 : 0,
        parsed.isActive ? 1 : 0,
        parsed.allMonthsApplicable ? 1 : 0,
        parsed.applicableMonthsJson,
        parsed.applicableFromJoining ? 1 : 0,
        parsed.monthsAfterJoining,
        parsed.maxDaysPerRequest,
        parsed.minDaysPerRequest,
        parsed.enforceRemainingBalanceCap ? 1 : 0,
        parsed.mustUseFullBalanceWhenLow ? 1 : 0,
        parsed.fullBalanceThresholdDays,
        parsed.maxRequestsPerMonth,
        parsed.maxRequestsPerYear,
        parsed.minGapDaysBetweenRequests,
        parsed.weekdaysOnly ? 1 : 0,
        parsed.allowBackdatedLeave ? 1 : 0,
        parsed.maxAdvanceBookingDays,
    ];
}

export const POLICY_UPDATE_SET = `
    code = ?, name = ?, description = ?, days_per_year = ?, accrual_cycle = ?,
    carry_forward_enabled = ?, carry_forward_max = ?, half_day_allowed = ?, document_required = ?,
    min_notice_days = ?, max_consecutive_days = ?, requires_approval = ?, paid = ?, is_active = ?,
    all_months_applicable = ?, applicable_months = ?, applicable_from_joining = ?, months_after_joining = ?,
    max_days_per_request = ?, min_days_per_request = ?, enforce_remaining_balance_cap = ?,
    must_use_full_balance_when_low = ?, full_balance_threshold_days = ?,
    max_requests_per_month = ?, max_requests_per_year = ?, min_gap_days_between_requests = ?,
    weekdays_only = ?, allow_backdated_leave = ?, max_advance_booking_days = ?
`;
