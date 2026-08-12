import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

const ACCESS_TABLE = "user_access_control";
const PERMISSIONS_TABLE = "user_module_permissions";

export interface PermissionScope {
    module: string;
    category: string;
    read: boolean;
    write: boolean;
    delete?: boolean;
    admin: boolean;
}

export interface UserAccessRecord {
    id: string; // employee_id
    fullName: string;
    email: string;
    username: string;
    role: string;
    status: "Active" | "Suspended" | "Pending Invite";
    department: string;
    lastActive: string;
    createdAt: string;
    permissions: PermissionScope[];
}

let tablesEnsuredPromise: Promise<void> | null = null;

export async function ensureUserAccessTables(): Promise<void> {
    if (!tablesEnsuredPromise) {
        tablesEnsuredPromise = (async () => {
            await ensureAdminEmployeesTable();

            // 1. Create main user_access_control table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${ACCESS_TABLE} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(64) NOT NULL,
                    full_name VARCHAR(191) NOT NULL,
                    email VARCHAR(191) NOT NULL DEFAULT '',
                    username VARCHAR(191) NOT NULL DEFAULT '',
                    role VARCHAR(64) NOT NULL DEFAULT 'Standard User',
                    status VARCHAR(32) NOT NULL DEFAULT 'Active',
                    department VARCHAR(128) NOT NULL DEFAULT 'General',
                    last_active VARCHAR(128) NOT NULL DEFAULT 'Just created',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_employee_access_id (employee_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // 2. Create granular module permissions table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${PERMISSIONS_TABLE} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id VARCHAR(64) NOT NULL,
                    module_name VARCHAR(128) NOT NULL,
                    category VARCHAR(128) NOT NULL,
                    can_read TINYINT(1) NOT NULL DEFAULT 0,
                    can_write TINYINT(1) NOT NULL DEFAULT 0,
                    can_delete TINYINT(1) NOT NULL DEFAULT 0,
                    can_admin TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_emp_mod (employee_id, module_name),
                    KEY idx_emp_id (employee_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            // Migration check for can_delete column
            const [cols] = await pool.query<RowDataPacket[]>(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'can_delete'`,
                [PERMISSIONS_TABLE]
            );
            if (!cols || cols.length === 0) {
                await pool.query(`ALTER TABLE ${PERMISSIONS_TABLE} ADD COLUMN can_delete TINYINT(1) NOT NULL DEFAULT 0 AFTER can_write`);
            }
        })().catch((err) => {
            tablesEnsuredPromise = null;
            throw err;
        });
    }
    await tablesEnsuredPromise;
}

/** Get all granted user access records and their permissions */
export async function getAllGrantedUserAccessRecords(): Promise<UserAccessRecord[]> {
    await ensureUserAccessTables();

    const [users] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id, full_name, email, username, role, status, department, last_active, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at
         FROM ${ACCESS_TABLE}
         ORDER BY id DESC`
    );

    if (!Array.isArray(users) || users.length === 0) {
        return [];
    }

    const [perms] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id, module_name, category, can_read, can_write, can_delete, can_admin
         FROM ${PERMISSIONS_TABLE}`
    );

    const permsMap = new Map<string, PermissionScope[]>();
    if (Array.isArray(perms)) {
        for (const p of perms) {
            const empId = p.employee_id;
            if (!permsMap.has(empId)) permsMap.set(empId, []);
            permsMap.get(empId)!.push({
                module: p.module_name,
                category: p.category,
                read: Boolean(p.can_read),
                write: Boolean(p.can_write),
                delete: Boolean(p.can_delete),
                admin: Boolean(p.can_admin),
            });
        }
    }

    return users.map((u) => ({
        id: u.employee_id,
        fullName: u.full_name,
        email: u.email,
        username: u.username,
        role: u.role,
        status: u.status as "Active" | "Suspended" | "Pending Invite",
        department: u.department,
        lastActive: u.last_active,
        createdAt: u.created_at || new Date().toISOString().split("T")[0],
        permissions: permsMap.get(u.employee_id) || [],
    }));
}

/** Save or update granted user access and module permissions for an employee */
export async function saveUserAccessPermissions(record: {
    employeeId: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    status: string;
    department: string;
    permissions: PermissionScope[];
}): Promise<boolean> {
    await ensureUserAccessTables();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Upsert user access record
        await conn.query(
            `INSERT INTO ${ACCESS_TABLE} 
                (employee_id, full_name, email, username, role, status, department)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                email = VALUES(email),
                username = VALUES(username),
                role = VALUES(role),
                status = VALUES(status),
                department = VALUES(department)`,
            [
                record.employeeId,
                record.fullName,
                record.email,
                record.username,
                record.role,
                record.status,
                record.department,
            ]
        );

        // Delete existing permissions for clean insert/update
        await conn.query(`DELETE FROM ${PERMISSIONS_TABLE} WHERE employee_id = ?`, [record.employeeId]);

        // Insert new granted permissions
        if (record.permissions && record.permissions.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];

            for (const p of record.permissions) {
                placeholders.push("(?, ?, ?, ?, ?, ?, ?)");
                values.push(
                    record.employeeId,
                    p.module,
                    p.category,
                    p.read ? 1 : 0,
                    p.write ? 1 : 0,
                    p.delete ? 1 : 0,
                    p.admin ? 1 : 0
                );
            }

            if (placeholders.length > 0) {
                await conn.query(
                    `INSERT INTO ${PERMISSIONS_TABLE} 
                        (employee_id, module_name, category, can_read, can_write, can_delete, can_admin)
                     VALUES ${placeholders.join(", ")}`,
                    values
                );
            }
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        console.error("Error saving user access permissions:", error);
        throw error;
    } finally {
        conn.release();
    }
}

/** Revoke user access completely */
export async function revokeUserAccess(employeeId: string): Promise<boolean> {
    await ensureUserAccessTables();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`DELETE FROM ${PERMISSIONS_TABLE} WHERE employee_id = ?`, [employeeId]);
        const [res] = await conn.query<ResultSetHeader>(`DELETE FROM ${ACCESS_TABLE} WHERE employee_id = ?`, [employeeId]);
        await conn.commit();
        return res.affectedRows > 0;
    } catch (error) {
        await conn.rollback();
        console.error("Error revoking user access:", error);
        throw error;
    } finally {
        conn.release();
    }
}

/** Get granted permissions for a specific employee ID */
export async function getEmployeeGrantedPermissions(employeeId: string): Promise<{
    role: string;
    status: string;
    permissions: PermissionScope[];
}> {
    await ensureUserAccessTables();

    const [users] = await pool.query<RowDataPacket[]>(
        `SELECT role, status FROM ${ACCESS_TABLE} WHERE employee_id = ? AND status = 'Active' LIMIT 1`,
        [employeeId]
    );

    const user = users[0];
    if (!user) {
        return { role: "Standard User", status: "Inactive", permissions: [] };
    }

    const [perms] = await pool.query<RowDataPacket[]>(
        `SELECT module_name, category, can_read, can_write, can_delete, can_admin
         FROM ${PERMISSIONS_TABLE}
         WHERE employee_id = ? AND (can_read = 1 OR can_write = 1 OR can_delete = 1 OR can_admin = 1)`,
        [employeeId]
    );

    const permissions: PermissionScope[] = Array.isArray(perms)
        ? perms.map((p) => ({
              module: p.module_name,
              category: p.category,
              read: Boolean(p.can_read),
              write: Boolean(p.can_write),
              delete: Boolean(p.can_delete),
              admin: Boolean(p.can_admin),
          }))
        : [];

    return {
        role: user.role,
        status: user.status,
        permissions,
    };
}
