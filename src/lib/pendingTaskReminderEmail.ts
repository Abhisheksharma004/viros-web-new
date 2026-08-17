import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminTasksTables } from "@/lib/adminTasks";
import {
    SHIFT_SELECT_JOIN,
    ensureAdminEmployeeShiftsTable,
    mapShiftRowToApi,
    type AdminEmployeeShiftRow,
} from "@/lib/adminEmployeeShifts";
import { isDateWorkingDay, DEFAULT_SHIFT_WORKING_DAYS } from "@/lib/attendanceSchedule";
import { getCorporateHolidayForDate } from "@/lib/attendanceCorporateCalendarSync";
import { IST_TIMEZONE, todayDateOnly } from "@/lib/dateOnly";
import type { TaskRow, TaskStatus } from "@/lib/adminTaskUiShared";
import { getStatusLabel } from "@/lib/adminTaskUiShared";
import {
    createMailTransporter,
    isEmailTestMode,
    isSmtpConfigured,
    smtpFromAddress,
} from "@/lib/mailer";
import { fetchEmployeeOfficialEmail } from "@/lib/taskAssignmentEmail";

const TASKS_TABLE = "admin_tasks";
const ASSIGNEES_TABLE = "admin_task_assignees";
const PENDING_REMINDER_LOG_TABLE = "employee_pending_task_reminder_log";
const OVERDUE_REMINDER_LOG_TABLE = "employee_overdue_task_reminder_log";

const ensureLogTablePromises = new Map<string, Promise<void>>();

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDisplayDate(iso: string): string {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
    return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function toDateOnlyFromDb(value: Date | string): string {
    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
    return String(value).slice(0, 10);
}

async function ensureReminderLogTable(table: string) {
    if (!ensureLogTablePromises.has(table)) {
        const promise = pool
            .query(`
                CREATE TABLE IF NOT EXISTS ${table} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(64) NOT NULL,
                    reminder_date DATE NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_task_reminder (employee_id, reminder_date),
                    INDEX idx_task_reminder_date (reminder_date)
                )
            `)
            .then(() => undefined)
            .catch((error) => {
                ensureLogTablePromises.delete(table);
                throw error;
            });
        ensureLogTablePromises.set(table, promise);
    }
    await ensureLogTablePromises.get(table)!;
}

async function hasReminderBeenSentToday(
    table: string,
    employeeId: string,
    dateIso: string,
): Promise<boolean> {
    await ensureReminderLogTable(table);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM ${table} WHERE employee_id = ? AND reminder_date = ? LIMIT 1`,
        [employeeId.trim(), dateIso],
    );
    return rows.length > 0;
}

async function markReminderSent(table: string, employeeId: string, dateIso: string): Promise<void> {
    await ensureReminderLogTable(table);
    await pool.query(
        `INSERT INTO ${table} (employee_id, reminder_date) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE sent_at = CURRENT_TIMESTAMP`,
        [employeeId.trim(), dateIso],
    );
}

type TaskDbRow = RowDataPacket & {
    task_code: string;
    title: string;
    priority: string;
    status: string;
    due_date: Date | string;
};

function mapTaskDbRow(row: TaskDbRow): TaskRow {
    const status = row.status as TaskStatus;
    const dueDateIso = toDateOnlyFromDb(row.due_date);
    return {
        recordId: 0,
        id: String(row.task_code),
        title: String(row.title),
        description: "",
        assignee: "—",
        department: "—",
        assignees: [],
        priority: row.priority as TaskRow["priority"],
        status,
        isOverdue: status !== "completed",
        dueDate: formatDisplayDate(dueDateIso),
        createdAt: "",
        assignDate: "",
        assignedBy: { id: null, email: "", name: "" },
    };
}

async function listPendingTasksForEmployee(employeeId: string): Promise<TaskRow[]> {
    await ensureAdminTasksTables();
    const trimmed = employeeId.trim();
    if (!trimmed) return [];

    const [rows] = await pool.query<TaskDbRow[]>(
        `SELECT t.task_code, t.title, t.priority, t.status, t.due_date
         FROM ${TASKS_TABLE} t
         INNER JOIN ${ASSIGNEES_TABLE} a ON a.task_id = t.id
         WHERE a.employee_id = ? AND t.status = 'pending'
         ORDER BY t.due_date ASC, t.created_at ASC`,
        [trimmed],
    );

    return rows.map(mapTaskDbRow);
}

async function listOverdueTasksForEmployee(employeeId: string, dateIso: string): Promise<TaskRow[]> {
    await ensureAdminTasksTables();
    const trimmed = employeeId.trim();
    if (!trimmed) return [];

    const [rows] = await pool.query<TaskDbRow[]>(
        `SELECT t.task_code, t.title, t.priority, t.status, t.due_date
         FROM ${TASKS_TABLE} t
         INNER JOIN ${ASSIGNEES_TABLE} a ON a.task_id = t.id
         WHERE a.employee_id = ?
           AND t.status != 'completed'
           AND t.due_date <= ?
         ORDER BY t.due_date ASC, t.created_at ASC`,
        [trimmed, dateIso],
    );

    return rows.map(mapTaskDbRow);
}

async function fetchEmployeeDisplayName(employeeId: string): Promise<string> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT full_name FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [employeeId.trim()],
    );
    const name = rows[0]?.full_name;
    return typeof name === "string" && name.trim() ? name.trim() : employeeId.trim();
}

type ReminderEmailTheme = {
    heading: string;
    intro: string;
    headerGradient: string;
    footer: string;
};

function buildTasksReminderHtml(options: {
    employeeName: string;
    tasks: TaskRow[];
    theme: ReminderEmailTheme;
}): string {
    const { employeeName, tasks, theme } = options;

    const taskRows = tasks
        .map(
            (task) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;color:#0a2a5e;">${escapeHtml(task.id)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${escapeHtml(task.title)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${escapeHtml(task.dueDate || "—")}</td>
        </tr>`,
        )
        .join("");

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${theme.headerGradient};padding:24px 28px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${escapeHtml(theme.heading)}</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Hi ${escapeHtml(employeeName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 16px;">${theme.intro}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Task ID</th>
                  <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Title</th>
                  <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Due</th>
                </tr>
                ${taskRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              ${escapeHtml(theme.footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type TaskReminderResult = {
    sent: boolean;
    skipped: boolean;
    reason?: string;
    taskCount?: number;
};

/** @deprecated Use TaskReminderResult */
export type PendingTaskReminderResult = TaskReminderResult;

type CheckInReminderContext = {
    employeeId: string;
    employeeName: string;
    to: string;
    dateIso: string;
};

async function resolveCheckInReminderContext(
    employeeId: string,
    dateIso: string,
): Promise<
    | { ok: true; ctx: CheckInReminderContext }
    | { ok: false; result: TaskReminderResult }
> {
    const trimmed = employeeId.trim();
    if (!trimmed) {
        return { ok: false, result: { sent: false, skipped: true, reason: "invalid_employee" } };
    }

    await ensureAdminEmployeeShiftsTable();
    const [shiftRows] = await pool.query(`${SHIFT_SELECT_JOIN} WHERE s.employee_id = ? LIMIT 1`, [
        trimmed,
    ]);
    const shiftRow = (shiftRows as AdminEmployeeShiftRow[])[0];
    const shift = shiftRow ? mapShiftRowToApi(shiftRow) : null;

    const workingDays =
        shift?.is_active && shift.working_days?.length
            ? shift.working_days
            : DEFAULT_SHIFT_WORKING_DAYS;

    if (!isDateWorkingDay(dateIso, workingDays)) {
        return { ok: false, result: { sent: false, skipped: true, reason: "not_working_day" } };
    }

    const corporateHoliday = await getCorporateHolidayForDate(dateIso);
    if (corporateHoliday) {
        return { ok: false, result: { sent: false, skipped: true, reason: "corporate_holiday" } };
    }

    if (!isSmtpConfigured()) {
        return {
            ok: false,
            result: { sent: false, skipped: true, reason: "smtp_not_configured" },
        };
    }

    const to = await fetchEmployeeOfficialEmail(trimmed);
    if (!to) {
        return { ok: false, result: { sent: false, skipped: true, reason: "no_email" } };
    }

    const employeeName = shift?.full_name?.trim() || (await fetchEmployeeDisplayName(trimmed));

    return {
        ok: true,
        ctx: { employeeId: trimmed, employeeName, to, dateIso },
    };
}

async function sendTaskReminderEmail(options: {
    logTable: string;
    logLabel: string;
    employeeId: string;
    employeeName: string;
    to: string;
    tasks: TaskRow[];
    dateIso: string;
    subject: string;
    textLines: string[];
    theme: ReminderEmailTheme;
}): Promise<void> {
    const { logTable, logLabel, employeeId, employeeName, to, tasks, dateIso, subject, textLines, theme } =
        options;

    const text = [`Hi ${employeeName},`, "", ...textLines, "", "Please review and update your tasks in the employee portal."].join(
        "\n",
    );
    const html = buildTasksReminderHtml({ employeeName, tasks, theme });

    if (isEmailTestMode()) {
        console.log(`\n[${logLabel}] TEST MODE — email not sent`);
        console.log("To:", to);
        console.log("Employee:", employeeName, `(${employeeId})`);
        console.log("Tasks:", tasks.length);
        console.log("");
        await markReminderSent(logTable, employeeId, dateIso);
        return;
    }

    const transporter = createMailTransporter();
    const from = `"VIROS HRMS" <${smtpFromAddress()}>`;
    await transporter.sendMail({ from, to, subject, text, html });
    await markReminderSent(logTable, employeeId, dateIso);
    console.log(`[${logLabel}] Sent to ${to} (${employeeId}) — ${tasks.length} task(s)`);
}

/**
 * On employee check-in: one pending-task reminder per working day.
 */
export async function trySendPendingTaskReminder(
    employeeId: string,
    options?: { dateIso?: string },
): Promise<TaskReminderResult> {
    const dateIso = options?.dateIso?.trim() || todayDateOnly(IST_TIMEZONE);
    const resolved = await resolveCheckInReminderContext(employeeId, dateIso);
    if (!resolved.ok) return resolved.result;

    const { ctx } = resolved;

    if (await hasReminderBeenSentToday(PENDING_REMINDER_LOG_TABLE, ctx.employeeId, dateIso)) {
        return { sent: false, skipped: true, reason: "already_sent_today" };
    }

    const tasks = await listPendingTasksForEmployee(ctx.employeeId);
    if (tasks.length === 0) {
        return { sent: false, skipped: true, reason: "no_pending_tasks", taskCount: 0 };
    }

    try {
        await sendTaskReminderEmail({
            logTable: PENDING_REMINDER_LOG_TABLE,
            logLabel: "Pending task reminder",
            employeeId: ctx.employeeId,
            employeeName: ctx.employeeName,
            to: ctx.to,
            tasks,
            dateIso,
            subject: `[Tasks] ${tasks.length} pending task${tasks.length === 1 ? "" : "s"} — check-in reminder`,
            textLines: [
                `You checked in on ${formatDisplayDate(dateIso)}.`,
                `You have ${tasks.length} pending task(s):`,
                "",
                ...tasks.map(
                    (t) =>
                        `- ${t.id}: ${t.title} (due ${t.dueDate || "—"}, ${getStatusLabel(t.status)})`,
                ),
            ],
            theme: {
                heading: "Pending tasks reminder",
                intro: `You have checked in for today. You have <strong>${tasks.length}</strong> pending task${tasks.length === 1 ? "" : "s"} waiting for action.`,
                headerGradient: "linear-gradient(135deg,#06124f,#0a2a5e 55%,#06b6d4)",
                footer: "VIROS HRMS · Pending task reminder (sent on check-in)",
            },
        });
        return { sent: true, skipped: false, taskCount: tasks.length };
    } catch (error) {
        console.error(`[Pending task reminder] Failed for ${ctx.employeeId}:`, error);
        return { sent: false, skipped: true, reason: "send_failed", taskCount: tasks.length };
    }
}

/**
 * On employee check-in: one overdue-task reminder per working day.
 */
export async function trySendOverdueTaskReminder(
    employeeId: string,
    options?: { dateIso?: string },
): Promise<TaskReminderResult> {
    const dateIso = options?.dateIso?.trim() || todayDateOnly(IST_TIMEZONE);
    const resolved = await resolveCheckInReminderContext(employeeId, dateIso);
    if (!resolved.ok) return resolved.result;

    const { ctx } = resolved;

    if (await hasReminderBeenSentToday(OVERDUE_REMINDER_LOG_TABLE, ctx.employeeId, dateIso)) {
        return { sent: false, skipped: true, reason: "already_sent_today" };
    }

    const tasks = await listOverdueTasksForEmployee(ctx.employeeId, dateIso);
    if (tasks.length === 0) {
        return { sent: false, skipped: true, reason: "no_overdue_tasks", taskCount: 0 };
    }

    try {
        await sendTaskReminderEmail({
            logTable: OVERDUE_REMINDER_LOG_TABLE,
            logLabel: "Overdue task reminder",
            employeeId: ctx.employeeId,
            employeeName: ctx.employeeName,
            to: ctx.to,
            tasks,
            dateIso,
            subject: `[Tasks] ${tasks.length} overdue task${tasks.length === 1 ? "" : "s"} — check-in reminder`,
            textLines: [
                `You checked in on ${formatDisplayDate(dateIso)}.`,
                `You have ${tasks.length} overdue task(s) that need immediate attention:`,
                "",
                ...tasks.map(
                    (t) =>
                        `- ${t.id}: ${t.title} (due ${t.dueDate || "—"}, ${getStatusLabel(t.status)})`,
                ),
            ],
            theme: {
                heading: "Overdue tasks reminder",
                intro: `You have checked in for today. You have <strong>${tasks.length}</strong> overdue task${tasks.length === 1 ? "" : "s"} that require immediate attention.`,
                headerGradient: "linear-gradient(135deg,#7f1d1d,#dc2626 55%,#f97316)",
                footer: "VIROS HRMS · Overdue task reminder (sent on check-in)",
            },
        });
        return { sent: true, skipped: false, taskCount: tasks.length };
    } catch (error) {
        console.error(`[Overdue task reminder] Failed for ${ctx.employeeId}:`, error);
        return { sent: false, skipped: true, reason: "send_failed", taskCount: tasks.length };
    }
}
