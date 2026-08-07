import pool from "@/lib/db";
import { getPaymentForPayslip } from "@/lib/adminPayroll";
import { formatPayrollMonthDisplay } from "@/lib/payrollCalculation";
import { generatePayslipPdfBuffer } from "@/lib/payrollPayslipExport";
import {
    createMailTransporter,
    isSmtpConfigured,
    smtpFromAddress,
} from "@/lib/mailer";
import type { RowDataPacket } from "mysql2";

function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(amount);
}

export async function sendPayslipEmail(paymentId: number): Promise<{ success: boolean; message: string }> {
    const payment = await getPaymentForPayslip(paymentId);
    if (!payment) {
        return { success: false, message: "Payslip record not found." };
    }

    // Fetch official and personal employee email addresses
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
            [payment.employee_id],
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
        console.error("Failed to query employee email:", err);
    }

    if (recipientEmails.length === 0) {
        return {
            success: false,
            message: `No email address (official or personal) found registered for employee ${payment.employee_name} (${payment.employee_id}).`,
        };
    }

    if (!isSmtpConfigured()) {
        return {
            success: false,
            message: `SMTP email service is not configured on the server. Please configure SMTP_USER & SMTP_PASSWORD.`,
        };
    }

    const monthDisplay = formatPayrollMonthDisplay(payment.payroll_month);
    const from = smtpFromAddress();
    const subject = `VIROS HRMS Payroll - Salary Payslip - ${monthDisplay} (${payment.payslip_number})`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VIROS HRMS Payroll - Payslip ${payment.payslip_number}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #0a2a5e; font-size: 18px; font-weight: bold;">VIROS HRMS Payroll</h2>
        <p style="font-size: 14px; margin-top: 16px;">Dear <strong>${payment.employee_name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Please find attached your official salary payslip PDF document for <strong>${monthDisplay}</strong> (Payslip ID: <strong>${payment.payslip_number}</strong>).
        </p>
        <div style="margin-top: 20px; padding: 16px; background-color: #f1f5f9; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.8;">
            <strong>Summary Details:</strong><br>
            Employee ID: <strong>${payment.employee_id}</strong><br>
            Payslip Number: <strong>${payment.payslip_number}</strong><br>
            Payroll Month: <strong>${monthDisplay}</strong><br>
            Net Salary Paid: <strong>${formatInr(payment.net_payable)}</strong>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            This is an automated email sent from <strong>VIROS HRMS Payroll</strong>. Please do not reply directly to this email.
        </p>
    </div>
</body>
</html>
    `;

    try {
        const pdfBuffer = await generatePayslipPdfBuffer(payment);
        const filename = `Payslip_${payment.payslip_number}_${payment.employee_name.replace(/\s+/g, "_")}.pdf`;

        const transporter = createMailTransporter();
        await transporter.sendMail({
            from: `"VIROS HRMS Payroll" <${from}>`,
            to: recipientEmails,
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
            message: `Payslip PDF (${filename}) successfully emailed to ${payment.employee_name} (${recipientEmails.join(", ")}).`,
        };
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Mail dispatch failed";
        console.error("Failed to send payslip email:", err);
        return {
            success: false,
            message: `Failed to send email to ${recipientEmails.join(", ")}: ${errMsg}`,
        };
    }
}
