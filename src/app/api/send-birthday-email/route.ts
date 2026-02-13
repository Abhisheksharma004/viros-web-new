import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

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
    try {
        const body = await request.json();
        const { to, name, celebrationTime, department } = body;

        // Validate required fields
        if (!to || !name) {
            return NextResponse.json(
                { error: 'Recipient email and name are required' },
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

        // Create transporter
        const transporter = nodemailer.createTransport(emailConfig);

        // Get customized HTML template
        const htmlContent = await getEmailTemplate({
            name,
            celebrationTime: celebrationTime || '3:00 PM',
            department: department || 'VIROS Team'
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
${department || ''}
        `.trim();

        // Email options
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'VIROS'} Team" <${emailConfig.auth.user}>`,
            to: to,
            subject: `🎉 Happy Birthday ${name}! 🎂`,
            text: textContent,
            html: htmlContent
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Birthday email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Recipient:', to);
        
        return NextResponse.json({
            success: true,
            message: 'Birthday email sent successfully!',
            messageId: info.messageId,
            recipient: to
        });

    } catch (error: any) {
        console.error('❌ Error sending birthday email:', error);
        return NextResponse.json(
            { 
                error: 'Failed to send birthday email',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
