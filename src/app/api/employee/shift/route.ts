import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    SHIFT_SELECT_JOIN,
    ensureAdminEmployeeShiftsTable,
    mapShiftRowToApi,
    type AdminEmployeeShiftRow,
} from "@/lib/adminEmployeeShifts";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureAdminEmployeeShiftsTable();

        const [rows] = await pool.query(
            `${SHIFT_SELECT_JOIN} WHERE s.employee_id = ? LIMIT 1`,
            [session.employeeId.trim()],
        );

        const row = (rows as RowDataPacket[])[0] as AdminEmployeeShiftRow | undefined;
        if (!row) {
            return NextResponse.json(
                { shift: null },
                { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
            );
        }

        return NextResponse.json(
            { shift: mapShiftRowToApi(row) },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee shift:", error);
        return NextResponse.json({ message: "Failed to fetch shift", error: message }, { status: 500 });
    }
}
