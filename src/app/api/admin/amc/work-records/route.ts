import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcWorkRecordsTable, type AmcWorkType } from "@/lib/adminAmcWorkRecords";

const WORK_RECORDS_LIST_SQL = `
  SELECT id, asset_id, employee_id, employee_name, scanned_tag_code,
         company_id, company_name, asset_name, asset_description, tag_code, category, status,
         user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time,
         work_type, created_at, updated_at
  FROM admin_amc_work_records
  WHERE work_type = ?
  ORDER BY created_at DESC
`;

function normalizeWorkType(raw: string | null): AmcWorkType {
    return raw === "without_amc" ? "without_amc" : "amc";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const workType = normalizeWorkType(searchParams.get("work_type"));

        await ensureAdminAmcWorkRecordsTable();

        const [rows] = await pool.query<RowDataPacket[]>(WORK_RECORDS_LIST_SQL, [workType]);

        return NextResponse.json(rows, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching AMC work records:", error);
        return NextResponse.json({ message: "Failed to load work records", error: message }, { status: 500 });
    }
}
