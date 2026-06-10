/** Client-safe types and constants for employee work entries (no database imports). */

export const WORK_STATUSES = ["In Progress", "Completed", "Pending", "On Hold"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

const MAX_WORK_HOURS = 9;

export const WORK_DURATION_OPTIONS = [
    "30 minutes",
    ...Array.from({ length: MAX_WORK_HOURS }, (_, i) => {
        const hours = i + 1;
        return hours === 1 ? "1 hour" : `${hours} hours`;
    }),
    "Full Day",
] as const;

export type EmployeeWorkEntryRow = {
    id: number;
    employee_id: string;
    employee_name: string | null;
    work_date: string;
    task: string;
    activity: string;
    duration: string | null;
    status: WorkStatus;
    remark: string | null;
    created_at: string;
};

export type WorkEntrySummary = {
    total: number;
    inProgress: number;
    completed: number;
};

export type AdminWorkEntrySummary = WorkEntrySummary & {
    employeeCount: number;
};

export function isValidWorkDuration(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return WORK_DURATION_OPTIONS.includes(trimmed as (typeof WORK_DURATION_OPTIONS)[number]);
}

export function normalizeWorkStatus(value: string): WorkStatus {
    return WORK_STATUSES.includes(value as WorkStatus) ? (value as WorkStatus) : "In Progress";
}

export function todayDateOnly(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isFutureWorkDate(workDate: string): boolean {
    return workDate > todayDateOnly();
}
