import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    LOCATION_TYPES,
    SHIFT_SELECT_JOIN,
    ensureAdminEmployeeShiftsTable,
    formatTimeHHMM,
    mapShiftRowToApi,
    normalizeMissedPunchDisableDays,
    serializeWorkingDays,
    type ShiftLocationType,
} from "@/lib/adminEmployeeShifts";

type Ctx = { params: Promise<{ id: string }> };

function parseBody(body: Record<string, unknown>) {
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

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeShiftsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid shift id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseBody(body);

        if (parsed.workingDays.length === 0) {
            return NextResponse.json({ message: "Select at least one working day" }, { status: 400 });
        }

        const [result] = await pool.query(
            `UPDATE admin_employee_shifts
             SET start_time = ?, end_time = ?, break_minutes = ?, grace_minutes = ?,
                 missed_punch_disable_days = ?, location_type = ?, location_label = ?, working_days = ?, is_active = ?
             WHERE id = ?`,
            [
                parsed.startTime,
                parsed.endTime,
                parsed.breakMinutes,
                parsed.graceMinutes,
                parsed.missedPunchDisableDays,
                parsed.locationType,
                parsed.locationLabel || parsed.locationType,
                serializeWorkingDays(parsed.workingDays),
                parsed.isActive ? 1 : 0,
                id,
            ],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Shift not found" }, { status: 404 });
        }

        const [rows] = await pool.query(`${SHIFT_SELECT_JOIN} WHERE s.id = ?`, [id]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Shift not found" }, { status: 404 });
        }

        return NextResponse.json(mapShiftRowToApi(row as Parameters<typeof mapShiftRowToApi>[0]));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee shift:", error);
        return NextResponse.json({ message: "Failed to update shift", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeShiftsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid shift id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_employee_shifts WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Shift not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting employee shift:", error);
        return NextResponse.json({ message: "Failed to delete shift", error: message }, { status: 500 });
    }
}
