import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { ensureEmployeeExpensesTable } from "@/lib/employeeExpenses";
import { ensureEmployeeLeaveDataReady } from "@/lib/employeeLeave";

export type ActivityLogItem = {
    id: string;
    title: string;
    description: string;
    category: "Employees" | "Leave" | "Expenses" | "Work Entries" | "Newsletter";
    type: "success" | "warning" | "info";
    timestamp: string;
    dateLabel: string;
    timeLabel: string;
    actor: string;
    href?: string;
};

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.toLowerCase().trim() ?? "";
        const category = searchParams.get("category")?.trim() ?? "All";

        await Promise.all([
            ensureAdminEmployeesTable().catch(() => {}),
            ensureEmployeeExpensesTable().catch(() => {}),
            ensureEmployeeLeaveDataReady().catch(() => {}),
        ]);

        const activities: ActivityLogItem[] = [];

        // 1. Employees added & soft deleted
        try {
            const [empRows] = await pool.query<RowDataPacket[]>(
                `SELECT id, employee_id, full_name, designation, department, is_deleted, created_at, deleted_at
                 FROM admin_employees
                 ORDER BY created_at DESC
                 LIMIT 50`
            );

            for (const row of empRows) {
                const empName = String(row.full_name ?? row.employee_id ?? "Employee");
                const empId = String(row.employee_id ?? "");
                const dept = String(row.department ?? "Unassigned");

                if (row.created_at) {
                    const createdIso = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
                    activities.push({
                        id: `emp-add-${row.id}`,
                        title: `Employee Registered: ${empName}`,
                        description: `New employee (${empId}) added to ${dept} department.`,
                        category: "Employees",
                        type: "success",
                        timestamp: createdIso,
                        dateLabel: new Date(createdIso).toLocaleString(),
                        timeLabel: relativeTimeLabel(createdIso),
                        actor: empName,
                        href: "/admin-dashboard/employees",
                    });
                }

                if (row.is_deleted === 1 && row.deleted_at) {
                    const deletedIso = row.deleted_at instanceof Date ? row.deleted_at.toISOString() : String(row.deleted_at);
                    activities.push({
                        id: `emp-del-${row.id}`,
                        title: `Employee Archived: ${empName}`,
                        description: `Employee record (${empId}) was archived.`,
                        category: "Employees",
                        type: "warning",
                        timestamp: deletedIso,
                        dateLabel: new Date(deletedIso).toLocaleString(),
                        timeLabel: relativeTimeLabel(deletedIso),
                        actor: empName,
                        href: "/admin-dashboard/delete-employee",
                    });
                }
            }
        } catch (e) {
            console.error("Error fetching employee activities:", e);
        }

        // 2. Leave Requests
        try {
            const [leaveRows] = await pool.query<RowDataPacket[]>(
                `SELECT lr.id, lr.request_id, lr.employee_id, lr.policy_name AS leave_type, lr.status, lr.applied_on,
                        COALESCE(e.full_name, lr.employee_id) AS employee_name
                 FROM employee_leave_requests lr
                 LEFT JOIN admin_employees e ON e.employee_id = lr.employee_id
                 ORDER BY lr.applied_on DESC
                 LIMIT 50`
            );

            for (const row of leaveRows) {
                const appliedIso = row.applied_on instanceof Date ? row.applied_on.toISOString() : String(row.applied_on);
                const empName = String(row.employee_name ?? row.employee_id);
                const status = String(row.status ?? "pending").replace(/_/g, " ");

                activities.push({
                    id: `leave-${row.id}`,
                    title: `Leave Request (${row.leave_type ?? "Leave"}): ${empName}`,
                    description: `Leave request ${row.request_id} status is currently ${status.toUpperCase()}.`,
                    category: "Leave",
                    type: row.status === "approved" ? "success" : row.status === "rejected" ? "warning" : "info",
                    timestamp: appliedIso,
                    dateLabel: new Date(appliedIso).toLocaleString(),
                    timeLabel: relativeTimeLabel(appliedIso),
                    actor: empName,
                    href: "/admin-dashboard/leave-request",
                });
            }
        } catch (e) {
            console.error("Error fetching leave activities:", e);
        }

        // 3. Expenses
        try {
            const [expRows] = await pool.query<RowDataPacket[]>(
                `SELECT id, expense_id, employee_name, title, amount, status, created_at
                 FROM employee_expenses
                 ORDER BY created_at DESC
                 LIMIT 50`
            );

            for (const row of expRows) {
                const createdIso = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
                const empName = String(row.employee_name ?? "Employee");
                const amountFormatted = row.amount ? `₹${Number(row.amount).toLocaleString("en-IN")}` : "—";

                activities.push({
                    id: `exp-${row.id}`,
                    title: `Expense Claim: ${row.title || "Expense"}`,
                    description: `${empName} submitted expense claim of ${amountFormatted} (${String(row.status).toUpperCase()}).`,
                    category: "Expenses",
                    type: row.status === "approved" ? "success" : row.status === "rejected" ? "warning" : "info",
                    timestamp: createdIso,
                    dateLabel: new Date(createdIso).toLocaleString(),
                    timeLabel: relativeTimeLabel(createdIso),
                    actor: empName,
                    href: "/admin-dashboard/expense-management",
                });
            }
        } catch (e) {
            console.error("Error fetching expense activities:", e);
        }

        // 4. Work Entries
        try {
            const [workRows] = await pool.query<RowDataPacket[]>(
                `SELECT id, employee_id, employee_name, task, activity, status, created_at
                 FROM employee_work_entries
                 ORDER BY created_at DESC
                 LIMIT 50`
            );

            for (const row of workRows) {
                const createdIso = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
                const empName = String(row.employee_name ?? row.employee_id ?? "Employee");
                const taskName = String(row.task ?? row.activity ?? "Work Entry");

                activities.push({
                    id: `work-${row.id}`,
                    title: `Work Entry Logged: ${empName}`,
                    description: `Task: "${taskName}" — Status: ${String(row.status ?? "Completed").toUpperCase()}.`,
                    category: "Work Entries",
                    type: "info",
                    timestamp: createdIso,
                    dateLabel: new Date(createdIso).toLocaleString(),
                    timeLabel: relativeTimeLabel(createdIso),
                    actor: empName,
                    href: "/admin-dashboard/work-entries",
                });
            }
        } catch {
            // Table may not exist yet, ignore
        }

        // 5. Newsletter Signups
        try {
            const [newsRows] = await pool.query<RowDataPacket[]>(
                `SELECT id, email, subscribed_at
                 FROM newsletter_subscriptions
                 ORDER BY subscribed_at DESC
                 LIMIT 50`
            );

            for (const row of newsRows) {
                const subIso = row.subscribed_at instanceof Date ? row.subscribed_at.toISOString() : String(row.subscribed_at);
                activities.push({
                    id: `news-${row.id}`,
                    title: `Newsletter Subscription: ${row.email}`,
                    description: `New visitor subscribed to newsletter updates.`,
                    category: "Newsletter",
                    type: "success",
                    timestamp: subIso,
                    dateLabel: new Date(subIso).toLocaleString(),
                    timeLabel: relativeTimeLabel(subIso),
                    actor: String(row.email),
                    href: "/admin-dashboard/reports/newsletter",
                });
            }
        } catch {
            // Table may not exist yet, ignore
        }

        // Sort descending by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Apply filtering
        let filtered = activities;
        if (category !== "All") {
            filtered = filtered.filter((item) => item.category.toLowerCase() === category.toLowerCase());
        }

        if (query) {
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.actor.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query)
            );
        }

        const stats = {
            total: activities.length,
            employees: activities.filter((a) => a.category === "Employees").length,
            leaveAndExpenses: activities.filter((a) => a.category === "Leave" || a.category === "Expenses").length,
            workEntries: activities.filter((a) => a.category === "Work Entries").length,
        };

        return NextResponse.json({
            stats,
            activities: filtered,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load activity logs";
        console.error("Activity log API error:", error);
        return NextResponse.json({ message, activities: [], stats: { total: 0, employees: 0, leaveAndExpenses: 0, workEntries: 0 } }, { status: 500 });
    }
}
