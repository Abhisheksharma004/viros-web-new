import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

const TABLE = "admin_employee_access";

/** Columns stored from the employee access modal (+ id, password_hash, created_at). */
const ALLOWED_COLUMNS = new Set([
    "id",
    "employee_id",
    "full_name",
    "department",
    "designation",
    "official_email",
    "portal_status",
    "password_hash",
    "created_at",
]);

async function getExistingColumns(table: string): Promise<Set<string>> {
    const [rows] = await pool.query<{ COLUMN_NAME: string }[]>(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [table],
    );
    return new Set(rows.map((row) => row.COLUMN_NAME));
}

let ensureAccessTablePromise: Promise<void> | null = null;

async function runEnsureAdminEmployeeAccessTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL DEFAULT '',
            designation VARCHAR(255) NOT NULL DEFAULT '',
            official_email VARCHAR(255) NOT NULL DEFAULT '',
            portal_status ENUM('Active', 'Disabled', 'Inactive') NOT NULL DEFAULT 'Active',
            password_hash VARCHAR(255) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_employee_id (employee_id)
        )
    `);

    let columns = await getExistingColumns(TABLE);

    const addColumnMigrations: Array<{ column: string; sql: string }> = [
        { column: "employee_id", sql: `ALTER TABLE ${TABLE} ADD COLUMN employee_id VARCHAR(64) NOT NULL DEFAULT '' AFTER id` },
        { column: "full_name", sql: `ALTER TABLE ${TABLE} ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT '' AFTER employee_id` },
        { column: "department", sql: `ALTER TABLE ${TABLE} ADD COLUMN department VARCHAR(255) NOT NULL DEFAULT '' AFTER full_name` },
        { column: "designation", sql: `ALTER TABLE ${TABLE} ADD COLUMN designation VARCHAR(255) NOT NULL DEFAULT '' AFTER department` },
        { column: "official_email", sql: `ALTER TABLE ${TABLE} ADD COLUMN official_email VARCHAR(255) NOT NULL DEFAULT '' AFTER designation` },
        {
            column: "portal_status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN portal_status ENUM('Active', 'Disabled', 'Inactive') NOT NULL DEFAULT 'Active' AFTER official_email`,
        },
        { column: "password_hash", sql: `ALTER TABLE ${TABLE} ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER portal_status` },
        { column: "created_at", sql: `ALTER TABLE ${TABLE} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
    ];

    for (const migration of addColumnMigrations) {
        if (!columns.has(migration.column)) {
            await pool.query(migration.sql);
            columns.add(migration.column);
        }
    }

    columns = await getExistingColumns(TABLE);
    for (const column of columns) {
        if (!ALLOWED_COLUMNS.has(column)) {
            await pool.query(`ALTER TABLE ${TABLE} DROP COLUMN \`${column}\``);
        }
    }
}

export async function ensureAdminEmployeeAccessTable() {
    if (!ensureAccessTablePromise) {
        ensureAccessTablePromise = runEnsureAdminEmployeeAccessTable().catch((error) => {
            ensureAccessTablePromise = null;
            throw error;
        });
    }
    await ensureAccessTablePromise;
}

export const EMPLOYEE_ACCESS_LIST_SELECT = `
    ea.id,
    ea.employee_id,
    ea.full_name,
    ea.department,
    ea.designation,
    ea.official_email,
    ea.portal_status,
    e.employee_status AS employee_status,
    ea.created_at
`;

export const EMPLOYEE_ACCESS_LIST_FROM = `
    FROM admin_employee_access ea
    LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
`;

let ensureDepsPromise: Promise<void> | null = null;

export async function ensureEmployeeAccessDependencies() {
    if (!ensureDepsPromise) {
        ensureDepsPromise = (async () => {
            await ensureAdminEmployeeAccessTable();
            await ensureAdminEmployeesTable();
        })().catch((error) => {
            ensureDepsPromise = null;
            throw error;
        });
    }
    await ensureDepsPromise;
}
