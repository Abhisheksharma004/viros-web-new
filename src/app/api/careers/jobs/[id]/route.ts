import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDbJobById, ensureCareersTables } from "@/lib/careersDb";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const job = await getDbJobById(id);
        if (!job) {
            return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        console.error("GET /api/careers/jobs/[id] error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to fetch job" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCareersTables();
        const { id } = await params;
        const body = await request.json();
        const {
            title,
            department,
            location,
            type,
            experience,
            salary,
            summary,
            tags,
            responsibilities,
            requirements,
            niceToHave,
            isActive
        } = body;

        await pool.query(
            `UPDATE job_openings SET 
                title = COALESCE(?, title),
                department = COALESCE(?, department),
                location = COALESCE(?, location),
                type = COALESCE(?, type),
                experience = COALESCE(?, experience),
                salary = COALESCE(?, salary),
                summary = COALESCE(?, summary),
                tags = COALESCE(?, tags),
                responsibilities = COALESCE(?, responsibilities),
                requirements = COALESCE(?, requirements),
                nice_to_have = COALESCE(?, nice_to_have),
                is_active = COALESCE(?, is_active)
            WHERE id = ?`,
            [
                title || null,
                department || null,
                location || null,
                type || null,
                experience || null,
                salary || null,
                summary || null,
                tags ? JSON.stringify(tags) : null,
                responsibilities ? JSON.stringify(responsibilities) : null,
                requirements ? JSON.stringify(requirements) : null,
                niceToHave ? JSON.stringify(niceToHave) : null,
                typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
                id
            ]
        );

        const updatedJob = await getDbJobById(id);
        return NextResponse.json({ success: true, message: "Job updated successfully", job: updatedJob });
    } catch (error: any) {
        console.error("PUT /api/careers/jobs/[id] error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to update job" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCareersTables();
        const { id } = await params;
        await pool.query(`DELETE FROM job_openings WHERE id = ?`, [id]);
        return NextResponse.json({ success: true, message: "Job deleted successfully" });
    } catch (error: any) {
        console.error("DELETE /api/careers/jobs/[id] error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to delete job" }, { status: 500 });
    }
}
