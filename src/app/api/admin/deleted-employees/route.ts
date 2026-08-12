import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

export async function GET() {
    try {
        await ensureAdminEmployeesTable();
        const [rows] = await pool.query(
            `SELECT id, employee_id, full_name, designation, department, official_email, employee_status, created_at, deleted_at
             FROM admin_employees
             WHERE is_deleted = 1
             ORDER BY deleted_at DESC, id DESC`
        );
        return NextResponse.json(rows, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching deleted admin employees:", error);
        return NextResponse.json({ message: "Failed to fetch deleted employees", error: message }, { status: 500 });
    }
}
