import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    SETTINGS_ROW_ID,
    ensureAdminLeaveModule,
    mapOrgSettingsRowToApi,
    parseOrgSettingsBody,
    type AdminLeaveOrgSettingsRow,
} from "@/lib/adminLeavePolicies";

export async function GET() {
    try {
        await ensureAdminLeaveModule();
        const [rows] = await pool.query(
            "SELECT * FROM admin_leave_org_settings WHERE id = ? LIMIT 1",
            [SETTINGS_ROW_ID],
        );
        const row = (rows as RowDataPacket[])[0] as AdminLeaveOrgSettingsRow | undefined;
        if (!row) {
            return NextResponse.json({
                fiscal_year_start_month: 4,
                default_min_notice_days: 2,
                max_consecutive_days_default: 15,
                allow_half_day: true,
                count_weekends_in_leave: false,
            });
        }
        return NextResponse.json(mapOrgSettingsRowToApi(row), {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching leave org settings:", error);
        return NextResponse.json(
            { message: "Failed to fetch organization settings", error: message },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request) {
    try {
        await ensureAdminLeaveModule();
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseOrgSettingsBody(body);

        await pool.query(
            `UPDATE admin_leave_org_settings
             SET fiscal_year_start_month = ?, default_min_notice_days = ?,
                 max_consecutive_days_default = ?, allow_half_day = ?, count_weekends_in_leave = ?
             WHERE id = ?`,
            [
                parsed.fiscalYearStartMonth,
                parsed.defaultMinNoticeDays,
                parsed.maxConsecutiveDaysDefault,
                parsed.allowHalfDay ? 1 : 0,
                parsed.countWeekendsInLeave ? 1 : 0,
                SETTINGS_ROW_ID,
            ],
        );

        const [rows] = await pool.query(
            "SELECT * FROM admin_leave_org_settings WHERE id = ? LIMIT 1",
            [SETTINGS_ROW_ID],
        );
        const row = (rows as RowDataPacket[])[0] as AdminLeaveOrgSettingsRow;
        return NextResponse.json(mapOrgSettingsRowToApi(row));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error saving leave org settings:", error);
        return NextResponse.json(
            { message: "Failed to save organization settings", error: message },
            { status: 500 },
        );
    }
}
