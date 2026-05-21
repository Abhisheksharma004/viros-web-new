import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    POLICY_INSERT_COLUMNS,
    ensureAdminLeaveModule,
    mapPolicyRowToApi,
    parsePolicyBody,
    policyInsertValues,
    type AdminLeavePolicyRow,
} from "@/lib/adminLeavePolicies";

export async function GET() {
    try {
        await ensureAdminLeaveModule();
        const [rows] = await pool.query(
            `SELECT * FROM admin_leave_policies ORDER BY updated_at DESC`,
        );
        const list = (rows as RowDataPacket[]).map((row) =>
            mapPolicyRowToApi(row as AdminLeavePolicyRow),
        );
        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching leave policies:", error);
        return NextResponse.json(
            { message: "Failed to fetch leave policies", error: message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminLeaveModule();
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parsePolicyBody(body);

        if (!parsed.code || parsed.code.length > 8) {
            return NextResponse.json(
                { message: "Policy code is required (max 8 characters)" },
                { status: 400 },
            );
        }
        if (!parsed.name) {
            return NextResponse.json({ message: "Policy name is required" }, { status: 400 });
        }
        if (!parsed.allMonthsApplicable) {
            const months = JSON.parse(parsed.applicableMonthsJson) as number[];
            if (months.length === 0) {
                return NextResponse.json(
                    { message: "Select at least one applicable month, or enable all months" },
                    { status: 400 },
                );
            }
        }
        if (parsed.applicableFromJoining && parsed.monthsAfterJoining <= 0) {
            return NextResponse.json(
                { message: "Months after joining must be at least 1 when enabled" },
                { status: 400 },
            );
        }
        if (parsed.minDaysPerRequest > parsed.maxDaysPerRequest) {
            return NextResponse.json(
                { message: "Min days per request cannot exceed max days per request" },
                { status: 400 },
            );
        }
        if (parsed.maxDaysPerRequest > parsed.maxConsecutiveDays) {
            return NextResponse.json(
                { message: "Max days per request cannot exceed max consecutive days" },
                { status: 400 },
            );
        }

        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM admin_leave_policies WHERE code = ? LIMIT 1",
            [parsed.code],
        );
        if (existing.length > 0) {
            return NextResponse.json(
                { message: "Another policy already uses this code" },
                { status: 409 },
            );
        }

        const values = policyInsertValues(parsed);
        const placeholders = values.map(() => "?").join(", ");
        const [result] = await pool.query(
            `INSERT INTO admin_leave_policies (${POLICY_INSERT_COLUMNS}) VALUES (${placeholders})`,
            values,
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query("SELECT * FROM admin_leave_policies WHERE id = ?", [
            insertId,
        ]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json(
                { message: "Policy created but could not be loaded" },
                { status: 201 },
            );
        }

        return NextResponse.json(mapPolicyRowToApi(row as AdminLeavePolicyRow), { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating leave policy:", error);
        return NextResponse.json(
            { message: "Failed to create leave policy", error: message },
            { status: 500 },
        );
    }
}
