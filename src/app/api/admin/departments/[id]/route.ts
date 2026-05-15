import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { DEPARTMENT_LIST_COLUMNS, ensureAdminDepartmentsTable } from "@/lib/adminDepartments";

const ALLOWED_STATUSES = ["Active", "Growing", "On Hold", "Planned", "Inactive"] as const;

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
            `SELECT ${DEPARTMENT_LIST_COLUMNS}, notes FROM admin_departments WHERE id = ? LIMIT 1`,
            [id],
        );

        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Department not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...row,
            employees: Number(row.employees) || 0,
            budget_amount: Number(row.budget_amount) || 0,
        });
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
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const head = typeof body.head === "string" ? body.head.trim() : "";

        if (!name || !head) {
            return NextResponse.json({ message: "Department name and head are required" }, { status: 400 });
        }

        const safeEmployees = Number.isFinite(Number(body.employees)) ? Math.max(0, Number(body.employees)) : 0;
        const safeStatus = ALLOWED_STATUSES.includes(body.status) ? body.status : "Active";
        const notes = typeof body.notes === "string" ? body.notes : null;

        const [result] = await pool.query(
            `UPDATE admin_departments
             SET name = ?, head = ?, employees = ?, status = ?, notes = ?
             WHERE id = ?`,
            [name, head, safeEmployees, safeStatus, notes, id],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Department not found" }, { status: 404 });
        }

        const [rows] = await pool.query(
            `SELECT ${DEPARTMENT_LIST_COLUMNS} FROM admin_departments WHERE id = ?`,
            [id],
        );

        const updated = (rows as RowDataPacket[])[0];
        return NextResponse.json({
            ...updated,
            employees: Number(updated.employees) || 0,
            budget_amount: Number(updated.budget_amount) || 0,
        });
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
