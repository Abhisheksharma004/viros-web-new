import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { EMPLOYEE_ACCESS_DEFAULT_PASSWORD } from "@/lib/employeeAccessConstants";

const TABLE = "admin_employee_access";

export { EMPLOYEE_ACCESS_DEFAULT_PASSWORD };

/** Columns stored on admin_employee_access (employee profile fields come from admin_employees join). */
const ALLOWED_COLUMNS = new Set([
    "id",
    "employee_id",
    "official_email",
    "portal_status",
    "default_password",
    "password_hash",
    "created_at",
]);

type ColumnNameRow = RowDataPacket & { COLUMN_NAME: string };

async function getExistingColumns(table: string): Promise<Set<string>> {
    const [rows] = await pool.query<ColumnNameRow[]>(
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
            official_email VARCHAR(255) NOT NULL DEFAULT '',
            portal_status ENUM('Active', 'Disabled', 'Inactive') NOT NULL DEFAULT 'Active',
            default_password VARCHAR(255) NOT NULL DEFAULT '',
            password_hash VARCHAR(255) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_employee_id (employee_id)
        )
    `);

    let columns = await getExistingColumns(TABLE);

    const addColumnMigrations: Array<{ column: string; sql: string }> = [
        { column: "employee_id", sql: `ALTER TABLE ${TABLE} ADD COLUMN employee_id VARCHAR(64) NOT NULL DEFAULT '' AFTER id` },
        { column: "official_email", sql: `ALTER TABLE ${TABLE} ADD COLUMN official_email VARCHAR(255) NOT NULL DEFAULT '' AFTER employee_id` },
        {
            column: "portal_status",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN portal_status ENUM('Active', 'Disabled', 'Inactive') NOT NULL DEFAULT 'Active' AFTER official_email`,
        },
        {
            column: "default_password",
            sql: `ALTER TABLE ${TABLE} ADD COLUMN default_password VARCHAR(255) NOT NULL DEFAULT '' AFTER portal_status`,
        },
        { column: "password_hash", sql: `ALTER TABLE ${TABLE} ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER default_password` },
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

    columns = await getExistingColumns(TABLE);
    if (columns.has("default_password")) {
        const defaultHash = await hashPassword(EMPLOYEE_ACCESS_DEFAULT_PASSWORD);
        await pool.query(
            `UPDATE ${TABLE}
             SET default_password = ?
             WHERE default_password = ''
                OR default_password = ?
                OR (default_password NOT LIKE '$2a$%' AND default_password NOT LIKE '$2b$%')`,
            [defaultHash, EMPLOYEE_ACCESS_DEFAULT_PASSWORD],
        );
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
    e.full_name,
    e.department,
    e.designation,
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

export async function employeeExists(employeeId: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [employeeId],
    );
    return rows.length > 0;
}
