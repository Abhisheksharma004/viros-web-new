import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { ensureEmployeeExpensesTable } from "@/lib/employeeExpenses";
import { ensureEmployeeLeaveDataReady } from "@/lib/employeeLeave";
import { fetchAdminBirthdayAlerts } from "@/lib/employeeBirthdays";

const TABLE = "admin_notifications";
const LIST_LIMIT = 35;
const SYNC_DAYS = 30;

export const ADMIN_NOTIFICATION_TYPES = ["leave", "expense", "employee", "task", "birthday", "system"] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export type AdminNotificationRow = {
    id: number;
    type: AdminNotificationType;
    title: string;
    message: string;
    href: string | null;
    isRead: boolean;
    createdAt: string;
};

type DbRow = RowDataPacket & {
    id: number;
    type: AdminNotificationType;
    title: string;
    message: string;
    href: string | null;
    reference_key: string;
    is_read: number;
    created_at: Date | string;
};

let ensureTablePromise: Promise<void> | null = null;

export async function ensureAdminNotificationsTable() {
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
            type ENUM('leave', 'expense', 'employee', 'task', 'birthday', 'system') NOT NULL DEFAULT 'system',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            href VARCHAR(512) NULL,
            reference_key VARCHAR(128) NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_notification_ref (reference_key),
            INDEX idx_admin_notifications_unread (is_read, created_at)
        )
    `);
}

function toIsoDateTime(v: Date | string): string {
    if (v instanceof Date) return v.toISOString();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}

function mapRow(row: DbRow): AdminNotificationRow {
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

export async function upsertAdminNotification(input: {
    type: AdminNotificationType;
    title: string;
    message: string;
    href?: string | null;
    referenceKey: string;
}) {
    await ensureAdminNotificationsTable();
    const referenceKey = input.referenceKey.trim();
    if (!referenceKey) return;

    await pool.query(
        `INSERT INTO ${TABLE} (type, title, message, href, reference_key)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [
            input.type,
            input.title.trim(),
            input.message.trim(),
            input.href?.trim() || null,
            referenceKey,
        ],
    );
}

export async function listAdminNotifications(): Promise<AdminNotificationRow[]> {
    await ensureAdminNotificationsTable();
    await syncAdminNotifications();

    const [rows] = await pool.query<DbRow[]>(
        `SELECT id, type, title, message, href, reference_key, is_read, created_at
         FROM ${TABLE}
         ORDER BY created_at DESC, id DESC
         LIMIT 150`,
    );

    const all = rows.map(mapRow);
    const unread = all.filter((n) => !n.isRead);
    const read = all.filter((n) => n.isRead).slice(0, 10);

    const combined = [...unread, ...read];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
}

export async function countUnreadAdminNotifications(): Promise<number> {
    await ensureAdminNotificationsTable();
    const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
        `SELECT COUNT(*) AS total FROM ${TABLE} WHERE is_read = 0`,
    );
    return Number(rows[0]?.total) || 0;
}

export async function markAdminNotificationRead(notificationId: number): Promise<boolean> {
    await ensureAdminNotificationsTable();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE} SET is_read = 1 WHERE id = ?`,
        [notificationId],
    );
    return result.affectedRows > 0;
}

export async function markAllAdminNotificationsRead(): Promise<number> {
    await ensureAdminNotificationsTable();
    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE} SET is_read = 1 WHERE is_read = 0`,
    );
    return result.affectedRows;
}

/** Format currency helper for notification messages */
function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Automatically sync live activity and alerts into admin_notifications table */
export async function syncAdminNotifications() {
    await ensureAdminNotificationsTable();

    const since = new Date();
    since.setDate(since.getDate() - SYNC_DAYS);

    // 1. Pending & Recent Leave Requests
    try {
        await ensureEmployeeLeaveDataReady();
        const [leaveRows] = await pool.query<
            (RowDataPacket & {
                id: number;
                request_id: string | null;
                employee_id: string;
                leave_type: string;
                days: number;
                status: string;
                applied_on: string | Date;
                employee_name: string | null;
            })[]
        >(
            `SELECT lr.id, lr.request_id, lr.employee_id, lr.policy_name AS leave_type, lr.days, lr.status, lr.applied_on,
                    COALESCE(e.full_name, lr.employee_id) AS employee_name
             FROM employee_leave_requests lr
             LEFT JOIN admin_employees e ON e.employee_id = lr.employee_id AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
             WHERE lr.applied_on >= ?
             ORDER BY lr.applied_on DESC
             LIMIT 40`,
            [since],
        );

        for (const row of leaveRows) {
            const empName = String(row.employee_name ?? row.employee_id ?? "Employee");
            const reqId = row.request_id?.trim() || `REQ-${row.id}`;
            const leaveType = String(row.leave_type ?? "Leave");

            if (row.status === "pending" || row.status === "l1_approved") {
                await upsertAdminNotification({
                    type: "leave",
                    title: `Pending Leave Request: ${empName}`,
                    message: `${reqId} · ${leaveType} for ${row.days} day(s) awaiting admin review.`,
                    href: "/admin-dashboard/leave-request",
                    referenceKey: `admin:leave:${row.id}:pending`,
                });
            }
        }
    } catch (err) {
        console.error("Error syncing admin leave notifications:", err);
    }

    // 2. Pending & Recent Expenses
    try {
        await ensureEmployeeExpensesTable();
        const [expenseRows] = await pool.query<
            (RowDataPacket & {
                id: number;
                expense_id: string;
                employee_name: string;
                title: string;
                amount: number;
                status: string;
                created_at: string | Date;
            })[]
        >(
            `SELECT id, expense_id, employee_name, title, amount, status, created_at
             FROM employee_expenses
             WHERE created_at >= ?
             ORDER BY created_at DESC
             LIMIT 40`,
            [since],
        );

        for (const row of expenseRows) {
            const empName = String(row.employee_name ?? "Employee");
            const amount = Number(row.amount) || 0;
            const expTitle = String(row.title ?? "Expense");

            if (row.status === "pending") {
                await upsertAdminNotification({
                    type: "expense",
                    title: `New Expense Claim: ${empName}`,
                    message: `${expTitle} · ${formatCurrency(amount)} submitted for approval.`,
                    href: "/admin-dashboard/expense-management",
                    referenceKey: `admin:expense:${row.id}:pending`,
                });
            }
        }
    } catch (err) {
        console.error("Error syncing admin expense notifications:", err);
    }

    // 3. Newly Registered Employees
    try {
        await ensureAdminEmployeesTable();
        const [empRows] = await pool.query<
            (RowDataPacket & {
                id: number;
                employee_id: string;
                full_name: string;
                department: string | null;
                created_at: string | Date;
            })[]
        >(
            `SELECT id, employee_id, full_name, department, created_at
             FROM admin_employees
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
               AND created_at >= ?
             ORDER BY created_at DESC
             LIMIT 20`,
            [since],
        );

        for (const row of empRows) {
            const empName = String(row.full_name ?? row.employee_id);
            const dept = String(row.department ?? "General").trim();
            await upsertAdminNotification({
                type: "employee",
                title: `New Employee Registered`,
                message: `${empName} (${row.employee_id}) joined ${dept}.`,
                href: "/admin-dashboard/employees",
                referenceKey: `admin:emp:${row.id}:created`,
            });
        }
    } catch (err) {
        console.error("Error syncing admin employee notifications:", err);
    }

    // 4. Birthdays
    try {
        const birthdayAlerts = await fetchAdminBirthdayAlerts();
        for (const alert of birthdayAlerts) {
            const isToday = alert.kind === "today";
            await upsertAdminNotification({
                type: "birthday",
                title: isToday ? `Birthday Today: ${alert.fullName}` : `Birthday Soon: ${alert.fullName}`,
                message: isToday
                    ? `Wish ${alert.fullName} (${alert.department || "Team"}) a happy birthday today!`
                    : `Upcoming birthday on ${alert.displayDate} (${alert.department || "Team"}).`,
                href: "/admin-dashboard",
                referenceKey: `admin:birthday:${alert.employeeId}:${isToday ? "today" : "soon"}`,
            });
        }
    } catch (err) {
        console.error("Error syncing admin birthday notifications:", err);
    }

    // 5. Daily Attendance Check-In & Check-Out
    try {
        const [attRows] = await pool.query<
            (RowDataPacket & {
                id: number;
                employee_id: string;
                attendance_date: string | Date;
                check_in_at: string | Date | null;
                check_out_at: string | Date | null;
                full_name: string | null;
            })[]
        >(
            `SELECT a.id, a.employee_id, a.attendance_date, a.check_in_at, a.check_out_at,
                    COALESCE(e.full_name, a.employee_id) AS full_name
             FROM employee_attendance a
             LEFT JOIN admin_employees e ON e.employee_id = a.employee_id AND (e.is_deleted = 0 OR e.is_deleted IS NULL)
             WHERE a.attendance_date >= ?
             ORDER BY a.created_at DESC
             LIMIT 40`,
            [since],
        );

        for (const row of attRows) {
            const empName = String(row.full_name ?? row.employee_id ?? "Employee");
            const dateStr =
                row.attendance_date instanceof Date
                    ? row.attendance_date.toISOString().slice(0, 10)
                    : String(row.attendance_date).slice(0, 10);

            if (row.check_in_at) {
                const inDate = new Date(row.check_in_at);
                const timeLabel = !Number.isNaN(inDate.getTime())
                    ? inDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "";
                await upsertAdminNotification({
                    type: "system",
                    title: `Employee Check-In: ${empName}`,
                    message: `${empName} (${row.employee_id}) checked in${timeLabel ? ` at ${timeLabel}` : ""}.`,
                    href: "/admin-dashboard/attendance",
                    referenceKey: `admin:att:${row.employee_id}:${dateStr}:check-in`,
                });
            }

            if (row.check_out_at) {
                const outDate = new Date(row.check_out_at);
                const timeLabel = !Number.isNaN(outDate.getTime())
                    ? outDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "";
                await upsertAdminNotification({
                    type: "system",
                    title: `Employee Check-Out: ${empName}`,
                    message: `${empName} (${row.employee_id}) checked out${timeLabel ? ` at ${timeLabel}` : ""}.`,
                    href: "/admin-dashboard/attendance",
                    referenceKey: `admin:att:${row.employee_id}:${dateStr}:check-out`,
                });
            }
        }
    } catch (err) {
        console.error("Error syncing admin attendance notifications:", err);
    }
}
