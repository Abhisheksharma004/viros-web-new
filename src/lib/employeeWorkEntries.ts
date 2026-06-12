import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { toDateOnlyString } from "@/lib/dateOnly";
import {
    type AdminWorkEntrySummary,
    type EmployeeWorkEntryRow,
    type WorkEntrySummary,
    type WorkStatus,
    isValidWorkDuration,
    normalizeWorkStatus,
} from "@/lib/employeeWorkShared";

export {
    WORK_STATUSES,
    WORK_DURATION_OPTIONS,
    type AdminWorkEntrySummary,
    type EmployeeWorkEntryRow,
    type WorkEntrySummary,
    type WorkStatus,
    isValidWorkDuration,
} from "@/lib/employeeWorkShared";

export type AdminWorkEntryFilters = {
    month?: string;
    employeeId?: string;
    query?: string;
    limit?: number;
};

const TABLE = "employee_work_entries";

type DbRow = RowDataPacket & {
    id: number;
    employee_id: string;
    employee_name: string | null;
    work_date: Date | string;
    task: string;
    activity: string;
    duration: string | null;
    status: string;
    remark: string | null;
    created_at: Date | string;
};

const ROW_SELECT = `id, employee_id, employee_name, work_date, task, activity, duration, status, remark, created_at`;

let ensureTablePromise: Promise<void> | null = null;

export async function ensureEmployeeWorkEntriesTable() {
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
            employee_id VARCHAR(64) NOT NULL,
            employee_name VARCHAR(255) NULL,
            work_date DATE NOT NULL,
            task VARCHAR(255) NOT NULL,
            activity TEXT NOT NULL,
            duration VARCHAR(64) NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'In Progress',
            remark TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_employee_work_entries_employee (employee_id),
            INDEX idx_employee_work_entries_date (work_date)
        )
    `);
}

function toIsoDate(v: Date | string): string {
    return toDateOnlyString(v);
}

function toIsoDateTime(v: Date | string): string {
    if (v instanceof Date) return v.toISOString();
    return String(v);
}

export function mapWorkEntryRow(row: DbRow): EmployeeWorkEntryRow {
    return {
        id: row.id,
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        work_date: toIsoDate(row.work_date),
        task: row.task,
        activity: row.activity,
        duration: row.duration?.trim() || null,
        status: normalizeWorkStatus(row.status),
        remark: row.remark?.trim() || null,
        created_at: toIsoDateTime(row.created_at),
    };
}

export async function getEmployeeWorkEntrySummary(
    employeeId: string,
    month: string,
): Promise<WorkEntrySummary> {
    await ensureEmployeeWorkEntriesTable();

    const [rows] = await pool.query<
        (RowDataPacket & { total: number; in_progress: number; completed: number })[]
    >(
        `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
         FROM ${TABLE}
         WHERE employee_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?`,
        [employeeId, month],
    );

    const row = rows[0];
    return {
        total: Number(row?.total) || 0,
        inProgress: Number(row?.in_progress) || 0,
        completed: Number(row?.completed) || 0,
    };
}

export async function countEmployeeWorkEntries(employeeId: string): Promise<number> {
    await ensureEmployeeWorkEntriesTable();

    const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
        `SELECT COUNT(*) AS total FROM ${TABLE} WHERE employee_id = ?`,
        [employeeId],
    );
    return Number(rows[0]?.total) || 0;
}

/** Work entry count per date (YYYY-MM-DD) for a calendar month. */
export async function getEmployeeWorkEntryCountsByDate(
    employeeId: string,
    year: number,
    month: number,
): Promise<Record<string, number>> {
    await ensureEmployeeWorkEntriesTable();

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const [rows] = await pool.query<
        (RowDataPacket & { work_date: Date | string; entry_count: number })[]
    >(
        `SELECT work_date, COUNT(*) AS entry_count
         FROM ${TABLE}
         WHERE employee_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?
         GROUP BY work_date`,
        [employeeId, monthKey],
    );

    const counts: Record<string, number> = {};
    for (const row of rows) {
        counts[toIsoDate(row.work_date)] = Number(row.entry_count) || 0;
    }
    return counts;
}

export async function listEmployeeWorkEntries(
    employeeId: string,
    options?: { month?: string; limit?: number },
): Promise<EmployeeWorkEntryRow[]> {
    await ensureEmployeeWorkEntriesTable();

    const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
    const params: unknown[] = [employeeId];
    let extraFilters = "";

    if (options?.month && /^\d{4}-\d{2}$/.test(options.month)) {
        extraFilters += " AND DATE_FORMAT(work_date, '%Y-%m') = ?";
        params.push(options.month);
    }

    params.push(limit);

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${ROW_SELECT}
         FROM ${TABLE}
         WHERE employee_id = ?${extraFilters}
         ORDER BY work_date DESC, id DESC
         LIMIT ?`,
        params,
    );

    return rows.map(mapWorkEntryRow);
}

export type CreateWorkEntryInput = {
    employeeId: string;
    employeeName: string;
    workDate: string;
    task: string;
    activity: string;
    duration?: string | null;
    status: WorkStatus;
    remark?: string | null;
};

export async function createEmployeeWorkEntry(
    input: CreateWorkEntryInput,
): Promise<EmployeeWorkEntryRow> {
    await ensureEmployeeWorkEntriesTable();

    const duration = input.duration?.trim() || null;
    if (duration && !isValidWorkDuration(duration)) {
        throw new Error("Select a valid duration");
    }

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${TABLE}
            (employee_id, employee_name, work_date, task, activity, duration, status, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            input.employeeId,
            input.employeeName || null,
            input.workDate,
            input.task.trim(),
            input.activity.trim(),
            duration,
            normalizeWorkStatus(input.status),
            input.remark?.trim() || null,
        ],
    );

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${ROW_SELECT} FROM ${TABLE} WHERE id = ?`,
        [result.insertId],
    );

    const row = rows[0];
    if (!row) {
        throw new Error("Failed to load created work entry");
    }

    return mapWorkEntryRow(row);
}

export async function getEmployeeWorkEntryById(
    employeeId: string,
    recordId: number,
): Promise<EmployeeWorkEntryRow | null> {
    await ensureEmployeeWorkEntriesTable();

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${ROW_SELECT} FROM ${TABLE} WHERE id = ? AND employee_id = ? LIMIT 1`,
        [recordId, employeeId],
    );

    const row = rows[0];
    return row ? mapWorkEntryRow(row) : null;
}

export type UpdateWorkEntryInput = {
    workDate: string;
    task: string;
    activity: string;
    duration?: string | null;
    status: WorkStatus;
    remark?: string | null;
};

export async function updateEmployeeWorkEntry(
    employeeId: string,
    recordId: number,
    input: UpdateWorkEntryInput,
): Promise<EmployeeWorkEntryRow | null> {
    await ensureEmployeeWorkEntriesTable();

    const duration = input.duration?.trim() || null;
    if (duration && !isValidWorkDuration(duration)) {
        throw new Error("Select a valid duration");
    }

    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE}
         SET work_date = ?, task = ?, activity = ?, duration = ?, status = ?, remark = ?
         WHERE id = ? AND employee_id = ?`,
        [
            input.workDate,
            input.task.trim(),
            input.activity.trim(),
            duration,
            normalizeWorkStatus(input.status),
            input.remark?.trim() || null,
            recordId,
            employeeId,
        ],
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getEmployeeWorkEntryById(employeeId, recordId);
}

export async function deleteEmployeeWorkEntry(
    employeeId: string,
    recordId: number,
): Promise<boolean> {
    await ensureEmployeeWorkEntriesTable();

    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM ${TABLE} WHERE id = ? AND employee_id = ?`,
        [recordId, employeeId],
    );

    return result.affectedRows > 0;
}

export async function getAdminWorkEntrySummary(month: string): Promise<AdminWorkEntrySummary> {
    await ensureEmployeeWorkEntriesTable();

    const [rows] = await pool.query<
        (RowDataPacket & {
            total: number;
            in_progress: number;
            completed: number;
            employee_count: number;
        })[]
    >(
        `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
            COUNT(DISTINCT employee_id) AS employee_count
         FROM ${TABLE}
         WHERE DATE_FORMAT(work_date, '%Y-%m') = ?`,
        [month],
    );

    const row = rows[0];
    return {
        total: Number(row?.total) || 0,
        inProgress: Number(row?.in_progress) || 0,
        completed: Number(row?.completed) || 0,
        employeeCount: Number(row?.employee_count) || 0,
    };
}

export async function listAdminWorkEntries(
    filters: AdminWorkEntryFilters = {},
): Promise<EmployeeWorkEntryRow[]> {
    await ensureEmployeeWorkEntriesTable();

    const limit = Math.min(Math.max(filters.limit ?? 300, 1), 1000);
    const params: unknown[] = [];
    let where = "WHERE 1=1";

    if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
        where += " AND DATE_FORMAT(work_date, '%Y-%m') = ?";
        params.push(filters.month);
    }

    if (filters.employeeId?.trim()) {
        where += " AND employee_id = ?";
        params.push(filters.employeeId.trim().toUpperCase());
    }

    const q = filters.query?.trim();
    if (q) {
        const like = `%${q}%`;
        where +=
            " AND (task LIKE ? OR activity LIKE ? OR remark LIKE ? OR employee_name LIKE ? OR employee_id LIKE ?)";
        params.push(like, like, like, like, like);
    }

    params.push(limit);

    const [rows] = await pool.query<DbRow[]>(
        `SELECT ${ROW_SELECT}
         FROM ${TABLE}
         ${where}
         ORDER BY work_date DESC, id DESC
         LIMIT ?`,
        params,
    );

    return rows.map(mapWorkEntryRow);
}
