import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { toDateOnlyString } from "@/lib/dateOnly";
import {
    isTaskOverdue,
    type TaskAssignedBy,
    type TaskAssignee,
    type TaskPriority,
    type TaskRemark,
    type TaskRow,
    type TaskStatus,
} from "@/lib/adminTaskUiShared";

const TASKS_TABLE = "admin_tasks";
const ASSIGNEES_TABLE = "admin_task_assignees";
const REMARKS_TABLE = "admin_task_remarks";
const TASK_CODE_PREFIX = "VETSK";
const TASK_SERIAL_LENGTH = 4;

type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

type TaskDbRow = RowDataPacket & {
    id: number;
    task_code: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: Date | string | null;
    created_at: Date | string;
    assigned_by_id?: number | null;
    assigned_by_email?: string | null;
    assigned_by_name?: string | null;
};

const TASK_SELECT_COLUMNS = `id, task_code, title, description, priority, status, due_date, created_at, assigned_by_id, assigned_by_email, assigned_by_name`;

function taskSelectSql(tableAlias?: string): string {
    const prefix = tableAlias ? `${tableAlias}.` : "";
    return TASK_SELECT_COLUMNS.split(",")
        .map((col) => `${prefix}${col.trim()}`)
        .join(", ");
}

type AssigneeDbRow = RowDataPacket & {
    task_id: number;
    employee_id: string;
    employee_name: string;
    department: string | null;
};

type RemarkDbRow = RowDataPacket & {
    id: number;
    task_id: number;
    employee_id: string;
    employee_name: string;
    remark: string;
    created_at: Date | string;
};

const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const STATUSES: TaskStatus[] = ["pending", "in-progress", "completed", "overdue"];
const EMPLOYEE_UPDATABLE_STATUSES: TaskStatus[] = ["pending", "in-progress", "completed"];

declare global {
    // eslint-disable-next-line no-var
    var __adminTasksTablesEnsured: boolean | undefined;
    // eslint-disable-next-line no-var
    var __adminTaskRemarksTableEnsured: boolean | undefined;
    // eslint-disable-next-line no-var
    var __adminTasksSchemaVersion: number | undefined;
}

const ADMIN_TASKS_SCHEMA_VERSION = 3;

let ensureTablePromise: Promise<void> | null = null;
let ensureRemarksPromise: Promise<void> | null = null;

async function runEnsureAdminTasksTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TASKS_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_code VARCHAR(32) NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
            status ENUM('pending', 'in-progress', 'completed', 'overdue') NOT NULL DEFAULT 'pending',
            due_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_admin_tasks_code (task_code),
            INDEX idx_admin_tasks_status (status),
            INDEX idx_admin_tasks_due (due_date)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${ASSIGNEES_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            employee_name VARCHAR(255) NOT NULL,
            department VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_task_assignee (task_id, employee_id),
            INDEX idx_task_assignees_employee (employee_id),
            CONSTRAINT fk_task_assignees_task
                FOREIGN KEY (task_id) REFERENCES ${TASKS_TABLE}(id) ON DELETE CASCADE
        )
    `);

    await ensureAssignedByColumns();
}

async function getTaskTableColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [TASKS_TABLE],
    );
    return new Set(rows.map((r) => String(r.COLUMN_NAME)));
}

async function ensureAssignedByColumns() {
    const columns = await getTaskTableColumns();
    const migrations: Array<{ column: string; sql: string }> = [
        {
            column: "assigned_by_id",
            sql: `ALTER TABLE ${TASKS_TABLE} ADD COLUMN assigned_by_id INT NULL AFTER due_date`,
        },
        {
            column: "assigned_by_email",
            sql: `ALTER TABLE ${TASKS_TABLE} ADD COLUMN assigned_by_email VARCHAR(255) NULL AFTER assigned_by_id`,
        },
        {
            column: "assigned_by_name",
            sql: `ALTER TABLE ${TASKS_TABLE} ADD COLUMN assigned_by_name VARCHAR(255) NULL AFTER assigned_by_email`,
        },
    ];
    for (const migration of migrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }
}

function mapAssignedByFromRow(task: TaskDbRow): TaskAssignedBy | null {
    const name = typeof task.assigned_by_name === "string" ? task.assigned_by_name.trim() : "";
    const email = typeof task.assigned_by_email === "string" ? task.assigned_by_email.trim() : "";
    const id =
        task.assigned_by_id != null && Number.isFinite(Number(task.assigned_by_id))
            ? Number(task.assigned_by_id)
            : null;
    if (!name && !email) return null;
    return {
        id,
        email,
        name: name || email || "VIROS Admin",
    };
}

async function fetchRemarksByTaskIds(taskIds: number[]): Promise<Map<number, TaskRemark[]>> {
    await ensureRemarksTable();
    const map = new Map<number, TaskRemark[]>();
    if (taskIds.length === 0) return map;

    const placeholders = taskIds.map(() => "?").join(",");
    const [rows] = await pool.query(
        `SELECT id, task_id, employee_id, employee_name, remark, created_at
         FROM ${REMARKS_TABLE}
         WHERE task_id IN (${placeholders})
         ORDER BY created_at DESC`,
        taskIds,
    );

    for (const row of rows as RemarkDbRow[]) {
        const list = map.get(row.task_id) ?? [];
        list.push({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            remark: row.remark,
            createdAt: toIsoDateTime(row.created_at),
        });
        map.set(row.task_id, list);
    }
    return map;
}

function attachRemarksToTasks(tasks: TaskRow[], remarksByTask: Map<number, TaskRemark[]>): TaskRow[] {
    return tasks.map((task) => ({
        ...task,
        remarks: remarksByTask.get(task.recordId) ?? [],
    }));
}

async function isEmployeeAssignedToTask(taskId: number, employeeId: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM ${ASSIGNEES_TABLE} WHERE task_id = ? AND employee_id = ? LIMIT 1`,
        [taskId, employeeId.trim()],
    );
    return rows.length > 0;
}

export async function ensureRemarksTable() {
    if (global.__adminTaskRemarksTableEnsured) return;

    if (!ensureRemarksPromise) {
        ensureRemarksPromise = pool
            .query(`
        CREATE TABLE IF NOT EXISTS ${REMARKS_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            employee_name VARCHAR(255) NOT NULL,
            remark TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_remarks_task (task_id),
            INDEX idx_task_remarks_created (created_at),
            CONSTRAINT fk_task_remarks_task
                FOREIGN KEY (task_id) REFERENCES ${TASKS_TABLE}(id) ON DELETE CASCADE
        )
    `)
            .then(() => {
                global.__adminTaskRemarksTableEnsured = true;
            })
            .catch((error) => {
                ensureRemarksPromise = null;
                throw error;
            });
    }
    await ensureRemarksPromise;
}

export async function ensureAdminTasksTables() {
    // Invalidate old dev caches that skipped remarks table (schema v2+)
    if (global.__adminTasksTablesEnsured && !global.__adminTaskRemarksTableEnsured) {
        global.__adminTasksTablesEnsured = false;
        ensureTablePromise = null;
    }
    if (
        global.__adminTasksTablesEnsured &&
        (global.__adminTasksSchemaVersion ?? 0) < ADMIN_TASKS_SCHEMA_VERSION
    ) {
        global.__adminTasksTablesEnsured = false;
        ensureTablePromise = null;
    }

    if (!global.__adminTasksTablesEnsured) {
        if (!ensureTablePromise) {
            ensureTablePromise = runEnsureAdminTasksTables()
                .then(() => {
                    global.__adminTasksTablesEnsured = true;
                    global.__adminTasksSchemaVersion = ADMIN_TASKS_SCHEMA_VERSION;
                })
                .catch((error) => {
                    ensureTablePromise = null;
                    throw error;
                });
        }
        await ensureTablePromise;
    }

    await ensureRemarksTable();
}

function toDateString(value: Date | string | null): string {
    if (!value) return "";
    return toDateOnlyString(value);
}

function toIsoDateTime(value: Date | string): string {
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

/** MMYY period key, e.g. 0526 for May 2026 */
export function getTaskIdPeriod(date = new Date()): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}${year}`;
}

/** VETSK + MMYY + serial, e.g. VETSK05260001 */
export async function generateNextTaskCode(conn: DbConnection, date = new Date()): Promise<string> {
    const period = getTaskIdPeriod(date);
    const base = `${TASK_CODE_PREFIX}${period}`;

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT task_code FROM ${TASKS_TABLE}
         WHERE task_code LIKE ?
         ORDER BY task_code DESC
         LIMIT 1
         FOR UPDATE`,
        [`${base}%`],
    );

    let nextSerial = 1;
    const lastCode = rows[0]?.task_code;
    if (typeof lastCode === "string" && lastCode.startsWith(base)) {
        const serialPart = lastCode.slice(base.length);
        const parsed = Number.parseInt(serialPart, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
            nextSerial = parsed + 1;
        }
    }

    return `${base}${String(nextSerial).padStart(TASK_SERIAL_LENGTH, "0")}`;
}

function mapTaskRow(task: TaskDbRow, assignees: AssigneeDbRow[]): TaskRow {
    const dueDate = toDateString(task.due_date);
    const assigneeList: TaskAssignee[] = assignees.map((a) => ({
        employee_id: a.employee_id,
        full_name: a.employee_name,
        department: a.department,
    }));
    const departments = [
        ...new Set(
            assigneeList.map((a) => a.department?.trim()).filter((d): d is string => Boolean(d)),
        ),
    ];

    return {
        recordId: task.id,
        id: task.task_code ?? `${TASK_CODE_PREFIX}${getTaskIdPeriod()}${String(task.id).padStart(TASK_SERIAL_LENGTH, "0")}`,
        title: task.title,
        description: task.description ?? "",
        assignee: assigneeList.map((a) => a.full_name).join(", ") || "—",
        department: departments.join(", ") || "—",
        assignees: assigneeList,
        priority: task.priority,
        status: task.status,
        isOverdue: isTaskOverdue(task.status, dueDate),
        dueDate,
        createdAt: toIsoDateTime(task.created_at),
        assignDate: toIsoDateTime(task.created_at),
        assignedBy: mapAssignedByFromRow(task),
    };
}

export async function listTasksForEmployee(employeeId: string): Promise<TaskRow[]> {
    await ensureAdminTasksTables();
    const trimmed = employeeId.trim();
    if (!trimmed) return [];

    const [taskRows] = await pool.query(
        `SELECT DISTINCT ${taskSelectSql("t")}
         FROM ${TASKS_TABLE} t
         INNER JOIN ${ASSIGNEES_TABLE} a ON a.task_id = t.id
         WHERE a.employee_id = ?
         ORDER BY t.created_at DESC`,
        [trimmed],
    );
    const tasks = taskRows as TaskDbRow[];
    if (tasks.length === 0) return [];

    const ids = tasks.map((t) => t.id);
    const placeholders = ids.map(() => "?").join(",");
    const [assigneeRows] = await pool.query(
        `SELECT task_id, employee_id, employee_name, department
         FROM ${ASSIGNEES_TABLE}
         WHERE task_id IN (${placeholders})
         ORDER BY employee_name ASC`,
        ids,
    );

    const byTask = new Map<number, AssigneeDbRow[]>();
    for (const row of assigneeRows as AssigneeDbRow[]) {
        const list = byTask.get(row.task_id) ?? [];
        list.push(row);
        byTask.set(row.task_id, list);
    }

    const mapped = tasks.map((task) => mapTaskRow(task, byTask.get(task.id) ?? []));
    const remarksByTask = await fetchRemarksByTaskIds(mapped.map((t) => t.recordId));
    return attachRemarksToTasks(mapped, remarksByTask);
}

export async function listAdminTasks(): Promise<TaskRow[]> {
    await ensureAdminTasksTables();

    const [taskRows] = await pool.query(
        `SELECT ${TASK_SELECT_COLUMNS}
         FROM ${TASKS_TABLE}
         ORDER BY created_at DESC`,
    );
    const tasks = taskRows as TaskDbRow[];
    if (tasks.length === 0) return [];

    const ids = tasks.map((t) => t.id);
    const placeholders = ids.map(() => "?").join(",");
    const [assigneeRows] = await pool.query(
        `SELECT task_id, employee_id, employee_name, department
         FROM ${ASSIGNEES_TABLE}
         WHERE task_id IN (${placeholders})
         ORDER BY employee_name ASC`,
        ids,
    );

    const byTask = new Map<number, AssigneeDbRow[]>();
    for (const row of assigneeRows as AssigneeDbRow[]) {
        const list = byTask.get(row.task_id) ?? [];
        list.push(row);
        byTask.set(row.task_id, list);
    }

    const mapped = tasks.map((task) => mapTaskRow(task, byTask.get(task.id) ?? []));
    const remarksByTask = await fetchRemarksByTaskIds(mapped.map((t) => t.recordId));
    return attachRemarksToTasks(mapped, remarksByTask);
}

export type EmployeeUpdateTaskInput = {
    status?: TaskStatus;
    remark?: string;
};

export async function employeeUpdateTask(
    recordId: number,
    employeeId: string,
    employeeName: string,
    input: EmployeeUpdateTaskInput,
): Promise<TaskRow | null> {
    await ensureAdminTasksTables();

    const trimmedId = employeeId.trim();
    const trimmedName = employeeName.trim() || trimmedId;
    if (!trimmedId) return null;

    const assigned = await isEmployeeAssignedToTask(recordId, trimmedId);
    if (!assigned) return null;

    const [statusRows] = await pool.query<RowDataPacket[]>(
        `SELECT status FROM ${TASKS_TABLE} WHERE id = ? LIMIT 1`,
        [recordId],
    );
    const currentStatus = statusRows[0]?.status;
    if (currentStatus === "completed") {
        throw new Error("Completed tasks cannot be updated.");
    }

    const status =
        input.status && EMPLOYEE_UPDATABLE_STATUSES.includes(input.status) ? input.status : null;
    const remark = typeof input.remark === "string" ? input.remark.trim() : "";

    if (!status && !remark) {
        throw new Error("Select a status and/or enter a remark.");
    }

    if (status) {
        await pool.query(`UPDATE ${TASKS_TABLE} SET status = ? WHERE id = ?`, [status, recordId]);
    }

    if (remark) {
        await pool.query(
            `INSERT INTO ${REMARKS_TABLE} (task_id, employee_id, employee_name, remark)
             VALUES (?, ?, ?, ?)`,
            [recordId, trimmedId, trimmedName, remark],
        );
    }

    return fetchTaskRowById(recordId);
}

export type TaskAssignedByInput = {
    id: number;
    email: string;
    name: string;
};

export type CreateAdminTaskInput = {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    assignees: Array<{
        employee_id: string;
        full_name: string;
        department: string | null;
    }>;
    assignedBy?: TaskAssignedByInput | null;
};

export async function createAdminTask(input: CreateAdminTaskInput): Promise<TaskRow> {
    await ensureAdminTasksTables();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const assignedBy = input.assignedBy ?? null;
        const [insertResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO ${TASKS_TABLE} (title, description, priority, status, due_date, assigned_by_id, assigned_by_email, assigned_by_name)
             VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [
                input.title,
                input.description || null,
                input.priority,
                input.dueDate || null,
                assignedBy?.id ?? null,
                assignedBy?.email ?? null,
                assignedBy?.name ?? null,
            ],
        );

        const taskId = insertResult.insertId;
        const taskCode = await generateNextTaskCode(conn);

        await conn.query(`UPDATE ${TASKS_TABLE} SET task_code = ? WHERE id = ?`, [taskCode, taskId]);

        for (const assignee of input.assignees) {
            await conn.query(
                `INSERT INTO ${ASSIGNEES_TABLE} (task_id, employee_id, employee_name, department)
                 VALUES (?, ?, ?, ?)`,
                [
                    taskId,
                    assignee.employee_id,
                    assignee.full_name,
                    assignee.department,
                ],
            );
        }

        await conn.commit();

        const [taskRows] = await pool.query(
            `SELECT ${TASK_SELECT_COLUMNS} FROM ${TASKS_TABLE} WHERE id = ?`,
            [taskId],
        );
        const [assigneeRows] = await pool.query(
            `SELECT task_id, employee_id, employee_name, department
             FROM ${ASSIGNEES_TABLE} WHERE task_id = ?`,
            [taskId],
        );

        const row = mapTaskRow((taskRows as TaskDbRow[])[0], assigneeRows as AssigneeDbRow[]);
        return attachRemarksToTasks([row], new Map())[0];
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

export type UpdateAdminTaskInput = CreateAdminTaskInput & {
    status: TaskStatus;
};

async function fetchTaskRowById(recordId: number): Promise<TaskRow | null> {
    const [taskRows] = await pool.query(
        `SELECT ${TASK_SELECT_COLUMNS} FROM ${TASKS_TABLE} WHERE id = ?`,
        [recordId],
    );
    const task = (taskRows as TaskDbRow[])[0];
    if (!task) return null;

    const [assigneeRows] = await pool.query(
        `SELECT task_id, employee_id, employee_name, department
         FROM ${ASSIGNEES_TABLE} WHERE task_id = ?`,
        [recordId],
    );

    const row = mapTaskRow(task, assigneeRows as AssigneeDbRow[]);
    const remarksByTask = await fetchRemarksByTaskIds([recordId]);
    return attachRemarksToTasks([row], remarksByTask)[0];
}

export async function updateAdminTask(
    recordId: number,
    input: UpdateAdminTaskInput,
): Promise<TaskRow | null> {
    await ensureAdminTasksTables();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [updateResult] = await conn.query<ResultSetHeader>(
            `UPDATE ${TASKS_TABLE}
             SET title = ?, description = ?, priority = ?, status = ?, due_date = ?
             WHERE id = ?`,
            [
                input.title,
                input.description || null,
                input.priority,
                input.status,
                input.dueDate || null,
                recordId,
            ],
        );

        if (updateResult.affectedRows === 0) {
            await conn.rollback();
            return null;
        }

        await conn.query(`DELETE FROM ${ASSIGNEES_TABLE} WHERE task_id = ?`, [recordId]);

        for (const assignee of input.assignees) {
            await conn.query(
                `INSERT INTO ${ASSIGNEES_TABLE} (task_id, employee_id, employee_name, department)
                 VALUES (?, ?, ?, ?)`,
                [recordId, assignee.employee_id, assignee.full_name, assignee.department],
            );
        }

        await conn.commit();
        return fetchTaskRowById(recordId);
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

export async function getTaskAssigneeEmployeeIds(recordId: number): Promise<string[]> {
    await ensureAdminTasksTables();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id FROM ${ASSIGNEES_TABLE} WHERE task_id = ?`,
        [recordId],
    );
    return rows.map((r) => String(r.employee_id).trim()).filter(Boolean);
}

export async function deleteAdminTask(recordId: number): Promise<boolean> {
    await ensureAdminTasksTables();
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM ${TASKS_TABLE} WHERE id = ?`,
        [recordId],
    );
    return result.affectedRows > 0;
}

export function parseTaskPriority(value: unknown): TaskPriority | null {
    return typeof value === "string" && PRIORITIES.includes(value as TaskPriority)
        ? (value as TaskPriority)
        : null;
}

export function parseTaskStatus(value: unknown): TaskStatus | null {
    return typeof value === "string" && STATUSES.includes(value as TaskStatus)
        ? (value as TaskStatus)
        : null;
}
