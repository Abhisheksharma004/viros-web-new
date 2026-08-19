import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureContactSubmissionsTable } from "@/lib/contactSubmissions";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export type LeadItem = {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string | null;
    subject: string;
    product: string | null;
    category: string | null;
    message: string;
    source: string;
    status: "new" | "contacted" | "in_progress" | "closed";
    created_at: string;
    updated_at: string;
};

export async function GET(request: NextRequest) {
    try {
        await ensureContactSubmissionsTable();

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get("q")?.trim() || "";
        const sourceFilter = searchParams.get("source")?.trim() || "all";
        const statusFilter = searchParams.get("status")?.trim() || "all";

        let whereClauses: string[] = [];
        let queryParams: any[] = [];

        if (sourceFilter && sourceFilter !== "all") {
            whereClauses.push("source = ?");
            queryParams.push(sourceFilter);
        }

        if (statusFilter && statusFilter !== "all") {
            whereClauses.push("status = ?");
            queryParams.push(statusFilter);
        }

        if (searchQuery) {
            whereClauses.push(
                "(name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ? OR subject LIKE ? OR product LIKE ? OR message LIKE ?)"
            );
            const wildcard = `%${searchQuery}%`;
            queryParams.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Fetch leads
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email, phone, company, subject, product, category, message, source, status, created_at, updated_at
             FROM contact_submissions
             ${whereSql}
             ORDER BY created_at DESC`,
            queryParams
        );

        // Fetch Stats
        const [statsRows] = await pool.query<RowDataPacket[]>(
            `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN source = 'website_popup' THEN 1 ELSE 0 END) as popup_leads,
                SUM(CASE WHEN source = 'product_inquiry_popup' THEN 1 ELSE 0 END) as product_inquiries,
                SUM(CASE WHEN source = 'contact_page' THEN 1 ELSE 0 END) as contact_page,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads
             FROM contact_submissions`
        );

        const stats = {
            total: Number(statsRows[0]?.total || 0),
            popup_leads: Number(statsRows[0]?.popup_leads || 0),
            product_inquiries: Number(statsRows[0]?.product_inquiries || 0),
            contact_page: Number(statsRows[0]?.contact_page || 0),
            new_leads: Number(statsRows[0]?.new_leads || 0),
        };

        return NextResponse.json({
            success: true,
            leads: rows,
            stats,
        });
    } catch (error: any) {
        console.error("Error fetching leads:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch leads" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await ensureContactSubmissionsTable();
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required id or status" }, { status: 400 });
        }

        const validStatuses = ["new", "contacted", "in_progress", "closed"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE contact_submissions SET status = ? WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Lead status updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating lead status:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update lead status" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await ensureContactSubmissionsTable();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `DELETE FROM contact_submissions WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Lead deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting lead:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete lead" },
            { status: 500 }
        );
    }
}
