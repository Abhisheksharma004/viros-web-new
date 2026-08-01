import { NextResponse } from "next/server";
import {
    computeLateSeconds,
    ensureEmployeeAttendanceTable,
    getAttendanceByDate,
    getAttendanceForMonth,
    getEmployeeShiftForLate,
    mapRowToTodaySession,
} from "@/lib/employeeAttendance";
import { getEmployeeSession } from "@/lib/employeeSession";
import {
    fetchLeaveRequestsOverlappingMonth,
    getTodayLeaveInfo,
    mergeLeaveRequestsIntoAttendanceRecords,
} from "@/lib/attendanceLeaveSync";
import { mergeMonthRecordsWithShift } from "@/lib/attendanceSchedule";
import {
    evaluateMissedPunchPortalAccess,
    missedPunchPortalBlockMessage,
    missedPunchPortalWarningMessage,
} from "@/lib/attendancePortalAutoDisable";
import { todayDateOnly } from "@/lib/dateOnly";
import { getEmployeeWorkEntryCountsByDate } from "@/lib/employeeWorkEntries";

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const employeeId = session.employeeId.trim();

        const portalEval = await evaluateMissedPunchPortalAccess(employeeId);
        if (portalEval.accessBlocked) {
            return NextResponse.json(
                {
                    message: missedPunchPortalBlockMessage(portalEval.disableThresholdDays),
                    portalAccess: {
                        status: portalEval.portalStatus,
                        blocked: true,
                        consecutiveMissedWorkingDays: portalEval.consecutiveMissedWorkingDays,
                    },
                },
                { status: 403 },
            );
        }

        await ensureEmployeeAttendanceTable();

        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = Number(searchParams.get("year")) || now.getFullYear();
        const month = Number(searchParams.get("month")) || now.getMonth() + 1;

        if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
            return NextResponse.json({ message: "Invalid year or month" }, { status: 400 });
        }

        const shift = await getEmployeeShiftForLate(employeeId);
        const dbRecords = await getAttendanceForMonth(employeeId, year, month);
        const leaveRequests = await fetchLeaveRequestsOverlappingMonth(employeeId, year, month);
        const withLeave = mergeLeaveRequestsIntoAttendanceRecords(dbRecords, leaveRequests);
        const workingDays = shift?.working_days?.length ? shift.working_days : [1, 2, 3, 4, 5];
        const todayIso = todayDateOnly();
        const records = mergeMonthRecordsWithShift(year, month, withLeave, workingDays, {
            todayIso,
            markPastAbsent: true,
        });
        const workEntryCounts = await getEmployeeWorkEntryCountsByDate(employeeId, year, month);
        const recordsWithWork = records.map((record) => ({
            ...record,
            workEntryCount: workEntryCounts[record.date] ?? 0,
        }));
        const todayLeave = await getTodayLeaveInfo(employeeId, todayIso);
        const todayRow = await getAttendanceByDate(employeeId, todayIso);

        let today = {
            record: null as ReturnType<typeof mapRowToTodaySession>["record"] | null,
            checkedIn: false,
            checkIn: null as ReturnType<typeof mapRowToTodaySession>["checkIn"],
            checkOut: null as ReturnType<typeof mapRowToTodaySession>["checkOut"],
            late: { isLate: false, secondsLate: 0, graceMinutes: shift?.grace_minutes ?? 0, shiftStartMinutes: 0 },
        };

        if (todayRow) {
            const sessionToday = mapRowToTodaySession(todayRow);
            const computedLate = sessionToday.checkIn?.punchedAt
                ? computeLateSeconds(sessionToday.checkIn.punchedAt, shift)
                : sessionToday.late;
            today = {
                ...sessionToday,
                late: {
                    isLate: computedLate.isLate,
                    secondsLate: computedLate.secondsLate,
                    graceMinutes: shift?.grace_minutes ?? 0,
                    shiftStartMinutes: 0,
                },
            };
        }

        return NextResponse.json(
            {
                records: recordsWithWork,
                today,
                shift,
                todayLeave,
                portalAccess: {
                    status: portalEval.portalStatus,
                    blocked: false,
                    consecutiveMissedWorkingDays: portalEval.consecutiveMissedWorkingDays,
                    warning: missedPunchPortalWarningMessage(
                        portalEval.consecutiveMissedWorkingDays,
                        portalEval.disableThresholdDays,
                    ),
                    disableThresholdDays: portalEval.disableThresholdDays,
                },
            },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee attendance:", error);
        return NextResponse.json({ message: "Failed to fetch attendance", error: message }, { status: 500 });
    }
}
