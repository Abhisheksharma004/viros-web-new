import type { AttendanceDayRecord, AttendanceStatus } from "@/lib/employeeAttendance";
import { parseWorkingDaysJson } from "@/lib/adminEmployeeShifts";

/** Default Mon–Fri when no shift is assigned. */
export const DEFAULT_SHIFT_WORKING_DAYS = [1, 2, 3, 4, 5];

export function isDateWorkingDay(isoDate: string, workingDays: number[]): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
    const days = workingDays.length > 0 ? workingDays : DEFAULT_SHIFT_WORKING_DAYS;
    const dow = new Date(isoDate + "T12:00:00").getDay();
    return days.includes(dow);
}

export function offDayNote(): string {
    return "Off day (per shift schedule)";
}

/**
 * Build a full month view: shift off-days, optional past absent on working days, preserve DB/leave rows.
 */
export function mergeMonthRecordsWithShift(
    year: number,
    monthOneBased: number,
    records: AttendanceDayRecord[],
    workingDays: number[],
    options?: { todayIso?: string; markPastAbsent?: boolean },
): AttendanceDayRecord[] {
    const days = workingDays.length > 0 ? workingDays : DEFAULT_SHIFT_WORKING_DAYS;
    const map = new Map(records.map((r) => [r.date, { ...r }]));
    const daysInMonth = new Date(year, monthOneBased, 0).getDate();
    const todayIso =
        options?.todayIso ??
        (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })();
    const markPastAbsent = options?.markPastAbsent ?? false;
    const merged: AttendanceDayRecord[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(monthOneBased).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const existing = map.get(iso);
        if (existing) {
            merged.push(existing);
            continue;
        }

        if (!isDateWorkingDay(iso, days)) {
            merged.push({
                date: iso,
                status: "weekend",
                note: offDayNote(),
            });
            continue;
        }

        if (markPastAbsent && iso < todayIso) {
            merged.push({ date: iso, status: "absent" });
        }
    }

    return merged.sort((a, b) => a.date.localeCompare(b.date));
}

export function parseWorkingDaysFromShiftRow(raw: unknown): number[] {
    return parseWorkingDaysJson(raw);
}
