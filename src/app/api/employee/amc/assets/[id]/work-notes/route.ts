import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcAssetsTable } from "@/lib/adminAmcAssets";
import {
    ensureAdminAmcWorkRecordsTable,
    type AmcWorkType,
    WORK_RECORD_SELECT,
} from "@/lib/adminAmcWorkRecords";
import { ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";
import { getEmployeeSession } from "@/lib/employeeSession";

type Ctx = { params: Promise<{ id: string }> };

const ASSET_ROW_SQL = `
  SELECT a.id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
         a.user_known_issue, a.user_issue_reporting_date, a.engineer_remarks, a.engineer_remarks_date_time,
         c.company_name AS company_name
  FROM admin_amc_assets a
  LEFT JOIN admin_amc_companies c ON c.id = a.company_id
  WHERE a.id = ?
  LIMIT 1
`;

function optText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const s = typeof value === "string" ? value.trim() : String(value).trim();
    return s === "" ? null : s;
}

function optDate(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const s = typeof value === "string" ? value.trim() : String(value).trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!iso) return null;
    const d = new Date(`${iso[1]}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return iso[1];
}

function normalizeWorkType(raw: unknown): AmcWorkType {
    const t = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    return t === "without_amc" ? "without_amc" : "amc";
}

export async function PATCH(request: Request, { params }: Ctx) {
    const conn = await pool.getConnection();
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await params;
        const assetId = Number(idParam);
        if (!Number.isFinite(assetId) || assetId < 1) {
            return NextResponse.json({ message: "Invalid asset id" }, { status: 400 });
        }

        const bodyUnknown: unknown = await request.json().catch(() => ({}));
        const body = bodyUnknown && typeof bodyUnknown === "object" ? (bodyUnknown as Record<string, unknown>) : {};

        const newUserKnownIssue = optText(
            body.user_known_issue ?? body.new_issue ?? body.newIssue ?? body.userKnownIssue,
        );
        const newUserIssueReportingDate = optDate(
            body.user_issue_reporting_date ?? body.new_issue_reporting_date ?? body.newIssueReportingDate,
        );
        const newEngineerRemarks = optText(
            body.engineer_remarks ?? body.new_engineer_remarks ?? body.newEngineerRemarks,
        );
        const scannedTagCode = optText(body.scanned_tag_code ?? body.scannedTagCode ?? body.tag_code);
        const workType = normalizeWorkType(body.work_type ?? body.workType);

        const employeeId = session.employeeId.trim();
        const employeeName = session.name.trim() || employeeId;

        await ensureAdminAmcCompaniesTable();
        await ensureAdminAmcAssetsTable();
        await ensureAdminAmcWorkRecordsTable();

        await conn.beginTransaction();

        const [assetRows] = await conn.query<RowDataPacket[]>(ASSET_ROW_SQL, [assetId]);
        const assetRow = assetRows[0];
        if (!assetRow) {
            await conn.rollback();
            return NextResponse.json({ message: "Asset not found" }, { status: 404 });
        }

        const companyIdRaw = assetRow.company_id;
        const companyId =
            companyIdRaw === null || companyIdRaw === undefined
                ? null
                : Number(companyIdRaw);
        const snapshotCompanyId = Number.isFinite(companyId) ? companyId : null;
        const snapshotCompanyName = optText(assetRow.company_name);
        const snapshotAssetName = optText(assetRow.asset_name) ?? "";
        const snapshotAssetDescription = optText(assetRow.asset_description);
        const snapshotTagCode = optText(assetRow.tag_code);
        const snapshotCategory = optText(assetRow.category);
        const snapshotStatus = optText(assetRow.status) ?? "Active";

        const hasNewEntry =
            newUserKnownIssue !== null ||
            newUserIssueReportingDate !== null ||
            newEngineerRemarks !== null;
        if (!hasNewEntry) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Enter a new issue and/or engineer remarks before saving." },
                { status: 400 },
            );
        }

        const prevUserKnownIssue = optText(assetRow.user_known_issue);
        const prevUserIssueReportingDate = optDate(assetRow.user_issue_reporting_date);
        const prevEngineerRemarks = optText(assetRow.engineer_remarks);

        const storedUserKnownIssue = newUserKnownIssue ?? prevUserKnownIssue;
        const storedUserIssueReportingDate = newUserIssueReportingDate ?? prevUserIssueReportingDate;
        const storedEngineerRemarks = newEngineerRemarks ?? prevEngineerRemarks;
        const remarksTimestampSql = newEngineerRemarks !== null ? "CURRENT_TIMESTAMP" : "engineer_remarks_date_time";

        await conn.query(
            `UPDATE admin_amc_assets
             SET user_known_issue = ?, user_issue_reporting_date = ?, engineer_remarks = ?,
                 engineer_remarks_date_time = ${remarksTimestampSql}
             WHERE id = ?`,
            [storedUserKnownIssue, storedUserIssueReportingDate, storedEngineerRemarks, assetId],
        );

        const recordRemarksTimestampSql =
            newEngineerRemarks !== null ? "CURRENT_TIMESTAMP" : "NULL";

        const [insertResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO admin_amc_work_records
             (asset_id, employee_id, employee_name, scanned_tag_code,
              company_id, company_name, asset_name, asset_description, tag_code, category, status,
              user_known_issue, user_issue_reporting_date, engineer_remarks, engineer_remarks_date_time, work_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${recordRemarksTimestampSql}, ?)`,
            [
                assetId,
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
                workType,
            ],
        );

        const workRecordId = insertResult.insertId;

        const [rows] = await conn.query<RowDataPacket[]>(
            `
            SELECT a.id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
                   a.user_known_issue, a.user_issue_reporting_date, a.engineer_remarks, a.engineer_remarks_date_time,
                   c.company_name AS company_name,
                   ${WORK_RECORD_SELECT}
            FROM admin_amc_assets a
            LEFT JOIN admin_amc_companies c ON c.id = a.company_id
            LEFT JOIN admin_amc_work_records r ON r.id = ?
            WHERE a.id = ?
            LIMIT 1
            `,
            [workRecordId, assetId],
        );

        await conn.commit();

        const row = rows[0];
        if (!row) {
            return NextResponse.json({ message: "Asset not found after save" }, { status: 500 });
        }

        return NextResponse.json({
            ...row,
            message: "Work record saved successfully.",
        });
    } catch (error: unknown) {
        await conn.rollback();
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error saving AMC work record:", error);
        return NextResponse.json({ message: "Failed to save work record", error: message }, { status: 500 });
    } finally {
        conn.release();
    }
}
