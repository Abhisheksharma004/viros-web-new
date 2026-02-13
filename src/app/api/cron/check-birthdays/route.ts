import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

// Email configuration
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
 * Read and customize the HTML email template
 */
async function getEmailTemplate(data: any) {
    try {
        const templatePath = path.join(process.cwd(), 'email-templates', 'birthday-wishes.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        
        template = template.replace(/\[Employee Name\]/g, data.name || '[Employee Name]');
        template = template.replace(/\[Time\]/g, data.celebrationTime || '3:00 PM');
        template = template.replace(/\[Department Name \/ Manager Name\]/g, data.department || 'VIROS Team');
        
        return template;
    } catch (error) {
        console.error('Error reading email template:', error);
        throw new Error('Failed to load email template');
    }
}

/**
 * Log email to history
 */
async function logEmailHistory(
    connection: any,
    birthdayId: number,
    email: string,
    name: string,
    status: 'sent' | 'failed',
    messageId?: string,
    error?: string
) {
    try {
        await connection.execute(
            `INSERT INTO birthday_email_history 
            (birthday_id, recipient_email, recipient_name, status, message_id, error_message, celebration_time, department) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [birthdayId, email, name, status, messageId || null, error || null, '3:00 PM', 'VIROS Team']
        );
    } catch (error) {
        console.error('Error logging email history:', error);
    }
}

/**
 * Send birthday email with error handling
 */
async function sendEmail(birthday: any, connection: any) {
    try {
        const transporter = nodemailer.createTransport(emailConfig);
        const htmlContent = await getEmailTemplate({
            name: birthday.name,
            celebrationTime: '3:00 PM',
            department: 'VIROS Team'
        });

        const textContent = `
Happy Birthday ${birthday.name}!

On behalf of the entire VIROS team, we want to wish you a very Happy Birthday! 🎉

Thank you for being a valued part of the VIROS family. Your trust and partnership mean the world to us, and we're honored to celebrate this special day with you.

May this year bring you success, happiness, and all the things you've been wishing for. You deserve nothing but the best!

With warmest wishes,
The VIROS Team
        `.trim();

        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'VIROS'} Team" <${emailConfig.auth.user}>`,
            to: birthday.email,
            subject: `🎉 Happy Birthday ${birthday.name}! 🎂`,
            text: textContent,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        await logEmailHistory(connection, birthday.id, birthday.email, birthday.name, 'sent', info.messageId);
        
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        await logEmailHistory(connection, birthday.id, birthday.email, birthday.name, 'failed', undefined, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Check for today's birthdays and send emails
 * This endpoint should be called daily via cron job
 * 
 * Security: Add authorization header check
 */
export async function POST(request: Request) {
    let connection;
    
    try {
        // Optional: Check for authorization token (recommended for production)
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET || process.env.API_SECRET;
        
        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check email configuration
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            return NextResponse.json(
                { error: 'Email not configured' },
                { status: 500 }
            );
        }

        // Connect to database
        connection = await getConnection();

        // Get today's date (MM-DD format)
        const today = new Date();
        const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Find birthdays for today that are active and have email
        const [birthdays] = await connection.execute(
            `SELECT * FROM birthdays 
            WHERE DATE_FORMAT(date, '%m-%d') = ? 
            AND is_active = 1 
            AND email IS NOT NULL 
            AND email != ''`,
            [monthDay]
        );

        if (!Array.isArray(birthdays) || birthdays.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No birthdays today',
                date: today.toISOString().split('T')[0],
                count: 0,
                results: []
            });
        }

        // Send emails to all birthday people
        const results = [];
        for (const birthday of birthdays as any[]) {
            const result = await sendEmail(birthday, connection);
            results.push({
                name: birthday.name,
                email: birthday.email,
                ...result
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Processed ${birthdays.length} birthday(s)`,
            date: today.toISOString().split('T')[0],
            count: birthdays.length,
            successCount,
            failCount,
            results
        });

    } catch (error: any) {
        console.error('Error in automated birthday check:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process birthdays',
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

/**
 * GET endpoint to check today's birthdays without sending emails
 */
export async function GET(request: Request) {
    let connection;
    
    try {
        // Optional: Check for authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET || process.env.API_SECRET;
        
        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        connection = await getConnection();

        const today = new Date();
        const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const [birthdays] = await connection.execute(
            `SELECT id, name, email, phone, date FROM birthdays 
            WHERE DATE_FORMAT(date, '%m-%d') = ? 
            AND is_active = 1`,
            [monthDay]
        );

        return NextResponse.json({
            date: today.toISOString().split('T')[0],
            count: (birthdays as any[]).length,
            birthdays
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to check birthdays', details: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
