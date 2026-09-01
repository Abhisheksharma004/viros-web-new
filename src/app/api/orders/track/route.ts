import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureProductOrdersTable } from "@/lib/productOrders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        await ensureProductOrdersTable();

        const { searchParams } = new URL(request.url);
        let orderRef = searchParams.get("orderRef")?.trim().toUpperCase() || "";
        const email = searchParams.get("email")?.trim().toLowerCase();

        if (!orderRef) {
            return NextResponse.json({
                success: false,
                error: "Please enter your Order Reference Number (e.g. VRS-123456)"
            }, { 
                status: 400,
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
            });
        }

        // Clean common user inputs (e.g. user might type with or without '#' or with or without 'VRS-')
        const cleanRef = orderRef.replace(/^#/, "").trim();
        const altRef = cleanRef.startsWith("VRS-") ? cleanRef : `VRS-${cleanRef}`;
        const noHyphenRef = cleanRef.replace("VRS-", "VRS");

        let query = `SELECT * FROM product_orders WHERE (UPPER(order_ref) = ? OR UPPER(order_ref) = ? OR UPPER(REPLACE(order_ref, '-', '')) = ?)`;
        const params: any[] = [cleanRef, altRef, noHyphenRef];

        if (email) {
            query += ` AND LOWER(customer_email) = ?`;
            params.push(email);
        }

        query += ` ORDER BY id DESC LIMIT 1`;

        const [rows]: any = await pool.query(query, params);

        if (!rows || rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: `No order found with Reference ID "${orderRef}". Please check your order confirmation email and try again.`
            }, { 
                status: 404,
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
            });
        }

        const order = rows[0];

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderRef: order.order_ref,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerPhone: order.customer_phone,
                companyName: order.company_name,
                gstin: order.gstin,
                productName: order.product_name,
                category: order.category,
                quantity: order.quantity,
                unitPrice: order.unit_price,
                totalAmount: Number(order.total_amount) || 0,
                paymentMethod: order.payment_method,
                utrNumber: order.utr_number,
                deliveryAddress: order.delivery_address,
                city: order.city,
                pincode: order.pincode,
                state: order.state,
                orderNotes: order.order_notes,
                trackingNumber: order.tracking_number,
                trackingLink: order.tracking_link,
                courierName: order.courier_name,
                otpVerified: Boolean(order.otp_verified),
                orderStatus: order.order_status || "confirmed",
                paymentStatus: order.payment_status || "pending_verification",
                createdAt: order.created_at,
                updatedAt: order.updated_at
            }
        }, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
            }
        });
    } catch (err: any) {
        console.error("Order tracking API error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "Failed to retrieve order status"
        }, { 
            status: 500,
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
        });
    }
}
