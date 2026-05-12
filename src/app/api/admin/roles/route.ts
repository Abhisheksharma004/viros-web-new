import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

    const [columnRows]: any = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'admin_roles'
           AND COLUMN_NAME = 'department'`
    );

    if (!columnRows?.[0]?.count) {
        await pool.query(
            "ALTER TABLE admin_roles ADD COLUMN department VARCHAR(255) NOT NULL DEFAULT 'General' AFTER id"
        );
    }

    const [legacyAccessColumnRows]: any = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'admin_roles'
           AND COLUMN_NAME = 'access_level'`
    );
    if (legacyAccessColumnRows?.[0]?.count) {
        await pool.query("ALTER TABLE admin_roles DROP COLUMN access_level");
    }

    const [legacyAssignedColumnRows]: any = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'admin_roles'
           AND COLUMN_NAME = 'assigned_users'`
    );
    if (legacyAssignedColumnRows?.[0]?.count) {
        await pool.query("ALTER TABLE admin_roles DROP COLUMN assigned_users");
    }
}

export async function GET() {
    try {
        await ensureAdminRolesTable();
        const [rows] = await pool.query(
            "SELECT id, department, name, status FROM admin_roles ORDER BY created_at ASC"
        );
        return NextResponse.json(rows, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: any) {
        console.error("Error fetching admin roles:", error);
        return NextResponse.json(
            { message: "Failed to fetch roles", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminRolesTable();
        const body = await request.json();
        const { department, name, status, notes } = body;

        if (!department || !name) {
            return NextResponse.json({ message: "Department and role name are required" }, { status: 400 });
        }

        const allowedStatuses = ["Active", "Growing", "On Hold", "Planned", "Inactive"];
        const safeStatus = allowedStatuses.includes(status) ? status : "Active";

        const [result]: any = await pool.query(
            `INSERT INTO admin_roles (department, name, status, notes)
             VALUES (?, ?, ?, ?)`,
            [department, name, safeStatus, notes || null]
        );

        const [rows]: any = await pool.query(
            "SELECT id, department, name, status FROM admin_roles WHERE id = ?",
            [result.insertId]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating admin role:", error);
        return NextResponse.json(
            { message: "Failed to create role", error: error.message },
            { status: 500 }
        );
    }
}
