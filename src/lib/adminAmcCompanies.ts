import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const TABLE = "admin_amc_companies";

/** Columns no longer used by the app — dropped on ensure if they exist. */
const OBSOLETE_COLUMNS = ["notes", "gst_number", "pincode", "state", "city", "address"] as const;

type ColumnNameRow = RowDataPacket & { COLUMN_NAME: string };

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

let ensureTablePromise: Promise<void> | null = null;

async function runEnsureAdminAmcCompaniesTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        {
            column: "company_name",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN company_name VARCHAR(255) NOT NULL DEFAULT '' AFTER id`,
        },
        { column: "contact_person", sql: `ALTER TABLE ${TABLE} ADD COLUMN contact_person VARCHAR(255) NULL AFTER company_name` },
        { column: "email", sql: `ALTER TABLE ${TABLE} ADD COLUMN email VARCHAR(255) NULL AFTER contact_person` },
        { column: "phone", sql: `ALTER TABLE ${TABLE} ADD COLUMN phone VARCHAR(50) NULL AFTER email` },
        {
            column: "status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER phone`,
        },
        { column: "created_at", sql: `ALTER TABLE ${TABLE} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
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

    for (const column of OBSOLETE_COLUMNS) {
        if (columns.has(column)) {
            await pool.query(`ALTER TABLE ${TABLE} DROP COLUMN ${pool.escapeId(column)}`);
            columns.delete(column);
        }
    }
}

export async function ensureAdminAmcCompaniesTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminAmcCompaniesTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

export const COMPANY_LIST_COLUMNS = "id, company_name, contact_person, email, phone, status";
