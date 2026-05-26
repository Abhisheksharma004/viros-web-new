import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminDepartmentsTable } from "@/lib/adminDepartments";
import { getEmployeeSession } from "@/lib/employeeSession";

async function ensureAdminRolesTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            department VARCHAR(255) NOT NULL DEFAULT 'General',
            name VARCHAR(255) NOT NULL,
            status ENUM('Active', 'Growing', 'On Hold', 'Planned', 'Inactive') NOT NULL DEFAULT 'Active',
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureAdminDepartmentsTable();
        await ensureAdminRolesTable();

        const [departments] = await pool.query<RowDataPacket[]>(
            `SELECT id, name FROM admin_departments ORDER BY name ASC`,
        );

        const [roles] = await pool.query<RowDataPacket[]>(
            `SELECT id, department, name, status FROM admin_roles WHERE status = 'Active' ORDER BY department ASC, name ASC`,
        );

        return NextResponse.json({
            departments: departments.map((d) => ({
                id: Number(d.id),
                name: String(d.name ?? ""),
            })),
            roles: roles.map((r) => ({
                id: Number(r.id),
                department: String(r.department ?? ""),
                name: String(r.name ?? ""),
                status: String(r.status ?? "Active"),
            })),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee profile meta:", error);
        return NextResponse.json({ message: "Failed to fetch form options", error: message }, { status: 500 });
    }
}
