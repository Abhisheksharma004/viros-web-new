import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
    EXPENSE_ID_PREFIX,
    EXPENSE_SERIAL_LENGTH,
    getExpenseIdPeriod,
} from "@/lib/employeeExpenseId";
import { toDateOnlyString } from "@/lib/dateOnly";

const TABLE = "employee_expenses";

export { EXPENSE_ID_PREFIX, EXPENSE_SERIAL_LENGTH, getExpenseIdPeriod } from "@/lib/employeeExpenseId";

type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

export const EXPENSE_CATEGORIES = [
    "Travel",
    "Food",
    "Lodging",
    "Fuel",
    "Metro",
    "Auto",
    "Cab Car",
    "Cab Bike",
    "Cab Logistic",
    "Bill Payments",
    "Office Supplies",
    "Client Meeting",
    "Other",
] as const;

export const EXPENSE_PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"] as const;

export const EXPENSE_STATUSES = ["pending", "approved", "rejected"] as const;

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Columns written from the add-expense form (plus employee + status metadata). */
export const EXPENSE_FORM_DB_FIELDS = [
    "expense_date",
    "category",
    "from_address",
    "to_address",
    "title",
    "amount",
    "payment_mode",
    "receipt_reference",
] as const;

function sqlCategoryEnumDefinition() {
    return EXPENSE_CATEGORIES.map((c) => `'${c.replace(/'/g, "''")}'`).join(", ");
}

export type EmployeeExpenseRow = {
    id: number;
    expense_id: string;
    employee_id: string;
    employee_name: string | null;
    expense_date: string;
    category: string;
    from_address: string | null;
    to_address: string | null;
    title: string;
    amount: number;
    payment_mode: string;
    receipt_reference: string | null;
    status: ExpenseStatus;
    reject_reason: string | null;
    created_at: string;
};

type DbRow = RowDataPacket & {
    id: number;
    expense_id: string | null;
    employee_id: string;
    employee_name: string | null;
    expense_date: Date | string;
    category: string;
    from_address: string | null;
    to_address: string | null;
    title: string;
    amount: string | number;
    payment_mode: string;
    receipt_reference: string | null;
    status: string;
    reject_reason: string | null;
    created_at: Date | string;
};

type ColumnNameRow = RowDataPacket & { COLUMN_NAME: string };

const EXPENSE_ROW_SELECT = `id, expense_id, employee_id, employee_name, expense_date, category, from_address, to_address,
                title, amount, payment_mode, receipt_reference, status, reject_reason, created_at`;

let ensureTablePromise: Promise<void> | null = null;

async function getExpenseTableColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<ColumnNameRow[]>(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [TABLE],
    );
    return new Set(rows.map((row) => row.COLUMN_NAME));
}

export async function ensureEmployeeExpensesTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsure().catch((err) => {
            ensureTablePromise = null;
            throw err;
        });
    }
    await ensureTablePromise;
}

async function runEnsure() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expense_id VARCHAR(16) NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            employee_name VARCHAR(255) NULL,
            expense_date DATE NOT NULL,
            category ENUM(${sqlCategoryEnumDefinition()}) NOT NULL,
            from_address VARCHAR(512) NULL,
            to_address VARCHAR(512) NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            payment_mode VARCHAR(32) NOT NULL,
            receipt_reference VARCHAR(128) NULL,
            status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_employee_expenses_expense_id (expense_id),
            INDEX idx_employee_expenses_employee (employee_id),
            INDEX idx_employee_expenses_date (expense_date),
            INDEX idx_employee_expenses_status (status)
        )
    `);

    let columns = await getExpenseTableColumns();
    const migrations: Array<{ column: string; sql: string }> = [
        {
            column: "expense_id",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN expense_id VARCHAR(16) NULL AFTER id`,
        },
        {
            column: "from_address",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN from_address VARCHAR(512) NULL AFTER category`,
        },
        {
            column: "to_address",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN to_address VARCHAR(512) NULL AFTER from_address`,
        },
        {
            column: "reject_reason",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN reject_reason TEXT NULL AFTER status`,
        },
    ];

    for (const migration of migrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }

    await pool.query(
        `ALTER TABLE ${TABLE} MODIFY COLUMN category ENUM(${sqlCategoryEnumDefinition()}) NOT NULL`,
    );

    if (columns.has("notes")) {
        await pool.query(`ALTER TABLE ${TABLE} DROP COLUMN notes`);
        columns.delete("notes");
    }

    await backfillMissingExpenseIds();

    columns = await getExpenseTableColumns();
    if (columns.has("expense_id")) {
        await pool.query(
            `ALTER TABLE ${TABLE} MODIFY COLUMN expense_id VARCHAR(16) NOT NULL`,
        );
        const [idxRows] = await pool.query<RowDataPacket[]>(
            `SELECT 1 FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = 'uk_employee_expenses_expense_id'
             LIMIT 1`,
            [TABLE],
        );
        if (idxRows.length === 0) {
            await pool.query(
                `ALTER TABLE ${TABLE} ADD UNIQUE KEY uk_employee_expenses_expense_id (expense_id)`,
            );
        }
    }
}

/** VEX + ddmm + serial, e.g. VEX2205001 */
export async function generateNextExpenseId(
    conn: DbConnection | typeof pool,
    expenseDate: string,
): Promise<string> {
    const period = getExpenseIdPeriod(expenseDate);
    const base = `${EXPENSE_ID_PREFIX}${period}`;

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT expense_id FROM ${TABLE}
         WHERE expense_id LIKE ?
         ORDER BY expense_id DESC
         LIMIT 1
         FOR UPDATE`,
        [`${base}%`],
    );

    let nextSerial = 1;
    const lastId = rows[0]?.expense_id;
    if (typeof lastId === "string" && lastId.startsWith(base)) {
        const serialPart = lastId.slice(base.length);
        const parsed = Number.parseInt(serialPart, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
            nextSerial = parsed + 1;
        }
    }

    if (nextSerial > 10 ** EXPENSE_SERIAL_LENGTH - 1) {
        throw new Error("Daily expense ID limit reached. Try again tomorrow or contact admin.");
    }

    return `${base}${String(nextSerial).padStart(EXPENSE_SERIAL_LENGTH, "0")}`;
}

async function backfillMissingExpenseIds() {
    const [rows] = await pool.query<
        (RowDataPacket & { id: number; expense_date: Date | string })[]
    >(
        `SELECT id, expense_date FROM ${TABLE}
         WHERE expense_id IS NULL OR expense_id = ''
         ORDER BY id ASC`,
    );

    if (rows.length === 0) return;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const row of rows) {
            const expenseDate = toIsoDate(row.expense_date);
            const expenseId = await generateNextExpenseId(conn, expenseDate);
            await conn.query(`UPDATE ${TABLE} SET expense_id = ? WHERE id = ?`, [
                expenseId,
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

function toIsoDate(v: Date | string): string {
    return toDateOnlyString(v);
}

function toIsoDateTime(v: Date | string): string {
    if (v instanceof Date) return v.toISOString();
    return String(v);
}

export function mapExpenseRow(row: DbRow): EmployeeExpenseRow {
    const expenseDate = toIsoDate(row.expense_date);
    const fallbackExpenseId =
        row.expense_id ??
        `${EXPENSE_ID_PREFIX}${getExpenseIdPeriod(expenseDate)}${String(row.id).padStart(EXPENSE_SERIAL_LENGTH, "0")}`;

    return {
        id: row.id,
        expense_id: fallbackExpenseId,
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        expense_date: expenseDate,
        category: row.category,
        from_address: row.from_address ?? null,
        to_address: row.to_address ?? null,
        title: row.title,
        amount: Number(row.amount) || 0,
        payment_mode: row.payment_mode,
        receipt_reference: row.receipt_reference,
        status: (EXPENSE_STATUSES.includes(row.status as ExpenseStatus)
            ? row.status
            : "pending") as ExpenseStatus,
        reject_reason: row.reject_reason?.trim() || null,
        created_at: toIsoDateTime(row.created_at),
    };
}

export async function listEmployeeExpenses(
    employeeId: string,
    options?: { limit?: number; month?: string; status?: ExpenseStatus },
): Promise<EmployeeExpenseRow[]> {
    await ensureEmployeeExpensesTable();

    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
    const params: unknown[] = [employeeId];
    let extraFilters = "";

    if (options?.month && /^\d{4}-\d{2}$/.test(options.month)) {
        extraFilters += " AND DATE_FORMAT(expense_date, '%Y-%m') = ?";
        params.push(options.month);
    }

    if (options?.status && EXPENSE_STATUSES.includes(options.status)) {
        extraFilters += " AND status = ?";
        params.push(options.status);
    }

    params.push(limit);

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${EXPENSE_ROW_SELECT}
         FROM ${TABLE}
         WHERE employee_id = ?${extraFilters}
         ORDER BY expense_date DESC, id DESC
         LIMIT ?`,
        params,
    );

    return rows.map(mapExpenseRow);
}

export async function getEmployeeExpenseSummaryByStatus(
    employeeId: string,
    month: string,
    status: ExpenseStatus,
) {
    await ensureEmployeeExpensesTable();

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            COALESCE(SUM(amount), 0) AS total_amount,
            COUNT(*) AS expense_count
         FROM ${TABLE}
         WHERE employee_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ? AND status = ?`,
        [employeeId, month, status],
    );

    const row = rows[0] as
        | (RowDataPacket & { total_amount: string | number; expense_count: number })
        | undefined;
    return {
        totalAmount: Number(row?.total_amount) || 0,
        expenseCount: Number(row?.expense_count) || 0,
    };
}

export type CreateExpenseInput = {
    employeeId: string;
    employeeName: string;
    expenseDate: string;
    category: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    title: string;
    amount: number;
    paymentMode: string;
    receiptReference?: string | null;
};

export async function createEmployeeExpense(input: CreateExpenseInput): Promise<EmployeeExpenseRow> {
    await ensureEmployeeExpensesTable();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const expenseId = await generateNextExpenseId(conn, input.expenseDate);

        const [result] = await conn.query<ResultSetHeader>(
            `INSERT INTO ${TABLE}
                (expense_id, employee_id, employee_name, expense_date, category, from_address, to_address, title, amount, payment_mode, receipt_reference, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                expenseId,
                input.employeeId,
                input.employeeName || null,
                input.expenseDate,
                input.category,
                input.fromAddress?.trim() || null,
                input.toAddress?.trim() || null,
                input.title,
                input.amount,
                input.paymentMode,
                input.receiptReference?.trim() || null,
            ],
        );

        const insertId = result.insertId;
        const [rows] = await conn.query<DbRow[]>(
            `SELECT ${EXPENSE_ROW_SELECT}
             FROM ${TABLE} WHERE id = ? LIMIT 1`,
            [insertId],
        );

        await conn.commit();

        const row = rows[0];
        if (!row) throw new Error("Failed to load created expense");
        return mapExpenseRow(row);
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

export async function getEmployeeExpenseSummary(employeeId: string, month: string) {
    await ensureEmployeeExpensesTable();

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            COALESCE(SUM(amount), 0) AS total_amount,
            COUNT(*) AS expense_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
         FROM ${TABLE}
         WHERE employee_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?`,
        [employeeId, month],
    );

    const row = rows[0] as
        | (RowDataPacket & { total_amount: string | number; expense_count: number; pending_count: number })
        | undefined;
    return {
        totalAmount: Number(row?.total_amount) || 0,
        expenseCount: Number(row?.expense_count) || 0,
        pendingCount: Number(row?.pending_count) || 0,
    };
}

export type AdminExpenseFilters = {
    status?: ExpenseStatus | "all";
    month?: string;
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    query?: string;
    limit?: number;
};

export async function listAllExpensesForAdmin(filters?: AdminExpenseFilters): Promise<EmployeeExpenseRow[]> {
    await ensureEmployeeExpensesTable();

    const limit = Math.min(Math.max(filters?.limit ?? 200, 1), 500);
    const params: unknown[] = [];
    const where: string[] = [];

    const month = filters?.month?.trim();
    if (month && /^\d{4}-\d{2}$/.test(month)) {
        where.push("DATE_FORMAT(expense_date, '%Y-%m') = ?");
        params.push(month);
    }

    const fromDate = filters?.fromDate?.trim();
    if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
        where.push("expense_date >= ?");
        params.push(fromDate);
    }

    const toDate = filters?.toDate?.trim();
    if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
        where.push("expense_date <= ?");
        params.push(toDate);
    }

    const employeeId = filters?.employeeId?.trim();
    if (employeeId) {
        where.push("employee_id = ?");
        params.push(employeeId);
    }

    const status = filters?.status;
    if (status && status !== "all" && EXPENSE_STATUSES.includes(status as ExpenseStatus)) {
        where.push("status = ?");
        params.push(status);
    }

    const q = filters?.query?.trim();
    if (q) {
        const like = `%${q}%`;
        where.push(
            "(expense_id LIKE ? OR employee_id LIKE ? OR employee_name LIKE ? OR category LIKE ? OR title LIKE ? OR payment_mode LIKE ? OR receipt_reference LIKE ? OR from_address LIKE ? OR to_address LIKE ?)",
        );
        params.push(like, like, like, like, like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    params.push(limit);

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${EXPENSE_ROW_SELECT}
         FROM ${TABLE}
         ${whereSql}
         ORDER BY expense_date DESC, id DESC
         LIMIT ?`,
        params,
    );

    return rows.map(mapExpenseRow);
}

export type AdminExpenseEmployeeSummary = {
    employeeId: string;
    employeeName: string;
    totalCount: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
};

export async function listAdminExpenseEmployeeSummaries(
    filters?: AdminExpenseFilters,
): Promise<AdminExpenseEmployeeSummary[]> {
    await ensureEmployeeExpensesTable();

    const params: unknown[] = [];
    const where: string[] = [];

    const month = filters?.month?.trim();
    if (month && /^\d{4}-\d{2}$/.test(month)) {
        where.push("DATE_FORMAT(expense_date, '%Y-%m') = ?");
        params.push(month);
    }

    const fromDate = filters?.fromDate?.trim();
    if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
        where.push("expense_date >= ?");
        params.push(fromDate);
    }

    const toDate = filters?.toDate?.trim();
    if (toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
        where.push("expense_date <= ?");
        params.push(toDate);
    }

    const status = filters?.status;
    if (status && status !== "all" && EXPENSE_STATUSES.includes(status as ExpenseStatus)) {
        where.push("status = ?");
        params.push(status);
    }

    const q = filters?.query?.trim();
    if (q) {
        const like = `%${q}%`;
        where.push("(employee_id LIKE ? OR employee_name LIKE ?)");
        params.push(like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<
        (RowDataPacket & {
            employee_id: string;
            employee_name: string | null;
            total_count: number;
            total_amount: string | number;
            pending_count: number;
            pending_amount: string | number;
            approved_count: number;
            approved_amount: string | number;
            rejected_count: number;
            rejected_amount: string | number;
        })[]
    >(
        `SELECT
            employee_id,
            MAX(employee_name) AS employee_name,
            COUNT(*) AS total_count,
            COALESCE(SUM(amount), 0) AS total_amount,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS approved_amount,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
            COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) AS rejected_amount
         FROM ${TABLE}
         ${whereSql}
         GROUP BY employee_id
         ORDER BY total_amount DESC, employee_name ASC`,
        params,
    );

    return rows.map((row) => ({
        employeeId: String(row.employee_id),
        employeeName: String(row.employee_name || "").trim(),
        totalCount: Number(row.total_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
        pendingCount: Number(row.pending_count) || 0,
        pendingAmount: Number(row.pending_amount) || 0,
        approvedCount: Number(row.approved_count) || 0,
        approvedAmount: Number(row.approved_amount) || 0,
        rejectedCount: Number(row.rejected_count) || 0,
        rejectedAmount: Number(row.rejected_amount) || 0,
    }));
}

export async function updateExpenseStatusForAdmin(
    recordId: number,
    status: ExpenseStatus,
    options?: { rejectReason?: string },
): Promise<EmployeeExpenseRow | null> {
    await ensureEmployeeExpensesTable();
    if (!Number.isFinite(recordId) || recordId <= 0) return null;
    if (!EXPENSE_STATUSES.includes(status)) return null;

    if (status === "rejected") {
        const rejectReason = options?.rejectReason?.trim() ?? "";
        if (!rejectReason) {
            throw new Error("Rejection reason is required");
        }
        await pool.query(`UPDATE ${TABLE} SET status = ?, reject_reason = ? WHERE id = ?`, [
            status,
            rejectReason,
            recordId,
        ]);
    } else {
        await pool.query(`UPDATE ${TABLE} SET status = ?, reject_reason = NULL WHERE id = ?`, [
            status,
            recordId,
        ]);
    }

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${EXPENSE_ROW_SELECT}
         FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [recordId],
    );
    const row = rows[0];
    if (!row) return null;
    return mapExpenseRow(row);
}

export type EmployeeExpenseMonthlySummary = {
    month: string;
    totalCount: number;
    totalAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
    pendingCount: number;
    pendingAmount: number;
};

export async function listEmployeeExpenseMonthlySummaries(
    employeeId: string,
    options?: { limit?: number },
): Promise<EmployeeExpenseMonthlySummary[]> {
    await ensureEmployeeExpensesTable();

    const limit = Math.min(Math.max(options?.limit ?? 12, 1), 60);

    const [rows] = await pool.query<
        (RowDataPacket & {
            expense_month: string;
            total_count: number;
            total_amount: string | number;
            approved_count: number;
            approved_amount: string | number;
            rejected_count: number;
            rejected_amount: string | number;
            pending_count: number;
            pending_amount: string | number;
        })[]
    >(
        `SELECT
            DATE_FORMAT(expense_date, '%Y-%m') AS expense_month,
            COUNT(*) AS total_count,
            COALESCE(SUM(amount), 0) AS total_amount,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS approved_amount,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
            COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) AS rejected_amount,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount
         FROM ${TABLE}
         WHERE employee_id = ?
         GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
         ORDER BY expense_month DESC
         LIMIT ?`,
        [employeeId, limit],
    );

    return rows.map((row) => ({
        month: String(row.expense_month),
        totalCount: Number(row.total_count) || 0,
        totalAmount: Number(row.total_amount) || 0,
        approvedCount: Number(row.approved_count) || 0,
        approvedAmount: Number(row.approved_amount) || 0,
        rejectedCount: Number(row.rejected_count) || 0,
        rejectedAmount: Number(row.rejected_amount) || 0,
        pendingCount: Number(row.pending_count) || 0,
        pendingAmount: Number(row.pending_amount) || 0,
    }));
}
