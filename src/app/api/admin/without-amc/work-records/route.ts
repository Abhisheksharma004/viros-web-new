import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    ensureAdminWithoutAmcWorkRecordsTable,
    WITHOUT_AMC_WORK_RECORDS_TABLE,
} from "@/lib/adminWithoutAmcWorkRecords";

const WORK_RECORDS_LIST_SQL = `
  SELECT id, asset_id, employee_id, employee_name, scanned_tag_code,
         company_id, company_name, asset_name, asset_description, tag_code, category, status,
         user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time,
         created_at, updated_at
  FROM ${WITHOUT_AMC_WORK_RECORDS_TABLE}
  ORDER BY created_at DESC
`;

export async function GET() {
    try {
        await ensureAdminWithoutAmcWorkRecordsTable();

        const [rows] = await pool.query<RowDataPacket[]>(WORK_RECORDS_LIST_SQL);

        return NextResponse.json(rows, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching without-AMC work records:", error);
        return NextResponse.json({ message: "Failed to load work records", error: message }, { status: 500 });
    }
}
