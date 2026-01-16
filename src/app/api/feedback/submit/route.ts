import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, company, designation, rating, message } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert feedback into database
        try {
            const [result] = await pool.execute(
                `INSERT INTO testimonials (name, email, role, company, content, rating, status, display_order) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Pending', 0)`,
                [name, email, designation || null, company || null, message, rating]
            );
            console.log('✅ Feedback saved to database with ID:', (result as any).insertId);
        } catch (dbError) {
            console.error('❌ Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to save feedback to database' },
                { status: 500 }
            );
        }

        // Test mode - skip email sending
        if (process.env.EMAIL_TEST_MODE === 'true') {
            console.log('\n🧪 EMAIL TEST MODE - Feedback received but not sent:\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⭐ Rating:', '⭐'.repeat(rating));
            console.log('👤 Name:', name);
            console.log('📧 Email:', email);            if (company) console.log('🏢 Company:', company);
            if (designation) console.log('💼 Designation:', designation);            console.log('💬 Message:', message);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('✅ In production, emails would be sent to:');
            console.log('   - Company: ' + (process.env.COMPANY_EMAIL || 'Not set'));
            console.log('   - Customer: ' + email);
            console.log('\n💡 To enable email sending, set EMAIL_TEST_MODE=false in .env.local\n');

            return NextResponse.json(
                { message: 'Feedback received successfully! (Test mode - no email sent)' },
                { status: 200 }
            );
        }

        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env.local');
            return NextResponse.json(
                { error: 'Email service not configured. Please contact administrator.' },
                { status: 500 }
            );
        }

        // Create a transporter using SMTP settings from environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Star rating HTML
        const starRatingHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

        // Email to company (you receive this)
        const companyMailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`,
            to: process.env.COMPANY_EMAIL || process.env.SMTP_USER,
            subject: `New Feedback: ${rating}/5 Stars`,
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 25px; border-radius: 16px 16px 0 0;">
                                        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0;">New Customer Feedback</h2>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 30px;">
                                        <!-- Rating -->
                                        <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                                            <div style="font-size: 32px; margin-bottom: 8px;">${starRatingHtml}</div>
                                            <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">${rating} out of 5 Stars</p>
                                        </div>

                                        <h3 style="color: #06124f; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">Customer Information</h3>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <strong style="color: #374151;">Name:</strong>
                                                </td>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                                    ${name}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <strong style="color: #374151;">Email:</strong>
                                                </td>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <a href="mailto:${email}" style="color: #06b6d4; text-decoration: none;">${email}</a>
                                                </td>
                                            </tr>
                                            ${company ? `
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <strong style="color: #374151;">Company:</strong>
                                                </td>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                                    ${company}
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${designation ? `
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <strong style="color: #374151;">Designation:</strong>
                                                </td>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                                    ${designation}
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>

                                        <h3 style="color: #06124f; margin: 25px 0 15px 0; font-size: 18px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">Feedback</h3>
                                        <div style="padding: 15px; background-color: #f9fafb; border-radius: 10px; color: #374151; line-height: 1.6;">
                                            ${message.replace(/\n/g, '<br>')}
                                        </div>

                                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                                            <p style="margin: 0;">This feedback was submitted from your website on ${new Date().toLocaleString()}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            `,
        };

        // Email to customer (they receive this)
        const customerMailOptions = {
            from: `"VIROS" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Thank you for your feedback!`,
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 25px; border-radius: 16px 16px 0 0;">
                                        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0;">Thank You for Your Feedback!</h2>
                                    </td>
                                </tr>
                                
                                <!-- Greeting -->
                                <tr>
                                    <td style="padding: 25px 30px 10px 30px;">
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">Hi ${name},</p>
                                    </td>
                                </tr>
                                
                                <!-- Message -->
                                <tr>
                                    <td style="padding: 10px 30px;">
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                                            Thank you for taking the time to share your feedback with us! Your ${rating}-star rating and comments help us improve our services and better serve you.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Rating Display -->
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                                            <div style="font-size: 28px; margin-bottom: 8px;">${starRatingHtml}</div>
                                            <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: bold;">Your Rating</p>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Appreciation -->
                                <tr>
                                    <td style="background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 10px; padding: 20px 30px; margin: 20px 30px;">
                                        <p style="color: #06124f; font-weight: 600; font-size: 16px; margin: 0 0 10px 0;">Your feedback matters!</p>
                                        <p style="color: #6b7280; line-height: 1.8; margin: 0;">
                                            We carefully review every piece of feedback we receive. Your insights help us deliver better products and services to all our customers.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Additional Info -->
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                                            If you have any questions or need further assistance, please don't hesitate to reach out to us.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Contact -->
                                <tr>
                                    <td align="center" style="background-color: #f9fafb; padding: 25px 30px; border-radius: 10px; margin: 20px;">
                                        <p style="color: #374151; font-weight: 600; margin: 0 0 10px 0;">Questions or concerns?</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                            Email: <a href="mailto:${process.env.COMPANY_EMAIL || process.env.SMTP_USER}" style="color: #06b6d4; text-decoration: none;">${process.env.COMPANY_EMAIL || process.env.SMTP_USER}</a>
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="border-top: 2px solid #e5e7eb; padding: 25px 30px; border-radius: 0 0 16px 16px;">
                                        <p style="color: #06124f; font-weight: bold; font-size: 18px; margin: 0 0 5px 0;">VIROS</p>
                                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Your trusted partner in barcode solutions</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            `,
        };

        // Send both emails
        console.log('Attempting to send feedback emails...');
        
        try {
            await transporter.sendMail(companyMailOptions);
            console.log('Company feedback notification sent successfully');
        } catch (emailError: any) {
            console.error('Error sending company email:', emailError);
            throw new Error(`Failed to send company notification email: ${emailError.message}`);
        }

        try {
            await transporter.sendMail(customerMailOptions);
            console.log('Customer feedback confirmation sent successfully');
        } catch (emailError: any) {
            console.error('Error sending customer email:', emailError);
            console.log('Company email sent, but customer email failed');
        }

        return NextResponse.json(
            { message: 'Feedback submitted successfully. Thank you!' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in feedback API:', error);
        const errorMessage = error.message || 'Failed to submit feedback. Please try again later.';
        
        let userMessage = errorMessage;
        if (error.code === 'EAUTH') {
            userMessage = 'Email authentication failed. Please check your email credentials.';
        } else if (error.code === 'ESOCKET') {
            userMessage = 'Unable to connect to email server. Please check your internet connection.';
        } else if (error.code === 'ETIMEDOUT') {
            userMessage = 'Email server connection timed out. Please try again.';
        }

        return NextResponse.json(
            { 
                error: userMessage,
                technicalDetails: process.env.NODE_ENV === 'development' ? {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                } : undefined
            },
            { status: 500 }
        );
    }
}
