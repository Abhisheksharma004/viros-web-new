import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { findLeaveBlockingCheckIn } from "@/lib/attendanceLeaveSync";
import { isDateWorkingDay, DEFAULT_SHIFT_WORKING_DAYS } from "@/lib/attendanceSchedule";
import { ensureEmployeeAttendanceTable } from "@/lib/employeeAttendance";
import {
    DEFAULT_MISSED_PUNCH_DISABLE_DAYS,
    getMissedPunchDisableDaysForEmployee,
    getShiftByEmployeeId,
} from "@/lib/adminEmployeeShifts";
import {
    ensureEmployeeAccessDependencies,
} from "@/lib/adminEmployeeAccess";
import { formatDateOnlyInTimeZone, IST_TIMEZONE, todayDateOnly } from "@/lib/dateOnly";

const ACCESS_TABLE = "admin_employee_access";
const ATTENDANCE_TABLE = "employee_attendance";

/** Fallback when employee has no shift (see shift.missed_punch_disable_days) */
export const MISSED_PUNCH_DISABLE_THRESHOLD = DEFAULT_MISSED_PUNCH_DISABLE_DAYS;

/** How far back to scan (calendar days) */
const LOOKBACK_CALENDAR_DAYS = 21;

export type PortalAccessStatus = "Active" | "Disabled" | "Inactive";

export type MissedPunchPortalEvaluation = {
    portalStatus: PortalAccessStatus;
    consecutiveMissedWorkingDays: number;
    /** From employee shift (0 = auto-disable off) */
    disableThresholdDays: number;
    /** True if threshold reached (portal disabled or was already disabled for this reason) */
    accessBlocked: boolean;
    /** True if this call set portal to Disabled */
    justDisabled: boolean;
};

function addDaysIso(iso: string, delta: number): string {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + delta);
    return formatDateOnlyInTimeZone(d, IST_TIMEZONE);
}

export async function getEmployeePortalAccessStatus(
    employeeId: string,
): Promise<PortalAccessStatus | null> {
    return getPortalStatus(employeeId);
}

async function getPortalStatus(employeeId: string): Promise<PortalAccessStatus | null> {
    await ensureEmployeeAccessDependencies();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT portal_status FROM ${ACCESS_TABLE} WHERE employee_id = ? LIMIT 1`,
        [employeeId.trim()],
    );
    const raw = rows[0]?.portal_status;
    if (raw === "Active" || raw === "Disabled" || raw === "Inactive") return raw;
    return null;
}

async function hasCheckInOnDate(employeeId: string, dateIso: string): Promise<boolean> {
    await ensureEmployeeAttendanceTable();
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT check_in_at FROM ${ATTENDANCE_TABLE}
         WHERE employee_id = ? AND attendance_date = ? AND check_in_at IS NOT NULL
         LIMIT 1`,
        [employeeId.trim(), dateIso],
    );
    return rows.length > 0;
}

/**
 * Count consecutive working days (from yesterday backward) with no check-in.
 * Skips week-offs and approved full-day leave without breaking the streak.
 */
export async function countConsecutiveMissedWorkingDays(
    employeeId: string,
    options?: { throughDateIso?: string; disableThreshold?: number },
): Promise<number> {
    const trimmed = employeeId.trim();
    const through = options?.throughDateIso ?? todayDateOnly();
    const yesterday = addDaysIso(through, -1);

    const shift = await getShiftByEmployeeId(trimmed);
    const activeShift = shift?.is_active ? shift : null;
    const workingDays =
        activeShift?.working_days?.length && activeShift.working_days.length > 0
            ? activeShift.working_days
            : DEFAULT_SHIFT_WORKING_DAYS;

    const threshold =
        options?.disableThreshold ??
        (await getMissedPunchDisableDaysForEmployee(trimmed));

    if (threshold <= 0) {
        return 0;
    }

    let streak = 0;
    let cursor = yesterday;

    for (let i = 0; i < LOOKBACK_CALENDAR_DAYS; i++) {
        if (!isDateWorkingDay(cursor, workingDays)) {
            cursor = addDaysIso(cursor, -1);
            continue;
        }

        const onFullLeave = await findLeaveBlockingCheckIn(trimmed, cursor);
        if (onFullLeave) {
            cursor = addDaysIso(cursor, -1);
            continue;
        }

        const punched = await hasCheckInOnDate(trimmed, cursor);
        if (punched) {
            break;
        }

        streak += 1;
        if (streak >= threshold) {
            break;
        }

        cursor = addDaysIso(cursor, -1);
    }

    return streak;
}

export async function disableEmployeePortalForMissedPunches(
    employeeId: string,
): Promise<boolean> {
    await ensureEmployeeAccessDependencies();
    const [result] = await pool.query(
        `UPDATE ${ACCESS_TABLE}
         SET portal_status = 'Disabled'
         WHERE employee_id = ? AND portal_status = 'Active'`,
        [employeeId.trim()],
    );
    return ((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

/**
 * If employee missed check-in on 2+ consecutive working days (excluding week-offs & approved full leave),
 * set portal_status to Disabled.
 */
export async function evaluateMissedPunchPortalAccess(
    employeeId: string,
): Promise<MissedPunchPortalEvaluation> {
    const trimmed = employeeId.trim();
    const disableThreshold = await getMissedPunchDisableDaysForEmployee(trimmed);
    const missed = await countConsecutiveMissedWorkingDays(trimmed, { disableThreshold });
    let portalStatus = await getPortalStatus(trimmed);

    if (!portalStatus) {
        return {
            portalStatus: "Inactive",
            consecutiveMissedWorkingDays: missed,
            disableThresholdDays: disableThreshold,
            accessBlocked: true,
            justDisabled: false,
        };
    }

    let justDisabled = false;

    if (
        disableThreshold > 0 &&
        portalStatus === "Active" &&
        missed >= disableThreshold
    ) {
        justDisabled = await disableEmployeePortalForMissedPunches(trimmed);
        if (justDisabled) {
            console.log(
                `[Attendance] Auto-disabled portal for ${trimmed}: ${missed} consecutive working day(s) without check-in`,
            );
        }
        portalStatus = (await getPortalStatus(trimmed)) ?? "Disabled";
    }

    const accessBlocked =
        portalStatus === "Disabled" || portalStatus === "Inactive";

    return {
        portalStatus,
        consecutiveMissedWorkingDays: missed,
        disableThresholdDays: disableThreshold,
        accessBlocked,
        justDisabled,
    };
}

export function missedPunchPortalBlockMessage(thresholdDays: number = MISSED_PUNCH_DISABLE_THRESHOLD): string {
    const days = Math.max(1, thresholdDays);
    return `Your portal login has been disabled because you did not check in for ${days} working day${days === 1 ? "" : "s"} in a row (week-offs and approved leave are excluded). Please contact your administrator.`;
}

export function missedPunchPortalWarningMessage(
    missed: number,
    thresholdDays: number = MISSED_PUNCH_DISABLE_THRESHOLD,
): string | null {
    if (thresholdDays <= 0) return null;
    if (missed < 1) return null;
    if (missed >= thresholdDays) {
        return missedPunchPortalBlockMessage(thresholdDays);
    }
    const remaining = thresholdDays - missed;
    return `You missed check-in on ${missed} working day(s) (week-offs and approved leave excluded). If you miss ${remaining} more working day${remaining === 1 ? "" : "s"} without check-in, your portal login will be disabled.`;
}
