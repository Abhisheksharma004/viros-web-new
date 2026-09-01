import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureProductOrdersTable } from "@/lib/productOrders";
import nodemailer from "nodemailer";

const getTransporter = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return null;
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureProductOrdersTable();
        const { id } = await params;

        const [rows]: any = await pool.query(
            `SELECT * FROM product_orders WHERE id = ?`,
            [id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order: rows[0] });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureProductOrdersTable();
        const { id } = await params;
        const body = await request.json();
        const {
            order_status,
            payment_status,
            order_notes,
            tracking_number,
            tracking_link,
            courier_name,
            utr_number,
            notify_customer
        } = body;

        // Fetch existing order before updating for email notification
        const [existingRows]: any = await pool.query(
            `SELECT * FROM product_orders WHERE id = ?`,
            [id]
        );

        if (!existingRows || existingRows.length === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const existingOrder = existingRows[0];

        const [result]: any = await pool.query(
            `UPDATE product_orders 
             SET order_status = COALESCE(?, order_status),
                 payment_status = COALESCE(?, payment_status),
                 order_notes = COALESCE(?, order_notes),
                 tracking_number = COALESCE(?, tracking_number),
                 tracking_link = COALESCE(?, tracking_link),
                 courier_name = COALESCE(?, courier_name),
                 utr_number = COALESCE(?, utr_number)
             WHERE id = ?`,
            [
                order_status,
                payment_status,
                order_notes,
                tracking_number,
                tracking_link,
                courier_name,
                utr_number,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        // Send Dispatch Email if status changed to dispatched or if notify_customer is requested
        const isDispatched = order_status === "dispatched" || (order_status === undefined && existingOrder.order_status === "dispatched");
        const effectiveTrackingNum = tracking_number !== undefined ? tracking_number : existingOrder.tracking_number;
        const effectiveCourier = courier_name !== undefined ? courier_name : existingOrder.courier_name;
        const effectiveTrackingLink = tracking_link !== undefined ? tracking_link : existingOrder.tracking_link;

        if (notify_customer !== false && isDispatched && existingOrder.customer_email) {
            try {
                const transporter = getTransporter();
                if (transporter && process.env.EMAIL_TEST_MODE !== "true") {
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
                    const virosTrackUrl = `${siteUrl}/track-order?orderRef=${existingOrder.order_ref}`;

                    const mailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f3f6; margin: 0; padding: 20px; color: #333; }
                            .container { max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }
                            .header { background: linear-gradient(135deg, #06124f 0%, #2874f0 100%); color: white; padding: 24px 20px; text-align: center; }
                            .badge { display: inline-block; background-color: #f59e0b; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                            .content { padding: 28px 24px; }
                            .tracking-card { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center; }
                            .tracking-number { font-size: 20px; font-family: monospace; font-weight: 900; color: #15803d; letter-spacing: 1px; margin: 8px 0; }
                            .btn { display: inline-block; background-color: #2874f0; color: #ffffff !important; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px; text-transform: uppercase; margin: 6px 4px; }
                            .btn-courier { background-color: #10b981; }
                            .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
                            .table td { padding: 8px 0; border-bottom: 1px solid #edf2f7; }
                            .footer { background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin:0; font-size: 22px;">VIROS Industrial Solutions</h2>
                                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Consignment Dispatched & In Transit</p>
                                <div class="badge">🚚 Dispatched via Express Courier</div>
                            </div>
                            
                            <div class="content">
                                <p style="font-size: 15px; margin-top: 0;">Dear <strong>${existingOrder.customer_name}</strong>,</p>
                                <p style="font-size: 13px; color: #555; line-height: 1.6;">
                                    Great news! Your hardware booking for <strong>${existingOrder.product_name}</strong> (Order Ref: <strong>#${existingOrder.order_ref}</strong>) has been dispatched from our fulfillment center and is on its way to you.
                                </p>
                                
                                <div class="tracking-card">
                                    <span style="font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Courier Consignment Details</span>
                                    <div style="font-size: 14px; font-weight: bold; color: #1f2937; margin-top: 4px;">
                                        Courier: <strong>${effectiveCourier || "Express Logistics Partner"}</strong>
                                    </div>
                                    ${effectiveTrackingNum ? `
                                    <div class="tracking-number">${effectiveTrackingNum}</div>
                                    <p style="font-size: 11px; color: #6b7280; margin: 0 0 12px 0;">Use this AWB/Tracking number to monitor live transit location.</p>
                                    ` : ''}
                                    
                                    <div style="margin-top: 12px;">
                                        ${effectiveTrackingLink ? `
                                        <a href="${effectiveTrackingLink}" target="_blank" class="btn btn-courier">Track on Courier Portal</a>
                                        ` : ''}
                                        <a href="${virosTrackUrl}" target="_blank" class="btn">Track Order Live on Viros</a>
                                    </div>
                                </div>
                                
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 16px;">
                                    <strong style="font-size: 12px; color: #0f172a; text-transform: uppercase;">Delivery Address:</strong>
                                    <p style="font-size: 12px; color: #475569; margin: 4px 0 0 0; line-height: 1.4;">
                                        ${existingOrder.delivery_address}, ${existingOrder.city} - ${existingOrder.pincode}
                                    </p>
                                </div>
                                
                                <p style="font-size: 12px; color: #64748b; margin-top: 20px; line-height: 1.5;">
                                    For any delivery or technical support queries, contact us at <strong>+91 8377929141</strong> or reply directly to this email.
                                </p>
                            </div>
                            
                            <div class="footer">
                                <p style="margin: 0;">© ${new Date().getFullYear()} VIROS. All rights reserved.</p>
                                <p style="margin: 4px 0 0 0;">Leading Barcode, RFID & Industrial AIDC Solutions Provider</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    `;

                    await transporter.sendMail({
                        from: `"VIROS Dispatch Team" <${process.env.SMTP_USER}>`,
                        to: existingOrder.customer_email,
                        subject: `🚚 [DISPATCHED] Your Order #${existingOrder.order_ref} is on the way! (${existingOrder.product_name})`,
                        html: mailHtml
                    });
                    console.log(`✅ Dispatch notification email sent to ${existingOrder.customer_email} for Order #${existingOrder.order_ref}`);
                }
            } catch (mailErr) {
                console.error("Failed to send customer dispatch email:", mailErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Order status & dispatch details updated successfully!"
        });
    } catch (err: any) {
        console.error("PUT /api/orders/[id] error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureProductOrdersTable();
        const { id } = await params;

        const [result]: any = await pool.query(
            `DELETE FROM product_orders WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
