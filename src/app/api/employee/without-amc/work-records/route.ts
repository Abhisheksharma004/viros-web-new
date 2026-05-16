import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { optDate, optText } from "@/lib/amcWorkNotesHelpers";
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

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const bodyUnknown: unknown = await request.json().catch(() => ({}));
        const body = bodyUnknown && typeof bodyUnknown === "object" ? (bodyUnknown as Record<string, unknown>) : {};

        const serial = optText(body.serial ?? body.tag_code ?? body.scanned_tag_code) ?? "";
        if (!serial) {
            return NextResponse.json({ message: "Serial number is required" }, { status: 400 });
        }

        const scannedTagCode = optText(body.scanned_tag_code ?? body.scannedTagCode) ?? serial;
        const newUserKnownIssue = optText(body.user_known_issue ?? body.userKnownIssue);
        const newUserIssueReportingDate = optDate(
            body.user_issue_reporting_date ?? body.userIssueReportingDate,
        );
        const newEngineerRemarks = optText(body.engineer_remarks ?? body.engineerRemarks);

        const hasWorkEntry =
            newUserKnownIssue !== null ||
            newUserIssueReportingDate !== null ||
            newEngineerRemarks !== null;

        await ensureAdminWithoutAmcWorkRecordsTable();

        const [existingRows] = await pool.query<RowDataPacket[]>(SERIAL_LOOKUP_SQL, [serial, serial]);
        const existing = existingRows[0];

        const manualAssetName = optText(body.asset_name ?? body.assetName);
        const manualCompanyName = optText(body.company_name ?? body.companyName);
        const manualCompanyIdRaw = body.company_id ?? body.companyId;
        const manualCompanyId =
            manualCompanyIdRaw === null || manualCompanyIdRaw === undefined
                ? null
                : Number(manualCompanyIdRaw);
        const manualAssetDescription = optText(body.asset_description ?? body.assetDescription);
        const manualCategory = optText(body.category);
        const manualStatus = "Active";
        const manualTagCode = optText(body.tag_code ?? body.tagCode) ?? serial;

        if (!existing) {
            if (!manualAssetName) {
                return NextResponse.json(
                    { message: "Asset name is required for a new serial number." },
                    { status: 400 },
                );
            }
            if (!hasWorkEntry) {
                return NextResponse.json(
                    { message: "Enter issue details and/or engineer remarks before saving." },
                    { status: 400 },
                );
            }
        } else if (!hasWorkEntry) {
            return NextResponse.json(
                { message: "Enter a new issue and/or engineer remarks before saving." },
                { status: 400 },
            );
        }

        const employeeId = session.employeeId.trim();
        const employeeName = session.name.trim() || employeeId;

        const companyIdRaw = existing?.company_id;
        const companyId =
            companyIdRaw === null || companyIdRaw === undefined ? null : Number(companyIdRaw);
        const snapshotCompanyId = existing
            ? Number.isFinite(companyId)
                ? companyId
                : null
            : Number.isFinite(manualCompanyId)
              ? manualCompanyId
              : null;

        const snapshotCompanyName = existing
            ? optText(existing.company_name)
            : manualCompanyName;
        const snapshotAssetName = existing ? optText(existing.asset_name) ?? "" : manualAssetName ?? "";
        const snapshotAssetDescription = existing
            ? optText(existing.asset_description)
            : manualAssetDescription;
        const snapshotTagCode = existing ? optText(existing.tag_code) ?? serial : manualTagCode;
        const snapshotCategory = existing ? optText(existing.category) : manualCategory;
        const snapshotStatus = existing ? optText(existing.status) ?? "Active" : manualStatus;
        const snapshotAssetId = existing?.asset_id ?? null;

        const recordRemarksTimestampSql = newEngineerRemarks !== null ? "CURRENT_TIMESTAMP" : "NULL";

        const [insertResult] = await pool.query<ResultSetHeader>(
            `INSERT INTO ${WITHOUT_AMC_WORK_RECORDS_TABLE}
             (asset_id, employee_id, employee_name, scanned_tag_code,
              company_id, company_name, asset_name, asset_description, tag_code, category, status,
              user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${recordRemarksTimestampSql})`,
            [
                snapshotAssetId,
                employeeId,
                employeeName,
                scannedTagCode,
                snapshotCompanyId,
                snapshotCompanyName,
                snapshotAssetName,
                snapshotAssetDescription,
                snapshotTagCode,
                snapshotCategory,
                snapshotStatus,
                newUserKnownIssue,
                newUserIssueReportingDate,
                newEngineerRemarks,
            ],
        );

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, asset_id, employee_id, employee_name, scanned_tag_code,
                    company_id, company_name, asset_name, asset_description, tag_code, category, status,
                    user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time,
                    created_at, updated_at
             FROM ${WITHOUT_AMC_WORK_RECORDS_TABLE}
             WHERE id = ?
             LIMIT 1`,
            [insertResult.insertId],
        );

        const row = rows[0];
        if (!row) {
            return NextResponse.json({ message: "Failed to load saved record" }, { status: 500 });
        }

        return NextResponse.json({
            ...row,
            message: "Work record saved successfully.",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error saving without-AMC work record:", error);
        return NextResponse.json({ message: "Failed to save work record", error: message }, { status: 500 });
    }
}
