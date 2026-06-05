import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { normalizeLetterStatus, type LetterStatus } from "@/lib/letterConstants";

export { LETTER_STATUSES, normalizeLetterStatus, type LetterStatus } from "@/lib/letterConstants";

const TABLE = "admin_letters";
const LETTER_PREFIX = "VEL";

export const LETTER_LIST_COLUMNS = `
    id, letter_number, client_name, designation, client_contact, client_email, client_phone,
    subject, content, letter_date, status, notes,
    created_by, created_at, updated_at
`;

export type LetterRecordInput = {
    client_name: string;
    designation?: string | null;
    client_contact?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    subject: string;
    content?: string | null;
    letter_date?: string | null;
    status?: LetterStatus;
    notes?: string | null;
    created_by?: string | null;
};

type ColumnNameRow = RowDataPacket & { COLUMN_NAME: string };

let ensureTablePromise: Promise<void> | null = null;

async function getExistingColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<ColumnNameRow[]>(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [TABLE],
    );
    return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function runEnsureAdminLettersTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            letter_number VARCHAR(20) NOT NULL,
            client_name VARCHAR(255) NOT NULL,
            designation VARCHAR(255) NULL,
            client_contact VARCHAR(255) NULL,
            client_email VARCHAR(255) NULL,
            client_phone VARCHAR(50) NULL,
            subject VARCHAR(255) NOT NULL,
            content LONGTEXT NULL,
            letter_date DATE NULL,
            status ENUM('Draft', 'Sent', 'Approved', 'Rejected', 'Expired') NOT NULL DEFAULT 'Draft',
            notes TEXT NULL,
            created_by VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_letter_number (letter_number),
            KEY idx_letter_status (status),
            KEY idx_letter_client (client_name)
        )
    `);

    const columns = await getExistingColumns();
    if (!columns.has("designation")) {
        await pool.query(`ALTER TABLE ${TABLE} ADD COLUMN designation VARCHAR(255) NULL AFTER client_name`);
    }
}

export async function ensureAdminLettersTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminLettersTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

function letterNumberPrefix(date = new Date()): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${LETTER_PREFIX}${mm}${yy}`;
}

export async function generateLetterNumber(date = new Date()): Promise<string> {
    const prefix = letterNumberPrefix(date);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT letter_number FROM ${TABLE}
         WHERE letter_number LIKE ?
         ORDER BY letter_number DESC
         LIMIT 1`,
        [`${prefix}%`],
    );
    const last = typeof rows[0]?.letter_number === "string" ? rows[0].letter_number : "";
    const seq = last.startsWith(prefix) ? Number.parseInt(last.slice(prefix.length), 10) : 0;
    const next = Number.isFinite(seq) ? seq + 1 : 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function createLetterRecord(input: LetterRecordInput): Promise<number> {
    await ensureAdminLettersTable();
    const letterNumber = await generateLetterNumber();
    const status = normalizeLetterStatus(input.status);

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${TABLE} (
            letter_number, client_name, designation, client_contact, client_email, client_phone,
            subject, content, letter_date, status, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            letterNumber,
            input.client_name,
            input.designation ?? null,
            input.client_contact ?? null,
            input.client_email ?? null,
            input.client_phone ?? null,
            input.subject,
            input.content ?? null,
            input.letter_date ?? null,
            status,
            input.notes ?? null,
            input.created_by ?? null,
        ],
    );

    return result.insertId;
}

export async function updateLetterRecord(id: number, input: LetterRecordInput): Promise<boolean> {
    await ensureAdminLettersTable();
    const status = normalizeLetterStatus(input.status);

    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE}
         SET client_name = ?, designation = ?, client_contact = ?, client_email = ?, client_phone = ?,
             subject = ?, content = ?, letter_date = ?, status = ?, notes = ?
         WHERE id = ?`,
        [
            input.client_name,
            input.designation ?? null,
            input.client_contact ?? null,
            input.client_email ?? null,
            input.client_phone ?? null,
            input.subject,
            input.content ?? null,
            input.letter_date ?? null,
            status,
            input.notes ?? null,
            id,
        ],
    );

    return result.affectedRows > 0;
}

export async function getLetterRowById(id: number): Promise<RowDataPacket | null> {
    await ensureAdminLettersTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${LETTER_LIST_COLUMNS} FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    return rows[0] ?? null;
}
