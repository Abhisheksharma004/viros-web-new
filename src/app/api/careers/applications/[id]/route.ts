import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureCareersTables } from "@/lib/careersDb";
import { sendApplicationStatusUpdateEmail, sendInterviewScheduleEmail } from "@/lib/careersEmail";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensureCareersTables();
        const { id } = await params;
        const body = await request.json();
        const {
            status,
            interviewLevel,
            interviewDate,
            interviewTime,
            interviewMode,
            interviewLink,
            interviewNotes
        } = body;

        if (!status) {
            return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
        }

        // Fetch application before updating
        const [rows]: any = await pool.query(`SELECT * FROM job_applications WHERE id = ? LIMIT 1`, [id]);
        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
        }

        const app = rows[0];
        const oldStatus = app.status;

        // Update database with status and optional interview details
        await pool.query(
            `UPDATE job_applications SET 
                status = ?,
                interview_level = COALESCE(?, interview_level),
                interview_date = COALESCE(?, interview_date),
                interview_time = COALESCE(?, interview_time),
                interview_mode = COALESCE(?, interview_mode),
                interview_link = COALESCE(?, interview_link),
                interview_notes = COALESCE(?, interview_notes)
            WHERE id = ?`,
            [
                status,
                interviewLevel || null,
                interviewDate || null,
                interviewTime || null,
                interviewMode || null,
                interviewLink || null,
                interviewNotes || null,
                id
            ]
        );

        // Send specialized interview email if scheduling an interview
        if (status === "interview" && (interviewDate || interviewLevel)) {
            try {
                await sendInterviewScheduleEmail({
                    applicationId: id,
                    jobTitle: app.job_title || "Job Application",
                    department: app.department || "General",
                    fullName: app.full_name,
                    email: app.email,
                    interviewLevel: interviewLevel || "Level 1",
                    interviewDate: interviewDate || "",
                    interviewTime: interviewTime || "11:00 AM",
                    interviewMode: interviewMode || "Online (Google Meet)",
                    interviewLink: interviewLink || "",
                    interviewNotes: interviewNotes || ""
                });
            } catch (emailErr) {
                console.error("Non-fatal error sending interview schedule email:", emailErr);
            }
        } else if (status !== oldStatus) {
            // Send standard status update email (shortlisted, rejected, etc.)
            try {
                await sendApplicationStatusUpdateEmail({
                    applicationId: id,
                    jobTitle: app.job_title || "Job Application",
                    department: app.department || "General",
                    fullName: app.full_name,
                    email: app.email,
                    newStatus: status
                });
            } catch (emailErr) {
                console.error("Non-fatal error sending candidate status update email:", emailErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: status === "interview" && interviewDate
                ? `Interview (${interviewLevel || "Level 1"}) scheduled and email invitation sent to candidate.`
                : `Application status updated to ${status.toUpperCase()} and candidate notified.`
        });
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
