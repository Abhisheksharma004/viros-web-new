import { NextResponse } from "next/server";
import pool from "@/lib/db";

async function ensureAdminDepartmentsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_departments (
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
}

export async function GET() {
    try {
        await ensureAdminDepartmentsTable();
        const [rows] = await pool.query(
            "SELECT id, name, head, employees, status, budget_amount FROM admin_departments ORDER BY created_at ASC"
        );
        return NextResponse.json(rows, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: any) {
        console.error("Error fetching admin departments:", error);
        return NextResponse.json(
            { message: "Failed to fetch departments", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminDepartmentsTable();
        const body = await request.json();
        const { name, head, employees, status, notes } = body;

        if (!name || !head) {
            return NextResponse.json(
                { message: "Department name and head are required" },
                { status: 400 }
            );
        }

        const safeEmployees = Number.isFinite(Number(employees)) ? Math.max(0, Number(employees)) : 0;
        const allowedStatuses = ["Active", "Growing", "On Hold", "Planned", "Inactive"];
        const safeStatus = allowedStatuses.includes(status) ? status : "Active";

        const [result]: any = await pool.query(
            `INSERT INTO admin_departments (name, head, employees, status, budget_amount, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, head, safeEmployees, safeStatus, 0, notes || null]
        );

        const [rows]: any = await pool.query(
            "SELECT id, name, head, employees, status, budget_amount FROM admin_departments WHERE id = ?",
            [result.insertId]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating admin department:", error);
        return NextResponse.json(
            { message: "Failed to create department", error: error.message },
            { status: 500 }
        );
    }
}
