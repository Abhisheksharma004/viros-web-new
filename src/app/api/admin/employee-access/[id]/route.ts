import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
    EMPLOYEE_ACCESS_LIST_FROM,
    EMPLOYEE_ACCESS_LIST_SELECT,
    ensureEmployeeAccessDependencies,
} from "@/lib/adminEmployeeAccess";

const ALLOWED_PORTAL_STATUSES = ["Active", "Disabled", "Inactive"] as const;

function pickPortalStatus(value: unknown): (typeof ALLOWED_PORTAL_STATUSES)[number] {
    return ALLOWED_PORTAL_STATUSES.includes(value as (typeof ALLOWED_PORTAL_STATUSES)[number])
        ? (value as (typeof ALLOWED_PORTAL_STATUSES)[number])
        : "Active";
}

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureEmployeeAccessDependencies();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid id" }, { status: 400 });
        }

        const [rows] = await pool.query(
            `SELECT ${EMPLOYEE_ACCESS_LIST_SELECT}
             ${EMPLOYEE_ACCESS_LIST_FROM}
             WHERE ea.id = ? LIMIT 1`,
            [id],
        );

        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Employee access record not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...row,
            created_at:
                row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee access:", error);
        return NextResponse.json({ message: "Failed to fetch employee access", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureEmployeeAccessDependencies();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid id" }, { status: 400 });
        }

        const body = await request.json();
        const employeeId = str(body.employee_id);
        const fullName = str(body.full_name);

        if (!employeeId || !fullName) {
            return NextResponse.json({ message: "Employee ID and full name are required" }, { status: 400 });
        }

        const department = str(body.department);
        const designation = str(body.designation);
        const officialEmail = str(body.official_email);
        const portalStatus = pickPortalStatus(body.portal_status);
        const password = str(body.password);

        let updateSql = `UPDATE admin_employee_access
             SET employee_id = ?, full_name = ?, department = ?, designation = ?, official_email = ?,
                 portal_status = ?`;
        const updateParams: unknown[] = [employeeId, fullName, department, designation, officialEmail, portalStatus];

        if (password) {
            const passwordHash = await hashPassword(password);
            updateSql += `, password_hash = ?`;
            updateParams.push(passwordHash);
        }

        updateSql += ` WHERE id = ?`;
        updateParams.push(id);

        const [result] = await pool.query(updateSql, updateParams);

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Employee access record not found" }, { status: 404 });
        }

        const [rows] = await pool.query(
            `SELECT ${EMPLOYEE_ACCESS_LIST_SELECT}
             ${EMPLOYEE_ACCESS_LIST_FROM}
             WHERE ea.id = ?`,
            [id],
        );

        const row = (rows as RowDataPacket[])[0];
        return NextResponse.json({
            ...row,
            created_at:
                row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("Duplicate") || message.includes("duplicate")) {
            return NextResponse.json({ message: "This Employee ID is already in use." }, { status: 409 });
        }
        console.error("Error updating employee access:", error);
        return NextResponse.json({ message: "Failed to update employee access", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureEmployeeAccessDependencies();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_employee_access WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Employee access record not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting employee access:", error);
        return NextResponse.json({ message: "Failed to delete employee access", error: message }, { status: 500 });
    }
}
