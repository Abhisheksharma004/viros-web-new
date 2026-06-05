import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import {
    ADVANCE_ID_MYSQL_PATTERN,
    ADVANCE_ID_PREFIX,
    ADVANCE_SERIAL_LENGTH,
    getAdvanceIdPeriod,
} from "@/lib/adminAdvancePaymentId";

const TABLE = "admin_employee_advance_payments";

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
    INNER JOIN admin_employees e ON e.employee_id = a.employee_id
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
