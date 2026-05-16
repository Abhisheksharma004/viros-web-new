import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const TABLE = "admin_amc_work_records";

export type AmcWorkType = "amc" | "without_amc";

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

async function runEnsureAdminAmcWorkRecordsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            asset_id INT NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            employee_name VARCHAR(255) NULL,
            scanned_tag_code VARCHAR(120) NULL,
            company_id INT NULL,
            company_name VARCHAR(255) NULL,
            asset_name VARCHAR(255) NULL,
            asset_description TEXT NULL,
            tag_code VARCHAR(120) NULL,
            category VARCHAR(120) NULL,
            status VARCHAR(32) NULL,
            user_known_issue TEXT NULL,
            user_issue_reporting_date DATE NULL,
            engineer_remarks TEXT NULL,
            engineer_remarks_date_time TIMESTAMP NULL,
            work_type ENUM('amc', 'without_amc') NOT NULL DEFAULT 'amc',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_amc_work_asset (asset_id),
            INDEX idx_amc_work_employee (employee_id),
            INDEX idx_amc_work_type (work_type)
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        { column: "asset_id", sql: `ALTER TABLE ${TABLE} ADD COLUMN asset_id INT NOT NULL AFTER id` },
        {
            column: "employee_id",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN employee_id VARCHAR(64) NOT NULL DEFAULT '' AFTER asset_id`,
        },
        {
            column: "employee_name",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN employee_name VARCHAR(255) NULL AFTER employee_id`,
        },
        {
            column: "scanned_tag_code",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN scanned_tag_code VARCHAR(120) NULL AFTER employee_name`,
        },
        {
            column: "company_id",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN company_id INT NULL AFTER scanned_tag_code`,
        },
        {
            column: "company_name",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN company_name VARCHAR(255) NULL AFTER company_id`,
        },
        {
            column: "asset_name",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN asset_name VARCHAR(255) NULL AFTER company_name`,
        },
        {
            column: "asset_description",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN asset_description TEXT NULL AFTER asset_name`,
        },
        {
            column: "tag_code",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN tag_code VARCHAR(120) NULL AFTER asset_description`,
        },
        {
            column: "category",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN category VARCHAR(120) NULL AFTER tag_code`,
        },
        {
            column: "status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN status VARCHAR(32) NULL AFTER category`,
        },
        {
            column: "user_known_issue",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN user_known_issue TEXT NULL AFTER status`,
        },
        {
            column: "user_issue_reporting_date",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN user_issue_reporting_date DATE NULL AFTER user_known_issue`,
        },
        {
            column: "engineer_remarks",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN engineer_remarks TEXT NULL AFTER user_issue_reporting_date`,
        },
        {
            column: "engineer_remarks_date_time",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN engineer_remarks_date_time TIMESTAMP NULL AFTER engineer_remarks`,
        },
        {
            column: "work_type",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN work_type ENUM('amc', 'without_amc') NOT NULL DEFAULT 'amc' AFTER engineer_remarks_date_time`,
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

export async function ensureAdminAmcWorkRecordsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminAmcWorkRecordsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

export const WORK_RECORD_SELECT = `
  r.id AS work_record_id,
  r.asset_id,
  r.employee_id,
  r.employee_name,
  r.scanned_tag_code,
  r.company_id AS work_record_company_id,
  r.company_name AS work_record_company_name,
  r.asset_name AS work_record_asset_name,
  r.asset_description AS work_record_asset_description,
  r.tag_code AS work_record_tag_code,
  r.category AS work_record_category,
  r.status AS work_record_status,
  r.user_known_issue AS work_record_user_known_issue,
  r.user_issue_reporting_date AS work_record_user_issue_reporting_date,
  r.engineer_remarks AS work_record_engineer_remarks,
  r.engineer_remarks_date_time AS work_record_engineer_remarks_date_time,
  r.work_type,
  r.created_at AS work_saved_at,
  r.updated_at AS work_updated_at
`;
