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

export async function GET() {
    try {
        await ensureEmployeeAccessDependencies();
        const [rows] = await pool.query(
            `SELECT ${EMPLOYEE_ACCESS_LIST_SELECT}
             ${EMPLOYEE_ACCESS_LIST_FROM}
             ORDER BY ea.created_at DESC`,
        );

        const list = (rows as RowDataPacket[]).map((row) => ({
            ...row,
            created_at:
                row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
        }));

        return NextResponse.json(list, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee access:", error);
        return NextResponse.json({ message: "Failed to fetch employee access", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureEmployeeAccessDependencies();
        const body = await request.json();

        const employeeId = str(body.employee_id);
        const fullName = str(body.full_name);
        const password = str(body.password);

        if (!employeeId || !fullName) {
            return NextResponse.json({ message: "Employee ID and full name are required" }, { status: 400 });
        }

        if (!password) {
            return NextResponse.json({ message: "Password is required" }, { status: 400 });
        }

        const department = str(body.department);
        const designation = str(body.designation);
        const officialEmail = str(body.official_email);
        const portalStatus = pickPortalStatus(body.portal_status);
        const passwordHash = await hashPassword(password);

        const [result] = await pool.query(
            `INSERT INTO admin_employee_access (
                employee_id, full_name, department, designation, official_email,
                portal_status, password_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [employeeId, fullName, department, designation, officialEmail, portalStatus, passwordHash],
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query(
            `SELECT ${EMPLOYEE_ACCESS_LIST_SELECT}
             ${EMPLOYEE_ACCESS_LIST_FROM}
             WHERE ea.id = ?`,
            [insertId],
        );

        const row = (rows as RowDataPacket[])[0];
        return NextResponse.json(
            {
                ...row,
                created_at:
                    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("Duplicate") || message.includes("duplicate")) {
            return NextResponse.json({ message: "This Employee ID is already in use." }, { status: 409 });
        }
        console.error("Error creating employee access:", error);
        return NextResponse.json({ message: "Failed to create employee access", error: message }, { status: 500 });
    }
}
