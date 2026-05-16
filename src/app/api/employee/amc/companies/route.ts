import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { COMPANY_LIST_COLUMNS, ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureAdminAmcCompaniesTable();
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT ${COMPANY_LIST_COLUMNS}
             FROM admin_amc_companies
             WHERE status = 'Active' OR status IS NULL
             ORDER BY company_name ASC`,
        );

        const list = rows.map((row) => ({
            id: row.id,
            company_name: typeof row.company_name === "string" ? row.company_name.trim() : "",
        }));

        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching companies for employee:", error);
        return NextResponse.json({ message: "Failed to fetch companies", error: message }, { status: 500 });
    }
}
