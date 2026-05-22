/** Deep-link helpers for admin HRMS pages. */

export type AdminAttendanceTab = "daily" | "monthly" | "employee";

export function adminAttendanceUrl(options?: {
    tab?: AdminAttendanceTab;
    employeeId?: string;
    month?: string;
    date?: string;
}): string {
    const params = new URLSearchParams();
    if (options?.tab) params.set("tab", options.tab);
    if (options?.employeeId?.trim()) {
        params.set("employeeId", options.employeeId.trim().toUpperCase());
    }
    if (options?.month && /^\d{4}-\d{2}$/.test(options.month)) {
        params.set("month", options.month);
    }
    if (options?.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
        params.set("date", options.date);
    }
    const qs = params.toString();
    return qs ? `/admin-dashboard/attendance?${qs}` : "/admin-dashboard/attendance";
}

export function adminAttendanceForEmployee(
    employeeId: string,
    options?: { month?: string; date?: string },
): string {
    return adminAttendanceUrl({
        tab: "employee",
        employeeId,
        month: options?.month,
        date: options?.date,
    });
}

export function adminAttendanceDailyForEmployee(
    employeeId: string,
    date?: string,
): string {
    return adminAttendanceUrl({
        tab: "daily",
        employeeId,
        date,
    });
}
