import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, company, message, product, category, productImage, productDescription, productSpecs } = body;

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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
                    <div style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 20px; border-radius: 12px 12px 0 0;">
                        <h2 style="color: white; margin: 0; font-size: 24px;">New Product Inquiry</h2>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 8px;">
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
                        <div style="padding: 15px; background-color: #f9fafb; border-radius: 10px; color: #374151; line-height: 1.6;">
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
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 25px; border-radius: 16px 16px 0 0;">
                                        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0;">Thank You for Your Inquiry!</h2>
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
                                            Thank you for your interest in <strong style="color: #06124f;">${product}</strong>. 
                                            We have received your inquiry and our team will review it shortly.
                                        </p>
                                    </td>
                                </tr>

                                ${productImage || productDescription ? `
                                <!-- Product Details -->
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #06b6d4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);">
                                            <tr>
                                                <td style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 15px;">
                                                    <h3 style="color: white; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; margin: 0;">
                                                        🔍 Product You're Interested In
                                                    </h3>
                                                </td>
                                            </tr>
                                            ${productImage ? `
                                            <tr>
                                                <td align="center" style="background: white; padding: 20px;">
                                                    <img src="${productImage}" alt="${product}" style="max-width: 100%; height: auto; max-height: 280px; display: block; border-radius: 8px;" />
                                                </td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="background: white; padding: 15px 20px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 4px; background: linear-gradient(to bottom, #06124f, #06b6d4);"></td>
                                                            <td>
                                                                <h4 style="color: #06124f; font-weight: 700; font-size: 20px;">${product}</h4>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ${category ? `
                                            <tr>
                                                <td style="padding: 10px 20px;">
                                                    <span style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        📦 ${category}
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${productDescription ? `
                                            <tr>
                                                <td style="border-top: 2px solid #e5e7eb; padding: 15px 20px;">
                                                    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">${productDescription}</p>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${productSpecs && productSpecs.length > 0 ? `
                                            <tr>
                                                <td style="border-top: 2px solid #e5e7eb; padding: 15px 20px;">
                                                    <p style="color: #06124f; font-weight: 600; font-size: 15px; margin: 0 0 10px 0;">📋 Specifications:</p>
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        ${productSpecs.map((spec: string) => `
                                                        <tr>
                                                            <td style="background: #f0f9ff; border: 1px solid #e0f2fe; padding: 10px 15px; border-radius: 6px; color: #06124f; font-size: 13px; font-weight: 500;">
                                                                • ${spec}
                                                            </td>
                                                        </tr>
                                                        `).join('')}
                                                    </table>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                                ` : ''}

                                <!-- Next Steps -->
                                <tr>
                                    <td style="background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 10px; padding: 20px 30px; margin: 20px 30px;">
                                        <p style="color: #06124f; font-weight: 600; font-size: 16px; margin: 0 0 10px 0;">What happens next?</p>
                                        <ul style="color: #6b7280; line-height: 1.8;">
                                            <li>Our product specialist will review your requirements</li>
                                            <li>We'll prepare a customized quote for you</li>
                                            <li>You can expect to hear from us within 24-48 hours</li>
                                        </ul>
                                    </td>
                                </tr>

                                <!-- Additional Info -->
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                                            If you have any urgent questions, please don't hesitate to contact us directly.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Contact -->
                                <tr>
                                    <td align="center" style="background-color: #f9fafb; padding: 25px 30px; border-radius: 10px; margin: 20px;">
                                        <p style="color: #374151; font-weight: 600; margin: 0 0 10px 0;">Need immediate assistance?</p>
                                        <p style="color: #6b7280; font-size: 14px;">
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
