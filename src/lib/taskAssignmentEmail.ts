import pool from "@/lib/db";
import type { TaskPriority, TaskRow, TaskStatus } from "@/lib/adminTaskUiShared";
import { formatAssignedByLabel, getStatusLabel } from "@/lib/adminTaskUiShared";
import {
    createMailTransporter,
    isEmailTestMode,
    isSmtpConfigured,
    smtpFromAddress,
} from "@/lib/mailer";
import type { RowDataPacket } from "mysql2";

export type TaskAssigneeNotifyInput = {
    employee_id: string;
    full_name: string;
    department: string | null;
};

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

function priorityLabel(priority: TaskPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/** Matches employee dashboard: multiple assignees = team task */
export function isTeamTask(task: TaskRow): boolean {
    return (task.assignees?.length ?? 0) > 1;
}

function formatTeamMembersList(assignees: TaskAssigneeNotifyInput[]): string {
    return assignees
        .map((a) => {
            const dept = a.department?.trim();
            return dept
                ? `${a.full_name} (${a.employee_id}) · ${dept}`
                : `${a.full_name} (${a.employee_id})`;
        })
        .join("\n");
}

function buildTeamMembersHtml(assignees: TaskAssigneeNotifyInput[]): string {
    if (assignees.length === 0) return "";
    const items = assignees
        .map(
            (a) =>
                `<li style="margin:0 0 8px;padding:0;color:#111827;font-size:14px;"><strong>${escapeHtml(a.full_name)}</strong> <span style="color:#6b7280;">(${escapeHtml(a.employee_id)}${a.department ? ` · ${escapeHtml(a.department)}` : ""})</span></li>`,
        )
        .join("");
    return `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1d4ed8;">Team members</p>
                    <ul style="margin:0;padding:0 0 0 18px;">${items}</ul>
                  </td>
                </tr>
              </table>`;
}

function assignedByTableRow(assignedByLabel: string): string {
    return `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Assigned by</strong><br><span>${escapeHtml(assignedByLabel)}</span></td></tr>`;
}

function buildTeamTaskAssignmentHtml(options: {
    employeeName: string;
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    teamMembers: TaskAssigneeNotifyInput[];
    assignedByLabel: string;
    isNewAssignment: boolean;
}): string {
    const {
        employeeName,
        taskId,
        title,
        description,
        priority,
        status,
        dueDate,
        teamMembers,
        assignedByLabel,
        isNewAssignment,
    } = options;

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";
    const tasksUrl = `${appUrl.replace(/\/$/, "")}/employee-dashboard/tasks`;
    const heading = isNewAssignment ? "New team task assigned" : "Added to team task";
    const intro = isNewAssignment
        ? "You are part of a team assigned to this task. Coordinate with your teammates and update progress in the employee portal."
        : "You have been added to a team task. Please review the details and coordinate with your teammates below.";

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
            <td style="background:linear-gradient(135deg,#06124f,#0a2a5e 55%,#06b6d4);padding:24px 28px;">
              <p style="margin:0 0 10px;"><span style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:6px 12px;border-radius:999px;">Team task</span></p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${escapeHtml(heading)}</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Hi ${escapeHtml(employeeName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 20px;">${escapeHtml(intro)}</p>
              ${buildTeamMembersHtml(teamMembers)}
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Task ID</strong><br><span>${escapeHtml(taskId)}</span></td></tr>
                ${assignedByTableRow(assignedByLabel)}
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Title</strong><br><span>${escapeHtml(title)}</span></td></tr>
                ${description ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Description</strong><br><span>${escapeHtml(description)}</span></td></tr>` : ""}
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Priority</strong><br><span>${escapeHtml(priorityLabel(priority))}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Status</strong><br><span>${escapeHtml(getStatusLabel(status))}</span></td></tr>
                <tr><td style="padding:14px 18px;"><strong style="color:#0a2a5e;">Due date</strong><br><span>${escapeHtml(formatDisplayDate(dueDate))}</span></td></tr>
              </table>
              <p style="margin:24px 0 0;">
                <a href="${tasksUrl}" style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">View team tasks in portal</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              VIROS HRMS · Team task assignment notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function fetchEmployeeOfficialEmail(employeeId: string): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            COALESCE(NULLIF(TRIM(e.official_email), ''), NULLIF(TRIM(ea.official_email), '')) AS email
         FROM admin_employees e
         LEFT JOIN admin_employee_access ea ON ea.employee_id = e.employee_id
         WHERE e.employee_id = ?
         LIMIT 1`,
        [employeeId.trim()],
    );
    const email = rows[0]?.email;
    if (typeof email !== "string") return null;
    const trimmed = email.trim();
    return trimmed.includes("@") ? trimmed : null;
}

function buildTaskAssignmentHtml(options: {
    employeeName: string;
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    department: string | null;
    assignedByLabel: string;
    isNewAssignment: boolean;
}): string {
    const {
        employeeName,
        taskId,
        title,
        description,
        priority,
        status,
        dueDate,
        department,
        assignedByLabel,
        isNewAssignment,
    } = options;

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";
    const tasksUrl = `${appUrl.replace(/\/$/, "")}/employee-dashboard/tasks`;
    const heading = isNewAssignment ? "New task assigned" : "Task assignment updated";
    const intro = isNewAssignment
        ? "You have been assigned a new task. Please review the details below and update your progress in the employee portal."
        : "You have been added as an assignee on a task. Please review the details below.";

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
            <td style="background:linear-gradient(135deg,#06124f,#0a2a5e 55%,#06b6d4);padding:24px 28px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${escapeHtml(heading)}</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Hi ${escapeHtml(employeeName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 20px;">${escapeHtml(intro)}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Task ID</strong><br><span>${escapeHtml(taskId)}</span></td></tr>
                ${assignedByTableRow(assignedByLabel)}
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Title</strong><br><span>${escapeHtml(title)}</span></td></tr>
                ${description ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Description</strong><br><span>${escapeHtml(description)}</span></td></tr>` : ""}
                ${department ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Department</strong><br><span>${escapeHtml(department)}</span></td></tr>` : ""}
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Priority</strong><br><span>${escapeHtml(priorityLabel(priority))}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Status</strong><br><span>${escapeHtml(getStatusLabel(status))}</span></td></tr>
                <tr><td style="padding:14px 18px;"><strong style="color:#0a2a5e;">Due date</strong><br><span>${escapeHtml(formatDisplayDate(dueDate))}</span></td></tr>
              </table>
              <p style="margin:24px 0 0;">
                <a href="${tasksUrl}" style="display:inline-block;background:#06b6d4;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">View tasks in portal</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              VIROS HRMS · Task assignment notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendOneTeamTaskAssignmentEmail(options: {
    to: string;
    employeeName: string;
    task: TaskRow;
    teamMembers: TaskAssigneeNotifyInput[];
    isNewAssignment: boolean;
}): Promise<boolean> {
    const { to, employeeName, task, teamMembers, isNewAssignment } = options;
    const assignedByLabel = formatAssignedByLabel(task.assignedBy);
    const subject = isNewAssignment
        ? `[Team Task] New assignment — ${task.id}: ${task.title}`
        : `[Team Task] You were added — ${task.id}: ${task.title}`;

    const text = [
        `Hi ${employeeName},`,
        isNewAssignment
            ? "You are part of a team assigned to a new task."
            : "You have been added to a team task.",
        "",
        `Assigned by: ${assignedByLabel}`,
        "",
        "Team members:",
        formatTeamMembersList(teamMembers),
        "",
        `Task ID: ${task.id}`,
        `Title: ${task.title}`,
        task.description ? `Description: ${task.description}` : "",
        `Priority: ${priorityLabel(task.priority)}`,
        `Status: ${getStatusLabel(task.status)}`,
        `Due date: ${formatDisplayDate(task.dueDate)}`,
    ]
        .filter(Boolean)
        .join("\n");

    const html = buildTeamTaskAssignmentHtml({
        employeeName,
        taskId: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        teamMembers,
        assignedByLabel,
        isNewAssignment,
    });

    const transporter = createMailTransporter();
    const from = `"VIROS HRMS" <${smtpFromAddress()}>`;

    await transporter.sendMail({ from, to, subject, text, html });
    return true;
}

async function sendOneTaskAssignmentEmail(options: {
    to: string;
    employeeName: string;
    task: TaskRow;
    assignee: TaskAssigneeNotifyInput;
    isNewAssignment: boolean;
}): Promise<boolean> {
    const { to, employeeName, task, assignee, isNewAssignment } = options;
    const assignedByLabel = formatAssignedByLabel(task.assignedBy);
    const subject = isNewAssignment
        ? `[Task] New assignment — ${task.id}: ${task.title}`
        : `[Task] You were assigned — ${task.id}: ${task.title}`;

    const text = [
        `Hi ${employeeName},`,
        isNewAssignment
            ? "You have been assigned a new task."
            : "You have been added as an assignee on a task.",
        "",
        `Assigned by: ${assignedByLabel}`,
        "",
        `Task ID: ${task.id}`,
        `Title: ${task.title}`,
        task.description ? `Description: ${task.description}` : "",
        assignee.department ? `Department: ${assignee.department}` : "",
        `Priority: ${priorityLabel(task.priority)}`,
        `Status: ${getStatusLabel(task.status)}`,
        `Due date: ${formatDisplayDate(task.dueDate)}`,
    ]
        .filter(Boolean)
        .join("\n");

    const html = buildTaskAssignmentHtml({
        employeeName,
        taskId: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        department: assignee.department,
        assignedByLabel,
        isNewAssignment,
    });

    const transporter = createMailTransporter();
    const from = `"VIROS HRMS" <${smtpFromAddress()}>`;

    await transporter.sendMail({ from, to, subject, text, html });
    return true;
}

/**
 * Sends task assignment emails to the given employee IDs (official email).
 * Never throws — logs errors so task create/update is not blocked.
 */
export async function sendTaskAssignmentEmails(
    task: TaskRow,
    assigneeEmployeeIds: string[],
    options?: { isNewTask?: boolean },
): Promise<{ sent: number; skipped: number }> {
    const uniqueIds = [...new Set(assigneeEmployeeIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
        return { sent: 0, skipped: 0 };
    }

    if (!isSmtpConfigured()) {
        console.warn(
            "[Task email] SMTP not configured (SMTP_USER / SMTP_PASSWORD). Task saved but emails not sent.",
        );
        return { sent: 0, skipped: uniqueIds.length };
    }

    const assigneeById = new Map(
        (task.assignees ?? []).map((a) => [a.employee_id, a] as const),
    );
    const allTeamMembers: TaskAssigneeNotifyInput[] = (task.assignees ?? []).map((a) => ({
        employee_id: a.employee_id,
        full_name: a.full_name,
        department: a.department,
    }));
    const teamTask = isTeamTask(task);

    let sent = 0;
    let skipped = 0;
    const isNewAssignment = options?.isNewTask !== false;

    for (const employeeId of uniqueIds) {
        try {
            const assignee = assigneeById.get(employeeId);
            const employeeName = assignee?.full_name ?? employeeId;
            const to = await fetchEmployeeOfficialEmail(employeeId);

            if (!to) {
                console.warn(
                    `[Task email] No official email for employee ${employeeId}. Task saved but email not sent.`,
                );
                skipped += 1;
                continue;
            }

            if (isEmailTestMode()) {
                console.log(
                    `\n[Task email] TEST MODE — ${teamTask ? "team " : ""}assignment email not sent`,
                );
                console.log("To:", to);
                console.log("Employee:", employeeName, `(${employeeId})`);
                console.log("Task:", task.id, task.title);
                if (teamTask) {
                    console.log("Team members:", formatTeamMembersList(allTeamMembers));
                }
                console.log("");
                sent += 1;
                continue;
            }

            if (teamTask) {
                await sendOneTeamTaskAssignmentEmail({
                    to,
                    employeeName,
                    task,
                    teamMembers: allTeamMembers,
                    isNewAssignment,
                });
                console.log(`[Task email] Sent team task assignment for ${task.id} to ${to}`);
            } else {
                await sendOneTaskAssignmentEmail({
                    to,
                    employeeName,
                    task,
                    assignee: assignee ?? {
                        employee_id: employeeId,
                        full_name: employeeName,
                        department: null,
                    },
                    isNewAssignment,
                });
                console.log(`[Task email] Sent task assignment for ${task.id} to ${to}`);
            }
            sent += 1;
        } catch (error) {
            console.error(
                `[Task email] Failed to send assignment email for ${employeeId} on task ${task.id}:`,
                error,
            );
            skipped += 1;
        }
    }

    return { sent, skipped };
}
