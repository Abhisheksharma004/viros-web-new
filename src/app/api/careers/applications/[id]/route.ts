import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureCareersTables } from "@/lib/careersDb";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCareersTables();
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
        }

        await pool.query(`UPDATE job_applications SET status = ? WHERE id = ?`, [status, id]);
        return NextResponse.json({ success: true, message: `Application status updated to ${status}` });
    } catch (error: any) {
        console.error("PUT /api/careers/applications/[id] error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to update application" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCareersTables();
        const { id } = await params;
        await pool.query(`DELETE FROM job_applications WHERE id = ?`, [id]);
        return NextResponse.json({ success: true, message: "Application deleted successfully" });
    } catch (error: any) {
        console.error("DELETE /api/careers/applications/[id] error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to delete application" }, { status: 500 });
    }
}
