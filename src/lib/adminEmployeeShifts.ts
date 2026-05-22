import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

const TABLE = "admin_employee_shifts";

export const LOCATION_TYPES = ["office", "remote", "hybrid", "client"] as const;
export type ShiftLocationType = (typeof LOCATION_TYPES)[number];

export type AdminEmployeeShiftRow = RowDataPacket & {
    id: number;
    employee_id: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    grace_minutes: number;
    location_type: ShiftLocationType;
    location_label: string;
    working_days: string;
    is_active: number;
    full_name: string | null;
    department: string | null;
    designation: string | null;
    employee_status: string | null;
};

let ensureTablePromise: Promise<void> | null = null;

async function runEnsureAdminEmployeeShiftsTable() {
    await ensureAdminEmployeesTable();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            break_minutes INT NOT NULL DEFAULT 0,
            grace_minutes INT NOT NULL DEFAULT 0,
            location_type ENUM('office', 'remote', 'hybrid', 'client') NOT NULL DEFAULT 'office',
            location_label VARCHAR(500) NOT NULL DEFAULT '',
            working_days JSON NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_employee_shifts_employee_id (employee_id)
        )
    `);
}

export async function ensureAdminEmployeeShiftsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminEmployeeShiftsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

export function formatTimeHHMM(value: unknown): string {
    if (value == null || value === "") return "09:00";
    const s = String(value);
    const match = s.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return "09:00";
    return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function parseWorkingDaysJson(raw: unknown): number[] {
    if (Array.isArray(raw)) {
        return raw.map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
    }
    if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                return parsed.map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
            }
        } catch {
            return [1, 2, 3, 4, 5];
        }
    }
    return [1, 2, 3, 4, 5];
}

export function serializeWorkingDays(days: number[]): string {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const unique = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6)));
    unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return JSON.stringify(unique);
}

export const SHIFT_SELECT_JOIN = `
    SELECT s.id, s.employee_id, s.start_time, s.end_time, s.break_minutes, s.grace_minutes,
           s.location_type, s.location_label, s.working_days, s.is_active,
           e.full_name, e.department, e.designation, e.employee_status
    FROM ${TABLE} s
    INNER JOIN admin_employees e ON e.employee_id = s.employee_id
`;

export function mapShiftRowToApi(row: AdminEmployeeShiftRow) {
    return {
        id: row.id,
        employee_id: row.employee_id,
        full_name: row.full_name ?? "",
        department: row.department ?? "",
        designation: row.designation ?? "",
        employee_status: row.employee_status ?? "Active",
        start_time: formatTimeHHMM(row.start_time),
        end_time: formatTimeHHMM(row.end_time),
        break_minutes: Number(row.break_minutes) || 0,
        grace_minutes: Number(row.grace_minutes) || 0,
        location_type: row.location_type,
        location_label: row.location_label ?? "",
        working_days: parseWorkingDaysJson(row.working_days),
        is_active: Boolean(row.is_active),
    };
}

export async function getShiftByEmployeeId(employeeId: string) {
    await ensureAdminEmployeeShiftsTable();
    const [rows] = await pool.query(`${SHIFT_SELECT_JOIN} WHERE s.employee_id = ? LIMIT 1`, [
        employeeId.trim(),
    ]);
    const row = (rows as AdminEmployeeShiftRow[])[0];
    return row ? mapShiftRowToApi(row) : null;
}

export async function getActiveShiftWorkingDaysMap(): Promise<Map<string, number[]>> {
    await ensureAdminEmployeeShiftsTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id, working_days, is_active FROM ${TABLE}`,
    );
    const map = new Map<string, number[]>();
    for (const row of rows) {
        if (!Number(row.is_active)) continue;
        map.set(String(row.employee_id), parseWorkingDaysJson(row.working_days));
    }
    return map;
}

export async function employeeExists(employeeId: string): Promise<boolean> {
    await ensureAdminEmployeesTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT employee_id FROM admin_employees WHERE employee_id = ? LIMIT 1",
        [employeeId],
    );
    return rows.length > 0;
}
