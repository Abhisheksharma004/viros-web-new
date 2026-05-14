import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminRolesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid role id" }, { status: 400 });
        }

        const [rows] = await pool.query(
            "SELECT id, department, name, status, notes FROM admin_roles WHERE id = ? LIMIT 1",
            [id],
        );
        const list = rows as RowDataPacket[];
        const row = list[0];
        if (!row) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        return NextResponse.json(row);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin role:", error);
        return NextResponse.json({ message: "Failed to fetch role", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminRolesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid role id" }, { status: 400 });
        }

        const body = await request.json();
        const { department, name, status, notes } = body;

        if (!department || !name) {
            return NextResponse.json({ message: "Department and role name are required" }, { status: 400 });
        }

        const allowedStatuses = ["Active", "Growing", "On Hold", "Planned", "Inactive"];
        const safeStatus = allowedStatuses.includes(status) ? status : "Active";

        const [result] = await pool.query(
            `UPDATE admin_roles
             SET department = ?, name = ?, status = ?, notes = ?
             WHERE id = ?`,
            [department, name, safeStatus, notes || null, id],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        const [rows] = await pool.query(
            "SELECT id, department, name, status FROM admin_roles WHERE id = ?",
            [id],
        );
        const updated = (rows as RowDataPacket[])[0];
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating admin role:", error);
        return NextResponse.json({ message: "Failed to update role", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminRolesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid role id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_roles WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting admin role:", error);
        return NextResponse.json({ message: "Failed to delete role", error: message }, { status: 500 });
    }
}
