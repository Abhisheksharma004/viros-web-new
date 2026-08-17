import {
    ensureEmployeeAttendanceTable,
    getAttendanceByDate,
    getAttendanceForMonth,
    getEmployeeShiftForLate,
    mapRowToTodaySession,
    type AttendanceDayRecord,
    type AttendanceStatus,
} from "@/lib/employeeAttendance";
import { listTasksForEmployee } from "@/lib/adminTasks";
import { type TaskPriority, type TaskRow } from "@/lib/adminTaskUiShared";
import {
    fetchLeaveRequestsOverlappingMonth,
    getTodayLeaveInfo,
    mergeLeaveRequestsIntoAttendanceRecords,
} from "@/lib/attendanceLeaveSync";
import {
    fetchCorporateEventsForMonth,
    getCorporateHolidayForDate,
    mergeCorporateEventsIntoAttendanceRecords,
    type CorporateEventForAttendance,
} from "@/lib/attendanceCorporateCalendarSync";
import { mergeMonthRecordsWithShift } from "@/lib/attendanceSchedule";
import { todayDateOnly } from "@/lib/dateOnly";
import {
    ensureEmployeeLeaveDataReady,
    fetchActivePolicies,
    fetchEmployeeRequests,
    fetchOrgSettings,
    fetchUsedDaysByPolicy,
    leaveRequestStatusLabel,
} from "@/lib/employeeLeave";
import {
    getEmployeeExpenseSummary,
    getEmployeeExpenseSummaryByStatus,
    listEmployeeExpenses,
} from "@/lib/employeeExpenses";
import {
    formatCurrency,
    formatCurrencyWhole,
    formatExpenseDateTime,
} from "@/lib/employeeExpenseUi";
import type { EmployeeSession } from "@/lib/employeeSession";
import { buildBirthdayWishCards } from "@/lib/employeeBirthdayCards";
import { fetchEmployeeBirthdayAlerts } from "@/lib/employeeBirthdays";
import { getUpcomingCorporateEventsAlerts, type CorporateEventApi } from "@/lib/corporateCalendar";

export type DashboardActivityType = "success" | "info" | "warning";

export type DashboardHeroSlideVariant = "default" | "birthday-today" | "birthday-soon" | "corporate-event";

export type DashboardHeroSlide = {
    id: string;
    variant?: DashboardHeroSlideVariant;
    eyebrow: string;
    title: string;
    subtitle: string;
    badge?: { text: string; variant: "emerald" | "amber" | "cyan" | "rose" };
    metrics: { label: string; value: string }[];
    href?: string;
    /** Initials shown on birthday slide avatar */
    birthdayInitials?: string;
    /** Short line below subtitle on birthday slides */
    birthdayHint?: string;
    /** Corporate Event object for corporate event slides */
    corporateEvent?: CorporateEventApi;
};

export type DashboardTaskItem = {
    recordId: number;
    title: string;
    due: string;
    priority: string;
    priorityKey: TaskPriority;
    done: boolean;
    href: string;
};

export type DashboardUpdateItem = {
    id: string;
    title: string;
    date: string;
    tag: string;
    tagStyle: "leave" | "expense" | "task";
    href: string;
};

export type DashboardActivityItem = {
    id: string;
    action: string;
    time: string;
    type: DashboardActivityType;
    href?: string;
};

export type DashboardAttendanceBar = {
    label: string;
    value: number;
    total: number;
    color: string;
};

export type EmployeeDashboardPayload = {
    employeeName: string;
    monthLabel: string;
    todayCheckedIn: boolean;
    punchSubtitle: string;
    stats: {
        daysPresent: number;
        leaveBalance: number;
        pendingTasks: number;
        expenseTotal: string;
        expenseSubtextApproved: string;
        expenseSubtextReject: string;
        expenseSubtextAll: string;
        expenseApprovedCount: number;
        expenseRejectedCount: number;
    };
    attendanceBars: DashboardAttendanceBar[];
    attendanceRate: number;
    tasks: DashboardTaskItem[];
    updates: DashboardUpdateItem[];
    recentActivity: DashboardActivityItem[];
    heroSlides: DashboardHeroSlide[];
    corporateEvents: CorporateEventApi[];
};

function birthdayCardsToHeroSlides(
    cards: ReturnType<typeof buildBirthdayWishCards>,
): DashboardHeroSlide[] {
    return cards.map((card) => ({
        id: card.id,
        variant: card.variant,
        eyebrow: card.eyebrow,
        title: card.title,
        subtitle: card.subtitle,
        badge: {
            text: card.badgeText,
            variant: card.variant === "birthday-today" ? ("rose" as const) : ("cyan" as const),
        },
        metrics: [],
        birthdayInitials: card.initials,
        birthdayHint: card.hint,
    }));
}

function corporateEventsToHeroSlides(
    events: CorporateEventApi[],
): DashboardHeroSlide[] {
    return events.map((event) => ({
        id: `corp-event-${event.id}`,
        variant: "corporate-event" as const,
        eyebrow: `Corporate Event · ${(event.event_type || "company_event").replace(/_/g, " ").toUpperCase()}`,
        title: event.title,
        subtitle: event.description || `${event.location || "Office HQ"} · ${event.audience}`,
        badge: {
            text: event.start_date,
            variant: "cyan" as const,
        },
        metrics: [],
        corporateEvent: event,
    }));
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrencyCompact(amount: number) {
    if (amount >= 100_000) {
        const lakhs = amount / 100_000;
        return `₹${lakhs >= 10 ? Math.round(lakhs) : lakhs.toFixed(1)}L`;
    }
    if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
    return formatCurrency(amount);
}

function formatTaskDueLabel(dueDate: string) {
    if (!dueDate) return "—";
    const due = new Date(`${dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() === today.getTime()) return "Today";
    if (due.getTime() === tomorrow.getTime()) return "Tomorrow";
    return due.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function priorityLabel(p: TaskPriority) {
    return p.charAt(0).toUpperCase() + p.slice(1);
}

function countAttendanceStats(records: AttendanceDayRecord[]) {
    const working = records.filter(
        (r) => !["weekend", "holiday", "leave-pending"].includes(r.status as string),
    );
    const present = working.filter((r) => r.status === "present" || r.status === "late").length;
    const absent = working.filter((r) => r.status === "absent").length;
    const leave = working.filter(
        (r) => r.status === "leave" || r.status === "half-day",
    ).length;
    const late = working.filter((r) => r.status === "late").length;
    const total = working.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, late, total, rate };
}

function todayStatusBadge(
    todayRecord: AttendanceDayRecord | undefined,
    checkedIn: boolean,
    onLeave: boolean,
    todayHoliday?: CorporateEventForAttendance | null,
): { text: string; variant: "emerald" | "amber" | "cyan" } {
    if (onLeave) return { text: "On leave", variant: "cyan" };
    if (!checkedIn && todayHoliday) {
        return { text: todayHoliday.title || "Holiday", variant: "cyan" };
    }
    const status = todayRecord?.status;
    if (status === "present" || (checkedIn && status !== "late" && status !== "absent")) {
        return { text: "Present", variant: "emerald" };
    }
    if (status === "holiday") return { text: todayRecord?.note || "Holiday", variant: "cyan" };
    if (status === "late") return { text: "Late", variant: "amber" };
    if (status === "absent") return { text: "Absent", variant: "amber" };
    if (status === "leave" || status === "half-day") return { text: "On leave", variant: "cyan" };
    if (checkedIn) return { text: "Checked in", variant: "emerald" };
    return { text: "Mark attendance", variant: "amber" };
}

type CheckInDisplay = string | { time?: string } | null | undefined;

/** Session punch uses an object; day records use a string. */
function displayCheckInTime(checkIn: CheckInDisplay): string | null {
    if (!checkIn) return null;
    if (typeof checkIn === "string") {
        const trimmed = checkIn.trim();
        return trimmed || null;
    }
    if (typeof checkIn === "object" && typeof checkIn.time === "string") {
        const trimmed = checkIn.time.trim();
        return trimmed || null;
    }
    return null;
}

function statusLabel(status: AttendanceStatus | string) {
    switch (status) {
        case "present":
            return "Present";
        case "late":
            return "Late";
        case "absent":
            return "Absent";
        case "leave":
            return "Leave";
        case "half-day":
            return "Half day";
        default:
            return String(status);
    }
}

function isTaskOpen(task: TaskRow) {
    return task.status !== "completed";
}

function isDueThisWeek(dueDate: string) {
    if (!dueDate) return false;
    const due = new Date(`${dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    due.setHours(0, 0, 0, 0);
    return due.getTime() >= today.getTime() && due.getTime() < weekEnd.getTime();
}

function buildActivityFeed(input: {
    expenses: Awaited<ReturnType<typeof listEmployeeExpenses>>;
    leaveRequests: Awaited<ReturnType<typeof fetchEmployeeRequests>>;
    tasks: TaskRow[];
    checkedIn: boolean;
    checkInTime: string | null;
}): DashboardActivityItem[] {
    const items: { sort: number; item: DashboardActivityItem }[] = [];

    for (const exp of input.expenses.slice(0, 5)) {
        const ts = new Date(exp.created_at).getTime();
        if (!Number.isFinite(ts)) continue;
        const status =
            exp.status === "approved" ? "success" : exp.status === "rejected" ? "warning" : "info";
        items.push({
            sort: ts,
            item: {
                id: `exp-${exp.id}`,
                action: `Expense ${exp.status}: ${exp.title}`,
                time: formatExpenseDateTime(exp.created_at),
                type: status,
                href: "/employee-dashboard/add-expense",
            },
        });
    }

    for (const req of input.leaveRequests.slice(0, 5)) {
        const ts = new Date(`${req.applied_on}T12:00:00`).getTime();
        if (!Number.isFinite(ts)) continue;
        const label = leaveRequestStatusLabel(req.status, req.rejected_at_stage);
        items.push({
            sort: ts,
            item: {
                id: `leave-${req.id}`,
                action: `Leave (${label}): ${req.policy_name}`,
                time: new Date(`${req.applied_on}T12:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }),
                type:
                    req.status === "approved"
                        ? "success"
                        : req.status === "rejected"
                            ? "warning"
                            : "info",
                href: "/employee-dashboard/leave",
            },
        });
    }

    for (const task of input.tasks.filter((t) => t.status === "completed").slice(0, 3)) {
        const ts = new Date(task.createdAt).getTime();
        if (!Number.isFinite(ts)) continue;
        items.push({
            sort: ts,
            item: {
                id: `task-done-${task.recordId}`,
                action: `Task completed: ${task.title}`,
                time: new Date(task.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                }),
                type: "success",
                href: "/employee-dashboard/tasks",
            },
        });
    }

    if (input.checkedIn) {
        items.push({
            sort: Date.now(),
            item: {
                id: "attendance-today",
                action: "Attendance marked for today",
                time: input.checkInTime ?? "Today",
                type: "success",
                href: "/employee-dashboard/attendance",
            },
        });
    }

    return items
        .sort((a, b) => b.sort - a.sort)
        .slice(0, 8)
        .map((x) => x.item);
}

function buildUpdates(input: {
    leaveRequests: Awaited<ReturnType<typeof fetchEmployeeRequests>>;
    expenses: Awaited<ReturnType<typeof listEmployeeExpenses>>;
}): DashboardUpdateItem[] {
    const updates: DashboardUpdateItem[] = [];

    for (const req of input.leaveRequests.slice(0, 4)) {
        if (!["pending", "l1_approved", "approved", "rejected"].includes(req.status)) continue;
        const start = new Date(`${req.start_date}T12:00:00`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
        const end = new Date(`${req.end_date}T12:00:00`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        updates.push({
            id: `leave-up-${req.id}`,
            title: `${req.policy_name} · ${req.days} day(s)`,
            date: `${start} – ${end}`,
            tag: leaveRequestStatusLabel(req.status, req.rejected_at_stage),
            tagStyle: "leave",
            href: "/employee-dashboard/leave",
        });
    }

    for (const exp of input.expenses.filter((e) => e.status === "pending").slice(0, 3)) {
        updates.push({
            id: `exp-up-${exp.id}`,
            title: exp.title,
            date: formatCurrency(exp.amount),
            tag: "Pending approval",
            tagStyle: "expense",
            href: "/employee-dashboard/add-expense",
        });
    }

    return updates.slice(0, 5);
}

export async function buildEmployeeDashboard(
    session: EmployeeSession,
    greeting: string,
): Promise<EmployeeDashboardPayload> {
    const employeeId = session.employeeId.trim();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthKey = currentMonthKey();
    const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const todayIso = todayDateOnly();

    await Promise.all([ensureEmployeeAttendanceTable(), ensureEmployeeLeaveDataReady()]);

    const shift = await getEmployeeShiftForLate(employeeId);
    const workingDays = shift?.working_days?.length ? shift.working_days : [1, 2, 3, 4, 5];

    const [
        dbRecords,
        leaveRequestsMonth,
        todayLeave,
        todayRow,
        policies,
        settings,
        leaveRequests,
        tasks,
        expenses,
        expenseSummary,
        expenseApproved,
        expenseRejected,
        birthdayAlerts,
        corpEvents,
        todayHoliday,
    ] = await Promise.all([
        getAttendanceForMonth(employeeId, year, month),
        fetchLeaveRequestsOverlappingMonth(employeeId, year, month),
        getTodayLeaveInfo(employeeId, todayIso),
        getAttendanceByDate(employeeId, todayIso),
        fetchActivePolicies(),
        fetchOrgSettings(),
        fetchEmployeeRequests(employeeId, 20),
        listTasksForEmployee(employeeId),
        listEmployeeExpenses(employeeId, { month: monthKey, limit: 15 }),
        getEmployeeExpenseSummary(employeeId, monthKey),
        getEmployeeExpenseSummaryByStatus(employeeId, monthKey, "approved"),
        getEmployeeExpenseSummaryByStatus(employeeId, monthKey, "rejected"),
        fetchEmployeeBirthdayAlerts(employeeId),
        fetchCorporateEventsForMonth(year, month),
        getCorporateHolidayForDate(todayIso),
    ]);

    const withLeave = mergeLeaveRequestsIntoAttendanceRecords(dbRecords, leaveRequestsMonth);
    const records = mergeMonthRecordsWithShift(year, month, withLeave, workingDays, {
        todayIso,
        markPastAbsent: true,
    });
    const recordsWithCorp = mergeCorporateEventsIntoAttendanceRecords(records, corpEvents);
    const todayRecord = recordsWithCorp.find((r) => r.date === todayIso);
    const att = countAttendanceStats(recordsWithCorp);

    let checkedIn = false;
    let checkInTime: string | null = null;
    if (todayRow) {
        const sessionToday = mapRowToTodaySession(todayRow);
        checkedIn = sessionToday.checkedIn;
        checkInTime =
            displayCheckInTime(sessionToday.checkIn) ??
            displayCheckInTime(todayRecord?.checkIn) ??
            null;
    }

    const onLeaveToday = Boolean(todayLeave?.blocking || todayLeave);
    const todayBadge = todayStatusBadge(todayRecord, checkedIn, onLeaveToday, todayHoliday);

    const usedByPolicy = await fetchUsedDaysByPolicy(
        employeeId,
        settings.fiscal_year_start_month,
    );
    const leaveBalance = policies.reduce((sum, policy) => {
        const used = usedByPolicy.get(policy.id) ?? 0;
        const total =
            policy.accrual_cycle === "none" ? 0 : Number(policy.days_per_year) || 0;
        const remaining = total > 0 ? Math.max(0, total - used) : 0;
        return sum + remaining;
    }, 0);

    const openTasks = tasks.filter(isTaskOpen);
    const pendingTasks = openTasks.length;
    const dueThisWeek = openTasks.filter((t) => isDueThisWeek(t.dueDate)).length;

    const taskItems: DashboardTaskItem[] = [...tasks]
        .sort((a, b) => {
            const aDone = a.status === "completed" ? 1 : 0;
            const bDone = b.status === "completed" ? 1 : 0;
            if (aDone !== bDone) return aDone - bDone;
            return (a.dueDate || "").localeCompare(b.dueDate || "");
        })
        .slice(0, 6)
        .map((t) => ({
            recordId: t.recordId,
            title: t.title,
            due: formatTaskDueLabel(t.dueDate),
            priority: priorityLabel(t.priority),
            priorityKey: t.priority,
            done: t.status === "completed",
            href: "/employee-dashboard/tasks",
        }));

    const attendanceBars: DashboardAttendanceBar[] = [
        { label: "Present", value: att.present, total: att.total || 1, color: "#0a7c5c" },
        { label: "Absent", value: att.absent, total: att.total || 1, color: "#ef4444" },
        { label: "Leave", value: att.leave, total: att.total || 1, color: "#f59e0b" },
        { label: "Late", value: att.late, total: att.total || 1, color: "#8b5cf6" },
    ];

    const expenseTotalCompact = formatCurrencyCompact(expenseSummary.totalAmount);
    const expenseApprovedFormatted = formatCurrencyWhole(expenseApproved.totalAmount);
    const expenseRejectedFormatted = formatCurrencyWhole(expenseRejected.totalAmount);
    const expenseAllFormatted = formatCurrencyWhole(expenseSummary.totalAmount);
    const birthdaySlides = birthdayCardsToHeroSlides(buildBirthdayWishCards(birthdayAlerts));
    const summarySlides: DashboardHeroSlide[] = [
        {
            id: "dashboard",
            variant: "default",
            eyebrow: greeting,
            title: session.name ? `Hi, ${session.name.split(" ")[0]}` : "My Dashboard",
            subtitle: "Your work summary for today",
            badge: todayBadge,
            metrics: [
                { label: "Attendance", value: `${att.rate}%` },
                { label: "Tasks", value: String(pendingTasks) },
                { label: "Leave", value: String(leaveBalance) },
            ],
            href: "/employee-dashboard/attendance",
        },
        {
            id: "attendance",
            variant: "default",
            eyebrow: "Attendance",
            title: monthLabel,
            subtitle: "Your punch & presence record",
            badge: { text: `${att.present} days`, variant: "cyan" },
            href: "/employee-dashboard/attendance",
            metrics: [
                { label: "Present", value: String(att.present) },
                { label: "Absent", value: String(att.absent) },
                { label: "Leave", value: String(att.leave) },
            ],
        },
        {
            id: "tasks",
            variant: "default",
            eyebrow: "Tasks & leave",
            title: "Action Items",
            subtitle: "Pending work & leave balance",
            badge: {
                text: pendingTasks > 0 ? `${pendingTasks} pending` : "All clear",
                variant: pendingTasks > 0 ? "amber" : "cyan",
            },
            href: "/employee-dashboard/tasks",
            metrics: [
                { label: "Tasks", value: String(pendingTasks) },
                { label: "Leave", value: String(leaveBalance) },
                { label: "Due", value: String(dueThisWeek) },
            ],
        },
        {
            id: "expenses",
            variant: "default",
            eyebrow: "Expenses",
            title: "Claims",
            subtitle: "Track submissions this month",
            href: "/employee-dashboard/add-expense",
            metrics: [
                { label: "Total", value: expenseTotalCompact },
                { label: "Pending", value: String(expenseSummary.pendingCount) },
                { label: "Approved", value: String(expenseApproved.expenseCount) },
            ],
        },
    ];
    const corporateEvents = await getUpcomingCorporateEventsAlerts();
    const eventSlides = corporateEventsToHeroSlides(corporateEvents);
    const heroSlides: DashboardHeroSlide[] = [...birthdaySlides, ...eventSlides, ...summarySlides];

    return {
        employeeName: session.name,
        monthLabel,
        todayCheckedIn: checkedIn,
        punchSubtitle: dashboardTodayPunchLabel(checkedIn, todayRecord, checkInTime),
        stats: {
            daysPresent: att.present,
            leaveBalance,
            pendingTasks,
            expenseTotal: expenseAllFormatted,
            expenseSubtextApproved:
                expenseApproved.expenseCount > 0
                    ? `${expenseApproved.expenseCount} approved · ${expenseApprovedFormatted}`
                    : "No approved",
            expenseSubtextReject: `Reject ${expenseRejectedFormatted}`,
            expenseSubtextAll:
                expenseSummary.pendingCount > 0
                    ? `${expenseSummary.pendingCount} pending`
                    : expenseSummary.draftCount > 0
                        ? `${expenseSummary.draftCount} draft`
                        : "This month",
            expenseApprovedCount: expenseApproved.expenseCount,
            expenseRejectedCount: expenseRejected.expenseCount,
        },
        attendanceBars,
        attendanceRate: att.rate,
        tasks: taskItems,
        updates: buildUpdates({ leaveRequests, expenses }),
        recentActivity: buildActivityFeed({
            expenses,
            leaveRequests,
            tasks,
            checkedIn,
            checkInTime,
        }),
        heroSlides,
        corporateEvents,
    };
}

export function dashboardTodayPunchLabel(
    checkedIn: boolean,
    todayRecord?: AttendanceDayRecord,
    checkInTime?: string | null,
) {
    if (!checkedIn) return "Check in or view today's log";
    const time = checkInTime ?? displayCheckInTime(todayRecord?.checkIn);
    if (time) {
        return `Checked in at ${time}${todayRecord?.status ? ` · ${statusLabel(todayRecord.status)}` : ""}`;
    }
    return todayRecord?.status
        ? `Today: ${statusLabel(todayRecord.status)}`
        : "View today's attendance log";
}
