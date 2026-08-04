import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { findLeaveBlockingCheckIn } from "@/lib/attendanceLeaveSync";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import {
    SHIFT_SELECT_JOIN,
    ensureAdminEmployeeShiftsTable,
    mapShiftRowToApi,
    type AdminEmployeeShiftRow,
} from "@/lib/adminEmployeeShifts";
import { formatDateOnlyInTimeZone, IST_TIMEZONE } from "@/lib/dateOnly";

const TABLE = "employee_attendance";

/** Attendance punch times are stored and shown in India Standard Time */
const ATTENDANCE_TIMEZONE = "Asia/Kolkata";
const ATTENDANCE_TZ_OFFSET = "+05:30";

const ATTENDANCE_SELECT_SQL = `
    SELECT id, employee_id, attendance_date, status,
           DATE_FORMAT(check_in_at, '%Y-%m-%d %H:%i:%s') AS check_in_at,
           DATE_FORMAT(check_out_at, '%Y-%m-%d %H:%i:%s') AS check_out_at,
           check_in_photo, check_out_photo,
           check_in_latitude, check_in_longitude, check_in_accuracy, check_in_address,
           check_out_latitude, check_out_longitude, check_out_accuracy, check_out_address,
           late_seconds, working_seconds, note
    FROM ${TABLE}
`;

type DateTimeParts = {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
};

function getPartsInTimeZone(date: Date, timeZone: string): DateTimeParts {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? "00";
    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
        hour: get("hour"),
        minute: get("minute"),
        second: get("second"),
    };
}

/** Wall-clock IST datetime for MySQL DATETIME column */
export function toMySQLDateTimeIST(isoOrDate: string | Date): string {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(d.getTime())) throw new Error("Invalid punch time");
    const p = getPartsInTimeZone(d, ATTENDANCE_TIMEZONE);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function toIsoDateIST(date: Date): string {
    return formatDateOnlyInTimeZone(date, IST_TIMEZONE);
}

/** Parse MySQL DATETIME string stored as IST wall clock */
export function parseISTDateTime(value: Date | string | null): Date | null {
    if (value == null || value === "") return null;

    if (value instanceof Date) {
        const p = getPartsInTimeZone(value, ATTENDANCE_TIMEZONE);
        return new Date(
            `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${ATTENDANCE_TZ_OFFSET}`,
        );
    }

    const text = String(value).trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        const sec = match[6] ?? "00";
        return new Date(
            `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${sec}${ATTENDANCE_TZ_OFFSET}`,
        );
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type AttendanceStatus =
    | "present"
    | "late"
    | "absent"
    | "leave"
    | "half-day"
    | "weekend"
    | "holiday";

export type AttendancePunchProof = {
    time?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
};

export type AttendanceDayRecord = {
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: AttendancePunchProof;
    checkOutProof?: AttendancePunchProof;
};

export type EmployeeAttendanceRow = RowDataPacket & {
    id: number;
    employee_id: string;
    attendance_date: Date | string;
    status: AttendanceStatus;
    check_in_at: Date | string | null;
    check_out_at: Date | string | null;
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
    late_seconds: number;
    working_seconds: number | null;
    note: string | null;
};

export type PunchLocationInput = {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
};

export type PunchInput = {
    type: "check-in" | "check-out";
    time: string;
    punchedAt: string;
    photoDataUrl: string;
    location: PunchLocationInput;
};

let ensureTablePromise: Promise<void> | null = null;

async function runEnsureEmployeeAttendanceTable() {
    await ensureAdminEmployeesTable();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            attendance_date DATE NOT NULL,
            status ENUM('present', 'late', 'absent', 'leave', 'half-day') NOT NULL DEFAULT 'present',
            check_in_at DATETIME NULL,
            check_out_at DATETIME NULL,
            check_in_photo LONGTEXT NULL,
            check_out_photo LONGTEXT NULL,
            check_in_latitude DECIMAL(10, 7) NULL,
            check_in_longitude DECIMAL(10, 7) NULL,
            check_in_accuracy DECIMAL(8, 2) NULL,
            check_in_address VARCHAR(500) NULL,
            check_out_latitude DECIMAL(10, 7) NULL,
            check_out_longitude DECIMAL(10, 7) NULL,
            check_out_accuracy DECIMAL(8, 2) NULL,
            check_out_address VARCHAR(500) NULL,
            late_seconds INT NOT NULL DEFAULT 0,
            working_seconds INT NULL,
            note VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_employee_attendance_day (employee_id, attendance_date),
            INDEX idx_employee_attendance_month (employee_id, attendance_date)
        )
    `);
}

export async function ensureEmployeeAttendanceTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureEmployeeAttendanceTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

export function attendanceDateFromIso(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return toIsoDateIST(new Date());
    return toIsoDateIST(d);
}

export function formatDbTime12h(value: Date | string | null): string | undefined {
    const d = parseISTDateTime(value);
    if (!d) return undefined;
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: ATTENDANCE_TIMEZONE,
    });
}

export function formatDurationHms(totalSeconds: number) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildShiftStartTime(punchDate: Date, startTime24: string) {
    const [h, m] = startTime24.split(":").map(Number);
    const safeH = Number.isNaN(h) ? 9 : h;
    const safeM = Number.isNaN(m) ? 0 : m;
    const p = getPartsInTimeZone(punchDate, ATTENDANCE_TIMEZONE);
    const hh = String(safeH).padStart(2, "0");
    const mm = String(safeM).padStart(2, "0");
    return new Date(`${p.year}-${p.month}-${p.day}T${hh}:${mm}:00${ATTENDANCE_TZ_OFFSET}`);
}

function buildShiftDeadline(punchDate: Date, startTime24: string, graceMinutes: number) {
    const [h, m] = startTime24.split(":").map(Number);
    const safeH = Number.isNaN(h) ? 9 : h;
    const safeM = Number.isNaN(m) ? 0 : m;
    const totalMinutes = safeH * 60 + safeM + Math.max(0, graceMinutes);

    const deadlineHour = Math.floor(totalMinutes / 60) % 24;
    const deadlineMinute = totalMinutes % 60;

    const p = getPartsInTimeZone(punchDate, ATTENDANCE_TIMEZONE);
    const hh = String(deadlineHour).padStart(2, "0");
    const mm = String(deadlineMinute).padStart(2, "0");

    return new Date(`${p.year}-${p.month}-${p.day}T${hh}:${mm}:00${ATTENDANCE_TZ_OFFSET}`);
}

function isWorkingDay(date: Date, workingDays: number[]) {
    const p = getPartsInTimeZone(date, ATTENDANCE_TIMEZONE);
    const dayOfWeek = new Date(`${p.year}-${p.month}-${p.day}T12:00:00${ATTENDANCE_TZ_OFFSET}`).getDay();
    if (!workingDays.length) return dayOfWeek !== 0 && dayOfWeek !== 6;
    return workingDays.includes(dayOfWeek);
}

export async function getEmployeeShiftForLate(employeeId: string) {
    await ensureAdminEmployeeShiftsTable();
    const [rows] = await pool.query(`${SHIFT_SELECT_JOIN} WHERE s.employee_id = ? LIMIT 1`, [
        employeeId.trim(),
    ]);
    const row = (rows as RowDataPacket[])[0] as AdminEmployeeShiftRow | undefined;
    return row ? mapShiftRowToApi(row) : null;
}

export function computeLateSeconds(punchedAtIso: string, shift: ReturnType<typeof mapShiftRowToApi> | null) {
    if (!shift?.is_active) return { isLate: false, isGrace: false, secondsLate: 0, graceMinutes: shift?.grace_minutes ?? 0 };

    const punchAt = new Date(punchedAtIso);
    if (Number.isNaN(punchAt.getTime())) {
        return { isLate: false, isGrace: false, secondsLate: 0, graceMinutes: shift.grace_minutes ?? 0 };
    }

    if (!isWorkingDay(punchAt, shift.working_days ?? [])) {
        return { isLate: false, isGrace: false, secondsLate: 0, graceMinutes: shift.grace_minutes ?? 0 };
    }

    const startTime = buildShiftStartTime(punchAt, shift.start_time);
    const deadline = buildShiftDeadline(punchAt, shift.start_time, shift.grace_minutes ?? 0);
    const secondsLate = Math.max(0, Math.floor((punchAt.getTime() - deadline.getTime()) / 1000));
    const isGrace = (shift.grace_minutes ?? 0) > 0 && punchAt.getTime() > startTime.getTime() && punchAt.getTime() <= deadline.getTime();
    return {
        isLate: secondsLate > 0,
        isGrace,
        secondsLate,
        graceMinutes: shift.grace_minutes ?? 0,
    };
}

export function mapPunchProof(
    time: string | undefined,
    photo: string | null,
    lat: number | null,
    lng: number | null,
    accuracy: number | null,
    address: string | null,
): AttendancePunchProof | undefined {
    if (!time && !photo) return undefined;
    return {
        time,
        photoUrl: photo ?? undefined,
        latitude: lat != null ? Number(lat) : undefined,
        longitude: lng != null ? Number(lng) : undefined,
        accuracy: accuracy != null ? Number(accuracy) : undefined,
        address: address ?? undefined,
    };
}

export function mapRowToDayRecord(row: EmployeeAttendanceRow): AttendanceDayRecord {
    const dateRaw = row.attendance_date;
    const date =
        dateRaw instanceof Date
            ? toIsoDateIST(dateRaw)
            : String(dateRaw).slice(0, 10);

    const workingSeconds = row.working_seconds != null ? Number(row.working_seconds) : null;
    const checkInTime = formatDbTime12h(row.check_in_at);
    const checkOutTime = formatDbTime12h(row.check_out_at);

    return {
        date,
        status: row.status as AttendanceStatus,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        hours: workingSeconds != null ? formatDurationHms(workingSeconds) : undefined,
        note: row.note ?? undefined,
        checkInProof: mapPunchProof(
            checkInTime,
            row.check_in_photo,
            row.check_in_latitude,
            row.check_in_longitude,
            row.check_in_accuracy,
            row.check_in_address,
        ),
        checkOutProof: mapPunchProof(
            checkOutTime,
            row.check_out_photo,
            row.check_out_latitude,
            row.check_out_longitude,
            row.check_out_accuracy,
            row.check_out_address,
        ),
    };
}

export function mapRowToTodaySession(row: EmployeeAttendanceRow) {
    const day = mapRowToDayRecord(row);
    const checkInAt = parseISTDateTime(row.check_in_at);
    const checkOutAt = parseISTDateTime(row.check_out_at);

    const checkIn = checkInAt
            ? {
                  time: day.checkIn ?? formatDbTime12h(row.check_in_at) ?? "",
                  punchedAt: checkInAt.toISOString(),
                  photoDataUrl: row.check_in_photo ?? "",
                  location: {
                      latitude: Number(row.check_in_latitude) || 0,
                      longitude: Number(row.check_in_longitude) || 0,
                      accuracy: Number(row.check_in_accuracy) || 0,
                      address: row.check_in_address ?? undefined,
                  },
              }
            : null;

    const checkOut = checkOutAt
            ? {
                  time: day.checkOut ?? formatDbTime12h(row.check_out_at) ?? "",
                  punchedAt: checkOutAt.toISOString(),
                  photoDataUrl: row.check_out_photo ?? "",
                  location: {
                      latitude: Number(row.check_out_latitude) || 0,
                      longitude: Number(row.check_out_longitude) || 0,
                      accuracy: Number(row.check_out_accuracy) || 0,
                      address: row.check_out_address ?? undefined,
                  },
              }
            : null;

    const checkedIn = Boolean(row.check_in_at && !row.check_out_at);
    const lateSeconds = Number(row.late_seconds) || 0;

    return {
        record: day,
        checkedIn,
        checkIn,
        checkOut,
        late: {
            isLate: lateSeconds > 0 || row.status === "late",
            secondsLate: lateSeconds,
            graceMinutes: 0,
            shiftStartMinutes: 0,
        },
    };
}

export async function getAttendanceForMonth(employeeId: string, year: number, month: number) {
    await ensureEmployeeAttendanceTable();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [rows] = await pool.query<EmployeeAttendanceRow[]>(
        `${ATTENDANCE_SELECT_SQL}
         WHERE employee_id = ? AND attendance_date >= ? AND attendance_date <= ?
         ORDER BY attendance_date ASC`,
        [employeeId.trim(), start, end],
    );

    return rows.map(mapRowToDayRecord);
}

export async function getAttendanceByDate(employeeId: string, dateIso: string) {
    await ensureEmployeeAttendanceTable();
    const [rows] = await pool.query<EmployeeAttendanceRow[]>(
        `${ATTENDANCE_SELECT_SQL} WHERE employee_id = ? AND attendance_date = ? LIMIT 1`,
        [employeeId.trim(), dateIso],
    );
    return rows[0] ?? null;
}

export async function punchAttendance(employeeId: string, punch: PunchInput) {
    await ensureEmployeeAttendanceTable();
    const dateIso = attendanceDateFromIso(punch.punchedAt);
    const mysqlDateTime = toMySQLDateTimeIST(punch.punchedAt);
    const punchedAtInstant = new Date(punch.punchedAt);
    if (Number.isNaN(punchedAtInstant.getTime())) {
        throw new Error("Invalid punch time");
    }

    if (punch.type === "check-in") {
        const leaveBlock = await findLeaveBlockingCheckIn(employeeId, dateIso);
        if (leaveBlock) {
            throw new Error(
                `Cannot check in: you are on approved leave (${leaveBlock.policyName}).`,
            );
        }

        const existing = await getAttendanceByDate(employeeId, dateIso);
        if (existing?.check_in_at) {
            throw new Error("Already checked in for today");
        }

        const shift = await getEmployeeShiftForLate(employeeId);
        const late = computeLateSeconds(punch.punchedAt, shift);
        const status: AttendanceStatus = late.isLate ? "late" : "present";
        const note = late.isLate
            ? `Late by ${formatDurationHms(late.secondsLate)} (grace ${late.graceMinutes} min)`
            : late.isGrace
            ? `Checked in during grace time (${late.graceMinutes} min grace)`
            : null;

        if (existing) {
            await pool.query(
                `UPDATE ${TABLE}
                 SET status = ?, check_in_at = ?, check_in_photo = ?,
                     check_in_latitude = ?, check_in_longitude = ?, check_in_accuracy = ?, check_in_address = ?,
                     late_seconds = ?, note = ?
                 WHERE id = ?`,
                [
                    status,
                    mysqlDateTime,
                    punch.photoDataUrl,
                    punch.location.latitude,
                    punch.location.longitude,
                    punch.location.accuracy,
                    punch.location.address ?? null,
                    late.secondsLate,
                    note,
                    existing.id,
                ],
            );
        } else {
            await pool.query(
                `INSERT INTO ${TABLE}
                 (employee_id, attendance_date, status, check_in_at, check_in_photo,
                  check_in_latitude, check_in_longitude, check_in_accuracy, check_in_address,
                  late_seconds, note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employeeId.trim(),
                    dateIso,
                    status,
                    mysqlDateTime,
                    punch.photoDataUrl,
                    punch.location.latitude,
                    punch.location.longitude,
                    punch.location.accuracy,
                    punch.location.address ?? null,
                    late.secondsLate,
                    note,
                ],
            );
        }
    } else {
        const existing = await getAttendanceByDate(employeeId, dateIso);
        if (!existing?.check_in_at) {
            throw new Error("Check in first before checking out");
        }
        if (existing.check_out_at) {
            throw new Error("Already checked out for today");
        }

        const checkInAt = parseISTDateTime(existing.check_in_at);
        if (!checkInAt) throw new Error("Invalid check-in time on record");
        const workingSeconds = Math.max(
            0,
            Math.floor((punchedAtInstant.getTime() - checkInAt.getTime()) / 1000),
        );

        await pool.query(
            `UPDATE ${TABLE}
             SET check_out_at = ?, check_out_photo = ?,
                 check_out_latitude = ?, check_out_longitude = ?, check_out_accuracy = ?, check_out_address = ?,
                 working_seconds = ?
             WHERE id = ?`,
            [
                mysqlDateTime,
                punch.photoDataUrl,
                punch.location.latitude,
                punch.location.longitude,
                punch.location.accuracy,
                punch.location.address ?? null,
                workingSeconds,
                existing.id,
            ],
        );
    }

    const row = await getAttendanceByDate(employeeId, dateIso);
    if (!row) throw new Error("Failed to save attendance");
    return mapRowToTodaySession(row);
}
