import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { leaveRequestStatusLabel } from "@/lib/employeeLeave";
import type { EmployeeExpenseRow } from "@/lib/employeeExpenses";
import type { TaskRow } from "@/lib/adminTaskUiShared";

const TABLE = "employee_notifications";
const SYNC_DAYS = 45;
const LIST_LIMIT = 40;

export const NOTIFICATION_TYPES = ["leave", "expense", "task", "system"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type EmployeeNotificationRow = {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    href: string | null;
    isRead: boolean;
    createdAt: string;
};

type DbRow = RowDataPacket & {
    id: number;
    employee_id: string;
    type: NotificationType;
    title: string;
    message: string;
    href: string | null;
    reference_key: string;
    is_read: number;
    created_at: Date | string;
};

let ensureTablePromise: Promise<void> | null = null;

export async function ensureEmployeeNotificationsTable() {
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
            type ENUM('leave', 'expense', 'task', 'system') NOT NULL DEFAULT 'system',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            href VARCHAR(512) NULL,
            reference_key VARCHAR(128) NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_employee_notification_ref (employee_id, reference_key),
            INDEX idx_employee_notifications_employee (employee_id),
            INDEX idx_employee_notifications_unread (employee_id, is_read, created_at)
        )
    `);
}

function toIsoDateTime(v: Date | string): string {
    if (v instanceof Date) return v.toISOString();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}

function mapRow(row: DbRow): EmployeeNotificationRow {
    return {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        href: row.href?.trim() || null,
        isRead: Boolean(row.is_read),
        createdAt: toIsoDateTime(row.created_at),
    };
}

function formatMonthLabel(monthKey: string) {
    const [y, m] = monthKey.split("-").map(Number);
    if (!y || !m) return monthKey;
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatLeaveDates(start: string, end: string) {
    const startLabel = new Date(`${start}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
    const endLabel = new Date(`${end}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    return start === end ? startLabel : `${startLabel} – ${endLabel}`;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export async function upsertEmployeeNotification(input: {
    employeeId: string;
    type: NotificationType;
    title: string;
    message: string;
    href?: string | null;
    referenceKey: string;
}) {
    await ensureEmployeeNotificationsTable();
    const employeeId = input.employeeId.trim();
    const referenceKey = input.referenceKey.trim();
    if (!employeeId || !referenceKey) return;

    await pool.query(
        `INSERT INTO ${TABLE} (employee_id, type, title, message, href, reference_key)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [
            employeeId,
            input.type,
            input.title.trim(),
            input.message.trim(),
            input.href?.trim() || null,
            referenceKey,
        ],
    );
}

export async function listEmployeeNotifications(
    employeeId: string,
    limit = LIST_LIMIT,
): Promise<EmployeeNotificationRow[]> {
    await ensureEmployeeNotificationsTable();
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [rows] = await pool.query<DbRow[]>(
        `SELECT id, employee_id, type, title, message, href, reference_key, is_read, created_at
         FROM ${TABLE}
         WHERE employee_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
        [employeeId.trim(), safeLimit],
    );
    return rows.map(mapRow);
}

export async function countUnreadEmployeeNotifications(employeeId: string): Promise<number> {
    await ensureEmployeeNotificationsTable();
    const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
        `SELECT COUNT(*) AS total FROM ${TABLE} WHERE employee_id = ? AND is_read = 0`,
        [employeeId.trim()],
    );
    return Number(rows[0]?.total) || 0;
}

export async function markEmployeeNotificationRead(
    employeeId: string,
    notificationId: number,
): Promise<boolean> {
    await ensureEmployeeNotificationsTable();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE} SET is_read = 1 WHERE id = ? AND employee_id = ?`,
        [notificationId, employeeId.trim()],
    );
    return result.affectedRows > 0;
}

export async function markAllEmployeeNotificationsRead(employeeId: string): Promise<number> {
    await ensureEmployeeNotificationsTable();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE} SET is_read = 1 WHERE employee_id = ? AND is_read = 0`,
        [employeeId.trim()],
    );
    return result.affectedRows;
}

/** Backfill notifications from recent leave, expense, and task activity. */
export async function syncRecentEmployeeNotifications(employeeId: string) {
    await ensureEmployeeNotificationsTable();
    const trimmed = employeeId.trim();
    if (!trimmed) return;

    const since = new Date();
    since.setDate(since.getDate() - SYNC_DAYS);
    const sinceIso = since.toISOString().slice(0, 10);

    const [leaveRows] = await pool.query<
        (RowDataPacket & {
            id: number;
            request_id: string | null;
            policy_name: string;
            start_date: string | Date;
            end_date: string | Date;
            days: number;
            status: string;
            rejected_at_stage: string | null;
            rejection_reason: string | null;
            applied_on: string | Date;
        })[]
    >(
        `SELECT id, request_id, policy_name, start_date, end_date, days, status,
                rejected_at_stage, rejection_reason, applied_on
         FROM employee_leave_requests
         WHERE employee_id = ?
           AND applied_on >= ?
         ORDER BY applied_on DESC
         LIMIT 50`,
        [trimmed, sinceIso],
    );

    for (const row of leaveRows) {
        const start =
            row.start_date instanceof Date
                ? row.start_date.toISOString().slice(0, 10)
                : String(row.start_date).slice(0, 10);
        const end =
            row.end_date instanceof Date
                ? row.end_date.toISOString().slice(0, 10)
                : String(row.end_date).slice(0, 10);
        const requestId = row.request_id?.trim() || `REQ-${row.id}`;

        if (row.status === "pending") {
            await upsertEmployeeNotification({
                employeeId: trimmed,
                type: "leave",
                title: "Leave request submitted",
                message: `${row.policy_name} · ${row.days} day(s) · ${formatLeaveDates(start, end)}`,
                href: "/employee-dashboard/leave",
                referenceKey: `leave:${row.id}:submitted`,
            });
        } else if (["l1_approved", "approved", "rejected"].includes(row.status)) {
            const status = row.status as "l1_approved" | "approved" | "rejected";
            const stage =
                status === "rejected" && row.rejected_at_stage === "l1"
                    ? "l1"
                    : status === "rejected" && row.rejected_at_stage === "l2"
                      ? "l2"
                      : null;
            const label = leaveRequestStatusLabel(status, stage);
            await upsertEmployeeNotification({
                employeeId: trimmed,
                type: "leave",
                title: `Leave ${label.toLowerCase()}`,
                message: `${requestId}: ${row.policy_name} · ${formatLeaveDates(start, end)}`,
                href: "/employee-dashboard/leave",
                referenceKey: `leave:${row.id}:${status}`,
            });
        }
    }

    const [expenseRows] = await pool.query<
        (RowDataPacket & {
            id: number;
            title: string;
            amount: string | number;
            status: string;
            expense_date: string | Date;
            updated_at: Date | string;
        })[]
    >(
        `SELECT id, title, amount, status, expense_date, updated_at
         FROM employee_expenses
         WHERE employee_id = ?
           AND status IN ('approved', 'rejected', 'rework')
           AND updated_at >= ?
         ORDER BY updated_at DESC
         LIMIT 60`,
        [trimmed, since],
    );

    for (const row of expenseRows) {
        const amount = Number(row.amount) || 0;
        if (row.status === "approved") {
            await upsertEmployeeNotification({
                employeeId: trimmed,
                type: "expense",
                title: "Expense approved",
                message: `${row.title} · ${formatCurrency(amount)}`,
                href: "/employee-dashboard/approved-expense",
                referenceKey: `expense:${row.id}:approved`,
            });
        } else if (row.status === "rejected") {
            await upsertEmployeeNotification({
                employeeId: trimmed,
                type: "expense",
                title: "Expense rejected",
                message: `${row.title} · ${formatCurrency(amount)}`,
                href: "/employee-dashboard/reject-expense",
                referenceKey: `expense:${row.id}:rejected`,
            });
        } else if (row.status === "rework") {
            await upsertEmployeeNotification({
                employeeId: trimmed,
                type: "expense",
                title: "Expense sent for rework",
                message: `${row.title} · update and resubmit`,
                href: "/employee-dashboard/add-expense",
                referenceKey: `expense:${row.id}:rework`,
            });
        }
    }

    const [taskRows] = await pool.query<
        (RowDataPacket & {
            task_id: number;
            title: string;
            due_date: string | Date | null;
            created_at: Date | string;
        })[]
    >(
        `SELECT t.id AS task_id, t.title, t.due_date, t.created_at
         FROM admin_tasks t
         INNER JOIN admin_task_assignees a ON a.task_id = t.id
         WHERE a.employee_id = ?
           AND t.status != 'completed'
           AND t.created_at >= ?
         ORDER BY t.created_at DESC
         LIMIT 30`,
        [trimmed, since],
    );

    for (const row of taskRows) {
        const due =
            row.due_date instanceof Date
                ? row.due_date.toISOString().slice(0, 10)
                : row.due_date
                  ? String(row.due_date).slice(0, 10)
                  : "";
        const dueNote = due
            ? ` · due ${new Date(`${due}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : "";
        await upsertEmployeeNotification({
            employeeId: trimmed,
            type: "task",
            title: "New task assigned",
            message: `${row.title}${dueNote}`,
            href: "/employee-dashboard/tasks",
            referenceKey: `task:${row.task_id}:assigned`,
        });
    }
}

export async function notifyLeaveStatusUpdated(row: {
    id: number;
    employee_id: string;
    request_id: string;
    policy_name: string;
    start_date: string;
    end_date: string;
    status: string;
    rejected_at_stage?: "l1" | "l2" | null;
}) {
    if (!["l1_approved", "approved", "rejected"].includes(row.status)) return;
    const status = row.status as "l1_approved" | "approved" | "rejected";
    const label = leaveRequestStatusLabel(status, row.rejected_at_stage ?? null);
    await upsertEmployeeNotification({
        employeeId: row.employee_id,
        type: "leave",
        title: `Leave ${label.toLowerCase()}`,
        message: `${row.request_id}: ${row.policy_name} · ${formatLeaveDates(row.start_date, row.end_date)}`,
        href: "/employee-dashboard/leave",
        referenceKey: `leave:${row.id}:${status}`,
    });
}

export async function notifyLeaveSubmitted(row: {
    id: number;
    employee_id: string;
    policy_name: string;
    start_date: string;
    end_date: string;
    days: number;
}) {
    await upsertEmployeeNotification({
        employeeId: row.employee_id,
        type: "leave",
        title: "Leave request submitted",
        message: `${row.policy_name} · ${row.days} day(s) · ${formatLeaveDates(row.start_date, row.end_date)}`,
        href: "/employee-dashboard/leave",
        referenceKey: `leave:${row.id}:submitted`,
    });
}

export async function notifyExpenseBatchReviewed(
    employeeId: string,
    month: string,
    action: "approve" | "reject",
    updatedCount: number,
    totalApprovedAmount?: number,
) {
    const monthLabel = formatMonthLabel(month);
    if (action === "approve") {
        const amountNote =
            totalApprovedAmount !== undefined ? ` · ${formatCurrency(totalApprovedAmount)}` : "";
        await upsertEmployeeNotification({
            employeeId,
            type: "expense",
            title: "Expenses approved",
            message: `${updatedCount} claim(s) for ${monthLabel} approved${amountNote}`,
            href: "/employee-dashboard/approved-expense",
            referenceKey: `expense:batch:${month}:approved`,
        });
    } else {
        await upsertEmployeeNotification({
            employeeId,
            type: "expense",
            title: "Expenses rejected",
            message: `${updatedCount} claim(s) for ${monthLabel} were rejected`,
            href: "/employee-dashboard/reject-expense",
            referenceKey: `expense:batch:${month}:rejected`,
        });
    }
}

export async function notifyExpenseStatusUpdated(expense: EmployeeExpenseRow) {
    const amount = expense.approved_amount ?? expense.amount;
    if (expense.status === "approved") {
        await upsertEmployeeNotification({
            employeeId: expense.employee_id,
            type: "expense",
            title: "Expense approved",
            message: `${expense.title} · ${formatCurrency(amount)}`,
            href: "/employee-dashboard/approved-expense",
            referenceKey: `expense:${expense.id}:approved`,
        });
    } else if (expense.status === "rejected") {
        await upsertEmployeeNotification({
            employeeId: expense.employee_id,
            type: "expense",
            title: "Expense rejected",
            message: `${expense.title} · ${formatCurrency(expense.amount)}`,
            href: "/employee-dashboard/reject-expense",
            referenceKey: `expense:${expense.id}:rejected`,
        });
    }
}

export async function notifyExpenseRework(expense: EmployeeExpenseRow) {
    await upsertEmployeeNotification({
        employeeId: expense.employee_id,
        type: "expense",
        title: "Expense sent for rework",
        message: expense.reject_reason
            ? `${expense.title} · ${expense.reject_reason}`
            : `${expense.title} · update and resubmit`,
        href: "/employee-dashboard/add-expense",
        referenceKey: `expense:${expense.id}:rework`,
    });
}

export async function notifyExpenseMonthSubmitted(
    employeeId: string,
    month: string,
    submittedCount: number,
    totalAmount: number,
) {
    await upsertEmployeeNotification({
        employeeId,
        type: "expense",
        title: "Expenses submitted",
        message: `${submittedCount} claim(s) for ${formatMonthLabel(month)} · ${formatCurrency(totalAmount)}`,
        href: "/employee-dashboard/add-expense",
        referenceKey: `expense:${month}:submitted`,
    });
}

export async function notifyTaskAssigned(employeeId: string, task: Pick<TaskRow, "recordId" | "title" | "dueDate">) {
    const dueNote = task.dueDate
        ? ` · due ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : "";
    await upsertEmployeeNotification({
        employeeId,
        type: "task",
        title: "New task assigned",
        message: `${task.title}${dueNote}`,
        href: "/employee-dashboard/tasks",
        referenceKey: `task:${task.recordId}:assigned`,
    });
}

export function formatNotificationRelativeTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
