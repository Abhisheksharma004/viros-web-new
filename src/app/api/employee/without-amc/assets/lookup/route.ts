import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcAssetsTable } from "@/lib/adminAmcAssets";
import { ensureAdminWithoutAmcAssetsTable, WITHOUT_AMC_ASSETS_TABLE } from "@/lib/adminWithoutAmcAssets";
import { ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";
import { getEmployeeSession } from "@/lib/employeeSession";

const WITHOUT_ASSET_LOOKUP_SQL = `
  SELECT a.id, a.amc_asset_id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
         a.user_known_issue, a.user_issue_reporting_date, a.engineer_remarks, a.engineer_remarks_date_time,
         c.company_name AS company_name
  FROM ${WITHOUT_AMC_ASSETS_TABLE} a
  LEFT JOIN admin_amc_companies c ON c.id = a.company_id
  WHERE TRIM(a.tag_code) = ?
  LIMIT 1
`;

const AMC_ASSET_FOR_SEED_SQL = `
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
        await ensureAdminWithoutAmcAssetsTable();

        const [existingRows] = await pool.query<RowDataPacket[]>(WITHOUT_ASSET_LOOKUP_SQL, [code]);
        if (existingRows[0]) {
            return NextResponse.json(existingRows[0], {
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
            });
        }

        const [amcRows] = await pool.query<RowDataPacket[]>(AMC_ASSET_FOR_SEED_SQL, [code]);
        const amcRow = amcRows[0];
        if (!amcRow) {
            return NextResponse.json(
                { message: "No asset found for this barcode / tag", code },
                { status: 404 },
            );
        }

        const amcAssetId = Number(amcRow.id);
        const [insertResult] = await pool.query<ResultSetHeader>(
            `INSERT INTO ${WITHOUT_AMC_ASSETS_TABLE}
             (amc_asset_id, company_id, asset_name, asset_description, tag_code, category, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                Number.isFinite(amcAssetId) ? amcAssetId : null,
                amcRow.company_id ?? null,
                amcRow.asset_name ?? "",
                amcRow.asset_description ?? null,
                amcRow.tag_code ?? code,
                amcRow.category ?? null,
                amcRow.status ?? "Active",
            ],
        );

        const [seededRows] = await pool.query<RowDataPacket[]>(
            `
            SELECT a.id, a.amc_asset_id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
                   a.user_known_issue, a.user_issue_reporting_date, a.engineer_remarks, a.engineer_remarks_date_time,
                   c.company_name AS company_name
            FROM ${WITHOUT_AMC_ASSETS_TABLE} a
            LEFT JOIN admin_amc_companies c ON c.id = a.company_id
            WHERE a.id = ?
            LIMIT 1
            `,
            [insertResult.insertId],
        );
        const row = seededRows[0];
        if (!row) {
            return NextResponse.json({ message: "Failed to prepare without-AMC asset" }, { status: 500 });
        }

        return NextResponse.json(row, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error looking up without-AMC asset:", error);
        return NextResponse.json({ message: "Failed to look up asset", error: message }, { status: 500 });
    }
}
