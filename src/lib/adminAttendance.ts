import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import {
    ensureEmployeeAttendanceTable,
    formatDbTime12h,
    formatDurationHms,
    getAttendanceByDate,
    mapPunchProof,
    mapRowToDayRecord,
    type AttendanceDayRecord,
    type AttendancePunchProof,
    type AttendanceStatus,
    type EmployeeAttendanceRow,
} from "@/lib/employeeAttendance";
import {
    fetchLeaveRequestsOverlappingMonth,
    mergeLeaveRequestsIntoAttendanceRecords,
} from "@/lib/attendanceLeaveSync";
import {
    countMonthScheduleDays,
    DEFAULT_SHIFT_WORKING_DAYS,
    isDateWorkingDay,
    mergeMonthRecordsWithShift,
    offDayNote,
} from "@/lib/attendanceSchedule";
import {
    getActiveShiftWorkingDaysMap,
    getShiftByEmployeeId,
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
    status: AttendanceStatus | "absent";
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: AttendancePunchProof;
    checkOutProof?: AttendancePunchProof;
    canMarkPresent: boolean;
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
    totalWorkingDays: number;
    weekOff: number;
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
    workingDays: number[] | null,
    hasShift: boolean,
): AdminDailyAttendanceRow {
    const hasRecord = row.attendance_id != null;
    const shiftDays = workingDays ?? DEFAULT_SHIFT_WORKING_DAYS;
    const isWorking = isDateWorkingDay(dateIso, shiftDays);

    let status: AttendanceStatus | "absent";
    if (hasRecord) {
        status = row.status as AttendanceStatus;
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

    const shiftMap = await getActiveShiftWorkingDaysMap();

    return rows.map((row) => {
        const wd = shiftMap.get(row.employee_id) ?? null;
        return mapJoinRowToDaily(row, date, wd, shiftMap.has(row.employee_id));
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

    const [rows] = await pool.query<
        (RowDataPacket & {
            employee_id: string;
            full_name: string;
            department: string | null;
            present: number;
            late: number;
            absent: number;
            leave_count: number;
            half_day: number;
        })[]
    >(
        `SELECT
            e.employee_id,
            e.full_name,
            e.department,
            COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) AS present,
            COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late,
            COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) AS absent,
            COALESCE(SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END), 0) AS leave_count,
            COALESCE(SUM(CASE WHEN a.status = 'half-day' THEN 1 ELSE 0 END), 0) AS half_day
         FROM admin_employees e
         LEFT JOIN ${ATTENDANCE_TABLE} a
            ON a.employee_id = e.employee_id
            AND a.attendance_date >= ?
            AND a.attendance_date <= ?
         WHERE e.employee_status = 'Active'
         GROUP BY e.employee_id, e.full_name, e.department
         ORDER BY e.full_name ASC`,
        [start, end],
    );

    const shiftMap = await getActiveShiftWorkingDaysMap();

    return rows.map((row) => {
        const workingDays = shiftMap.get(row.employee_id) ?? DEFAULT_SHIFT_WORKING_DAYS;
        const { totalWorkingDays, weekOff } = countMonthScheduleDays(year, month, workingDays);
        const present = Number(row.present) || 0;
        const late = Number(row.late) || 0;
        const leave = Number(row.leave_count) || 0;
        const halfDay = Number(row.half_day) || 0;
        return {
            employeeId: row.employee_id,
            fullName: row.full_name,
            department: row.department ?? "",
            present,
            late,
            absent: Number(row.absent) || 0,
            leave,
            halfDay,
            totalPresent: present + late + leave + halfDay,
            totalWorkingDays,
            weekOff,
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
    const dbRecords = attRows.map(mapRowToDayRecord);
    const leaveRequests = await fetchLeaveRequestsOverlappingMonth(trimmedId, year, month);
    const withLeave = mergeLeaveRequestsIntoAttendanceRecords(dbRecords, leaveRequests);
    const todayIso = new Date().toISOString().slice(0, 10);
    const records = mergeMonthRecordsWithShift(year, month, withLeave, workingDays, {
        todayIso,
        markPastAbsent: true,
    });

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
