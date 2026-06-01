import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    LOCATION_TYPES,
    SHIFT_SELECT_JOIN,
    employeeExists,
    ensureAdminEmployeeShiftsTable,
    formatTimeHHMM,
    mapShiftRowToApi,
    normalizeMissedPunchDisableDays,
    serializeWorkingDays,
    type ShiftLocationType,
} from "@/lib/adminEmployeeShifts";

function parseBody(body: Record<string, unknown>) {
    const employeeId = typeof body.employee_id === "string" ? body.employee_id.trim().toUpperCase() : "";
    const startTime = formatTimeHHMM(body.start_time);
    const endTime = formatTimeHHMM(body.end_time);
    const breakMinutes = Number.isFinite(Number(body.break_minutes))
        ? Math.max(0, Number(body.break_minutes))
        : 0;
    const graceMinutes = Number.isFinite(Number(body.grace_minutes))
        ? Math.max(0, Number(body.grace_minutes))
        : 0;
    const locationType = LOCATION_TYPES.includes(body.location_type as ShiftLocationType)
        ? (body.location_type as ShiftLocationType)
        : "office";
    const locationLabel =
        typeof body.location_label === "string" ? body.location_label.trim() : "";
    const workingDays = Array.isArray(body.working_days)
        ? (body.working_days as unknown[]).map(Number).filter((n) => Number.isFinite(n))
        : [];
    const isActive = body.is_active !== false && body.is_active !== 0 && body.is_active !== "0";
    const missedPunchDisableDays = normalizeMissedPunchDisableDays(body.missed_punch_disable_days);

    return {
        employeeId,
        startTime,
        endTime,
        breakMinutes,
        graceMinutes,
        missedPunchDisableDays,
        locationType,
        locationLabel,
        workingDays,
        isActive,
    };
}

export async function GET() {
    try {
        await ensureAdminEmployeeShiftsTable();
        const [rows] = await pool.query(`${SHIFT_SELECT_JOIN} ORDER BY s.updated_at DESC`);

        const list = (rows as RowDataPacket[]).map((row) =>
            mapShiftRowToApi(row as Parameters<typeof mapShiftRowToApi>[0]),
        );

        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee shifts:", error);
        return NextResponse.json({ message: "Failed to fetch shifts", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminEmployeeShiftsTable();
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseBody(body);

        if (!parsed.employeeId) {
            return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
        }
        if (parsed.workingDays.length === 0) {
            return NextResponse.json({ message: "Select at least one working day" }, { status: 400 });
        }
        if (!(await employeeExists(parsed.employeeId))) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM admin_employee_shifts WHERE employee_id = ? LIMIT 1",
            [parsed.employeeId],
        );
        if (existing.length > 0) {
            return NextResponse.json(
                { message: "A shift already exists for this employee. Edit the existing shift instead." },
                { status: 409 },
            );
        }

        const [result] = await pool.query(
            `INSERT INTO admin_employee_shifts
             (employee_id, start_time, end_time, break_minutes, grace_minutes, missed_punch_disable_days, location_type, location_label, working_days, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parsed.employeeId,
                parsed.startTime,
                parsed.endTime,
                parsed.breakMinutes,
                parsed.graceMinutes,
                parsed.missedPunchDisableDays,
                parsed.locationType,
                parsed.locationLabel || parsed.locationType,
                serializeWorkingDays(parsed.workingDays),
                parsed.isActive ? 1 : 0,
            ],
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query(`${SHIFT_SELECT_JOIN} WHERE s.id = ?`, [insertId]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Shift created but could not be loaded" }, { status: 201 });
        }

        return NextResponse.json(
            mapShiftRowToApi(row as Parameters<typeof mapShiftRowToApi>[0]),
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating employee shift:", error);
        return NextResponse.json({ message: "Failed to create shift", error: message }, { status: 500 });
    }
}
