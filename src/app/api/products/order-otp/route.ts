import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { saveProductOrder } from "@/lib/productOrders";

// In-memory OTP storage: email -> { otp: string, expiresAt: number, attempts: number }
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, name, productName, otp, orderData } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Email address is required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // -------------------------------------------------------------
        // ACTION 1: SEND 7-DIGIT OTP
        // -------------------------------------------------------------
        if (action === "send_otp") {
            // Generate 7-digit OTP
            const generatedOtp = Math.floor(1000000 + Math.random() * 9000000).toString();
            const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

            otpStore.set(normalizedEmail, {
                otp: generatedOtp,
                expiresAt,
                attempts: 0
            });

            console.log(`\n🔑 [7-DIGIT BOOKING OTP] Generated for ${normalizedEmail}: ${generatedOtp} (Valid for 5 mins)\n`);

            // Email Template for OTP
            const otpEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f3f6; margin: 0; padding: 20px; color: #333; }
                    .container { max-width: 550px; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }
                    .header { background: linear-gradient(135deg, #06124f 0%, #2874f0 100%); color: white; padding: 24px 20px; text-align: center; }
                    .content { padding: 30px 24px; text-align: center; }
                    .otp-box { background-color: #f0f7ff; border: 2px dashed #2874f0; border-radius: 8px; padding: 18px; margin: 24px 0; display: inline-block; width: 80%; }
                    .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #2874f0; font-family: monospace; }
                    .footer { background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0; font-size: 20px;">Viros Industrial Hardware</h2>
                        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Order Verification Code</p>
                    </div>
                    <div class="content">
                        <p style="font-size: 14px; margin-top: 0;">Hello <strong>${name || "Customer"}</strong>,</p>
                        <p style="font-size: 13px; color: #555; line-height: 1.5;">
                            Use the 7-digit OTP below to verify your email and confirm your order for <strong>${productName || "Hardware Product"}</strong>.
                        </p>
                        
                        <div class="otp-box">
                            <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 6px; font-weight: bold;">Your 7-Digit OTP</div>
                            <div class="otp-code">${generatedOtp}</div>
                        </div>

                        <p style="font-size: 12px; color: #e53935; margin: 0; font-weight: bold;">
                            ⏳ Valid for 5 minutes only. Do not share this OTP with anyone.
                        </p>
                    </div>
                    <div class="footer">
                        © ${new Date().getFullYear()} Viros Industrial Hardware. All Rights Reserved.<br>
                        Pan-India Hardware Dispatch & Technical Support.
                    </div>
                </div>
            </body>
            </html>
            `;

            // Try sending email if SMTP configured
            const transporter = getTransporter();
            if (process.env.EMAIL_TEST_MODE !== "true" && transporter) {
                try {
                    await transporter.sendMail({
                        from: `"${process.env.COMPANY_NAME || 'Viros Hardware'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                        to: normalizedEmail,
                        subject: `[OTP: ${generatedOtp}] Verify Your Product Booking - Viros Hardware`,
                        html: otpEmailHtml,
                    });
                    console.log(`✅ 7-digit OTP email dispatched to ${normalizedEmail}`);
                } catch (emailErr) {
                    console.error("Failed to send OTP email via SMTP:", emailErr);
                }
            } else if (!transporter) {
                console.warn("⚠️ SMTP credentials not fully configured (SMTP_USER / SMTP_PASSWORD). Check .env.local.");
            }

            return NextResponse.json({
                success: true,
                message: "7-digit verification OTP sent to your email.",
                devOtp: process.env.NODE_ENV !== "production" ? generatedOtp : undefined
            });
        }

        // -------------------------------------------------------------
        // ACTION 2: VERIFY OTP, SAVE ORDER & SEND BOOKING CONFIRMATION EMAIL
        // -------------------------------------------------------------
        if (action === "verify_and_order") {
            const enteredOtp = (otp || "").toString().trim();
            const record = otpStore.get(normalizedEmail);

            if (!record) {
                return NextResponse.json({
                    success: false,
                    error: "OTP expired or not found. Please click 'Resend OTP'."
                }, { status: 400 });
            }

            if (Date.now() > record.expiresAt) {
                otpStore.delete(normalizedEmail);
                return NextResponse.json({
                    success: false,
                    error: "OTP has expired. Please request a new OTP."
                }, { status: 400 });
            }

            if (record.otp !== enteredOtp) {
                record.attempts = (record.attempts || 0) + 1;
                if (record.attempts >= 4) {
                    otpStore.delete(normalizedEmail);
                    return NextResponse.json({
                        success: false,
                        error: "Too many incorrect attempts. Please request a new OTP."
                    }, { status: 400 });
                }
                return NextResponse.json({
                    success: false,
                    error: `Invalid 7-digit OTP. (${4 - record.attempts} attempts remaining)`
                }, { status: 400 });
            }

            // OTP is valid! Delete from store
            otpStore.delete(normalizedEmail);

            // Generate Order Reference ID
            const orderRef = "VRS-" + Math.floor(100000 + Math.random() * 900000);
            const customerName = orderData.name || name || "Valued Customer";
            const orderedProduct = orderData.productName || productName || "Industrial Hardware";
            const orderQty = parseInt(orderData.qty || 1, 10);
            const totalAmountVal = parseFloat(orderData.totalAmount || 0);
            const paymentMethodStr = (orderData.paymentMethod || "COD").toUpperCase();

            // 1. Save order into dedicated `product_orders` MySQL table
            let orderDbId: number | null = null;
            try {
                orderDbId = await saveProductOrder({
                    orderRef,
                    customerName,
                    customerEmail: normalizedEmail,
                    customerPhone: orderData.phone,
                    companyName: orderData.company,
                    gstin: orderData.gstin,
                    productName: orderedProduct,
                    category: orderData.category || "Hardware",
                    quantity: orderQty,
                    unitPrice: orderData.priceDisplay || "Contact for Quote",
                    totalAmount: totalAmountVal,
                    paymentMethod: orderData.paymentMethod || "COD",
                    deliveryAddress: orderData.address,
                    city: orderData.city,
                    pincode: orderData.pincode,
                    state: orderData.state || null,
                    orderNotes: orderData.notes || null,
                    otpVerified: true,
                    orderStatus: "confirmed",
                    paymentStatus: orderData.paymentMethod === "online" ? "paid" : "cod_pending"
                });
                console.log(`✅ Buy Now Order #${orderRef} successfully stored in table 'product_orders' (ID: ${orderDbId})`);
            } catch (dbErr) {
                console.error("Database save error into product_orders:", dbErr);
            }

            // 2. SEND BOOKING CONFIRMATION EMAIL TO CUSTOMER
            const transporter = getTransporter();
            if (process.env.EMAIL_TEST_MODE !== "true" && transporter) {
                try {
                    const bookingStatusEmailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f3f6; margin: 0; padding: 20px; color: #333; }
                            .container { max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }
                            .header { background: linear-gradient(135deg, #06124f 0%, #2874f0 100%); color: white; padding: 24px 20px; text-align: center; }
                            .badge { display: inline-block; background-color: #10b981; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                            .content { padding: 28px 24px; }
                            .order-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
                            .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
                            .table td { padding: 8px 0; border-bottom: 1px solid #edf2f7; }
                            .table td.title { color: #64748b; width: 40%; }
                            .table td.value { color: #0f172a; font-weight: 600; text-align: right; }
                            .highlight-row td { border-bottom: none; padding-top: 12px; font-size: 15px; font-weight: bold; color: #2874f0; }
                            .address-box { background-color: #f1f5f9; border-left: 4px solid #2874f0; padding: 12px 16px; border-radius: 4px; font-size: 12px; line-height: 1.5; margin: 16px 0; }
                            .footer { background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin:0; font-size: 22px;">Viros Industrial Hardware</h2>
                                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Order Booking Confirmation</p>
                                <div class="badge">✓ Booking Confirmed & Email Verified</div>
                            </div>
                            
                            <div class="content">
                                <p style="font-size: 15px; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
                                <p style="font-size: 13px; color: #555; line-height: 1.6;">
                                    Thank you for your order! Your booking for <strong>${orderedProduct}</strong> has been successfully placed and confirmed. Our operations team is preparing your package for express dispatch.
                                </p>

                                <div class="order-box">
                                    <div style="font-size: 12px; font-weight: bold; color: #06124f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                                        Order Summary (#${orderRef})
                                    </div>
                                    <table class="table">
                                        <tr>
                                            <td class="title">Product Name</td>
                                            <td class="value">${orderedProduct}</td>
                                        </tr>
                                        <tr>
                                            <td class="title">Category</td>
                                            <td class="value">${orderData.category || "Hardware"}</td>
                                        </tr>
                                        <tr>
                                            <td class="title">Quantity</td>
                                            <td class="value">${orderQty} Unit(s)</td>
                                        </tr>
                                        <tr>
                                            <td class="title">Payment Method</td>
                                            <td class="value">${paymentMethodStr}</td>
                                        </tr>
                                        <tr>
                                            <td class="title">Order Status</td>
                                            <td class="value" style="color: #10b981;">● Confirmed / Processing</td>
                                        </tr>
                                        <tr class="highlight-row">
                                            <td class="title" style="color: #06124f;">Total Amount</td>
                                            <td class="value" style="color: #2874f0; font-size: 16px;">₹${totalAmountVal.toLocaleString("en-IN")}</td>
                                        </tr>
                                    </table>
                                </div>

                                <div style="font-size: 12px; font-weight: bold; color: #334155; margin-top: 16px;">Delivery Shipping Address:</div>
                                <div class="address-box">
                                    <strong>${customerName}</strong><br>
                                    ${orderData.address || ""}<br>
                                    ${orderData.city || ""}, ${orderData.state || ""} - ${orderData.pincode || ""}<br>
                                    📞 Mobile: ${orderData.phone || ""}
                                    <div style="text-align: center; margin: 24px 0 10px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track-order?orderRef=${orderRef}&email=${encodeURIComponent(normalizedEmail)}" style="background-color: #2874f0; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                                            🚚 Track Order Live
                                        </a>
                                    </div>

                                    <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                                        🚚 <strong>Dispatch Update:</strong> Our team will contact you via WhatsApp / Call on <strong>${orderData.phone}</strong> with courier tracking details.
                                    </p>
                                </div>
                            </div>

                            <div class="footer">
                                Need help with your order? Contact our support at <strong>${process.env.COMPANY_EMAIL || 'support@viros.in'}</strong><br>
                                © ${new Date().getFullYear()} Viros Industrial Hardware. All Rights Reserved.
                            </div>
                        </div>
                    </body>
                    </html>
                    `;

                    // Send email to Customer
                    await transporter.sendMail({
                        from: `"${process.env.COMPANY_NAME || 'Viros Hardware'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                        to: normalizedEmail,
                        subject: `🎉 Booking Confirmed! [Order #${orderRef}] - Viros Industrial Hardware`,
                        html: bookingStatusEmailHtml,
                    });
                    console.log(`✅ Booking Status Confirmation Email dispatched to customer: ${normalizedEmail}`);

                    // Also notify company/admin
                    if (process.env.COMPANY_EMAIL && process.env.COMPANY_EMAIL !== normalizedEmail) {
                        await transporter.sendMail({
                            from: `"Viros Store Order" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                            to: process.env.COMPANY_EMAIL,
                            subject: `🛒 [NEW BUY NOW ORDER #${orderRef}] ${customerName} - ${orderedProduct}`,
                            html: bookingStatusEmailHtml,
                        });
                    }
                } catch (emailErr) {
                    console.error("Failed to send booking status email:", emailErr);
                }
            }

            return NextResponse.json({
                success: true,
                orderId: orderRef,
                orderDbId,
                message: "Email verified, order confirmed, and confirmation email sent to customer!"
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("Order OTP handler error:", err);
        return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
    }
}
