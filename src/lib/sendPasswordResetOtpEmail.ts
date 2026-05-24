import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

export function isPasswordResetEmailConfigured(): boolean {
    return Boolean(emailUser && emailPassword);
}

export async function sendPasswordResetOtpEmail(to: string, otp: string): Promise<void> {
    const templatePath = path.join(process.cwd(), "email-templates", "password-reset-otp.html");
    let emailHTML = await fs.readFile(templatePath, "utf-8");

    emailHTML = emailHTML.replace("{{OTP}}", otp);
    emailHTML = emailHTML.replace(
        "{{TIMESTAMP}}",
        new Date().toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
        }),
    );

    await transporter.sendMail({
        from: `"VIROS Security" <${emailUser}>`,
        to,
        subject: "🔒 Password Reset Code - VIROS",
        html: emailHTML,
        text: `Your VIROS password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    });
}
