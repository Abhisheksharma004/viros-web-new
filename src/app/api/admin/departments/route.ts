import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { DEPARTMENT_LIST_COLUMNS, ensureAdminDepartmentsTable } from "@/lib/adminDepartments";

const ALLOWED_STATUSES = ["Active", "Growing", "On Hold", "Planned", "Inactive"] as const;

export async function GET() {
    try {
        await ensureAdminDepartmentsTable();
        const [rows] = await pool.query(
            `SELECT ${DEPARTMENT_LIST_COLUMNS} FROM admin_departments ORDER BY created_at ASC`,
        );

        const list = (rows as RowDataPacket[]).map((row) => ({
            ...row,
            employees: Number(row.employees) || 0,
            budget_amount: Number(row.budget_amount) || 0,
        }));

        return NextResponse.json(list, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin departments:", error);
        return NextResponse.json({ message: "Failed to fetch departments", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminDepartmentsTable();
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
            `INSERT INTO admin_departments (name, head, employees, status, budget_amount, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, head, safeEmployees, safeStatus, 0, notes],
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query(
            `SELECT ${DEPARTMENT_LIST_COLUMNS} FROM admin_departments WHERE id = ?`,
            [insertId],
        );

        const row = (rows as RowDataPacket[])[0];
        return NextResponse.json(
            {
                ...row,
                employees: Number(row.employees) || 0,
                budget_amount: Number(row.budget_amount) || 0,
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating admin department:", error);
        return NextResponse.json({ message: "Failed to create department", error: message }, { status: 500 });
    }
}
