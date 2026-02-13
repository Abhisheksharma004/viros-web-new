import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { isValidEmail, sanitizeEmail } from '@/lib/email-utils';

// Email configuration - supports both SMTP_* and EMAIL_* environment variables
const emailConfig = {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
    }
};

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viros_web_new',
    port: parseInt(process.env.DB_PORT || '3306')
};

/**
 * Get database connection
 */
async function getConnection() {
    return await mysql.createConnection(dbConfig);
}

/**
 * Log email to history
 */
async function logEmailHistory(
    connection: any,
    birthdayId: number | null,
    email: string,
    name: string,
    status: 'sent' | 'failed',
    messageId?: string,
    error?: string,
    celebrationTime?: string,
    department?: string
) {
    try {
        await connection.execute(
            `INSERT INTO birthday_email_history 
            (birthday_id, recipient_email, recipient_name, status, message_id, error_message, celebration_time, department) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                birthdayId || null,
                email,
                name,
                status,
                messageId || null,
                error || null,
                celebrationTime || '3:00 PM',
                department || 'VIROS Team'
            ]
        );
    } catch (error) {
        console.error('Error logging email history:', error);
        // Don't throw - we don't want to fail the email send if logging fails
    }
}

/**
 * Read and customize the HTML email template
 */
async function getEmailTemplate(data: any) {
    try {
        const templatePath = path.join(process.cwd(), 'email-templates', 'birthday-wishes.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        
        // Replace placeholders with actual data
        template = template.replace(/\[Employee Name\]/g, data.name || '[Employee Name]');
        template = template.replace(/\[Time\]/g, data.celebrationTime || '3:00 PM');
        template = template.replace(/\[Department Name \/ Manager Name\]/g, data.department || 'VIROS Team');
        
        return template;
    } catch (error) {
        console.error('Error reading email template:', error);
        throw new Error('Failed to load email template');
    }
}

export async function POST(request: Request) {
    let connection;
    
    try {
        const body = await request.json();
        const { to, name, celebrationTime, department, birthdayId } = body;

        // Validate required fields
        if (!to || !name) {
            return NextResponse.json(
                { error: 'Recipient email and name are required' },
                { status: 400 }
            );
        }

        // Validate and sanitize email
        const sanitizedEmail = sanitizeEmail(to);
        if (!sanitizedEmail) {
            return NextResponse.json(
                { error: 'Invalid email address format' },
                { status: 400 }
            );
        }

        // Check email configuration
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            return NextResponse.json(
                { error: 'Email not configured. Please set SMTP_USER and SMTP_PASSWORD (or EMAIL_USER and EMAIL_PASSWORD) in .env.local' },
                { status: 500 }
            );
        }

        // Connect to database for logging
        try {
            connection = await getConnection();
        } catch (dbError) {
            console.warn('Database connection failed, proceeding without history logging:', dbError);
        }

        // Create transporter
        const transporter = nodemailer.createTransport(emailConfig);

        const celebrationTimeValue = celebrationTime || '3:00 PM';
        const departmentValue = department || 'VIROS Team';

        // Get customized HTML template
        const htmlContent = await getEmailTemplate({
            name,
            celebrationTime: celebrationTimeValue,
            department: departmentValue
        });

        // Plain text fallback
        const textContent = `
Happy Birthday ${name}!

On behalf of the entire VIROS team, we want to wish you a very Happy Birthday! 🎉

Thank you for being a valued part of the VIROS family. Your trust and partnership mean the world to us, and we're honored to celebrate this special day with you.

May this year bring you success, happiness, and all the things you've been wishing for. You deserve nothing but the best!

We hope your birthday is as special as you are! May this year bring you continued success, good health, and endless happiness.

With warmest wishes,
The VIROS Team
${departmentValue}
        `.trim();

        // Email options
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'VIROS'} Team" <${emailConfig.auth.user}>`,
            to: sanitizedEmail,
            subject: `🎉 Happy Birthday ${name}! 🎂`,
            text: textContent,
            html: htmlContent
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Birthday email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Recipient:', sanitizedEmail);
        
        // Log to history if database is available
        if (connection) {
            await logEmailHistory(
                connection,
                birthdayId || null,
                sanitizedEmail,
                name,
                'sent',
                info.messageId,
                undefined,
                celebrationTimeValue,
                departmentValue
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Birthday email sent successfully!',
            messageId: info.messageId,
            recipient: sanitizedEmail
        });

    } catch (error: any) {
        console.error('❌ Error sending birthday email:', error);
        
        // Log failure to history if database is available
        if (connection) {
            try {
                const body = await request.clone().json();
                await logEmailHistory(
                    connection,
                    body.birthdayId || null,
                    body.to,
                    body.name,
                    'failed',
                    undefined,
                    error.message,
                    body.celebrationTime,
                    body.department
                );
            } catch (logError) {
                console.error('Failed to log error:', logError);
            }
        }
        
        return NextResponse.json(
            { 
                error: 'Failed to send birthday email',
                details: error.message 
            },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
