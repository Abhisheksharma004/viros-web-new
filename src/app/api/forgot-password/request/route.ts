import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';
import { generateOTP, getOTPExpiration, sanitizeEmail } from '@/lib/otp-utils';
import { isValidEmail } from '@/lib/email-utils';
import fs from 'fs/promises';
import path from 'path';

// Email configuration - supports both SMTP_* and EMAIL_* environment variables
const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD;

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

export async function POST(request: Request) {
    try {
        // Validate email configuration
        if (!emailUser || !emailPassword) {
            console.error('[Password Reset] Email configuration missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD (or SMTP_USER and SMTP_PASSWORD) in .env.local');
            return NextResponse.json(
                { message: 'Email service is not configured. Please contact administrator.' },
                { status: 500 }
            );
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const sanitizedEmail = sanitizeEmail(email);

        // Validate email format
        if (!isValidEmail(sanitizedEmail)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if user exists
        const [users]: any = await pool.query(
            'SELECT id, email FROM users WHERE email = ?',
            [sanitizedEmail]
        );

        if (users.length === 0) {
            // Return success even if user doesn't exist (security best practice)
            // This prevents email enumeration attacks
            return NextResponse.json(
                { message: 'If an account exists with this email, you will receive a password reset code.' },
                { status: 200 }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiration();

        // Delete any existing unused OTPs for this email
        await pool.query(
            'DELETE FROM password_reset_otps WHERE email = ? AND used = FALSE',
            [sanitizedEmail]
        );

        // Store OTP in database
        await pool.query(
            'INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (?, ?, ?)',
            [sanitizedEmail, otp, expiresAt]
        );

        // Load email template
        const templatePath = path.join(process.cwd(), 'email-templates', 'password-reset-otp.html');
        let emailHTML = await fs.readFile(templatePath, 'utf-8');

        // Replace placeholders
        emailHTML = emailHTML.replace('{{OTP}}', otp);
        emailHTML = emailHTML.replace('{{TIMESTAMP}}', new Date().toLocaleString('en-US', {
            dateStyle: 'long',
            timeStyle: 'short'
        }));

        // Send email
        await transporter.sendMail({
            from: `"VIROS Security" <${emailUser}>`,
            to: sanitizedEmail,
            subject: '🔒 Password Reset Code - VIROS',
            html: emailHTML,
            text: `Your VIROS password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
        });

        console.log(`[Password Reset] OTP sent to ${sanitizedEmail}`);

        return NextResponse.json(
            { 
                message: 'If an account exists with this email, you will receive a password reset code.',
                email: sanitizedEmail // Send back for frontend to use in verify step
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('[Password Reset Request] Error:', error);
        return NextResponse.json(
            { message: 'Failed to process password reset request' },
            { status: 500 }
        );
    }
}
