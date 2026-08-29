import { NextRequest, NextResponse } from "next/server";
import { getAllProductOrders, ensureProductOrdersTable } from "@/lib/productOrders";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const search = searchParams.get("search") || "";
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const orders = await getAllProductOrders({
            status,
            search,
            limit,
            offset
        });

        return NextResponse.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err: any) {
        console.error("GET /api/orders error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
