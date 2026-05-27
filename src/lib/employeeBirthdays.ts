import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { IST_TIMEZONE, todayDateOnly, toDateOnlyString } from "@/lib/dateOnly";

export type EmployeeBirthdayKind = "today" | "soon";

export type EmployeeBirthdayAlert = {
    employeeId: string;
    fullName: string;
    department: string;
    dateOfBirth: string;
    daysUntil: number;
    kind: EmployeeBirthdayKind;
    isSelf: boolean;
    displayDate: string;
};

type EmployeeBirthdayRow = RowDataPacket & {
    employee_id: string;
    full_name: string;
    department: string | null;
    date_of_birth: string | Date | null;
    employee_status: string | null;
};

type LegacyBirthdayRow = RowDataPacket & {
    id: number;
    name: string;
    date: string | Date;
    is_active: number | null;
};

const ACTIVE_STATUS_SQL = `(
    employee_status IS NULL
    OR TRIM(employee_status) = ''
    OR LOWER(TRIM(employee_status)) = 'active'
)`;

function parseMonthDay(iso: string): { month: number; day: number } | null {
    const normalized = toDateOnlyString(iso);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
    if (!match) return null;
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day };
}

function resolveBirthdayDay(month: number, day: number, year: number) {
    if (month === 2 && day === 29) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        return isLeap ? 29 : 28;
    }
    return day;
}

/** Calendar days from today (IST) until the next occurrence of this birthday (month/day only). */
export function daysUntilBirthday(dobIso: string, todayIso: string): number {
    const birth = parseMonthDay(dobIso);
    const today = parseMonthDay(todayIso);
    if (!birth || !today) return -1;

    const year = Number(todayIso.slice(0, 4));
    const todayAt = new Date(year, today.month - 1, today.day, 12, 0, 0, 0);
    const dayThisYear = resolveBirthdayDay(birth.month, birth.day, year);
    let nextAt = new Date(year, birth.month - 1, dayThisYear, 12, 0, 0, 0);

    if (nextAt.getTime() < todayAt.getTime()) {
        const nextYear = year + 1;
        const dayNextYear = resolveBirthdayDay(birth.month, birth.day, nextYear);
        nextAt = new Date(nextYear, birth.month - 1, dayNextYear, 12, 0, 0, 0);
    }

    return Math.round((nextAt.getTime() - todayAt.getTime()) / 86_400_000);
}

export function formatBirthdayDisplayDate(dobIso: string, todayIso: string): string {
    const days = daysUntilBirthday(dobIso, todayIso);
    if (days < 0) return "";
    const [y, m, d] = todayIso.split("-").map(Number);
    const next = new Date(y, m - 1, d + days, 12, 0, 0, 0);
    return next.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function birthdayKey(fullName: string, dobIso: string) {
    const md = parseMonthDay(dobIso);
    if (!md) return "";
    return `${fullName.trim().toLowerCase()}|${md.month}-${md.day}`;
}

function isEmployeeActive(status: string | null | undefined) {
    const s = String(status ?? "").trim().toLowerCase();
    return !s || s === "active";
}

function alertFromRow(
    row: {
        employeeId: string;
        fullName: string;
        department: string;
        dob: string;
    },
    todayIso: string,
    viewerId: string,
    seen: Set<string>,
): EmployeeBirthdayAlert | null {
    const daysUntil = daysUntilBirthday(row.dob, todayIso);
    if (daysUntil < 0 || daysUntil > 2) return null;

    const key = birthdayKey(row.fullName, row.dob);
    if (key && seen.has(key)) return null;
    if (key) seen.add(key);

    return {
        employeeId: row.employeeId,
        fullName: row.fullName,
        department: row.department,
        dateOfBirth: toDateOnlyString(row.dob),
        daysUntil,
        kind: daysUntil === 0 ? "today" : "soon",
        isSelf: row.employeeId === viewerId,
        displayDate: formatBirthdayDisplayDate(row.dob, todayIso),
    };
}

async function fetchLegacyBirthdayRows(): Promise<LegacyBirthdayRow[]> {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, date, is_active
             FROM birthdays
             WHERE COALESCE(is_active, 1) = 1
             ORDER BY name ASC`,
        );
        return rows as LegacyBirthdayRow[];
    } catch {
        return [];
    }
}

/**
 * Birthdays for admin dashboard (same window: today + next 2 days).
 * No viewer employee — cards always show colleague messaging.
 */
export async function fetchAdminBirthdayAlerts(): Promise<EmployeeBirthdayAlert[]> {
    return fetchEmployeeBirthdayAlerts("");
}

/**
 * Birthdays on every employee dashboard:
 * - today (daysUntil === 0)
 * - coming soon (daysUntil === 1 or 2)
 */
export async function fetchEmployeeBirthdayAlerts(
    viewerEmployeeId: string,
): Promise<EmployeeBirthdayAlert[]> {
    await ensureAdminEmployeesTable();

    const todayIso = todayDateOnly(IST_TIMEZONE);
    const viewerId = viewerEmployeeId.trim();
    const seen = new Set<string>();
    const alerts: EmployeeBirthdayAlert[] = [];

    const [employeeRows] = await pool.query(
        `SELECT employee_id, full_name, department, date_of_birth, employee_status
         FROM admin_employees
         WHERE date_of_birth IS NOT NULL
         ORDER BY full_name ASC`,
    );

    for (const row of employeeRows as EmployeeBirthdayRow[]) {
        if (!isEmployeeActive(row.employee_status)) continue;

        const dob = toDateOnlyString(row.date_of_birth);
        if (!dob) continue;

        const alert = alertFromRow(
            {
                employeeId: String(row.employee_id ?? "").trim(),
                fullName: String(row.full_name ?? "").trim() || "Team member",
                department: String(row.department ?? "").trim(),
                dob,
            },
            todayIso,
            viewerId,
            seen,
        );
        if (alert) alerts.push(alert);
    }

    const legacyRows = await fetchLegacyBirthdayRows();
    for (const row of legacyRows) {
        const dob = toDateOnlyString(row.date);
        if (!dob) continue;

        const alert = alertFromRow(
            {
                employeeId: `birthday-${row.id}`,
                fullName: String(row.name ?? "").trim() || "Team member",
                department: "",
                dob,
            },
            todayIso,
            viewerId,
            seen,
        );
        if (alert) alerts.push(alert);
    }

    return alerts.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "today" ? -1 : 1;
        if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
        return a.fullName.localeCompare(b.fullName);
    });
}
