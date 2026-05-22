import pool from "@/lib/db";
import { parseNotificationEmailsJson } from "@/lib/adminLeavePolicies";
import { fetchOrgSettings, leaveRequestStatusLabel } from "@/lib/employeeLeave";
import type { LeaveRejectionStage, LeaveRequestStatus } from "@/lib/employeeLeave";
import {
    createMailTransporter,
    isEmailTestMode,
    isSmtpConfigured,
    smtpFromAddress,
} from "@/lib/mailer";
import type { RowDataPacket } from "mysql2";

export type LeaveStatusEmailPayload = {
    employee_id: string;
    employee_name: string;
    request_id: string;
    policy_name: string;
    policy_code: string;
    start_date: string;
    end_date: string;
    days: number;
    day_type: string;
    reason: string;
    status: LeaveRequestStatus;
    rejected_at_stage: LeaveRejectionStage | null;
    rejection_reason: string | null;
};

export type LeaveApplicationEmailPayload = {
    employeeId: string;
    employeeName: string;
    department?: string;
    request: {
        request_id: string;
        policy_name: string;
        policy_code: string;
        start_date: string;
        end_date: string;
        days: number;
        day_type: string;
        reason: string;
        applied_on: string;
    };
};

function formatDayTypeLabel(dayType: string): string {
    switch (dayType) {
        case "first-half":
            return "First half";
        case "second-half":
            return "Second half";
        default:
            return "Full day";
    }
}

function formatDisplayDate(iso: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function buildLeaveApplicationHtml(payload: LeaveApplicationEmailPayload): string {
    const { employeeName, employeeId, department, request } = payload;
    const dateRange =
        request.start_date === request.end_date
            ? formatDisplayDate(request.start_date)
            : `${formatDisplayDate(request.start_date)} – ${formatDisplayDate(request.end_date)}`;

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";
    const reviewUrl = `${appUrl.replace(/\/$/, "")}/admin-dashboard/leave-request`;

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
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">New leave request</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Submitted via employee portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 20px;">An employee has applied for leave and is awaiting approval.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Employee</strong><br><span>${escapeHtml(employeeName)} (${escapeHtml(employeeId)})</span></td></tr>
                ${department ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Department</strong><br><span>${escapeHtml(department)}</span></td></tr>` : ""}
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Request ID</strong><br><span>${escapeHtml(request.request_id)}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Leave type</strong><br><span>${escapeHtml(request.policy_name)} (${escapeHtml(request.policy_code)})</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Dates</strong><br><span>${escapeHtml(dateRange)}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Duration</strong><br><span>${escapeHtml(String(request.days))} day(s) · ${escapeHtml(formatDayTypeLabel(request.day_type))}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Applied on</strong><br><span>${escapeHtml(formatDisplayDate(request.applied_on))}</span></td></tr>
                <tr><td style="padding:14px 18px;"><strong style="color:#0a2a5e;">Reason</strong><br><span>${escapeHtml(request.reason || "—")}</span></td></tr>
              </table>
              <p style="margin:24px 0 0;">
                <a href="${reviewUrl}" style="display:inline-block;background:#06b6d4;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">Review in admin portal</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              VIROS HRMS · Leave notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export async function fetchEmployeeProfileForEmail(
    employeeId: string,
): Promise<{ fullName: string; department: string }> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT full_name, department FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [employeeId.trim()],
    );
    const row = rows[0];
    return {
        fullName: row?.full_name ? String(row.full_name) : employeeId,
        department: row?.department ? String(row.department) : "",
    };
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

function statusBadgeStyle(status: LeaveRequestStatus): { bg: string; color: string } {
    switch (status) {
        case "l1_approved":
            return { bg: "#e0f2fe", color: "#0369a1" };
        case "approved":
            return { bg: "#dcfce7", color: "#15803d" };
        case "rejected":
            return { bg: "#fee2e2", color: "#b91c1c" };
        default:
            return { bg: "#f3f4f6", color: "#374151" };
    }
}

function buildLeaveStatusHtml(
    payload: LeaveStatusEmailPayload,
    statusLabel: string,
): string {
    const { employee_name, request_id, status } = payload;
    const dateRange =
        payload.start_date === payload.end_date
            ? formatDisplayDate(payload.start_date)
            : `${formatDisplayDate(payload.start_date)} – ${formatDisplayDate(payload.end_date)}`;

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";
    const leaveUrl = `${appUrl.replace(/\/$/, "")}/employee-dashboard/leave`;
    const badge = statusBadgeStyle(status);
    const isRejected = status === "rejected";

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
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Leave request update</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Hi ${escapeHtml(employee_name)}, your leave request has been updated</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 16px;text-align:center;">
                <span style="display:inline-block;background:${badge.bg};color:${badge.color};font-weight:700;font-size:16px;padding:10px 20px;border-radius:999px;">${escapeHtml(statusLabel)}</span>
              </p>
              ${isRejected && payload.rejection_reason ? `<p style="margin:0 0 20px;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b;"><strong>Reason:</strong> ${escapeHtml(payload.rejection_reason)}</p>` : ""}
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Request ID</strong><br><span>${escapeHtml(request_id)}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Leave type</strong><br><span>${escapeHtml(payload.policy_name)} (${escapeHtml(payload.policy_code)})</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Dates</strong><br><span>${escapeHtml(dateRange)}</span></td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><strong style="color:#0a2a5e;">Duration</strong><br><span>${escapeHtml(String(payload.days))} day(s) · ${escapeHtml(formatDayTypeLabel(payload.day_type))}</span></td></tr>
                <tr><td style="padding:14px 18px;"><strong style="color:#0a2a5e;">Your reason</strong><br><span>${escapeHtml(payload.reason || "—")}</span></td></tr>
              </table>
              <p style="margin:24px 0 0;">
                <a href="${leaveUrl}" style="display:inline-block;background:#06b6d4;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">View in employee portal</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
              VIROS HRMS · Leave status notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends leave application notification to emails configured on Leave Policy page.
 * Never throws — logs errors so leave submission is not blocked.
 */
export async function sendLeaveApplicationNotification(
    payload: LeaveApplicationEmailPayload,
): Promise<{ sent: boolean; recipientCount: number; reason?: string }> {
    try {
        const settings = await fetchOrgSettings();
        const recipients = parseNotificationEmailsJson(settings.notification_emails);

        if (recipients.length === 0) {
            console.warn(
                "[Leave email] No notification emails configured. Add recipients on Admin → Leave Policy.",
            );
            return { sent: false, recipientCount: 0, reason: "no_recipients" };
        }

        if (!isSmtpConfigured()) {
            console.warn(
                "[Leave email] SMTP not configured (SMTP_USER / SMTP_PASSWORD). Leave saved but email not sent.",
            );
            return { sent: false, recipientCount: recipients.length, reason: "smtp_not_configured" };
        }

        const subject = `[Leave] ${payload.employeeName} (${payload.employeeId}) — ${payload.request.policy_code} · ${payload.request.start_date}`;
        const html = buildLeaveApplicationHtml(payload);
        const text = [
            `New leave request from ${payload.employeeName} (${payload.employeeId})`,
            `Request: ${payload.request.request_id}`,
            `Type: ${payload.request.policy_name} (${payload.request.policy_code})`,
            `Dates: ${payload.request.start_date} to ${payload.request.end_date}`,
            `Days: ${payload.request.days} (${formatDayTypeLabel(payload.request.day_type)})`,
            `Reason: ${payload.request.reason}`,
        ].join("\n");

        if (isEmailTestMode()) {
            console.log("\n[Leave email] TEST MODE — notification not sent");
            console.log("To:", recipients.join(", "));
            console.log("Subject:", subject);
            console.log(text);
            console.log("");
            return { sent: true, recipientCount: recipients.length, reason: "test_mode" };
        }

        const transporter = createMailTransporter();
        const from = `"VIROS HRMS" <${smtpFromAddress()}>`;

        await transporter.sendMail({
            from,
            to: recipients.join(", "),
            subject,
            text,
            html,
        });

        console.log(
            `[Leave email] Sent leave notification for ${payload.request.request_id} to ${recipients.length} recipient(s)`,
        );
        return { sent: true, recipientCount: recipients.length };
    } catch (error) {
        console.error("[Leave email] Failed to send leave application notification:", error);
        return { sent: false, recipientCount: 0, reason: "send_failed" };
    }
}

/**
 * Notifies the employee when their leave is L1/L2 approved or rejected.
 * Never throws — logs errors so status updates are not blocked.
 */
export async function sendLeaveStatusNotificationToEmployee(
    payload: LeaveStatusEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
    try {
        const notifyStatuses: LeaveRequestStatus[] = ["l1_approved", "approved", "rejected"];
        if (!notifyStatuses.includes(payload.status)) {
            return { sent: false, reason: "status_not_notifiable" };
        }

        const to = await fetchEmployeeOfficialEmail(payload.employee_id);
        if (!to) {
            console.warn(
                `[Leave email] No official email for employee ${payload.employee_id}. Status saved but email not sent.`,
            );
            return { sent: false, reason: "no_employee_email" };
        }

        if (!isSmtpConfigured()) {
            console.warn(
                "[Leave email] SMTP not configured. Leave status updated but employee email not sent.",
            );
            return { sent: false, reason: "smtp_not_configured" };
        }

        const statusLabel = leaveRequestStatusLabel(
            payload.status,
            payload.rejected_at_stage,
        );
        const subject = `[Leave] ${statusLabel} — ${payload.request_id}`;
        const html = buildLeaveStatusHtml(payload, statusLabel);
        const textLines = [
            `Hi ${payload.employee_name},`,
            `Your leave request (${payload.request_id}) status: ${statusLabel}`,
            `Type: ${payload.policy_name} (${payload.policy_code})`,
            `Dates: ${payload.start_date} to ${payload.end_date}`,
            `Days: ${payload.days} (${formatDayTypeLabel(payload.day_type)})`,
        ];
        if (payload.status === "rejected" && payload.rejection_reason) {
            textLines.push(`Reason: ${payload.rejection_reason}`);
        }
        const text = textLines.join("\n");

        if (isEmailTestMode()) {
            console.log("\n[Leave email] TEST MODE — employee status email not sent");
            console.log("To:", to);
            console.log("Subject:", subject);
            console.log(text);
            console.log("");
            return { sent: true, reason: "test_mode" };
        }

        const transporter = createMailTransporter();
        const from = `"VIROS HRMS" <${smtpFromAddress()}>`;

        await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html,
        });

        console.log(
            `[Leave email] Sent ${statusLabel} notification for ${payload.request_id} to ${to}`,
        );
        return { sent: true };
    } catch (error) {
        console.error("[Leave email] Failed to send leave status notification to employee:", error);
        return { sent: false, reason: "send_failed" };
    }
}
