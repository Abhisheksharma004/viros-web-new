import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    POLICY_UPDATE_SET,
    ensureAdminLeaveModule,
    mapPolicyRowToApi,
    parsePolicyBody,
    policyInsertValues,
    type AdminLeavePolicyRow,
} from "@/lib/adminLeavePolicies";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminLeaveModule();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid policy id" }, { status: 400 });
        }

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

        const [dup] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM admin_leave_policies WHERE code = ? AND id != ? LIMIT 1",
            [parsed.code, id],
        );
        if (dup.length > 0) {
            return NextResponse.json(
                { message: "Another policy already uses this code" },
                { status: 409 },
            );
        }

        const values = [...policyInsertValues(parsed), id];
        const [result] = await pool.query(
            `UPDATE admin_leave_policies SET ${POLICY_UPDATE_SET} WHERE id = ?`,
            values,
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Leave policy not found" }, { status: 404 });
        }

        const [rows] = await pool.query("SELECT * FROM admin_leave_policies WHERE id = ?", [id]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Leave policy not found" }, { status: 404 });
        }

        return NextResponse.json(mapPolicyRowToApi(row as AdminLeavePolicyRow));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating leave policy:", error);
        return NextResponse.json(
            { message: "Failed to update leave policy", error: message },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminLeaveModule();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid policy id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_leave_policies WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Leave policy not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting leave policy:", error);
        return NextResponse.json(
            { message: "Failed to delete leave policy", error: message },
            { status: 500 },
        );
    }
}
