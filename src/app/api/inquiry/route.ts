import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveContactSubmission } from '@/lib/contactSubmissions';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            company,
            message,
            product,
            category,
            productImage,
            productDescription,
            productSpecs,
            source,
            subject
        } = body;

        // Validate required fields (name, email, phone, message)
        if (!name || !email || !phone || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: Name, Email, Phone, and Message are required' },
                { status: 400 }
            );
        }

        const effectiveSubject = subject || (product ? `Product Inquiry: ${product}` : 'Website Inquiry');
        const effectiveProduct = product || null;
        const effectiveCategory = category || null;

        // 1. Save inquiry into MySQL contact_submissions table
        let submissionId: number | null = null;
        try {
            submissionId = await saveContactSubmission({
                name,
                email,
                phone,
                company: company || null,
                subject: effectiveSubject,
                product: effectiveProduct,
                category: effectiveCategory,
                message,
                source: source || (effectiveProduct ? 'product_inquiry_popup' : 'website_popup'),
            });
            console.log(`✅ Inquiry stored in database with ID: ${submissionId}`);
        } catch (dbError) {
            console.error('Failed to save inquiry to database:', dbError);
        }

        // Test mode - skip email sending
        if (process.env.EMAIL_TEST_MODE === 'true') {
            console.log('\n🧪 EMAIL TEST MODE - Inquiry received but not sent:\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📦 Subject / Product:', effectiveSubject);
            console.log('📁 Category:', effectiveCategory || 'N/A');
            console.log('👤 Name:', name);
            console.log('📧 Email:', email);
            console.log('📱 Phone:', phone);
            if (company) console.log('🏢 Company:', company);
            console.log('💬 Message:', message);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return NextResponse.json(
                { 
                    success: true,
                    message: 'Inquiry received and saved successfully!',
                    id: submissionId 
                },
                { status: 200 }
            );
        }

        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.warn('SMTP credentials not configured. Inquiry saved in DB, skipping email.');
            return NextResponse.json(
                { 
                    success: true,
                    message: 'Inquiry submitted and saved successfully.',
                    id: submissionId 
                },
                { status: 200 }
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

        // Email to company (you receive this)
        const companyMailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`,
            to: process.env.COMPANY_EMAIL || process.env.SMTP_USER,
            subject: `[Website Inquiry] ${effectiveSubject} - ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
                    <div style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 20px; border-radius: 12px 12px 0 0;">
                        <h2 style="color: white; margin: 0; font-size: 24px;">New Website Inquiry</h2>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ${effectiveProduct ? `
                        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(6, 18, 79, 0.1)); border-left: 4px solid #06b6d4; border-radius: 8px;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">PRODUCT INQUIRY</p>
                            <p style="margin: 5px 0 0 0; color: #06124f; font-size: 18px; font-weight: bold;">${effectiveProduct}</p>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Category: ${effectiveCategory || 'N/A'}</p>
                        </div>
                        ` : `
                        <div style="margin-bottom: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px;">
                            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">SUBJECT / SOURCE</p>
                            <p style="margin: 5px 0 0 0; color: #06124f; font-size: 16px; font-weight: bold;">${effectiveSubject}</p>
                        </div>
                        `}

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
            subject: effectiveProduct ? `Thank you for your inquiry about ${effectiveProduct}` : `Thank you for contacting VIROS`,
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(to right, #06124f, #06b6d4); padding: 25px; border-radius: 16px 16px 0 0;">
                                        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0;">Thank You for Reaching Out!</h2>
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
                                            ${effectiveProduct
                                                ? `Thank you for your interest in <strong style="color: #06124f;">${effectiveProduct}</strong>. We have received your inquiry and our team will review it shortly.`
                                                : `Thank you for getting in touch with VIROS. We have received your inquiry and our technical solutions team will connect with you shortly.`}
                                        </p>
                                    </td>
                                </tr>

                                ${effectiveProduct && (productImage || productDescription) ? `
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
                                                    <img src="${productImage}" alt="${effectiveProduct}" style="max-width: 100%; height: auto; max-height: 280px; display: block; border-radius: 8px;" />
                                                </td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="background: white; padding: 15px 20px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 4px; background: linear-gradient(to bottom, #06124f, #06b6d4);"></td>
                                                            <td>
                                                                <h4 style="color: #06124f; font-weight: 700; font-size: 20px;">${effectiveProduct}</h4>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            ${effectiveCategory ? `
                                            <tr>
                                                <td style="padding: 10px 20px;">
                                                    <span style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        📦 ${effectiveCategory}
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
                                            <li>Our specialist team will review your requirements</li>
                                            <li>We'll prepare a customized solution or quote for you</li>
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
                                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Your trusted partner in barcode & AIDC solutions</p>
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
        }

        try {
            await transporter.sendMail(customerMailOptions);
            console.log('Customer email sent successfully');
        } catch (emailError: any) {
            console.error('Error sending customer email:', emailError);
        }

        return NextResponse.json(
            { 
                success: true,
                message: 'Inquiry submitted successfully. Check your email for confirmation.',
                id: submissionId
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in inquiry API:', error);
        const errorMessage = error.message || 'Failed to send inquiry. Please try again later.';
        
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
                success: false,
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
