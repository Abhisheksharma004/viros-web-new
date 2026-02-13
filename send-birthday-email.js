/**
 * Birthday Email Sender Utility
 * 
 * This module provides functionality to send birthday wishes emails
 * using the beautiful HTML template.
 * 
 * Setup Instructions:
 * 1. Install nodemailer: npm install nodemailer
 * 2. Configure your email settings in .env.local:
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password
 *    COMPANY_NAME=VIROS
 * 
 * Usage Example:
 *    const { sendBirthdayEmail } = require('./send-birthday-email');
 *    await sendBirthdayEmail({
 *      to: 'employee@company.com',
 *      name: 'John Doe',
 *      celebrationTime: '3:00 PM',
 *      department: 'Engineering Team'
 *    });
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Email configuration - supports both SMTP_* and EMAIL_* environment variables
const emailConfig = {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
    }
};

/**
 * Read and customize the HTML email template
 */
async function getEmailTemplate(data) {
    try {
        const templatePath = path.join(__dirname, 'email-templates', 'birthday-wishes.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        
        // Replace placeholders with actual data
        template = template.replace(/\[Employee Name\]/g, data.name || '[Employee Name]');
        template = template.replace(/\[Time\]/g, data.celebrationTime || '3:00 PM');
        template = template.replace(/\[Department Name \/ Manager Name\]/g, data.department || '[Department Name]');
        template = template.replace(/VIROS/g, process.env.COMPANY_NAME || 'VIROS');
        
        // Replace footer information if provided
        if (data.companyAddress) {
            template = template.replace('[Company Address]', data.companyAddress);
        }
        if (data.contactEmail) {
            template = template.replace('[Contact Email]', data.contactEmail);
        }
        if (data.phoneNumber) {
            template = template.replace('[Phone Number]', data.phoneNumber);
        }
        
        return template;
    } catch (error) {
        console.error('Error reading email template:', error);
        throw new Error('Failed to load email template');
    }
}

/**
 * Send birthday wishes email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Employee name
 * @param {string} options.celebrationTime - Optional celebration time
 * @param {string} options.department - Optional department/manager name
 * @param {string} options.companyAddress - Optional company address
 * @param {string} options.contactEmail - Optional contact email
 * @param {string} options.phoneNumber - Optional phone number
 */
async function sendBirthdayEmail(options) {
    try {
        // Validate required fields
        if (!options.to || !options.name) {
            throw new Error('Recipient email and name are required');
        }

        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            throw new Error('Email credentials not configured. Please set SMTP_USER and SMTP_PASSWORD (or EMAIL_USER and EMAIL_PASSWORD) in .env.local');
        }

        // Create transporter
        const transporter = nodemailer.createTransport(emailConfig);

        // Get customized HTML template
        const htmlContent = await getEmailTemplate(options);

        // Plain text fallback
        const textContent = `
Happy Birthday ${options.name}!

On behalf of the entire ${process.env.COMPANY_NAME || 'VIROS'} team, we want to wish you a very Happy Birthday! 🎉

Thank you for being a valued part of the VIROS family. Your trust and partnership mean the world to us, and we're honored to celebrate this special day with you.

May this year bring you success, happiness, and all the things you've been wishing for. You deserve nothing but the best!

We hope your birthday is as special as you are! May this year bring you continued success, good health, and endless happiness.

With warmest wishes,
The ${process.env.COMPANY_NAME || 'VIROS'} Team
${options.department || ''}
        `.trim();

        // Email options
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'VIROS'} Team" <${emailConfig.auth.user}>`,
            to: options.to,
            subject: `🎉 Happy Birthday ${options.name}! 🎂`,
            text: textContent,
            html: htmlContent
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Birthday email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Recipient:', options.to);
        
        return {
            success: true,
            messageId: info.messageId,
            recipient: options.to
        };

    } catch (error) {
        console.error('❌ Error sending birthday email:', error);
        throw error;
    }
}

/**
 * Send birthday emails to multiple recipients
 */
async function sendBulkBirthdayEmails(recipients) {
    const results = [];
    
    for (const recipient of recipients) {
        try {
            const result = await sendBirthdayEmail(recipient);
            results.push({ ...result, name: recipient.name });
            
            // Add delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({
                success: false,
                name: recipient.name,
                email: recipient.to,
                error: error.message
            });
        }
    }
    
    return results;
}

module.exports = {
    sendBirthdayEmail,
    sendBulkBirthdayEmails
};
