import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const TABLE = "admin_amc_assets";

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

async function runEnsureAdminAmcAssetsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NULL,
            asset_name VARCHAR(255) NOT NULL,
            asset_description TEXT NULL,
            tag_code VARCHAR(120) NULL,
            category VARCHAR(120) NULL,
            status ENUM('Active', 'Inactive', 'Maintenance') NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_amc_assets_company (company_id)
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        { column: "company_id", sql: `ALTER TABLE ${TABLE} ADD COLUMN company_id INT NULL AFTER id` },
        {
            column: "asset_name",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN asset_name VARCHAR(255) NOT NULL DEFAULT '' AFTER company_id`,
        },
        {
            column: "asset_description",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN asset_description TEXT NULL AFTER asset_name`,
        },
        { column: "tag_code", sql: `ALTER TABLE ${TABLE} ADD COLUMN tag_code VARCHAR(120) NULL AFTER asset_description` },
        { column: "category", sql: `ALTER TABLE ${TABLE} ADD COLUMN category VARCHAR(120) NULL AFTER tag_code` },
        {
            column: "status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN status ENUM('Active', 'Inactive', 'Maintenance') NOT NULL DEFAULT 'Active' AFTER category`,
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
}

export async function ensureAdminAmcAssetsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminAmcAssetsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}
