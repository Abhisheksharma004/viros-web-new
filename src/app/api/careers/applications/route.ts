import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureCareersTables } from "@/lib/careersDb";
import { sendApplicationEmails } from "@/lib/careersEmail";

export async function GET(request: NextRequest) {
    try {
        await ensureCareersTables();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const department = searchParams.get("department");

        let query = `SELECT * FROM job_applications WHERE 1=1`;
        const params: any[] = [];

        if (status && status !== "all") {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (department && department !== "All") {
            query += ` AND department = ?`;
            params.push(department);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows]: any = await pool.query(query, params);

        const applications = (rows || []).map((r: any) => ({
            id: String(r.id),
            jobId: r.job_id,
            jobTitle: r.job_title,
            department: r.department,
            fullName: r.full_name,
            email: r.email,
            phone: r.phone,
            currentCity: r.current_city,
            readyToRelocate: r.ready_to_relocate,
            highestQualification: r.highest_qualification,
            totalExperience: r.total_experience,
            currentCompany: r.current_company,
            currentDesignation: r.current_designation,
            keySkills: r.key_skills,
            currentCtc: r.current_ctc,
            expectedCtc: r.expected_ctc,
            noticePeriod: r.notice_period,
            resumeLink: r.resume_link,
            linkedinUrl: r.linkedin_url,
            portfolioUrl: r.portfolio_url,
            coverNote: r.cover_note,
            interviewLevel: r.interview_level || "",
            interviewDate: r.interview_date || "",
            interviewTime: r.interview_time || "",
            interviewMode: r.interview_mode || "",
            interviewLink: r.interview_link || "",
            interviewNotes: r.interview_notes || "",
            status: r.status,
            appliedDate: r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : ""
        }));

        return NextResponse.json({ success: true, applications });
    } catch (error: any) {
        console.error("GET /api/careers/applications error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to fetch applications" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureCareersTables();
        const body = await request.json();
        const {
            jobId,
            jobTitle,
            department,
            fullName,
            email,
            phone,
            currentCity,
            readyToRelocate,
            highestQualification,
            totalExperience,
            currentCompany,
            currentDesignation,
            keySkills,
            currentCtc,
            expectedCtc,
            noticePeriod,
            resumeLink,
            linkedinUrl,
            portfolioUrl,
            coverNote
        } = body;

        if (!fullName || !email || !phone || !resumeLink) {
            return NextResponse.json({
                success: false,
                message: "Missing required fields (Name, Email, Phone, Resume Link)"
            }, { status: 400 });
        }

        const effectiveJobTitle = jobTitle || "General Talent Pool";
        const effectiveDepartment = department || "General";

        const [result]: any = await pool.query(
            `INSERT INTO job_applications 
            (job_id, job_title, department, full_name, email, phone, current_city, ready_to_relocate, highest_qualification, total_experience, current_company, current_designation, key_skills, current_ctc, expected_ctc, notice_period, resume_link, linkedin_url, portfolio_url, cover_note, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
            [
                jobId || null,
                effectiveJobTitle,
                effectiveDepartment,
                fullName,
                email,
                phone,
                currentCity || "N/A",
                readyToRelocate || "Yes",
                highestQualification || "Graduate",
                totalExperience || "N/A",
                currentCompany || null,
                currentDesignation || null,
                keySkills || null,
                currentCtc || null,
                expectedCtc || "N/A",
                noticePeriod || "Immediate",
                resumeLink,
                linkedinUrl || null,
                portfolioUrl || null,
                coverNote || null
            ]
        );

        const applicationId = result?.insertId || Date.now();

        // Send confirmation email to candidate & notification to recruitment team
        try {
            await sendApplicationEmails({
                applicationId,
                jobTitle: effectiveJobTitle,
                department: effectiveDepartment,
                fullName,
                email,
                phone,
                currentCity,
                readyToRelocate,
                highestQualification,
                totalExperience,
                currentCompany,
                currentDesignation,
                keySkills,
                currentCtc,
                expectedCtc,
                noticePeriod,
                resumeLink,
                linkedinUrl,
                portfolioUrl,
                coverNote
            });
        } catch (emailErr) {
            console.error("Non-fatal email dispatch error in /api/careers/applications:", emailErr);
        }

        return NextResponse.json({
            success: true,
            message: "Application submitted successfully",
            applicationId
        });
    } catch (error: any) {
        console.error("POST /api/careers/applications error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to submit application" }, { status: 500 });
    }
}
