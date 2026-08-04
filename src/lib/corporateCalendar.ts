import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/lib/db";

const TABLE = "corporate_calendar";

export const CORPORATE_EVENT_TYPES = [
    "holiday",
    "company_event",
    "meeting",
    "appraisal",
    "training",
    "milestone",
] as const;

export type CorporateEventType = (typeof CORPORATE_EVENT_TYPES)[number];

export type CorporateCalendarRow = RowDataPacket & {
    id: number;
    title: string;
    event_type: CorporateEventType;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    is_all_day: number;
    location: string | null;
    audience: string;
    color_tag: string;
    description: string | null;
    is_mandatory: number;
    created_at?: string;
    updated_at?: string;
};

export type CorporateEventApi = {
    id: number;
    title: string;
    event_type: CorporateEventType;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    is_all_day: boolean;
    location: string;
    audience: string;
    color_tag: string;
    description: string;
    is_mandatory: boolean;
};

export async function ensureCorporateCalendarTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            event_type ENUM('holiday', 'company_event', 'meeting', 'appraisal', 'training', 'milestone') NOT NULL DEFAULT 'company_event',
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            start_time TIME NULL,
            end_time TIME NULL,
            is_all_day TINYINT(1) NOT NULL DEFAULT 1,
            location VARCHAR(255) NULL DEFAULT 'Office HQ',
            audience VARCHAR(100) NOT NULL DEFAULT 'All Employees',
            color_tag VARCHAR(50) NOT NULL DEFAULT 'blue',
            description TEXT NULL,
            is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_corp_event_type (event_type),
            INDEX idx_corp_dates (start_date, end_date)
        )
    `);

    // Insert initial corporate calendar entries if table is empty
    const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM ${TABLE}`);
    if (countRows[0]?.count === 0) {
        const year = new Date().getFullYear();
        await pool.query(`
            INSERT INTO ${TABLE} 
            (title, event_type, start_date, end_date, start_time, end_time, is_all_day, location, audience, color_tag, description, is_mandatory)
            VALUES 
            ('New Year Day', 'holiday', '${year}-01-01', '${year}-01-01', NULL, NULL, 1, 'National Holiday', 'All Employees', 'emerald', 'Official Paid Public Holiday', 1),
            ('Republic Day', 'holiday', '${year}-01-26', '${year}-01-26', NULL, NULL, 1, 'National Holiday', 'All Employees', 'emerald', 'National Republic Day Celebration', 1),
            ('Q1 All-Hands Town Hall', 'company_event', '${year}-02-10', '${year}-02-10', '11:00', '13:00', 0, 'Main Auditorium & Zoom', 'All Employees', 'purple', 'Quarterly company performance & vision roadmap', 1),
            ('Annual Performance Appraisal Cycle', 'appraisal', '${year}-03-01', '${year}-03-31', NULL, NULL, 1, 'HR Portal', 'All Staff & Managers', 'amber', 'Annual self-appraisal and manager review submission window', 1),
            ('Cybersecurity & Data Privacy Workshop', 'training', '${year}-04-15', '${year}-04-15', '14:00', '16:00', 0, 'Conference Room B & Meet', 'All Employees', 'cyan', 'Mandatory annual IT security compliance training', 1),
            ('May Day / Labor Day', 'holiday', '${year}-05-01', '${year}-05-01', NULL, NULL, 1, 'National Holiday', 'All Employees', 'emerald', 'International Workers Day', 1),
            ('Annual Leadership Summit', 'meeting', '${year}-06-12', '${year}-06-14', '09:30', '17:30', 0, 'Executive Boardroom', 'Management & Leadership', 'blue', 'Strategic corporate goals & expansion planning', 1),
            ('Mid-Year Financial Audit', 'milestone', '${year}-07-01', '${year}-07-05', NULL, NULL, 1, 'Finance Dept', 'Finance & Admin', 'red', 'Mid-year fiscal audit and compliance check', 1),
            ('Independence Day Celebration', 'holiday', '${year}-08-15', '${year}-08-15', '09:00', '12:00', 0, 'Company Campus', 'All Employees', 'emerald', 'Flag hoisting ceremony and cultural celebration', 1),
            ('Annual Team Outing & Retreat', 'company_event', '${year}-10-20', '${year}-10-22', NULL, NULL, 1, 'Resort Campus', 'All Employees', 'purple', 'Annual corporate offsite, team building games and dinner', 0)
        `);
    }
}

export function mapRowToApi(row: CorporateCalendarRow): CorporateEventApi {
    return {
        id: Number(row.id),
        title: String(row.title ?? ""),
        event_type: CORPORATE_EVENT_TYPES.includes(row.event_type) ? row.event_type : "company_event",
        start_date: row.start_date
            ? String(row.start_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        end_date: row.end_date
            ? String(row.end_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
        end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
        is_all_day: Boolean(row.is_all_day),
        location: String(row.location ?? "Office HQ"),
        audience: String(row.audience ?? "All Employees"),
        color_tag: String(row.color_tag ?? "blue"),
        description: String(row.description ?? ""),
        is_mandatory: Boolean(row.is_mandatory),
    };
}

export async function getAllCorporateEvents(): Promise<CorporateEventApi[]> {
    await ensureCorporateCalendarTable();
    const [rows] = await pool.query<CorporateCalendarRow[]>(
        `SELECT * FROM ${TABLE} ORDER BY start_date ASC, id ASC`
    );
    return rows.map(mapRowToApi);
}

export async function getCorporateEventById(id: number): Promise<CorporateEventApi | null> {
    await ensureCorporateCalendarTable();
    const [rows] = await pool.query<CorporateCalendarRow[]>(
        `SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [id]
    );
    return rows[0] ? mapRowToApi(rows[0]) : null;
}

export async function createCorporateEvent(data: {
    title: string;
    event_type: CorporateEventType;
    start_date: string;
    end_date: string;
    start_time?: string | null;
    end_time?: string | null;
    is_all_day?: boolean;
    location?: string;
    audience?: string;
    color_tag?: string;
    description?: string;
    is_mandatory?: boolean;
}): Promise<number> {
    await ensureCorporateCalendarTable();
    const [res] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${TABLE} 
        (title, event_type, start_date, end_date, start_time, end_time, is_all_day, location, audience, color_tag, description, is_mandatory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.title.trim(),
            data.event_type,
            data.start_date,
            data.end_date,
            data.start_time || null,
            data.end_time || null,
            data.is_all_day ? 1 : 0,
            data.location?.trim() || "Office HQ",
            data.audience?.trim() || "All Employees",
            data.color_tag || "blue",
            data.description?.trim() || null,
            data.is_mandatory ? 1 : 0,
        ]
    );
    return res.insertId;
}

export async function updateCorporateEvent(
    id: number,
    data: {
        title: string;
        event_type: CorporateEventType;
        start_date: string;
        end_date: string;
        start_time?: string | null;
        end_time?: string | null;
        is_all_day?: boolean;
        location?: string;
        audience?: string;
        color_tag?: string;
        description?: string;
        is_mandatory?: boolean;
    }
): Promise<boolean> {
    await ensureCorporateCalendarTable();
    const [res] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE}
        SET title = ?, event_type = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ?, 
            is_all_day = ?, location = ?, audience = ?, color_tag = ?, description = ?, is_mandatory = ?
        WHERE id = ?`,
        [
            data.title.trim(),
            data.event_type,
            data.start_date,
            data.end_date,
            data.start_time || null,
            data.end_time || null,
            data.is_all_day ? 1 : 0,
            data.location?.trim() || "Office HQ",
            data.audience?.trim() || "All Employees",
            data.color_tag || "blue",
            data.description?.trim() || null,
            data.is_mandatory ? 1 : 0,
            id,
        ]
    );
    return res.affectedRows > 0;
}

export async function deleteCorporateEvent(id: number): Promise<boolean> {
    await ensureCorporateCalendarTable();
    const [res] = await pool.query<ResultSetHeader>(
        `DELETE FROM ${TABLE} WHERE id = ?`,
        [id]
    );
    return res.affectedRows > 0;
}
