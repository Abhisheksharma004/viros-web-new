import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

export async function GET(request: Request) {
    try {
        await ensureAdminEmployeesTable();

        const { searchParams } = new URL(request.url);
        const employeeId = (searchParams.get("employee_id") ?? "").trim();

        if (!employeeId) {
            return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
        }

        const [rows] = await pool.query(
            `SELECT employee_id, full_name, department, designation, official_email, employee_status
             FROM admin_employees
             WHERE employee_id = ?
             LIMIT 1`,
            [employeeId],
        );

        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json({
            employee_id: row.employee_id,
            full_name: row.full_name,
            department: row.department ?? "",
            designation: row.designation ?? "",
            official_email: row.official_email ?? "",
            employee_status: row.employee_status ?? "Active",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error looking up employee:", error);
        return NextResponse.json({ message: "Failed to look up employee", error: message }, { status: 500 });
    }
}
