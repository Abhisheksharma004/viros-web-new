import pool from "@/lib/db";
import { formatExpenseMonthDisplay, resolveExpenseApprovedAmount } from "@/lib/employeeExpenseUi";
import { generateEmployeeWiseExpensePdfBuffer } from "@/lib/adminExpenseExport";
import {
    createMailTransporter,
    isSmtpConfigured,
    smtpFromAddress,
} from "@/lib/mailer";
import type { RowDataPacket } from "mysql2";
import { listAllExpensesForAdmin, type EmployeeExpenseRow } from "@/lib/employeeExpenses";

function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(amount);
}

export async function sendExpenseEmail(
    employeeId: string,
    month: string,
    options?: { ccEmails?: string[] | string },
): Promise<{ success: boolean; message: string }> {
    if (!employeeId.trim()) {
        return { success: false, message: "Employee ID is required." };
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
        return { success: false, message: "Valid month (YYYY-MM) is required." };
    }

    // 1. Fetch expenses for employee & month
    const mapped: EmployeeExpenseRow[] = await listAllExpensesForAdmin({ employeeId, month, limit: 500 });

    if (mapped.length === 0) {
        return { success: false, message: "No expense records found for this employee & month." };
    }

    const paidCount = mapped.filter((e: EmployeeExpenseRow) => e.payment_status === "paid").length;
    if (paidCount === 0) {
        return {
            success: false,
            message: "Expense reimbursement statement can only be emailed after payment status is Paid.",
        };
    }

    const employeeName =
        mapped.find((e: EmployeeExpenseRow) => e.employee_name && e.employee_name.trim())?.employee_name || employeeId;

    // Parse CC emails
    const ccList: string[] = [];
    if (options?.ccEmails) {
        const raw = Array.isArray(options.ccEmails) ? options.ccEmails : options.ccEmails.split(/[,;\s]+/);
        raw.forEach((em) => {
            if (typeof em === "string" && em.trim().includes("@")) {
                const cleaned = em.trim().toLowerCase();
                if (!ccList.includes(cleaned)) {
                    ccList.push(cleaned);
                }
            }
        });
    }

    // 2. Query employee registered email addresses
    const recipientEmails: string[] = [];
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT
                e.official_email AS emp_official,
                e.personal_email AS emp_personal,
                ea.official_email AS access_official
             FROM admin_employees e
             LEFT JOIN admin_employee_access ea ON UPPER(TRIM(e.employee_id)) = UPPER(TRIM(ea.employee_id))
             WHERE UPPER(TRIM(e.employee_id)) = UPPER(TRIM(?))
             LIMIT 1`,
            [employeeId],
        );
        if (rows.length > 0) {
            const row = rows[0];
            const emailSet = new Set<string>();
            [row.emp_official, row.emp_personal, row.access_official].forEach((em) => {
                if (typeof em === "string" && em.trim().length > 0 && em.includes("@")) {
                    emailSet.add(em.trim().toLowerCase());
                }
            });
            recipientEmails.push(...Array.from(emailSet));
        }
    } catch (err) {
        console.error("Failed to query employee email for expense notification:", err);
    }

    if (recipientEmails.length === 0) {
        return {
            success: false,
            message: `No email address (official or personal) registered for employee ${employeeName} (${employeeId}).`,
        };
    }

    if (!isSmtpConfigured()) {
        return {
            success: false,
            message: "SMTP email service is not configured on the server. Please configure SMTP credentials.",
        };
    }

    const monthDisplay = formatExpenseMonthDisplay(month);
    const totalApproved = mapped.reduce((sum: number, e: EmployeeExpenseRow) => sum + (resolveExpenseApprovedAmount(e) ?? 0), 0);
    const approvedCount = mapped.filter((e: EmployeeExpenseRow) => e.status === "approved").length;

    const from = smtpFromAddress();
    const subject = `VIROS HRMS - Expense Reimbursement Statement - ${monthDisplay} (${employeeId})`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VIROS HRMS - Expense Reimbursement Statement ${monthDisplay}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #0a2a5e; font-size: 18px; font-weight: bold;">VIROS HRMS Expense Management</h2>
        <p style="font-size: 14px; margin-top: 16px;">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Please find attached your official Expense Reimbursement Statement PDF document for <strong>${monthDisplay}</strong>.
        </p>
        <div style="margin-top: 20px; padding: 16px; background-color: #f1f5f9; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.8;">
            <strong>Summary Details:</strong><br>
            Employee ID: <strong>${employeeId}</strong><br>
            Reimbursement Month: <strong>${monthDisplay}</strong><br>
            Approved Expense Claims: <strong>${approvedCount} record(s)</strong><br>
            Net Amount Reimbursed: <strong>${formatInr(totalApproved)}</strong><br>
            Payment Status: <span style="color: #059669; font-weight: bold;">PAID</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            This is an automated email sent from <strong>VIROS HRMS Expense Management</strong>. Please do not reply directly to this email. For inquiries, please contact <a href="mailto:hr@virosentrepreneurs.com" style="color: #0284c7;">hr@virosentrepreneurs.com</a>.
        </p>
    </div>
</body>
</html>
    `;

    try {
        const pdfBuffer = await generateEmployeeWiseExpensePdfBuffer(mapped, { employeeId, employeeName }, monthDisplay);
        const filename = `Expense_Statement_${employeeId}_${month.replace("-", "_")}.pdf`;

        const transporter = createMailTransporter();
        await transporter.sendMail({
            from: `"VIROS HRMS" <${from}>`,
            to: recipientEmails,
            ...(ccList.length > 0 ? { cc: ccList } : {}),
            subject,
            html,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        return {
            success: true,
            message: `Expense reimbursement PDF statement emailed to ${employeeName} (${recipientEmails.join(", ")}).`,
        };
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Mail dispatch failed";
        console.error("Failed to send expense email:", err);
        return {
            success: false,
            message: `Failed to send email to ${recipientEmails.join(", ")}: ${errMsg}`,
        };
    }
}
