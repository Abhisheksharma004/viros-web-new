import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDbJobOpenings, ensureCareersTables } from "@/lib/careersDb";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";
        const jobs = await getDbJobOpenings(activeOnly);
        return NextResponse.json({ success: true, jobs });
    } catch (error: any) {
        console.error("GET /api/careers/jobs error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to fetch jobs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureCareersTables();
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

        if (!title || !department || !summary) {
            return NextResponse.json({ success: false, message: "Missing required fields (Title, Department, Summary)" }, { status: 400 });
        }

        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString().slice(-4);

        await pool.query(
            `INSERT INTO job_openings 
            (id, title, department, location, type, experience, salary, summary, tags, responsibilities, requirements, nice_to_have, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                title,
                department,
                location || "Noida / Delhi NCR (On-Site)",
                type || "Full-Time",
                experience || "2 - 5 Years",
                salary || "Competitive / Best in Industry",
                summary,
                JSON.stringify(Array.isArray(tags) ? tags : []),
                JSON.stringify(Array.isArray(responsibilities) ? responsibilities : []),
                JSON.stringify(Array.isArray(requirements) ? requirements : []),
                JSON.stringify(Array.isArray(niceToHave) ? niceToHave : []),
                isActive === false ? 0 : 1
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Job opening created successfully",
            job: { id, title, department, location, type, experience, salary, summary, tags, responsibilities, requirements, niceToHave, isActive: true }
        });
    } catch (error: any) {
        console.error("POST /api/careers/jobs error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to create job" }, { status: 500 });
    }
}
