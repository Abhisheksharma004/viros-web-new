import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcAssetsTable } from "@/lib/adminAmcAssets";
import { ensureAdminAmcWorkRecordsTable } from "@/lib/adminAmcWorkRecords";
import { ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";
import { getEmployeeSession } from "@/lib/employeeSession";

const ASSET_LOOKUP_SQL = `
  SELECT a.id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
         a.user_known_issue, a.user_issue_reporting_date, a.engineer_remarks, a.engineer_remarks_date_time,
         c.company_name AS company_name
  FROM admin_amc_assets a
  LEFT JOIN admin_amc_companies c ON c.id = a.company_id
  WHERE TRIM(a.tag_code) = ?
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
            return NextResponse.json({ message: "Barcode or tag code is required" }, { status: 400 });
        }

        await ensureAdminAmcCompaniesTable();
        await ensureAdminAmcAssetsTable();
        await ensureAdminAmcWorkRecordsTable();

        const [rows] = await pool.query<RowDataPacket[]>(ASSET_LOOKUP_SQL, [code]);
        const row = rows[0];
        if (!row) {
            return NextResponse.json(
                { message: "No asset found for this barcode / tag", code },
                { status: 404 },
            );
        }

        return NextResponse.json(row, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error looking up AMC asset:", error);
        return NextResponse.json({ message: "Failed to look up asset", error: message }, { status: 500 });
    }
}
