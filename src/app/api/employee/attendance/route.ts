import { NextResponse } from "next/server";
import {
    attendanceDateFromIso,
    ensureEmployeeAttendanceTable,
    getAttendanceByDate,
    getAttendanceForMonth,
    getEmployeeShiftForLate,
    mapRowToTodaySession,
} from "@/lib/employeeAttendance";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureEmployeeAttendanceTable();

        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = Number(searchParams.get("year")) || now.getFullYear();
        const month = Number(searchParams.get("month")) || now.getMonth() + 1;

        if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
            return NextResponse.json({ message: "Invalid year or month" }, { status: 400 });
        }

        const employeeId = session.employeeId.trim();
        const records = await getAttendanceForMonth(employeeId, year, month);

        const todayIso = attendanceDateFromIso(now.toISOString());
        const todayRow = await getAttendanceByDate(employeeId, todayIso);
        const shift = await getEmployeeShiftForLate(employeeId);

        let today = {
            record: null as ReturnType<typeof mapRowToTodaySession>["record"] | null,
            checkedIn: false,
            checkIn: null as ReturnType<typeof mapRowToTodaySession>["checkIn"],
            checkOut: null as ReturnType<typeof mapRowToTodaySession>["checkOut"],
            late: { isLate: false, secondsLate: 0, graceMinutes: shift?.grace_minutes ?? 0, shiftStartMinutes: 0 },
        };

        if (todayRow) {
            const sessionToday = mapRowToTodaySession(todayRow);
            today = {
                ...sessionToday,
                late: {
                    ...sessionToday.late,
                    graceMinutes: shift?.grace_minutes ?? 0,
                },
            };
        }

        return NextResponse.json(
            { records, today, shift },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee attendance:", error);
        return NextResponse.json({ message: "Failed to fetch attendance", error: message }, { status: 500 });
    }
}
