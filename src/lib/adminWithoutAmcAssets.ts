import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const WITHOUT_AMC_ASSETS_TABLE = "admin_without_amc_assets";

type ColumnNameRow = RowDataPacket & { COLUMN_NAME: string };

let ensureTablePromise: Promise<void> | null = null;

async function getExistingColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<ColumnNameRow[]>(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [WITHOUT_AMC_ASSETS_TABLE],
    );
    return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function runEnsureAdminWithoutAmcAssetsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${WITHOUT_AMC_ASSETS_TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            amc_asset_id INT NULL,
            company_id INT NULL,
            asset_name VARCHAR(255) NOT NULL,
            asset_description TEXT NULL,
            tag_code VARCHAR(120) NULL,
            category VARCHAR(120) NULL,
            status ENUM('Active', 'Inactive', 'Maintenance') NOT NULL DEFAULT 'Active',
            user_known_issue TEXT NULL,
            user_issue_reporting_date DATE NULL,
            engineer_remarks TEXT NULL,
            engineer_remarks_date_time TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_without_amc_assets_tag (tag_code),
            INDEX idx_without_amc_assets_amc (amc_asset_id),
            INDEX idx_without_amc_assets_company (company_id)
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        {
            column: "amc_asset_id",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN amc_asset_id INT NULL AFTER id`,
        },
        { column: "company_id", sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN company_id INT NULL AFTER amc_asset_id` },
        {
            column: "asset_name",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN asset_name VARCHAR(255) NOT NULL DEFAULT '' AFTER company_id`,
        },
        {
            column: "asset_description",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN asset_description TEXT NULL AFTER asset_name`,
        },
        {
            column: "tag_code",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN tag_code VARCHAR(120) NULL AFTER asset_description`,
        },
        {
            column: "category",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN category VARCHAR(120) NULL AFTER tag_code`,
        },
        {
            column: "status",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN status ENUM('Active', 'Inactive', 'Maintenance') NOT NULL DEFAULT 'Active' AFTER category`,
        },
        {
            column: "user_known_issue",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN user_known_issue TEXT NULL AFTER status`,
        },
        {
            column: "user_issue_reporting_date",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN user_issue_reporting_date DATE NULL AFTER user_known_issue`,
        },
        {
            column: "engineer_remarks",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN engineer_remarks TEXT NULL AFTER user_issue_reporting_date`,
        },
        {
            column: "engineer_remarks_date_time",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN engineer_remarks_date_time TIMESTAMP NULL AFTER engineer_remarks`,
        },
        {
            column: "created_at",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        },
        {
            column: "updated_at",
            sql: `ALTER TABLE ${WITHOUT_AMC_ASSETS_TABLE} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
        },
    ];

    for (const migration of migrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }
}

export async function ensureAdminWithoutAmcAssetsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminWithoutAmcAssetsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}
