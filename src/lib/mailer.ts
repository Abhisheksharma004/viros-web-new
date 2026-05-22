import nodemailer from "nodemailer";

export function isSmtpConfigured(): boolean {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass =
        process.env.SMTP_PASSWORD ||
        process.env.EMAIL_PASSWORD ||
        process.env.EMAIL_APP_PASSWORD;
    return Boolean(user && pass);
}

export function smtpFromAddress(): string {
    return process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@viros.local";
}

export function createMailTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER || process.env.EMAIL_USER,
            pass:
                process.env.SMTP_PASSWORD ||
                process.env.EMAIL_PASSWORD ||
                process.env.EMAIL_APP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
}

export function isEmailTestMode(): boolean {
    return process.env.EMAIL_TEST_MODE === "true";
}
