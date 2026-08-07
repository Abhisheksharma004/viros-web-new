import pool from "@/lib/db";
import { getPaymentForPayslip } from "@/lib/adminPayroll";
import { formatPayrollMonthDisplay } from "@/lib/payrollCalculation";
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

    // Fetch employee email address
    let recipientEmail = "";
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(
                NULLIF(TRIM(e.official_email), ''),
                NULLIF(TRIM(e.personal_email), ''),
                NULLIF(TRIM(ea.official_email), '')
             ) AS email
             FROM admin_employees e
             LEFT JOIN admin_employee_access ea ON UPPER(TRIM(e.employee_id)) = UPPER(TRIM(ea.employee_id))
             WHERE UPPER(TRIM(e.employee_id)) = UPPER(TRIM(?))
             LIMIT 1`,
            [payment.employee_id],
        );
        if (rows.length > 0 && typeof rows[0].email === "string") {
            recipientEmail = rows[0].email.trim();
        }
    } catch (err) {
        console.error("Failed to query employee email:", err);
    }

    if (!recipientEmail) {
        return {
            success: false,
            message: `No email address found registered for employee ${payment.employee_name} (${payment.employee_id}).`,
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
    const subject = `Salary Payslip - ${monthDisplay} (${payment.payslip_number})`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Salary Payslip ${payment.payslip_number}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #0a2a5e; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">VEEROS HEALTHCARE</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #38bdf8;">Salary Payslip — ${monthDisplay}</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
            <p style="font-size: 14px; margin-top: 0;">Dear <strong>${payment.employee_name}</strong>,</p>
            <p style="font-size: 13px; color: #475569; line-height: 1.5;">
                Your salary payment for <strong>${monthDisplay}</strong> has been successfully processed. Below are your payslip breakdown details:
            </p>

            <!-- Employee Info Box -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
                <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Employee Name</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${payment.employee_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Employee ID</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${payment.employee_id}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Department</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${payment.department || "—"}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 14px; color: #64748b;">Payslip Number</td>
                    <td style="padding: 10px 14px; font-weight: bold; color: #0a2a5e; text-align: right;">${payment.payslip_number}</td>
                </tr>
            </table>

            <!-- Salary Details Box -->
            <h3 style="font-size: 14px; color: #0f172a; margin-top: 20px; margin-bottom: 10px;">Payment Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #475569;">Gross Salary</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatInr(payment.gross_salary)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #dc2626;">Absent Deduction</td>
                    <td style="padding: 8px 0; text-align: right; color: #dc2626;">-${formatInr(payment.absent_deduction)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #d97706;">Leave Deduction</td>
                    <td style="padding: 8px 0; text-align: right; color: #d97706;">-${formatInr(payment.leave_deduction)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #2563eb;">Advance Deduction</td>
                    <td style="padding: 8px 0; text-align: right; color: #2563eb;">-${formatInr(payment.advance_deduction)}</td>
                </tr>
                <tr style="background-color: #f0fdf4;">
                    <td style="padding: 12px; font-weight: bold; color: #166534; font-size: 14px;">Net Paid Amount</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; color: #15803d; font-size: 16px;">${formatInr(payment.net_payable)}</td>
                </tr>
            </table>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.5;">
                This is a system-generated salary payslip statement. For any queries regarding your payroll calculation, please contact HR / Payroll department.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Veeros Healthcare. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;

    try {
        const transporter = createMailTransporter();
        await transporter.sendMail({
            from: `"Veeros HR & Payroll" <${from}>`,
            to: recipientEmail,
            subject,
            html,
        });

        return {
            success: true,
            message: `Payslip ${payment.payslip_number} sent to ${payment.employee_name} (${recipientEmail}).`,
        };
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Mail dispatch failed";
        console.error("Failed to send payslip email:", err);
        return {
            success: false,
            message: `Failed to send email to ${recipientEmail}: ${errMsg}`,
        };
    }
}
