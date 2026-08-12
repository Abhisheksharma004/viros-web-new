import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { ensureAdminEmployeeSalariesTable } from "@/lib/adminEmployeeSalaries";
import {
    ADVANCE_ID_MYSQL_PATTERN,
    ADVANCE_ID_PREFIX,
    ADVANCE_SERIAL_LENGTH,
    getAdvanceIdPeriod,
} from "@/lib/adminAdvancePaymentId";

const TABLE = "admin_employee_advance_payments";
const LEDGER_TABLE = "admin_advance_recovery_ledger";

const PAYROLL_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type AdvancePaymentStatus = "pending" | "recovering" | "recovered" | "cancelled";
export type AdvancePaymentMode = "bank_transfer" | "cash" | "cheque";

export type AdminEmployeeAdvancePaymentRow = RowDataPacket & {
    id: number;
    advance_id: string;
    employee_id: string;
    amount: number;
    recovered_amount: number;
    advance_date: Date | string;
    recovery_start_month: string | null;
    monthly_deduction: number;
    emi_months: number;
    payment_mode: AdvancePaymentMode;
    status: AdvancePaymentStatus;
    purpose: string;
    notes: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    full_name: string | null;
    department: string | null;
    designation: string | null;
    employee_status: string | null;
};

type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

let ensureTablePromise: Promise<void> | null = null;

function toIsoDate(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    const text = String(value);
    return text.includes("T") ? text.slice(0, 10) : text.slice(0, 10);
}

function toIsoDateTime(value: Date | string): string {
    if (value instanceof Date) return value.toISOString();
    const text = String(value);
    if (text.includes("T")) return text;
    return `${text.replace(" ", "T")}Z`;
}

async function columnExists(columnName: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [TABLE, columnName],
    );
    return rows.length > 0;
}

async function runEnsureAdminEmployeeAdvancePaymentsTable() {
    await ensureAdminEmployeesTable();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            advance_id VARCHAR(16) NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            recovered_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            advance_date DATE NOT NULL,
            recovery_start_month VARCHAR(7) NULL,
            monthly_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            emi_months DECIMAL(5,2) NOT NULL DEFAULT 0,
            payment_mode ENUM('bank_transfer', 'cash', 'cheque') NOT NULL DEFAULT 'bank_transfer',
            status ENUM('pending', 'recovering', 'recovered', 'cancelled') NOT NULL DEFAULT 'pending',
            purpose VARCHAR(500) NOT NULL DEFAULT '',
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_advance_payments_advance_id (advance_id),
            INDEX idx_admin_advance_payments_employee (employee_id),
            INDEX idx_admin_advance_payments_status (status)
        )
    `);

    if (!(await columnExists("advance_id"))) {
        await pool.query(
            `ALTER TABLE ${TABLE} ADD COLUMN advance_id VARCHAR(16) NULL AFTER id`,
        );
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${LEDGER_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            advance_payment_id INT NOT NULL,
            payroll_month VARCHAR(7) NOT NULL,
            deducted_amount DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_advance_recovery_ledger_month (advance_payment_id, payroll_month),
            INDEX idx_advance_recovery_ledger_payroll (payroll_month),
            CONSTRAINT fk_advance_recovery_ledger_payment
                FOREIGN KEY (advance_payment_id) REFERENCES ${TABLE}(id) ON DELETE CASCADE
        )
    `);
}

export async function ensureAdminEmployeeAdvancePaymentsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminEmployeeAdvancePaymentsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
    await backfillMissingAdvanceIds();
}

/** VEAD + mmyy + serial, e.g. VEAD0526001 */
export async function generateNextAdvanceId(
    conn: DbConnection | typeof pool,
    advanceDate: string,
): Promise<string> {
    const period = getAdvanceIdPeriod(advanceDate);
    const base = `${ADVANCE_ID_PREFIX}${period}`;

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT advance_id FROM ${TABLE}
         WHERE advance_id LIKE ?
         ORDER BY advance_id DESC
         LIMIT 1
         FOR UPDATE`,
        [`${base}%`],
    );

    let nextSerial = 1;
    const lastId = rows[0]?.advance_id;
    if (typeof lastId === "string" && lastId.startsWith(base)) {
        const serialPart = lastId.slice(base.length);
        const parsed = Number.parseInt(serialPart, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
            nextSerial = parsed + 1;
        }
    }

    if (nextSerial > 10 ** ADVANCE_SERIAL_LENGTH - 1) {
        throw new Error("Monthly advance ID limit reached. Try again next month or contact admin.");
    }

    return `${base}${String(nextSerial).padStart(ADVANCE_SERIAL_LENGTH, "0")}`;
}

async function backfillMissingAdvanceIds() {
    const [rows] = await pool.query<
        (RowDataPacket & { id: number; advance_date: Date | string })[]
    >(
        `SELECT id, advance_date FROM ${TABLE}
         WHERE advance_id IS NULL
            OR TRIM(advance_id) = ''
            OR advance_id NOT REGEXP ?
         ORDER BY advance_date ASC, id ASC`,
        [ADVANCE_ID_MYSQL_PATTERN],
    );

    if (rows.length === 0) return;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const row of rows) {
            const advanceDate = toIsoDate(row.advance_date);
            const advanceId = await generateNextAdvanceId(conn, advanceDate);
            await conn.query(`UPDATE ${TABLE} SET advance_id = ? WHERE id = ?`, [
                advanceId,
                row.id,
            ]);
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

function parseMoney(value: unknown): number {
    if (typeof value === "string") {
        const n = Number(value.replace(/,/g, "").trim());
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function parseEmiMonths(value: unknown): number {
    if (typeof value === "string") {
        const n = Number(value.trim());
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.min(120, n);
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(120, n);
}

const PAYMENT_MODES: AdvancePaymentMode[] = ["bank_transfer", "cash", "cheque"];
const STATUSES: AdvancePaymentStatus[] = ["pending", "recovering", "recovered", "cancelled"];

export function deriveAdvanceStatus(
    amount: number,
    recovered: number,
    selected: AdvancePaymentStatus,
): AdvancePaymentStatus {
    if (selected === "cancelled") return "cancelled";
    if (amount > 0 && recovered >= amount) return "recovered";
    if (recovered > 0) return "recovering";
    return selected === "recovered" ? "recovered" : selected;
}

export function parseAdvancePaymentBody(
    body: Record<string, unknown>,
    options?: { requireEmployeeId?: boolean },
) {
    const employeeId =
        typeof body.employee_id === "string" ? body.employee_id.trim().toUpperCase() : "";
    const amount = parseMoney(body.amount);
    const recoveredAmount = parseMoney(body.recovered_amount);
    const advanceDate =
        typeof body.advance_date === "string" ? body.advance_date.trim().slice(0, 10) : "";
    const recoveryStartMonth =
        typeof body.recovery_start_month === "string"
            ? body.recovery_start_month.trim().slice(0, 7)
            : "";
    const monthlyDeduction = parseMoney(body.monthly_deduction);
    const emiMonths = parseEmiMonths(body.emi_months);
    const paymentMode = PAYMENT_MODES.includes(body.payment_mode as AdvancePaymentMode)
        ? (body.payment_mode as AdvancePaymentMode)
        : "bank_transfer";
    const selectedStatus = STATUSES.includes(body.status as AdvancePaymentStatus)
        ? (body.status as AdvancePaymentStatus)
        : "pending";
    const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const status = deriveAdvanceStatus(amount, recoveredAmount, selectedStatus);

    return {
        employeeId,
        amount,
        recoveredAmount,
        advanceDate,
        recoveryStartMonth,
        monthlyDeduction,
        emiMonths,
        paymentMode,
        status,
        purpose,
        notes,
        requireEmployeeId: options?.requireEmployeeId ?? false,
    };
}

export const ADVANCE_PAYMENT_SELECT_JOIN = `
    SELECT a.id, a.advance_id, a.employee_id, a.amount, a.recovered_amount, a.advance_date,
           a.recovery_start_month, a.monthly_deduction, a.emi_months, a.payment_mode, a.status,
           a.purpose, a.notes, a.created_at, a.updated_at,
           e.full_name, e.department, e.designation, e.employee_status
    FROM ${TABLE} a
    INNER JOIN admin_employees e ON e.employee_id = a.employee_id AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
`;

export function mapAdvancePaymentRowToApi(row: AdminEmployeeAdvancePaymentRow) {
    return {
        id: row.id,
        advance_id: row.advance_id,
        employee_id: row.employee_id,
        full_name: row.full_name ?? "",
        department: row.department ?? "",
        designation: row.designation ?? "",
        employee_status: row.employee_status ?? "Active",
        amount: Number(row.amount) || 0,
        recovered_amount: Number(row.recovered_amount) || 0,
        advance_date: toIsoDate(row.advance_date),
        recovery_start_month: row.recovery_start_month ?? "",
        monthly_deduction: Number(row.monthly_deduction) || 0,
        emi_months: Number(row.emi_months) || 0,
        payment_mode: row.payment_mode,
        status: row.status,
        purpose: row.purpose ?? "",
        notes: row.notes ?? "",
        created_at: toIsoDateTime(row.created_at),
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

export async function getAdvancePaymentById(id: number) {
    await ensureAdminEmployeeAdvancePaymentsTable();
    const [rows] = await pool.query(`${ADVANCE_PAYMENT_SELECT_JOIN} WHERE a.id = ?`, [id]);
    const row = (rows as RowDataPacket[])[0] as AdminEmployeeAdvancePaymentRow | undefined;
    return row ?? null;
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export function parsePayrollMonth(value: unknown): string {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().slice(0, 7);
    return PAYROLL_MONTH_PATTERN.test(trimmed) ? trimmed : "";
}

export function isPayrollMonthOnOrAfterRecoveryStart(
    recoveryStartMonth: string | null | undefined,
    payrollMonth: string,
): boolean {
    const start = (recoveryStartMonth ?? "").trim().slice(0, 7);
    if (!start || !PAYROLL_MONTH_PATTERN.test(start)) return false;
    return payrollMonth >= start;
}

function monthsBetweenInclusive(startYm: string, endYm: string): number {
    const [sy, sm] = startYm.split("-").map(Number);
    const [ey, em] = endYm.split("-").map(Number);
    if (!sy || !sm || !ey || !em) return 0;
    return (ey - sy) * 12 + (em - sm) + 1;
}

export type AdvanceDeductionPreviewRow = {
    employee_id: string;
    amount: number;
    recovered_amount: number;
    recovery_start_month: string;
    monthly_deduction: number;
    emi_months: number;
    status: AdvancePaymentStatus;
};

/** Planned advance deduction for payroll month (0 before recovery start month). */
export function computeAdvanceDeductionForPayrollMonth(
    advances: AdvanceDeductionPreviewRow[],
    employeeId: string,
    payrollMonth: string,
): number {
    const month = parsePayrollMonth(payrollMonth);
    if (!month) return 0;

    let total = 0;
    const empKey = employeeId.trim().toUpperCase();

    for (const row of advances) {
        if (row.employee_id.trim().toUpperCase() !== empKey) continue;
        if (row.status === "cancelled" || row.status === "recovered") continue;
        if (!isPayrollMonthOnOrAfterRecoveryStart(row.recovery_start_month, month)) continue;

        const remaining = roundMoney(Math.max(0, Number(row.amount) - Number(row.recovered_amount)));
        const monthlyDeduction = Number(row.monthly_deduction) || 0;
        if (remaining <= 0 || monthlyDeduction <= 0) continue;

        const emiMonths = Number(row.emi_months) || 0;
        if (emiMonths > 0) {
            const start = row.recovery_start_month.trim().slice(0, 7);
            const monthsElapsed = monthsBetweenInclusive(start, month);
            if (monthsElapsed > emiMonths) continue;
        }

        total = roundMoney(total + Math.min(monthlyDeduction, remaining));
    }

    return total;
}

export type AdvanceRecoveryLine = {
    advance_payment_id: number;
    advance_id: string;
    employee_id: string;
    deducted_amount: number;
    new_recovered_amount: number;
    new_status: AdvancePaymentStatus;
};

export type AdvanceRecoverySkip = {
    advance_payment_id: number;
    advance_id: string;
    employee_id: string;
    reason: string;
};

export type ProcessAdvanceRecoveryResult = {
    payroll_month: string;
    processed: AdvanceRecoveryLine[];
    skipped: AdvanceRecoverySkip[];
    total_deducted: number;
    salary_deductions_updated: number;
};

type AdvanceRecoveryCandidate = RowDataPacket & {
    id: number;
    advance_id: string;
    employee_id: string;
    amount: number;
    recovered_amount: number;
    recovery_start_month: string | null;
    monthly_deduction: number;
    emi_months: number;
    status: AdvancePaymentStatus;
    ledger_count: number;
    already_processed: number;
};

async function applyAdvanceRecoveryForRows(
    conn: DbConnection,
    rows: AdvanceRecoveryCandidate[],
    month: string,
): Promise<{
    processed: AdvanceRecoveryLine[];
    skipped: AdvanceRecoverySkip[];
    salaryDeductionByEmployee: Map<string, number>;
}> {
    const processed: AdvanceRecoveryLine[] = [];
    const skipped: AdvanceRecoverySkip[] = [];
    const salaryDeductionByEmployee = new Map<string, number>();

    for (const row of rows) {
        const baseSkip = {
            advance_payment_id: row.id,
            advance_id: row.advance_id,
            employee_id: row.employee_id,
        };
        const amount = Number(row.amount) || 0;
        const recovered = Number(row.recovered_amount) || 0;
        const monthlyDeduction = Number(row.monthly_deduction) || 0;
        const emiMonths = Number(row.emi_months) || 0;
        const ledgerCount = Number(row.ledger_count) || 0;
        const remaining = roundMoney(Math.max(0, amount - recovered));

        if (Number(row.already_processed) > 0) {
            skipped.push({ ...baseSkip, reason: "Already processed for this payroll month" });
            continue;
        }
        if (!isPayrollMonthOnOrAfterRecoveryStart(row.recovery_start_month, month)) {
            skipped.push({ ...baseSkip, reason: "Recovery start month not reached" });
            continue;
        }
        if (monthlyDeduction <= 0) {
            skipped.push({ ...baseSkip, reason: "Monthly deduction is not set" });
            continue;
        }
        if (remaining <= 0) {
            skipped.push({ ...baseSkip, reason: "Advance already fully recovered" });
            continue;
        }
        if (emiMonths > 0 && ledgerCount >= emiMonths) {
            skipped.push({ ...baseSkip, reason: "EMI month limit reached" });
            continue;
        }

        const deduct = roundMoney(Math.min(monthlyDeduction, remaining));
        if (deduct <= 0) {
            skipped.push({ ...baseSkip, reason: "No deductible amount" });
            continue;
        }

        const newRecovered = roundMoney(recovered + deduct);
        const newStatus = deriveAdvanceStatus(amount, newRecovered, row.status);

        await conn.query(
            `INSERT INTO ${LEDGER_TABLE} (advance_payment_id, payroll_month, deducted_amount)
             VALUES (?, ?, ?)`,
            [row.id, month, deduct],
        );
        await conn.query(
            `UPDATE ${TABLE}
             SET recovered_amount = ?, status = ?
             WHERE id = ?`,
            [newRecovered, newStatus, row.id],
        );

        processed.push({
            advance_payment_id: row.id,
            advance_id: row.advance_id,
            employee_id: row.employee_id,
            deducted_amount: deduct,
            new_recovered_amount: newRecovered,
            new_status: newStatus,
        });

        salaryDeductionByEmployee.set(
            row.employee_id,
            roundMoney((salaryDeductionByEmployee.get(row.employee_id) ?? 0) + deduct),
        );
    }

    return { processed, skipped, salaryDeductionByEmployee };
}

async function syncSalaryAdvanceDeductions(
    conn: DbConnection,
    salaryDeductionByEmployee: Map<string, number>,
): Promise<number> {
    let salaryDeductionsUpdated = 0;
    for (const [employeeId, deduction] of salaryDeductionByEmployee) {
        const [result] = await conn.query(
            `UPDATE admin_employee_salaries
             SET advance_deduction = ?
             WHERE employee_id = ?`,
            [deduction, employeeId],
        );
        if ((result as ResultSetHeader).affectedRows > 0) {
            salaryDeductionsUpdated += 1;
        }
    }
    return salaryDeductionsUpdated;
}

const ADVANCE_RECOVERY_SELECT = `
    SELECT a.id, a.advance_id, a.employee_id, a.amount, a.recovered_amount,
           a.recovery_start_month, a.monthly_deduction, a.emi_months, a.status,
           (SELECT COUNT(*) FROM ${LEDGER_TABLE} l WHERE l.advance_payment_id = a.id) AS ledger_count,
           (SELECT COUNT(*) FROM ${LEDGER_TABLE} l
            WHERE l.advance_payment_id = a.id AND l.payroll_month = ?) AS already_processed
    FROM ${TABLE} a
    WHERE a.status IN ('pending', 'recovering')
`;

/** Apply advance recovery for one employee within an existing transaction. */
export async function processAdvanceRecoveryForEmployeePayrollMonth(
    conn: DbConnection,
    employeeId: string,
    payrollMonth: string,
): Promise<{
    processed: AdvanceRecoveryLine[];
    skipped: AdvanceRecoverySkip[];
    total_deducted: number;
}> {
    const month = parsePayrollMonth(payrollMonth);
    if (!month) {
        throw new Error("Invalid payroll month. Use YYYY-MM format.");
    }

    const trimmed = employeeId.trim().toUpperCase();
    const [rows] = await conn.query<AdvanceRecoveryCandidate[]>(
        `${ADVANCE_RECOVERY_SELECT} AND a.employee_id = ?
         ORDER BY a.recovery_start_month ASC, a.id ASC`,
        [month, trimmed],
    );

    const { processed, skipped, salaryDeductionByEmployee } = await applyAdvanceRecoveryForRows(
        conn,
        rows,
        month,
    );
    await syncSalaryAdvanceDeductions(conn, salaryDeductionByEmployee);

    return {
        processed,
        skipped,
        total_deducted: roundMoney(processed.reduce((sum, line) => sum + line.deducted_amount, 0)),
    };
}

export async function processAdvanceRecoveryForPayrollMonth(
    payrollMonth: string,
): Promise<ProcessAdvanceRecoveryResult> {
    const month = parsePayrollMonth(payrollMonth);
    if (!month) {
        throw new Error("Invalid payroll month. Use YYYY-MM format.");
    }

    await ensureAdminEmployeeAdvancePaymentsTable();
    await ensureAdminEmployeeSalariesTable();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query<AdvanceRecoveryCandidate[]>(
            `${ADVANCE_RECOVERY_SELECT}
             ORDER BY a.recovery_start_month ASC, a.id ASC`,
            [month],
        );

        const { processed, skipped, salaryDeductionByEmployee } = await applyAdvanceRecoveryForRows(
            conn,
            rows,
            month,
        );
        const salaryDeductionsUpdated = await syncSalaryAdvanceDeductions(
            conn,
            salaryDeductionByEmployee,
        );

        await conn.commit();

        return {
            payroll_month: month,
            processed,
            skipped,
            total_deducted: roundMoney(
                processed.reduce((sum, line) => sum + line.deducted_amount, 0),
            ),
            salary_deductions_updated: salaryDeductionsUpdated,
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}
