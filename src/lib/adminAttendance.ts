import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { todayDateOnly } from "@/lib/dateOnly";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import {
    computeLateSeconds,
    ensureEmployeeAttendanceTable,
    formatDbTime12h,
    formatDurationHms,
    getAttendanceByDate,
    mapPunchProof,
    mapRowToDayRecord,
    parseISTDateTime,
    type AttendanceDayRecord,
    type AttendancePunchProof,
    type AttendanceStatus,
    type EmployeeAttendanceRow,
} from "@/lib/employeeAttendance";
import {
    fetchLeaveRequestsOverlappingMonth,
    mergeLeaveRequestsIntoAttendanceRecords,
    type LeaveRequestForAttendance,
} from "@/lib/attendanceLeaveSync";
import { mapLeaveRequestRowToApi, type EmployeeLeaveRequestRow } from "@/lib/employeeLeave";
import {
    fetchCorporateEventsForMonth,
    mergeCorporateEventsIntoAttendanceRecords,
} from "@/lib/attendanceCorporateCalendarSync";
import {
    countMonthScheduleDays,
    DEFAULT_SHIFT_WORKING_DAYS,
    isDateWorkingDay,
    mergeMonthRecordsWithShift,
    offDayNote,
} from "@/lib/attendanceSchedule";
import {
    getActiveShiftWorkingDaysMap,
    getActiveShiftsMap,
    getShiftByEmployeeId,
    type ActiveShiftDetail,
} from "@/lib/adminEmployeeShifts";

const ATTENDANCE_TABLE = "employee_attendance";

const ATTENDANCE_JOIN_SELECT = `
    SELECT
        e.employee_id,
        e.full_name,
        e.department,
        e.designation,
        a.id AS attendance_id,
        a.attendance_date,
        a.status,
        DATE_FORMAT(a.check_in_at, '%Y-%m-%d %H:%i:%s') AS check_in_at,
        DATE_FORMAT(a.check_out_at, '%Y-%m-%d %H:%i:%s') AS check_out_at,
        a.working_seconds,
        a.late_seconds,
        a.note,
        a.check_in_photo,
        a.check_out_photo,
        a.check_in_latitude,
        a.check_in_longitude,
        a.check_in_accuracy,
        a.check_in_address,
        a.check_out_latitude,
        a.check_out_longitude,
        a.check_out_accuracy,
        a.check_out_address
    FROM admin_employees e
    LEFT JOIN ${ATTENDANCE_TABLE} a
        ON a.employee_id = e.employee_id AND a.attendance_date = ?
    WHERE e.employee_status = 'Active'
`;

type EmployeeJoinRow = RowDataPacket & {
    employee_id: string;
    full_name: string;
    department: string | null;
    designation: string | null;
    attendance_id: number | null;
    attendance_date: Date | string | null;
    status: AttendanceStatus | null;
    check_in_at: string | null;
    check_out_at: string | null;
    working_seconds: number | null;
    late_seconds: number | null;
    note: string | null;
    check_in_photo: string | null;
    check_out_photo: string | null;
    check_in_latitude: number | null;
    check_in_longitude: number | null;
    check_in_accuracy: number | null;
    check_in_address: string | null;
    check_out_latitude: number | null;
    check_out_longitude: number | null;
    check_out_accuracy: number | null;
    check_out_address: string | null;
};

export type AdminDailyAttendanceRow = {
    employeeId: string;
    fullName: string;
    department: string;
    designation: string;
    attendanceId: number | null;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: AttendancePunchProof;
    checkOutProof?: AttendancePunchProof;
    canMarkPresent: boolean;
    canMarkAbsent: boolean;
    isWorkingDay: boolean;
    hasShift: boolean;
};

export type AdminMonthlySummaryRow = {
    employeeId: string;
    fullName: string;
    department: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
    halfDay: number;
    totalPresent: number;
    /**
     * Total shift working days for the selected month (full month schedule).
     * Payroll should use this value for per-day salary calculations.
     */
    totalWorkingDaysInMonth: number;
    /**
     * Total working days up to the cutoff date (today for current month).
     * Attendance dashboards use this to avoid counting future days.
     */
    totalWorkingDaysToDate: number;
    /** Full-month off days per employee shift schedule. */
    weekOff: number;
    /** Off days from month start through today (current month only). */
    weekOffToDate: number;
    /** Full-month declared corporate holidays. */
    holiday: number;
    /** Declared corporate holidays from month start through cutoff date. */
    holidayToDate: number;
    totalDaysInMonth?: number;
};

export type AdminEmployeeShiftContext = {
    configured: boolean;
    active: boolean;
    startTime: string;
    endTime: string;
    graceMinutes: number;
    workingDays: number[];
    locationType: string;
    locationLabel: string;
};

export type AdminEmployeeMonthlyDetail = {
    employee: {
        employeeId: string;
        fullName: string;
        department: string;
        designation: string;
    };
    shift: AdminEmployeeShiftContext;
    records: AttendanceDayRecord[];
};

function isoDateOnly(value: string): string {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        throw new Error("Invalid date");
    }
    return trimmed;
}

function mapJoinRowToDaily(
    row: EmployeeJoinRow,
    dateIso: string,
    shiftDetail: ActiveShiftDetail | null,
    hasShift: boolean,
): AdminDailyAttendanceRow {
    const hasRecord = row.attendance_id != null;
    const shiftDays = shiftDetail?.workingDays ?? DEFAULT_SHIFT_WORKING_DAYS;
    const isWorking = isDateWorkingDay(dateIso, shiftDays);

    let status: AttendanceStatus;
    if (hasRecord) {
        status = row.status as AttendanceStatus;
        if (status === "present" && row.check_in_at && shiftDetail) {
            const checkInDate = parseISTDateTime(row.check_in_at);
            if (checkInDate) {
                const [sh, sm] = shiftDetail.startTime.split(":").map(Number);
                const safeH = Number.isNaN(sh) ? 9 : sh;
                const safeM = Number.isNaN(sm) ? 0 : sm;
                const startMins = safeH * 60 + safeM;
                const graceMins = startMins + Math.max(0, shiftDetail.graceMinutes);
                const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();

                if (checkInMins > startMins && checkInMins <= graceMins) {
                    status = "grace" as AttendanceStatus;
                }
            }
        }
        if (status === "present" && row.note?.toLowerCase().includes("grace")) {
            status = "grace" as AttendanceStatus;
        }
    } else if (!isWorking) {
        status = "weekend";
    } else {
        status = "absent";
    }

    const workingSeconds = row.working_seconds != null ? Number(row.working_seconds) : null;
    const checkIn = formatDbTime12h(row.check_in_at);
    const checkOut = formatDbTime12h(row.check_out_at);

    const canMarkPresent =
        isWorking &&
        (!hasRecord ||
            status === "absent" ||
            (hasRecord && !row.check_in_at && status !== "leave" && status !== "weekend"));

    const canMarkAbsent =
        isWorking &&
        status !== "absent" &&
        status !== "leave" &&
        status !== "weekend";

    return {
        employeeId: row.employee_id,
        fullName: row.full_name,
        department: row.department ?? "",
        designation: row.designation ?? "",
        attendanceId: row.attendance_id,
        date: dateIso,
        status,
        checkIn,
        checkOut,
        hours: workingSeconds != null ? formatDurationHms(workingSeconds) : undefined,
        note:
            !hasRecord && !isWorking
                ? offDayNote()
                : row.note ?? undefined,
        checkInProof: mapPunchProof(
            checkIn,
            row.check_in_photo,
            row.check_in_latitude,
            row.check_in_longitude,
            row.check_in_accuracy,
            row.check_in_address,
        ),
        checkOutProof: mapPunchProof(
            checkOut,
            row.check_out_photo,
            row.check_out_latitude,
            row.check_out_longitude,
            row.check_out_accuracy,
            row.check_out_address,
        ),
        canMarkPresent,
        canMarkAbsent,
        isWorkingDay: isWorking,
        hasShift,
    };
}

export async function getAdminDailyAttendance(dateIso: string): Promise<AdminDailyAttendanceRow[]> {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const date = isoDateOnly(dateIso);
    const [rows] = await pool.query<EmployeeJoinRow[]>(
        `${ATTENDANCE_JOIN_SELECT} ORDER BY e.full_name ASC`,
        [date],
    );

    const shiftMap = await getActiveShiftsMap();
    const [year, month] = date.split("-").map(Number);
    const corpEvents = await fetchCorporateEventsForMonth(year, month);
    const eventsOnDate = corpEvents.filter((ev) => date >= ev.start_date && date <= ev.end_date);

    const [leaveRows] = await pool.query<
        (RowDataPacket & {
            employee_id: string;
            policy_name: string;
            request_id: string;
            day_type: "full" | "half";
            status: string;
            rejected_at_stage: string | null;
        })[]
    >(
        `SELECT employee_id, policy_name, request_id, day_type, status, rejected_at_stage
         FROM employee_leave_requests
         WHERE status IN ('pending', 'l1_approved', 'approved')
           AND start_date <= ?
           AND end_date >= ?`,
        [date, date],
    );

    const leaveMap = new Map(leaveRows.map((r) => [r.employee_id.trim(), r]));

    return rows.map((row) => {
        const shiftDetail = shiftMap.get(row.employee_id) ?? null;
        const daily = mapJoinRowToDaily(row, date, shiftDetail, shiftMap.has(row.employee_id));
        const leaveReq = leaveMap.get(row.employee_id);

        if (leaveReq) {
            const hasPunch = Boolean(
                daily.checkIn || daily.checkOut || daily.checkInProof || daily.checkOutProof,
            );
            if (!hasPunch) {
                const targetStatus = leaveReq.day_type === "full" ? "leave" : "half-day";
                const statusLabel =
                    leaveReq.status === "approved"
                        ? "Approved Leave"
                        : leaveReq.status === "l1_approved"
                          ? "L1 Approved Leave"
                          : "Pending Leave";
                const leaveNote = `${statusLabel}: ${leaveReq.policy_name} (${leaveReq.request_id})`;

                daily.status = targetStatus as AttendanceStatus;
                daily.note = daily.note ? `${leaveNote} | ${daily.note}` : leaveNote;
                daily.canMarkPresent = true;
                daily.canMarkAbsent = false;
            }
        }

        if (eventsOnDate.length > 0) {
            const eventTitle = eventsOnDate.map((ev) => ev.title).join(" | ");
            const hasHoliday = eventsOnDate.some((ev) => ev.event_type === "holiday");
            const hasPunch = Boolean(daily.checkIn || daily.checkOut || daily.checkInProof || daily.checkOutProof);

            if (hasHoliday) {
                if (!hasPunch && daily.status !== "leave") {
                    daily.status = "holiday" as AttendanceStatus;
                    daily.note = eventTitle;
                } else if (hasPunch) {
                    const notePrefix = daily.note ? `${daily.note} | ` : "";
                    daily.note = `${notePrefix}Present on ${eventTitle}`;
                }
            } else {
                const notePrefix = daily.note ? `${daily.note} | ` : "";
                if (!daily.note?.includes(eventTitle)) {
                    daily.note = daily.note ? `${notePrefix}${eventTitle}` : eventTitle;
                }
            }
        }

        return daily;
    });
}

export async function getAdminMonthlySummary(
    year: number,
    month: number,
): Promise<AdminMonthlySummaryRow[]> {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const todayIso = todayDateOnly();
    const [ty, tm, td] = todayIso.split("-").map(Number);

    const isFutureMonth = ty && tm ? year > ty || (year === ty && month > tm) : false;
    const isCurrentMonth = ty && tm ? year === ty && month === tm : false;
    const cutoffDay = isFutureMonth ? 0 : isCurrentMonth && td ? Math.min(td, lastDay) : lastDay;
    const cutoffIso = `${year}-${String(month).padStart(2, "0")}-${String(cutoffDay).padStart(2, "0")}`;

    const [empRows] = await pool.query<
        (RowDataPacket & {
            employee_id: string;
            full_name: string;
            department: string | null;
        })[]
    >(
        `SELECT employee_id, full_name, department
         FROM admin_employees
         WHERE employee_status = 'Active'
         ORDER BY full_name ASC`,
    );

    const [attRows] = await pool.query<EmployeeAttendanceRow[]>(
        `SELECT id, employee_id, attendance_date, status,
                DATE_FORMAT(check_in_at, '%Y-%m-%d %H:%i:%s') AS check_in_at,
                DATE_FORMAT(check_out_at, '%Y-%m-%d %H:%i:%s') AS check_out_at,
                check_in_photo, check_out_photo,
                check_in_latitude, check_in_longitude, check_in_accuracy, check_in_address,
                check_out_latitude, check_out_longitude, check_out_accuracy, check_out_address,
                late_seconds, working_seconds, note
         FROM ${ATTENDANCE_TABLE}
         WHERE attendance_date >= ? AND attendance_date <= ?
         ORDER BY attendance_date DESC`,
        [start, end],
    );

    const attByEmp = new Map<string, EmployeeAttendanceRow[]>();
    for (const r of attRows) {
        const empIdKey = r.employee_id.trim().toLowerCase();
        const list = attByEmp.get(empIdKey) ?? [];
        list.push(r);
        attByEmp.set(empIdKey, list);
    }

    const [allLeaveRows] = await pool.query<EmployeeLeaveRequestRow[]>(
        `SELECT * FROM employee_leave_requests
         WHERE status IN ('pending', 'l1_approved', 'approved')
           AND start_date <= ?
           AND end_date >= ?
         ORDER BY start_date ASC, id ASC`,
        [end, start],
    );

    const leaveByEmp = new Map<string, LeaveRequestForAttendance[]>();
    for (const row of allLeaveRows) {
        const empIdKey = row.employee_id.trim().toLowerCase();
        const apiRow = mapLeaveRequestRowToApi(row);
        const list = leaveByEmp.get(empIdKey) ?? [];
        list.push(apiRow);
        leaveByEmp.set(empIdKey, list);
    }

    const shiftMap = await getActiveShiftsMap();
    const corpEvents = await fetchCorporateEventsForMonth(year, month);

    return empRows.map((emp) => {
        const empId = emp.employee_id.trim();
        const empIdKey = empId.toLowerCase();
        const shiftDetail = shiftMap.get(empId) ?? null;
        const workingDays = shiftDetail?.workingDays ?? DEFAULT_SHIFT_WORKING_DAYS;

        const empAtt = attByEmp.get(empIdKey) ?? [];
        const dbRecords = empAtt.map((row) => {
            const rec = mapRowToDayRecord(row);
            if (rec.status === "present" && row.check_in_at && shiftDetail) {
                const checkInDate = parseISTDateTime(row.check_in_at);
                if (checkInDate) {
                    const [sh, sm] = shiftDetail.startTime.split(":").map(Number);
                    const safeH = Number.isNaN(sh) ? 9 : sh;
                    const safeM = Number.isNaN(sm) ? 0 : sm;
                    const startMins = safeH * 60 + safeM;
                    const graceMins = startMins + Math.max(0, shiftDetail.graceMinutes);
                    const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();

                    if (checkInMins > startMins && checkInMins <= graceMins) {
                        rec.status = "grace" as AttendanceStatus;
                    }
                }
            }
            if (rec.status === "present" && row.note?.toLowerCase().includes("grace")) {
                rec.status = "grace" as AttendanceStatus;
            }
            return rec;
        });

        const empLeaves = leaveByEmp.get(empIdKey) ?? [];
        const withLeave = mergeLeaveRequestsIntoAttendanceRecords(dbRecords, empLeaves);
        const recordsWithShift = mergeMonthRecordsWithShift(year, month, withLeave, workingDays, {
            todayIso,
            markPastAbsent: true,
        });
        const records = mergeCorporateEventsIntoAttendanceRecords(recordsWithShift, corpEvents);

        let present = 0;
        let late = 0;
        let absent = 0;
        let leave = 0;
        let halfDay = 0;

        let firstActiveDate: string | null = null;
        let lastActiveDate: string | null = null;

        const activeDateSet = new Set<string>();
        const includedWeekOffSet = new Set<string>();

        for (const rec of records) {
            const isToDate = rec.date <= cutoffIso;
            if (!isToDate) continue;

            const isActive =
                rec.status === "present" ||
                (rec.status as string) === "grace" ||
                rec.status === "late" ||
                rec.status === "leave" ||
                rec.status === "half-day";

            if (isActive) {
                activeDateSet.add(rec.date);
                if (!firstActiveDate) firstActiveDate = rec.date;
                lastActiveDate = rec.date;
            }
        }

        let weekOffBetween = 0;
        let holidayBetween = 0;
        let totalWorkingDaysToDate = 0;
        let weekOffToDate = 0;
        let weekOffMonth = 0;
        let holidayToDate = 0;
        let holidayMonth = 0;
        let totalWorkingDaysInMonth = 0;

        const getPrevIsoDate = (iso: string) => {
            const d = new Date(`${iso}T12:00:00`);
            d.setDate(d.getDate() - 1);
            return d.toISOString().slice(0, 10);
        };

        const getNextIsoDate = (iso: string) => {
            const d = new Date(`${iso}T12:00:00`);
            d.setDate(d.getDate() + 1);
            return d.toISOString().slice(0, 10);
        };

        for (const rec of records) {
            const isToDate = rec.date <= cutoffIso;
            if (rec.status === "weekend") {
                weekOffMonth += 1;
                if (isToDate) {
                    weekOffToDate += 1;
                    const isFirstDayOfMonth = rec.date === start;
                    const isLastDayOfMonth = rec.date === end;
                    const isBetween =
                        firstActiveDate !== null &&
                        lastActiveDate !== null &&
                        rec.date >= firstActiveDate &&
                        rec.date <= lastActiveDate;

                    const prevDate = getPrevIsoDate(rec.date);
                    const nextDate = getNextIsoDate(rec.date);
                    const isAdjoiningActive =
                        activeDateSet.has(prevDate) ||
                        includedWeekOffSet.has(prevDate) ||
                        activeDateSet.has(nextDate);

                    if (
                        isBetween ||
                        isAdjoiningActive ||
                        (isFirstDayOfMonth && firstActiveDate !== null) ||
                        (isLastDayOfMonth && lastActiveDate !== null)
                    ) {
                        weekOffBetween += 1;
                        includedWeekOffSet.add(rec.date);
                    }
                }
                continue;
            }
            if (rec.status === "holiday") {
                holidayMonth += 1;
                if (isToDate) {
                    holidayToDate += 1;
                    const isFirstDayOfMonth = rec.date === start;
                    const isLastDayOfMonth = rec.date === end;
                    const isBetween =
                        firstActiveDate !== null &&
                        lastActiveDate !== null &&
                        rec.date >= firstActiveDate &&
                        rec.date <= lastActiveDate;

                    const prevDate = getPrevIsoDate(rec.date);
                    const nextDate = getNextIsoDate(rec.date);
                    const isAdjoiningActive =
                        activeDateSet.has(prevDate) ||
                        includedWeekOffSet.has(prevDate) ||
                        activeDateSet.has(nextDate);

                    if (
                        isBetween ||
                        isAdjoiningActive ||
                        (isFirstDayOfMonth && firstActiveDate !== null) ||
                        (isLastDayOfMonth && lastActiveDate !== null)
                    ) {
                        holidayBetween += 1;
                        includedWeekOffSet.add(rec.date);
                    }
                }
                continue;
            }

            totalWorkingDaysInMonth += 1;
            if (isToDate) {
                totalWorkingDaysToDate += 1;
                if (rec.status === "present" || (rec.status as string) === "grace") present += 1;
                else if (rec.status === "late") late += 1;
                else if (rec.status === "leave") leave += 1;
                else if (rec.status === "half-day") halfDay += 1;
                else if (rec.status === "absent") absent += 1;
                else present += 1;
            }
        }

        const workedDays = present + late + leave + halfDay;
        const totalPresent = workedDays + weekOffBetween + holidayBetween;

        return {
            employeeId: emp.employee_id,
            fullName: emp.full_name,
            department: emp.department ?? "",
            present,
            late,
            absent,
            leave,
            halfDay,
            totalPresent,
            totalWorkingDaysInMonth,
            totalWorkingDaysToDate,
            weekOff: weekOffMonth,
            weekOffToDate,
            holiday: holidayMonth,
            holidayToDate,
            totalDaysInMonth: lastDay,
        };
    });
}

export async function getAdminEmployeeMonthlyDetail(
    employeeId: string,
    year: number,
    month: number,
): Promise<AdminEmployeeMonthlyDetail | null> {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const trimmedId = employeeId.trim();
    const [empRows] = await pool.query<
        (RowDataPacket & {
            employee_id: string;
            full_name: string;
            department: string | null;
            designation: string | null;
        })[]
    >(
        `SELECT employee_id, full_name, department, designation
         FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [trimmedId],
    );

    const emp = empRows[0];
    if (!emp) return null;

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [attRows] = await pool.query<EmployeeAttendanceRow[]>(
        `SELECT id, employee_id, attendance_date, status,
                DATE_FORMAT(check_in_at, '%Y-%m-%d %H:%i:%s') AS check_in_at,
                DATE_FORMAT(check_out_at, '%Y-%m-%d %H:%i:%s') AS check_out_at,
                check_in_photo, check_out_photo,
                check_in_latitude, check_in_longitude, check_in_accuracy, check_in_address,
                check_out_latitude, check_out_longitude, check_out_accuracy, check_out_address,
                late_seconds, working_seconds, note
         FROM ${ATTENDANCE_TABLE}
         WHERE employee_id = ? AND attendance_date >= ? AND attendance_date <= ?
         ORDER BY attendance_date DESC`,
        [trimmedId, start, end],
    );

    const shiftRow = await getShiftByEmployeeId(trimmedId);
    const workingDays = shiftRow?.working_days ?? DEFAULT_SHIFT_WORKING_DAYS;

    const dbRecords = attRows.map((row) => {
        const rec = mapRowToDayRecord(row);
        if (rec.status === "present" && row.check_in_at && shiftRow) {
            const checkInDate = parseISTDateTime(row.check_in_at);
            if (checkInDate) {
                const [sh, sm] = shiftRow.start_time.split(":").map(Number);
                const safeH = Number.isNaN(sh) ? 9 : sh;
                const safeM = Number.isNaN(sm) ? 0 : sm;
                const startMins = safeH * 60 + safeM;
                const graceMins = startMins + Math.max(0, shiftRow.grace_minutes);
                const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();

                if (checkInMins > startMins && checkInMins <= graceMins) {
                    rec.status = "grace" as AttendanceStatus;
                }
            }
        }
        if (rec.status === "present" && row.note?.toLowerCase().includes("grace")) {
            rec.status = "grace" as AttendanceStatus;
        }
        return rec;
    });
    const leaveRequests = await fetchLeaveRequestsOverlappingMonth(trimmedId, year, month);
    const withLeave = mergeLeaveRequestsIntoAttendanceRecords(dbRecords, leaveRequests);
    const todayIso = todayDateOnly();
    const recordsWithShift = mergeMonthRecordsWithShift(year, month, withLeave, workingDays, {
        todayIso,
        markPastAbsent: true,
    });
    const corpEvents = await fetchCorporateEventsForMonth(year, month);
    const records = mergeCorporateEventsIntoAttendanceRecords(recordsWithShift, corpEvents);

    const shift: AdminEmployeeShiftContext = shiftRow
        ? {
            configured: true,
            active: shiftRow.is_active,
            startTime: shiftRow.start_time,
            endTime: shiftRow.end_time,
            graceMinutes: shiftRow.grace_minutes,
            workingDays: shiftRow.working_days,
            locationType: shiftRow.location_type,
            locationLabel: shiftRow.location_label,
        }
        : {
            configured: false,
            active: false,
            startTime: "09:00",
            endTime: "18:00",
            graceMinutes: 0,
            workingDays: DEFAULT_SHIFT_WORKING_DAYS,
            locationType: "office",
            locationLabel: "",
        };

    return {
        employee: {
            employeeId: emp.employee_id,
            fullName: emp.full_name,
            department: emp.department ?? "",
            designation: emp.designation ?? "",
        },
        shift,
        records,
    };
}

export async function adminMarkEmployeePresent(
    employeeId: string,
    dateIso: string,
    adminNote?: string,
) {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const date = isoDateOnly(dateIso);
    const trimmedId = employeeId.trim().toUpperCase();

    const [empRows] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [trimmedId],
    );
    if (!empRows[0]) {
        throw new Error("Employee not found");
    }

    const noteText = adminNote?.trim()
        ? `Marked present by admin: ${adminNote.trim()}`
        : "Marked present by admin";

    const shiftRow = await getShiftByEmployeeId(trimmedId);
    const workingDays = shiftRow?.working_days ?? DEFAULT_SHIFT_WORKING_DAYS;
    if (!isDateWorkingDay(date, workingDays)) {
        throw new Error("Cannot mark attendance on a non-working day for this employee's shift");
    }

    const existing = await getAttendanceByDate(trimmedId, date);

    if (existing) {
        if (existing.status === "present" || existing.status === "late") {
            if (existing.check_in_at) {
                throw new Error("Employee already has a present attendance record for this date");
            }
        }

        await pool.query(
            `UPDATE ${ATTENDANCE_TABLE}
             SET status = 'present', note = ?
             WHERE id = ?`,
            [noteText, existing.id],
        );
    } else {
        await pool.query(
            `INSERT INTO ${ATTENDANCE_TABLE} (employee_id, attendance_date, status, note)
             VALUES (?, ?, 'present', ?)`,
            [trimmedId, date, noteText],
        );
    }

    const updated = await getAttendanceByDate(trimmedId, date);
    if (!updated) throw new Error("Failed to update attendance");
    return mapRowToDayRecord(updated);
}

export async function adminMarkEmployeeAbsent(
    employeeId: string,
    dateIso: string,
    adminNote?: string,
) {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const date = isoDateOnly(dateIso);
    const trimmedId = employeeId.trim().toUpperCase();

    const [empRows] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [trimmedId],
    );
    if (!empRows[0]) {
        throw new Error("Employee not found");
    }

    const noteText = adminNote?.trim()
        ? `Marked absent by admin: ${adminNote.trim()}`
        : "Marked absent by admin";

    const shiftRow = await getShiftByEmployeeId(trimmedId);
    const workingDays = shiftRow?.working_days ?? DEFAULT_SHIFT_WORKING_DAYS;
    if (!isDateWorkingDay(date, workingDays)) {
        throw new Error("Cannot mark attendance on a non-working day for this employee's shift");
    }

    const existing = await getAttendanceByDate(trimmedId, date);

    if (existing) {
        await pool.query(
            `UPDATE ${ATTENDANCE_TABLE}
             SET status = 'absent', check_in_at = NULL, check_out_at = NULL, late_seconds = 0, working_seconds = NULL, note = ?
             WHERE id = ?`,
            [noteText, existing.id],
        );
    } else {
        await pool.query(
            `INSERT INTO ${ATTENDANCE_TABLE} (employee_id, attendance_date, status, note)
             VALUES (?, ?, 'absent', ?)`,
            [trimmedId, date, noteText],
        );
    }

    const updated = await getAttendanceByDate(trimmedId, date);
    if (!updated) throw new Error("Failed to update attendance");
    return mapRowToDayRecord(updated);
}

export async function adminUpdateEmployeeAttendanceRecord(
    employeeId: string,
    dateIso: string,
    data: {
        checkInTime?: string | null;
        checkOutTime?: string | null;
        checkInAddress?: string | null;
        checkOutAddress?: string | null;
        note?: string | null;
    },
) {
    await ensureAdminEmployeesTable();
    await ensureEmployeeAttendanceTable();

    const date = isoDateOnly(dateIso);
    const trimmedId = employeeId.trim().toUpperCase();

    const [empRows] = await pool.query<RowDataPacket[]>(
        `SELECT employee_id FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [trimmedId],
    );
    if (!empRows[0]) {
        throw new Error("Employee not found");
    }

    const shift = await getShiftByEmployeeId(trimmedId);
    const workingDays = shift?.working_days ?? DEFAULT_SHIFT_WORKING_DAYS;
    if (!isDateWorkingDay(date, workingDays)) {
        throw new Error("Cannot update attendance on a non-working day for this employee's shift");
    }

    let checkInDateTime: string | null = null;
    let checkOutDateTime: string | null = null;

    if (data.checkInTime && data.checkInTime.trim()) {
        const [h, m] = data.checkInTime.trim().split(":").map(Number);
        const hh = String(Number.isNaN(h) ? 9 : h).padStart(2, "0");
        const mm = String(Number.isNaN(m) ? 0 : m).padStart(2, "0");
        checkInDateTime = `${date} ${hh}:${mm}:00`;
    }

    if (data.checkOutTime && data.checkOutTime.trim()) {
        const [h, m] = data.checkOutTime.trim().split(":").map(Number);
        const hh = String(Number.isNaN(h) ? 18 : h).padStart(2, "0");
        const mm = String(Number.isNaN(m) ? 0 : m).padStart(2, "0");
        checkOutDateTime = `${date} ${hh}:${mm}:00`;
    }

    let status: AttendanceStatus = "present";
    let lateSeconds = 0;

    if (checkInDateTime && shift) {
        const punchedAtIso = `${date}T${checkInDateTime.split(" ")[1]}+05:30`;
        const lateCalc = computeLateSeconds(punchedAtIso, shift);
        status = lateCalc.isLate ? "late" : "present";
        lateSeconds = lateCalc.secondsLate;
    }

    let workingSeconds: number | null = null;
    if (checkInDateTime && checkOutDateTime) {
        const tIn = new Date(`${date}T${checkInDateTime.split(" ")[1]}+05:30`).getTime();
        const tOut = new Date(`${date}T${checkOutDateTime.split(" ")[1]}+05:30`).getTime();
        if (tOut > tIn) {
            workingSeconds = Math.floor((tOut - tIn) / 1000);
        }
    }

    const noteText = data.note?.trim()
        ? `Updated by admin: ${data.note.trim()}`
        : "Updated by admin";

    const existing = await getAttendanceByDate(trimmedId, date);

    if (existing) {
        await pool.query(
            `UPDATE ${ATTENDANCE_TABLE}
             SET status = ?,
                 check_in_at = COALESCE(?, check_in_at),
                 check_out_at = COALESCE(?, check_out_at),
                 check_in_address = COALESCE(?, check_in_address),
                 check_out_address = COALESCE(?, check_out_address),
                 late_seconds = ?,
                 working_seconds = COALESCE(?, working_seconds),
                 note = ?
             WHERE id = ?`,
            [
                status,
                checkInDateTime,
                checkOutDateTime,
                data.checkInAddress?.trim() ?? existing.check_in_address,
                data.checkOutAddress?.trim() ?? existing.check_out_address,
                lateSeconds,
                workingSeconds,
                noteText,
                existing.id,
            ],
        );
    } else {
        await pool.query(
            `INSERT INTO ${ATTENDANCE_TABLE}
             (employee_id, attendance_date, status, check_in_at, check_out_at, check_in_address, check_out_address, late_seconds, working_seconds, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedId,
                date,
                status,
                checkInDateTime,
                checkOutDateTime,
                data.checkInAddress?.trim() ?? null,
                data.checkOutAddress?.trim() ?? null,
                lateSeconds,
                workingSeconds,
                noteText,
            ],
        );
    }

    const updated = await getAttendanceByDate(trimmedId, date);
    if (!updated) throw new Error("Failed to update attendance");
    return mapRowToDayRecord(updated);
}
