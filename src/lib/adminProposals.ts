import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { normalizeProposalStatus, type ProposalStatus } from "@/lib/proposalConstants";

export { PROPOSAL_STATUSES, normalizeProposalStatus, type ProposalStatus } from "@/lib/proposalConstants";

const TABLE = "admin_proposals";
const PROPOSAL_PREFIX = "VEP";

export const PROPOSAL_LIST_COLUMNS = `
    id, proposal_number, client_name, client_contact, client_email, client_phone,
    project_title, content, proposed_amount, valid_until, status, notes,
    created_by, created_at, updated_at
`;

export type ProposalRecordInput = {
    client_name: string;
    client_contact?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    project_title: string;
    content?: string | null;
    proposed_amount?: number;
    valid_until?: string | null;
    status?: ProposalStatus;
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

async function runEnsureAdminProposalsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            proposal_number VARCHAR(20) NOT NULL,
            client_name VARCHAR(255) NOT NULL,
            client_contact VARCHAR(255) NULL,
            client_email VARCHAR(255) NULL,
            client_phone VARCHAR(50) NULL,
            project_title VARCHAR(255) NOT NULL,
            content LONGTEXT NULL,
            proposed_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            valid_until DATE NULL,
            status ENUM('Draft', 'Sent', 'Approved', 'Rejected', 'Expired') NOT NULL DEFAULT 'Draft',
            notes TEXT NULL,
            created_by VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_proposal_number (proposal_number),
            KEY idx_proposal_status (status),
            KEY idx_proposal_client (client_name)
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        {
            column: "content",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN content LONGTEXT NULL AFTER project_title`,
        },
        {
            column: "proposed_amount",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN proposed_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER content`,
        },
        {
            column: "valid_until",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN valid_until DATE NULL AFTER proposed_amount`,
        },
        {
            column: "status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN status ENUM('Draft', 'Sent', 'Approved', 'Rejected', 'Expired') NOT NULL DEFAULT 'Draft' AFTER valid_until`,
        },
        {
            column: "notes",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN notes TEXT NULL AFTER status`,
        },
        {
            column: "created_by",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN created_by VARCHAR(100) NULL AFTER notes`,
        },
        {
            column: "created_at",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        },
        {
            column: "updated_at",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
        },
    ];

    for (const migration of migrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }

    if (columns.has("description") && columns.has("content")) {
        await pool.query(
            `UPDATE ${TABLE}
             SET content = description
             WHERE (content IS NULL OR content = '')
               AND description IS NOT NULL
               AND description != ''`,
        );
    }
}

export async function ensureAdminProposalsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminProposalsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

function proposalNumberPrefix(date = new Date()): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${PROPOSAL_PREFIX}${mm}${yy}`;
}

export async function generateProposalNumber(date = new Date()): Promise<string> {
    const prefix = proposalNumberPrefix(date);
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT proposal_number FROM ${TABLE}
         WHERE proposal_number LIKE ?
         ORDER BY proposal_number DESC
         LIMIT 1`,
        [`${prefix}%`],
    );
    const last = typeof rows[0]?.proposal_number === "string" ? rows[0].proposal_number : "";
    const seq = last.startsWith(prefix) ? Number.parseInt(last.slice(prefix.length), 10) : 0;
    const next = Number.isFinite(seq) ? seq + 1 : 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function createProposalRecord(input: ProposalRecordInput): Promise<number> {
    await ensureAdminProposalsTable();
    const proposalNumber = await generateProposalNumber();
    const status = normalizeProposalStatus(input.status);

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${TABLE} (
            proposal_number, client_name, client_contact, client_email, client_phone,
            project_title, content, proposed_amount, valid_until, status, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            proposalNumber,
            input.client_name,
            input.client_contact ?? null,
            input.client_email ?? null,
            input.client_phone ?? null,
            input.project_title,
            input.content ?? null,
            input.proposed_amount ?? 0,
            input.valid_until ?? null,
            status,
            input.notes ?? null,
            input.created_by ?? null,
        ],
    );

    return result.insertId;
}

export async function updateProposalRecord(id: number, input: ProposalRecordInput): Promise<boolean> {
    await ensureAdminProposalsTable();
    const status = normalizeProposalStatus(input.status);

    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE ${TABLE}
         SET client_name = ?, client_contact = ?, client_email = ?, client_phone = ?,
             project_title = ?, content = ?, proposed_amount = ?, valid_until = ?,
             status = ?, notes = ?
         WHERE id = ?`,
        [
            input.client_name,
            input.client_contact ?? null,
            input.client_email ?? null,
            input.client_phone ?? null,
            input.project_title,
            input.content ?? null,
            input.proposed_amount ?? 0,
            input.valid_until ?? null,
            status,
            input.notes ?? null,
            id,
        ],
    );

    return result.affectedRows > 0;
}

export async function getProposalRowById(id: number): Promise<RowDataPacket | null> {
    await ensureAdminProposalsTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${PROPOSAL_LIST_COLUMNS} FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    return rows[0] ?? null;
}
