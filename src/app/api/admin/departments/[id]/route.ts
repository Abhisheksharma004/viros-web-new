import type { ResultSetHeader, RowDataPacket } from "mysql2";
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminDepartmentsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid department id" }, { status: 400 });
        }

        const [rows] = await pool.query(
            "SELECT id, name, head, employees, status, budget_amount, notes FROM admin_departments WHERE id = ? LIMIT 1",
            [id],
        );
        const list = rows as RowDataPacket[];
        const row = list[0];
        if (!row) {
            return NextResponse.json({ message: "Department not found" }, { status: 404 });
        }

        return NextResponse.json(row);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin department:", error);
        return NextResponse.json({ message: "Failed to fetch department", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminDepartmentsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid department id" }, { status: 400 });
        }

        const body = await request.json();
        const { name, head, employees, status, notes } = body;

        if (!name || !head) {
            return NextResponse.json({ message: "Department name and head are required" }, { status: 400 });
        }

        const safeEmployees = Number.isFinite(Number(employees)) ? Math.max(0, Number(employees)) : 0;
        const allowedStatuses = ["Active", "Growing", "On Hold", "Planned", "Inactive"];
        const safeStatus = allowedStatuses.includes(status) ? status : "Active";

        const [result] = await pool.query(
            `UPDATE admin_departments
             SET name = ?, head = ?, employees = ?, status = ?, notes = ?
             WHERE id = ?`,
            [name, head, safeEmployees, safeStatus, notes || null, id],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Department not found" }, { status: 404 });
        }

        const [rows] = await pool.query(
            "SELECT id, name, head, employees, status, budget_amount FROM admin_departments WHERE id = ?",
            [id],
        );
        const updated = (rows as RowDataPacket[])[0];
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating admin department:", error);
        return NextResponse.json({ message: "Failed to update department", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminDepartmentsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid department id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_departments WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Department not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting admin department:", error);
        return NextResponse.json({ message: "Failed to delete department", error: message }, { status: 500 });
    }
}
