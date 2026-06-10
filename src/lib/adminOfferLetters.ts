import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
    normalizeCurrency,
    normalizeEmploymentType,
    normalizeNoticePeriod,
    normalizeOfferPriority,
    normalizeOfferType,
    normalizeProbationPeriod,
    normalizeSalaryType,
    normalizeOfferLetterStatus,
    type OfferLetterStatus,
} from "@/lib/offerLetterConstants";

export { OFFER_LETTER_STATUSES, normalizeOfferLetterStatus, type OfferLetterStatus } from "@/lib/offerLetterConstants";

const TABLE = "admin_offer_letters";
const OFFER_PREFIX = "JITOFFER";

export const OFFER_LETTER_LIST_COLUMNS = `
    id, offer_number, offer_type, priority,
    candidate_name, candidate_email, candidate_phone, candidate_address,
    designation, department, employment_type, location, reporting_to,
    joining_date, compensation, salary_type, currency, working_hours,
    probation_period, notice_period, duration, offer_expiry_date,
    benefits, key_responsibilities, terms_and_conditions,
    subject, content, offer_date, status, notes,
    created_by, created_at, updated_at
`;

export type OfferLetterRecordInput = {
    offer_type?: string | null;
    priority?: string | null;
    candidate_name: string;
    candidate_email?: string | null;
    candidate_phone?: string | null;
    candidate_address?: string | null;
    designation?: string | null;
    department?: string | null;
    employment_type?: string | null;
    location?: string | null;
    reporting_to?: string | null;
    joining_date?: string | null;
    compensation?: string | null;
    salary_type?: string | null;
    currency?: string | null;
    working_hours?: string | null;
    probation_period?: string | null;
    notice_period?: string | null;
    duration?: string | null;
    offer_expiry_date?: string | null;
    benefits?: string | null;
    key_responsibilities?: string | null;
    terms_and_conditions?: string | null;
    subject: string;
    content?: string | null;
    offer_date?: string | null;
    status?: OfferLetterStatus;
    notes?: string | null;
    created_by?: string | null;
};

let ensureTablePromise: Promise<void> | null = null;

async function columnExists(column: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [TABLE, column],
    );
    return Number(rows[0]?.count) > 0;
}

async function ensureColumn(column: string, sql: string) {
    if (!(await columnExists(column))) {
        await pool.query(sql);
    }
}

async function runEnsureAdminOfferLettersTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            offer_number VARCHAR(24) NOT NULL,
            offer_type VARCHAR(50) NOT NULL DEFAULT 'Job',
            priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
            candidate_name VARCHAR(255) NOT NULL,
            candidate_email VARCHAR(255) NULL,
            candidate_phone VARCHAR(50) NULL,
            candidate_address TEXT NULL,
            designation VARCHAR(255) NULL,
            department VARCHAR(255) NULL,
            employment_type VARCHAR(50) NOT NULL DEFAULT 'Full Time',
            location VARCHAR(255) NULL,
            reporting_to VARCHAR(255) NULL,
            joining_date DATE NULL,
            compensation VARCHAR(100) NULL,
            salary_type VARCHAR(30) NOT NULL DEFAULT 'Monthly',
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            working_hours VARCHAR(100) NOT NULL DEFAULT '9:00 AM - 6:00 PM',
            probation_period VARCHAR(50) NOT NULL DEFAULT '3 months',
            notice_period VARCHAR(50) NOT NULL DEFAULT '1 month',
            duration VARCHAR(100) NULL,
            offer_expiry_date DATE NULL,
            benefits TEXT NULL,
            key_responsibilities TEXT NULL,
            terms_and_conditions TEXT NULL,
            subject VARCHAR(255) NOT NULL,
            content LONGTEXT NULL,
            offer_date DATE NULL,
            status ENUM('Draft', 'Sent', 'Approved', 'Rejected', 'Expired') NOT NULL DEFAULT 'Draft',
            notes TEXT NULL,
            created_by VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_offer_number (offer_number),
            KEY idx_offer_status (status),
            KEY idx_offer_candidate (candidate_name)
        )
    `);

    const migrations: { column: string; sql: string }[] = [
        { column: "offer_type", sql: `ALTER TABLE ${TABLE} ADD COLUMN offer_type VARCHAR(50) NOT NULL DEFAULT 'Job' AFTER offer_number` },
        { column: "priority", sql: `ALTER TABLE ${TABLE} ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'Medium' AFTER offer_type` },
        { column: "candidate_address", sql: `ALTER TABLE ${TABLE} ADD COLUMN candidate_address TEXT NULL AFTER candidate_phone` },
        { column: "employment_type", sql: `ALTER TABLE ${TABLE} ADD COLUMN employment_type VARCHAR(50) NOT NULL DEFAULT 'Full Time' AFTER department` },
        { column: "location", sql: `ALTER TABLE ${TABLE} ADD COLUMN location VARCHAR(255) NULL AFTER employment_type` },
        { column: "reporting_to", sql: `ALTER TABLE ${TABLE} ADD COLUMN reporting_to VARCHAR(255) NULL AFTER location` },
        { column: "salary_type", sql: `ALTER TABLE ${TABLE} ADD COLUMN salary_type VARCHAR(30) NOT NULL DEFAULT 'Monthly' AFTER compensation` },
        { column: "currency", sql: `ALTER TABLE ${TABLE} ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'INR' AFTER salary_type` },
        { column: "working_hours", sql: `ALTER TABLE ${TABLE} ADD COLUMN working_hours VARCHAR(100) NOT NULL DEFAULT '9:00 AM - 6:00 PM' AFTER currency` },
        { column: "probation_period", sql: `ALTER TABLE ${TABLE} ADD COLUMN probation_period VARCHAR(50) NOT NULL DEFAULT '3 months' AFTER working_hours` },
        { column: "notice_period", sql: `ALTER TABLE ${TABLE} ADD COLUMN notice_period VARCHAR(50) NOT NULL DEFAULT '1 month' AFTER probation_period` },
        { column: "duration", sql: `ALTER TABLE ${TABLE} ADD COLUMN duration VARCHAR(100) NULL AFTER notice_period` },
        { column: "offer_expiry_date", sql: `ALTER TABLE ${TABLE} ADD COLUMN offer_expiry_date DATE NULL AFTER duration` },
        { column: "benefits", sql: `ALTER TABLE ${TABLE} ADD COLUMN benefits TEXT NULL AFTER offer_expiry_date` },
        { column: "key_responsibilities", sql: `ALTER TABLE ${TABLE} ADD COLUMN key_responsibilities TEXT NULL AFTER benefits` },
        { column: "terms_and_conditions", sql: `ALTER TABLE ${TABLE} ADD COLUMN terms_and_conditions TEXT NULL AFTER key_responsibilities` },
    ];

    for (const migration of migrations) {
        await ensureColumn(migration.column, migration.sql);
    }
}

export async function ensureAdminOfferLettersTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminOfferLettersTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

function offerNumberPrefix(date = new Date()): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${OFFER_PREFIX}${mm}${yy}`;
}

export async function generateOfferNumber(date = new Date()): Promise<string> {
    const prefix = offerNumberPrefix(date);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT offer_number FROM ${TABLE}
         WHERE offer_number LIKE ?
         ORDER BY offer_number DESC
         LIMIT 1`,
        [`${prefix}%`],
    );
    const last = typeof rows[0]?.offer_number === "string" ? rows[0].offer_number : "";
    const seq = last.startsWith(prefix) ? Number.parseInt(last.slice(prefix.length), 10) : 0;
    const next = Number.isFinite(seq) ? seq + 1 : 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
}

function normalizeInput(input: OfferLetterRecordInput) {
    return {
        offer_type: normalizeOfferType(input.offer_type),
        priority: normalizeOfferPriority(input.priority),
        candidate_name: input.candidate_name,
        candidate_email: input.candidate_email ?? null,
        candidate_phone: input.candidate_phone ?? null,
        candidate_address: input.candidate_address ?? null,
        designation: input.designation ?? null,
        department: input.department ?? null,
        employment_type: normalizeEmploymentType(input.employment_type),
        location: input.location ?? null,
        reporting_to: input.reporting_to ?? null,
        joining_date: input.joining_date ?? null,
        compensation: input.compensation ?? null,
        salary_type: normalizeSalaryType(input.salary_type),
        currency: normalizeCurrency(input.currency),
        working_hours: input.working_hours ?? "9:00 AM - 6:00 PM",
        probation_period: normalizeProbationPeriod(input.probation_period),
        notice_period: normalizeNoticePeriod(input.notice_period),
        duration: input.duration ?? null,
        offer_expiry_date: input.offer_expiry_date ?? null,
        benefits: input.benefits ?? null,
        key_responsibilities: input.key_responsibilities ?? null,
        terms_and_conditions: input.terms_and_conditions ?? null,
        subject: input.subject,
        content: input.content ?? null,
        offer_date: input.offer_date ?? null,
        status: normalizeOfferLetterStatus(input.status),
        notes: input.notes ?? null,
        created_by: input.created_by ?? null,
    };
}

export async function createOfferLetterRecord(input: OfferLetterRecordInput): Promise<number> {
    await ensureAdminOfferLettersTable();
    const offerNumber = await generateOfferNumber();
    const data = normalizeInput(input);

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${TABLE} (
            offer_number, offer_type, priority,
            candidate_name, candidate_email, candidate_phone, candidate_address,
            designation, department, employment_type, location, reporting_to,
            joining_date, compensation, salary_type, currency, working_hours,
            probation_period, notice_period, duration, offer_expiry_date,
            benefits, key_responsibilities, terms_and_conditions,
            subject, content, offer_date, status, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            offerNumber,
            data.offer_type,
            data.priority,
            data.candidate_name,
            data.candidate_email,
            data.candidate_phone,
            data.candidate_address,
            data.designation,
            data.department,
            data.employment_type,
            data.location,
            data.reporting_to,
            data.joining_date,
            data.compensation,
            data.salary_type,
            data.currency,
            data.working_hours,
            data.probation_period,
            data.notice_period,
            data.duration,
            data.offer_expiry_date,
            data.benefits,
            data.key_responsibilities,
            data.terms_and_conditions,
            data.subject,
            data.content,
            data.offer_date,
            data.status,
            data.notes,
            data.created_by,
        ],
    );

    return result.insertId;
}

export async function updateOfferLetterRecord(id: number, input: OfferLetterRecordInput): Promise<boolean> {
    await ensureAdminOfferLettersTable();
    const data = normalizeInput(input);

    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE}
         SET offer_type = ?, priority = ?,
             candidate_name = ?, candidate_email = ?, candidate_phone = ?, candidate_address = ?,
             designation = ?, department = ?, employment_type = ?, location = ?, reporting_to = ?,
             joining_date = ?, compensation = ?, salary_type = ?, currency = ?, working_hours = ?,
             probation_period = ?, notice_period = ?, duration = ?, offer_expiry_date = ?,
             benefits = ?, key_responsibilities = ?, terms_and_conditions = ?,
             subject = ?, content = ?, offer_date = ?, status = ?, notes = ?
         WHERE id = ?`,
        [
            data.offer_type,
            data.priority,
            data.candidate_name,
            data.candidate_email,
            data.candidate_phone,
            data.candidate_address,
            data.designation,
            data.department,
            data.employment_type,
            data.location,
            data.reporting_to,
            data.joining_date,
            data.compensation,
            data.salary_type,
            data.currency,
            data.working_hours,
            data.probation_period,
            data.notice_period,
            data.duration,
            data.offer_expiry_date,
            data.benefits,
            data.key_responsibilities,
            data.terms_and_conditions,
            data.subject,
            data.content,
            data.offer_date,
            data.status,
            data.notes,
            id,
        ],
    );

    return result.affectedRows > 0;
}

export async function getOfferLetterRowById(id: number): Promise<RowDataPacket | null> {
    await ensureAdminOfferLettersTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${OFFER_LETTER_LIST_COLUMNS} FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    return rows[0] ?? null;
}
