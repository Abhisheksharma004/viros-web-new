import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { ensureAdminDepartmentsTable } from "@/lib/adminDepartments";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { ensureEmployeeAccessDependencies } from "@/lib/adminEmployeeAccess";
import { ensureEmployeeExpensesTable } from "@/lib/employeeExpenses";
import { ensureEmployeeLeaveDataReady } from "@/lib/employeeLeave";
import { buildBirthdayWishCards, type BirthdayWishCardData } from "@/lib/employeeBirthdayCards";
import { fetchAdminBirthdayAlerts } from "@/lib/employeeBirthdays";

export type AdminDashboardRecentEmployee = {
    employeeId: string;
    fullName: string;
    designation: string;
    department: string;
    status: string;
    initials: string;
    href: string;
};

export type AdminDashboardDepartmentSlice = {
    name: string;
    count: number;
    color: string;
};

export type AdminDashboardActivity = {
    action: string;
    time: string;
    timeLabel: string;
    type: "success" | "info" | "warning";
    href?: string;
};

export type AdminDashboardOverview = {
    stats: {
        portalAccessCount: number;
        employeeCount: number;
        activeEmployeeCount: number;
        departmentCount: number;
        birthdaysThisMonth: number;
        pendingLeaveCount: number;
        pendingExpenseCount: number;
        newsletterSubscribers: number;
    };
    recentEmployees: AdminDashboardRecentEmployee[];
    departments: AdminDashboardDepartmentSlice[];
    recentActivity: AdminDashboardActivity[];
    birthdayCards: BirthdayWishCardData[];
};

const DEPT_COLORS = ["#0a2a5e", "#00bcd4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

const ACTIVE_EMPLOYEE_SQL = `(
    employee_status IS NULL
    OR TRIM(employee_status) = ''
    OR LOWER(TRIM(employee_status)) = 'active'
)`;

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function relativeTimeLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function safeNewsletterQuery(
    sql: string,
): Promise<[RowDataPacket[], unknown]> {
    try {
        return await pool.query<RowDataPacket[]>(sql);
    } catch {
        return [[], []];
    }
}

export async function buildAdminDashboardOverview(): Promise<AdminDashboardOverview> {
    await Promise.all([
        ensureAdminEmployeesTable(),
        ensureAdminDepartmentsTable(),
        ensureEmployeeAccessDependencies(),
        ensureEmployeeExpensesTable(),
        ensureEmployeeLeaveDataReady(),
    ]);

    const [
        employeeRows,
        portalRows,
        departmentCountRows,
        deptGroupRows,
        leavePendingRows,
        expensePendingRows,
        newsletterRows,
        recentLeaveRows,
        recentExpenseRows,
        recentNewsletterRows,
    ] = await Promise.all([
        pool.query<RowDataPacket[]>(
            `SELECT employee_id, full_name, designation, department, employee_status, created_at
             FROM admin_employees
             ORDER BY created_at DESC
             LIMIT 8`,
        ),
        pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS c FROM admin_employee_access WHERE LOWER(TRIM(portal_status)) = 'active'`,
        ),
        pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS c FROM admin_departments`),
        pool.query<RowDataPacket[]>(
            `SELECT
                COALESCE(NULLIF(TRIM(department), ''), 'Unassigned') AS name,
                COUNT(*) AS count
             FROM admin_employees
             WHERE ${ACTIVE_EMPLOYEE_SQL}
             GROUP BY name
             ORDER BY count DESC, name ASC
             LIMIT 8`,
        ),
        pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS c FROM employee_leave_requests WHERE status IN ('pending', 'l1_approved')`,
        ),
        pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS c FROM employee_expenses WHERE status = 'pending'`,
        ),
        safeNewsletterQuery(`SELECT COUNT(*) AS c FROM newsletter_subscriptions WHERE status = 'active'`),
        pool.query<RowDataPacket[]>(
            `SELECT lr.request_id,
                    COALESCE(e.full_name, lr.employee_id) AS employee_name,
                    lr.status,
                    lr.applied_on
             FROM employee_leave_requests lr
             LEFT JOIN admin_employees e ON e.employee_id = lr.employee_id
             ORDER BY lr.applied_on DESC
             LIMIT 5`,
        ),
        pool.query<RowDataPacket[]>(
            `SELECT expense_id, employee_name, title, amount, status, created_at
             FROM employee_expenses
             ORDER BY created_at DESC
             LIMIT 5`,
        ),
        safeNewsletterQuery(
            `SELECT email, subscribed_at
             FROM newsletter_subscriptions
             ORDER BY subscribed_at DESC
             LIMIT 5`,
        ),
    ]);

    const allEmployees = await pool.query<RowDataPacket[]>(
        `SELECT employee_status FROM admin_employees`,
    );
    const employeeList = allEmployees[0] as RowDataPacket[];
    const employeeCount = employeeList.length;
    const activeEmployeeCount = employeeList.filter((row) => {
        const s = String(row.employee_status ?? "").trim().toLowerCase();
        return !s || s === "active";
    }).length;

    const recentEmployees: AdminDashboardRecentEmployee[] = (
        employeeRows[0] as RowDataPacket[]
    ).slice(0, 5).map((row) => {
        const fullName = String(row.full_name ?? "").trim() || "Employee";
        const status = String(row.employee_status ?? "").trim() || "Active";
        return {
            employeeId: String(row.employee_id ?? ""),
            fullName,
            designation: String(row.designation ?? "").trim() || "—",
            department: String(row.department ?? "").trim() || "—",
            status,
            initials: initialsFromName(fullName),
            href: "/admin-dashboard/employees",
        };
    });

    const deptRows = deptGroupRows[0] as RowDataPacket[];
    const departments: AdminDashboardDepartmentSlice[] = deptRows.map((row, index) => ({
        name: String(row.name),
        count: Number(row.count) || 0,
        color: DEPT_COLORS[index % DEPT_COLORS.length],
    }));

    type ActivityCandidate = AdminDashboardActivity & { sortTime: number };

    const activityCandidates: ActivityCandidate[] = [];

    for (const row of employeeRows[0] as RowDataPacket[]) {
        const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? "");
        if (!created) continue;
        const name = String(row.full_name ?? "").trim() || "Employee";
        activityCandidates.push({
            action: `New employee added: ${name}`,
            time: created,
            timeLabel: relativeTimeLabel(created),
            type: "success",
            href: "/admin-dashboard/employees",
            sortTime: new Date(created).getTime() || 0,
        });
    }

    for (const row of recentLeaveRows[0] as RowDataPacket[]) {
        const applied = row.applied_on instanceof Date ? row.applied_on.toISOString() : String(row.applied_on ?? "");
        if (!applied) continue;
        const name = String(row.employee_name ?? "").trim() || "Employee";
        const status = String(row.status ?? "").replace(/_/g, " ");
        activityCandidates.push({
            action: `Leave request ${row.request_id}: ${name} — ${status}`,
            time: applied,
            timeLabel: relativeTimeLabel(applied),
            type: row.status === "rejected" ? "warning" : "info",
            href: "/admin-dashboard/leave-request",
            sortTime: new Date(applied).getTime() || 0,
        });
    }

    for (const row of recentExpenseRows[0] as RowDataPacket[]) {
        const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? "");
        if (!created) continue;
        const name = String(row.employee_name ?? "").trim() || "Employee";
        const title = String(row.title ?? "").trim() || "Expense";
        activityCandidates.push({
            action: `Expense ${row.expense_id}: ${name} — ${title}`,
            time: created,
            timeLabel: relativeTimeLabel(created),
            type: row.status === "approved" ? "success" : row.status === "rejected" ? "warning" : "info",
            href: "/admin-dashboard/expense-management",
            sortTime: new Date(created).getTime() || 0,
        });
    }

    for (const row of recentNewsletterRows[0] as RowDataPacket[]) {
        const subscribed =
            row.subscribed_at instanceof Date ? row.subscribed_at.toISOString() : String(row.subscribed_at ?? "");
        if (!subscribed) continue;
        activityCandidates.push({
            action: `Newsletter signup: ${String(row.email ?? "")}`,
            time: subscribed,
            timeLabel: relativeTimeLabel(subscribed),
            type: "success",
            href: "/admin-dashboard/reports/newsletter",
            sortTime: new Date(subscribed).getTime() || 0,
        });
    }

    const recentActivity = activityCandidates
        .sort((a, b) => b.sortTime - a.sortTime)
        .slice(0, 8)
        .map(({ sortTime: _sortTime, ...item }) => item);

    const birthdayAlerts = await fetchAdminBirthdayAlerts();
    const birthdayCards = buildBirthdayWishCards(birthdayAlerts);

    return {
        stats: {
            portalAccessCount: Number((portalRows[0][0] as RowDataPacket)?.c) || 0,
            employeeCount,
            activeEmployeeCount,
            departmentCount: Number((departmentCountRows[0][0] as RowDataPacket)?.c) || 0,
            birthdaysThisMonth: birthdayCards.length,
            pendingLeaveCount: Number((leavePendingRows[0][0] as RowDataPacket)?.c) || 0,
            pendingExpenseCount: Number((expensePendingRows[0][0] as RowDataPacket)?.c) || 0,
            newsletterSubscribers: Number((newsletterRows[0][0] as RowDataPacket)?.c) || 0,
        },
        recentEmployees,
        departments,
        recentActivity,
        birthdayCards,
    };
}
