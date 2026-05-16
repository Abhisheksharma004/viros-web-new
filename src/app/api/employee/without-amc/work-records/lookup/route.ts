import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    ensureAdminWithoutAmcWorkRecordsTable,
    WITHOUT_AMC_WORK_RECORDS_TABLE,
} from "@/lib/adminWithoutAmcWorkRecords";
import { getEmployeeSession } from "@/lib/employeeSession";

const SERIAL_LOOKUP_SQL = `
  SELECT id, asset_id, employee_id, employee_name, scanned_tag_code,
         company_id, company_name, asset_name, asset_description, tag_code, category, status,
         user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time,
         created_at, updated_at
  FROM ${WITHOUT_AMC_WORK_RECORDS_TABLE}
  WHERE TRIM(tag_code) = ? OR TRIM(scanned_tag_code) = ?
  ORDER BY created_at DESC
  LIMIT 1
`;

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const code = (searchParams.get("code") ?? searchParams.get("tag") ?? "").trim();
        if (!code) {
            return NextResponse.json({ message: "Serial number is required" }, { status: 400 });
        }

        await ensureAdminWithoutAmcWorkRecordsTable();

        const [rows] = await pool.query<RowDataPacket[]>(SERIAL_LOOKUP_SQL, [code, code]);
        const record = rows[0];

        if (!record) {
            return NextResponse.json(
                { found: false, serial: code },
                { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
            );
        }

        return NextResponse.json(
            { found: true, serial: code, record },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error looking up without-AMC serial:", error);
        return NextResponse.json({ message: "Failed to look up serial", error: message }, { status: 500 });
    }
}
