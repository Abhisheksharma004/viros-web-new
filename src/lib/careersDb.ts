import pool from "@/lib/db";
import { JobOpening } from "@/data/careersData";

let tablesInitialized = false;

export async function ensureCareersTables() {
    if (tablesInitialized) return;

    try {
        // 1. Table for Job Openings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_openings (
                id VARCHAR(120) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                department VARCHAR(100) NOT NULL,
                location VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
                experience VARCHAR(100) NOT NULL,
                salary VARCHAR(150) NOT NULL,
                summary TEXT NOT NULL,
                tags JSON NULL,
                responsibilities JSON NULL,
                requirements JSON NULL,
                nice_to_have JSON NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Table for Candidate Applications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id VARCHAR(120) NULL,
                job_title VARCHAR(255) NOT NULL,
                department VARCHAR(100) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                current_city VARCHAR(150) NOT NULL,
                ready_to_relocate VARCHAR(100) NULL,
                highest_qualification VARCHAR(150) NOT NULL,
                total_experience VARCHAR(100) NOT NULL,
                current_company VARCHAR(255) NULL,
                current_designation VARCHAR(255) NULL,
                key_skills TEXT NULL,
                current_ctc VARCHAR(100) NULL,
                expected_ctc VARCHAR(100) NOT NULL,
                notice_period VARCHAR(100) NOT NULL,
                resume_link TEXT NOT NULL,
                linkedin_url TEXT NULL,
                portfolio_url TEXT NULL,
                cover_note TEXT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Ensure interview columns exist
        const interviewCols = [
            "ALTER TABLE job_applications ADD COLUMN interview_level VARCHAR(50) NULL;",
            "ALTER TABLE job_applications ADD COLUMN interview_date VARCHAR(50) NULL;",
            "ALTER TABLE job_applications ADD COLUMN interview_time VARCHAR(50) NULL;",
            "ALTER TABLE job_applications ADD COLUMN interview_mode VARCHAR(100) NULL;",
            "ALTER TABLE job_applications ADD COLUMN interview_link TEXT NULL;",
            "ALTER TABLE job_applications ADD COLUMN interview_notes TEXT NULL;"
        ];

        for (const sql of interviewCols) {
            try {
                await pool.query(sql);
            } catch {
                // Column already exists or table freshly created
            }
        }

        tablesInitialized = true;
    } catch (error) {
        console.error("Error ensuring careers tables:", error);
    }
}

export function parseJsonField(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
        if (typeof val === "string") {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch {
        return [];
    }
    return [];
}

export async function getDbJobOpenings(activeOnly: boolean = false): Promise<JobOpening[]> {
    await ensureCareersTables();
    try {
        const query = activeOnly
            ? `SELECT * FROM job_openings WHERE is_active = 1 ORDER BY created_at DESC`
            : `SELECT * FROM job_openings ORDER BY created_at DESC`;
        
        const [rows]: any = await pool.query(query);
        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            department: r.department,
            location: r.location,
            type: r.type,
            experience: r.experience,
            salary: r.salary,
            summary: r.summary,
            tags: parseJsonField(r.tags),
            responsibilities: parseJsonField(r.responsibilities),
            requirements: parseJsonField(r.requirements),
            niceToHave: parseJsonField(r.nice_to_have),
            isActive: Boolean(r.is_active),
            createdAt: r.created_at
        }));
    } catch (error) {
        console.error("Error fetching jobs from DB:", error);
        return [];
    }
}

export async function getDbJobById(id: string): Promise<JobOpening | null> {
    await ensureCareersTables();
    try {
        const [rows]: any = await pool.query(`SELECT * FROM job_openings WHERE id = ? LIMIT 1`, [id]);
        if (!rows || rows.length === 0) {
            return null;
        }
        const r = rows[0];
        return {
            id: r.id,
            title: r.title,
            department: r.department,
            location: r.location,
            type: r.type,
            experience: r.experience,
            salary: r.salary,
            summary: r.summary,
            tags: parseJsonField(r.tags),
            responsibilities: parseJsonField(r.responsibilities),
            requirements: parseJsonField(r.requirements),
            niceToHave: parseJsonField(r.nice_to_have),
            isActive: Boolean(r.is_active),
            createdAt: r.created_at
        };
    } catch (error) {
        console.error("Error fetching job by ID:", error);
        return null;
    }
}
