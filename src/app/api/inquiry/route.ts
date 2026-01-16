import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, company, message, product, category, productImage, productDescription } = body;

        // Validate required fields
        if (!name || !email || !phone || !message || !product) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Test mode - skip email sending
        if (process.env.EMAIL_TEST_MODE === 'true') {
            console.log('\n🧪 EMAIL TEST MODE - Inquiry received but not sent:\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📦 Product:', product);
            console.log('📁 Category:', category || 'N/A');
            console.log('👤 Name:', name);
            console.log('📧 Email:', email);
            console.log('📱 Phone:', phone);
            if (company) console.log('🏢 Company:', company);
            console.log('💬 Message:', message);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('✅ In production, emails would be sent to:');
            console.log('   - Company: ' + (process.env.COMPANY_EMAIL || 'Not set'));
            console.log('   - Customer: ' + email);
            console.log('\n💡 To enable email sending, set EMAIL_TEST_MODE=false in .env.local\n');

            return NextResponse.json(
                { message: 'Inquiry received successfully! (Test mode - no email sent)' },
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

        console.log('SMTP Configuration:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            // Don't log password
        });

        // Email to company (you receive this)
        const companyMailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`,
            to: process.env.COMPANY_EMAIL || process.env.SMTP_USER,
            subject: `New Product Inquiry: ${product}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0; font-size: 24px;">New Product Inquiry</h2>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 4px;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">PRODUCT INQUIRY</p>
                            <p style="margin: 5px 0 0 0; color: #06124f; font-size: 18px; font-weight: bold;">${product}</p>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Category: ${category || 'N/A'}</p>
                        </div>

                        <h3 style="color: #06124f; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">Customer Information</h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
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
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                    <strong style="color: #374151;">Phone:</strong>
                                </td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                    <a href="tel:${phone}" style="color: #06b6d4; text-decoration: none;">${phone}</a>
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
                        </table>

                        <h3 style="color: #06124f; margin: 25px 0 15px 0; font-size: 18px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">Message</h3>
                        <div style="padding: 15px; background-color: #f9fafb; border-radius: 6px; color: #374151; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>

                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                            <p style="margin: 0;">This inquiry was submitted from your website on ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `,
        };

        // Email to customer (they receive this)
        const customerMailOptions = {
            from: `"VIROS" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Thank you for your inquiry about ${product}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0; font-size: 24px;">Thank You for Your Inquiry!</h2>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Thank you for your interest in <strong style="color: #06124f;">${product}</strong>. 
                            We have received your inquiry and our team will review it shortly.
                        </p>

                        ${productImage || productDescription ? `
                        <div style="margin: 25px 0; padding: 0; background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border-radius: 12px; border: 2px solid #06b6d4; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15); overflow: hidden;">
                            <!-- Header -->
                            <div style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 15px 20px;">
                                <h3 style="color: white; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                                    🔍 Product You're Interested In
                                </h3>
                            </div>
                            
                            <!-- Content -->
                            <div style="padding: 25px;">
                                ${productImage ? `
                                <!-- Product Image -->
                                <div style="text-align: center; margin-bottom: 20px; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    <img src="${productImage}" alt="${product}" style="max-width: 100%; height: auto; max-height: 280px; border-radius: 8px; display: inline-block;" />
                                </div>
                                ` : ''}
                                
                                <!-- Product Info -->
                                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                        <div style="width: 4px; height: 24px; background: linear-gradient(to bottom, #06124f, #06b6d4); border-radius: 2px; margin-right: 12px;"></div>
                                        <h4 style="margin: 0; color: #06124f; font-weight: 700; font-size: 20px; line-height: 1.2;">${product}</h4>
                                    </div>
                                    
                                    ${category ? `
                                    <div style="display: inline-block; margin-bottom: 15px; padding: 6px 14px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 20px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
                                        <p style="margin: 0; color: white; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                            📦 ${category}
                                        </p>
                                    </div>
                                    ` : ''}
                                    
                                    ${productDescription ? `
                                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7; text-align: justify;">
                                            ${productDescription}
                                        </p>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <div style="margin: 25px 0; padding: 20px; background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 4px;">
                            <p style="margin: 0; color: #06124f; font-weight: 600; font-size: 16px;">What happens next?</p>
                            <ul style="color: #6b7280; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                                <li>Our product specialist will review your requirements</li>
                                <li>We'll prepare a customized quote for you</li>
                                <li>You can expect to hear from us within 24-48 hours</li>
                            </ul>
                        </div>

                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            If you have any urgent questions, please don't hesitate to contact us directly.
                        </p>

                        <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Need immediate assistance?</p>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                Email: <a href="mailto:${process.env.COMPANY_EMAIL || process.env.SMTP_USER}" style="color: #06b6d4; text-decoration: none;">${process.env.COMPANY_EMAIL || process.env.SMTP_USER}</a>
                            </p>
                        </div>

                        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
                            <p style="color: #06124f; font-weight: bold; font-size: 18px; margin: 0 0 5px 0;">VIROS</p>
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">Your trusted partner in barcode solutions</p>
                        </div>
                    </div>
                </div>
            `,
        };

        // Send both emails
        console.log('Attempting to send emails...');
        
        try {
            await transporter.sendMail(companyMailOptions);
            console.log('Company email sent successfully');
        } catch (emailError: any) {
            console.error('Error sending company email:', emailError);
            console.error('SMTP Error Details:', {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response,
                responseCode: emailError.responseCode
            });
            throw new Error(`Failed to send company notification email: ${emailError.message}`);
        }

        try {
            await transporter.sendMail(customerMailOptions);
            console.log('Customer email sent successfully');
        } catch (emailError: any) {
            console.error('Error sending customer email:', emailError);
            // Continue even if customer email fails
            console.log('Company email sent, but customer email failed');
        }

        return NextResponse.json(
            { message: 'Inquiry submitted successfully. Check your email for confirmation.' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in inquiry API:', error);
        const errorMessage = error.message || 'Failed to send inquiry. Please try again later.';
        
        // Provide helpful error messages
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
