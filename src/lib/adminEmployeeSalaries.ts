import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

const TABLE = "admin_employee_salaries";

export type AdminEmployeeSalaryRow = RowDataPacket & {
    id: number;
    employee_id: string;
    basic_salary: number;
    hra: number;
    conveyance: number;
    special_allowance: number;
    performance_allowance: number;
    bonus: number;
    other_allowance: number;
    pf: number;
    pf_percent: number;
    esi: number;
    tds: number;
    advance_deduction: number;
    leave_deduction: number;
    is_active: number;
    notes: string | null;
    full_name: string | null;
    department: string | null;
    designation: string | null;
    employee_status: string | null;
};

let ensureTablePromise: Promise<void> | null = null;

async function runEnsureAdminEmployeeSalariesTable() {
    await ensureAdminEmployeesTable();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
            hra DECIMAL(12,2) NOT NULL DEFAULT 0,
            conveyance DECIMAL(12,2) NOT NULL DEFAULT 0,
            special_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
            performance_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
            bonus DECIMAL(12,2) NOT NULL DEFAULT 0,
            other_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
            pf DECIMAL(12,2) NOT NULL DEFAULT 0,
            pf_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
            esi DECIMAL(12,2) NOT NULL DEFAULT 0,
            tds DECIMAL(12,2) NOT NULL DEFAULT 0,
            advance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            leave_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_employee_salaries_employee_id (employee_id)
        )
    `);
}

export async function ensureAdminEmployeeSalariesTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminEmployeeSalariesTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

function parseMoney(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function parseSalaryBody(body: Record<string, unknown>, options?: { requireEmployeeId?: boolean }) {
    const employeeId =
        typeof body.employee_id === "string" ? body.employee_id.trim().toUpperCase() : "";
    const basicSalary = parseMoney(body.basic_salary);
    const hra = parseMoney(body.hra);
    const conveyance = parseMoney(body.conveyance);
    const specialAllowance = parseMoney(body.special_allowance);
    const performanceAllowance = parseMoney(body.performance_allowance);
    const bonus = parseMoney(body.bonus);
    const otherAllowance = parseMoney(body.other_allowance);
    const pf = parseMoney(body.pf);
    const pfPercent = parseMoney(body.pf_percent);
    const esi = parseMoney(body.esi);
    const tds = parseMoney(body.tds);
    const advanceDeduction = parseMoney(body.advance_deduction);
    const leaveDeduction = parseMoney(body.leave_deduction);
    const isActive = body.is_active !== false && body.is_active !== 0 && body.is_active !== "0";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    return {
        employeeId,
        basicSalary,
        hra,
        conveyance,
        specialAllowance,
        performanceAllowance,
        bonus,
        otherAllowance,
        pf,
        pfPercent,
        esi,
        tds,
        advanceDeduction,
        leaveDeduction,
        isActive,
        notes,
        requireEmployeeId: options?.requireEmployeeId ?? false,
    };
}

export const SALARY_SELECT_JOIN = `
    SELECT s.id, s.employee_id, s.basic_salary, s.hra, s.conveyance,
           s.special_allowance, s.performance_allowance, s.bonus, s.other_allowance,
           s.pf, s.pf_percent, s.esi, s.tds, s.advance_deduction, s.leave_deduction,
           s.is_active, s.notes,
           e.full_name, e.department, e.designation, e.employee_status
    FROM ${TABLE} s
    INNER JOIN admin_employees e ON e.employee_id = s.employee_id
`;

export function mapSalaryRowToApi(row: AdminEmployeeSalaryRow) {
    return {
        id: row.id,
        employee_id: row.employee_id,
        full_name: row.full_name ?? "",
        department: row.department ?? "",
        designation: row.designation ?? "",
        employee_status: row.employee_status ?? "Active",
        basic_salary: Number(row.basic_salary) || 0,
        hra: Number(row.hra) || 0,
        conveyance: Number(row.conveyance) || 0,
        special_allowance: Number(row.special_allowance) || 0,
        performance_allowance: Number(row.performance_allowance) || 0,
        bonus: Number(row.bonus) || 0,
        other_allowance: Number(row.other_allowance) || 0,
        pf: Number(row.pf) || 0,
        pf_percent: Number(row.pf_percent) || 0,
        esi: Number(row.esi) || 0,
        tds: Number(row.tds) || 0,
        advance_deduction: Number(row.advance_deduction) || 0,
        leave_deduction: Number(row.leave_deduction) || 0,
        is_active: Boolean(row.is_active),
        notes: row.notes ?? "",
    };
}

export async function employeeExists(employeeId: string): Promise<boolean> {
    await ensureAdminEmployeesTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT employee_id FROM admin_employees WHERE employee_id = ? LIMIT 1",
        [employeeId],
    );
    return rows.length > 0;
}

export const SALARY_INSERT_COLUMNS = `
    employee_id, basic_salary, hra, conveyance, special_allowance, performance_allowance,
    bonus, other_allowance, pf, pf_percent, esi, tds, advance_deduction, leave_deduction,
    is_active, notes
`;

export function salaryInsertValues(parsed: ReturnType<typeof parseSalaryBody>) {
    return [
        parsed.employeeId,
        parsed.basicSalary,
        parsed.hra,
        parsed.conveyance,
        parsed.specialAllowance,
        parsed.performanceAllowance,
        parsed.bonus,
        parsed.otherAllowance,
        parsed.pf,
        parsed.pfPercent,
        parsed.esi,
        parsed.tds,
        parsed.advanceDeduction,
        parsed.leaveDeduction,
        parsed.isActive ? 1 : 0,
        parsed.notes || null,
    ];
}
