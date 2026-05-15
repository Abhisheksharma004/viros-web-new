import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const TABLE = "admin_departments";

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

async function runEnsureAdminDepartmentsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            head VARCHAR(255) NOT NULL,
            employees INT NOT NULL DEFAULT 0,
            status ENUM('Active', 'Growing', 'On Hold', 'Planned', 'Inactive') NOT NULL DEFAULT 'Active',
            budget_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    let columns = await getExistingColumns();

    const migrations: Array<{ column: string; sql: string }> = [
        { column: "name", sql: `ALTER TABLE ${TABLE} ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '' AFTER id` },
        { column: "head", sql: `ALTER TABLE ${TABLE} ADD COLUMN head VARCHAR(255) NOT NULL DEFAULT '' AFTER name` },
        { column: "employees", sql: `ALTER TABLE ${TABLE} ADD COLUMN employees INT NOT NULL DEFAULT 0 AFTER head` },
        {
            column: "status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN status ENUM('Active', 'Growing', 'On Hold', 'Planned', 'Inactive') NOT NULL DEFAULT 'Active' AFTER employees`,
        },
        {
            column: "budget_amount",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN budget_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER status`,
        },
        { column: "notes", sql: `ALTER TABLE ${TABLE} ADD COLUMN notes TEXT NULL AFTER budget_amount` },
        { column: "created_at", sql: `ALTER TABLE ${TABLE} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
        { column: "updated_at", sql: `ALTER TABLE ${TABLE} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` },
    ];

    for (const migration of migrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }
}

export async function ensureAdminDepartmentsTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminDepartmentsTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

export const DEPARTMENT_LIST_COLUMNS =
    "id, name, head, employees, status, budget_amount";
