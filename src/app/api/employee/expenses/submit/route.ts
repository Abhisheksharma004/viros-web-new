import { NextResponse } from "next/server";
import {
    getEmployeeExpenseSummary,
    getEmployeeMonthClaimInfo,
    submitEmployeeExpenseMonth,
} from "@/lib/employeeExpenses";
import { getEmployeeSession } from "@/lib/employeeSession";

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const month =
            typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month.trim())
                ? body.month.trim()
                : currentMonth();

        const result = await submitEmployeeExpenseMonth(session.employeeId, month);
        const [summary, monthClaim] = await Promise.all([
            getEmployeeExpenseSummary(session.employeeId, month),
            getEmployeeMonthClaimInfo(session.employeeId, month),
        ]);

        try {
            const { upsertAdminNotification } = await import("@/lib/adminNotifications");
            await upsertAdminNotification({
                type: "expense",
                title: `New Expense Submission: ${session.name || session.employeeId}`,
                message: `${result.submittedCount} claim(s) submitted for ${month} (${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(result.totalAmount)}).`,
                href: "/admin-dashboard/expense-management",
                referenceKey: `admin:expense:${session.employeeId}:${month}:submitted`,
            });
        } catch {
            // non-fatal trigger error
        }

        return NextResponse.json({
            message: `${result.submittedCount} expense${result.submittedCount === 1 ? "" : "s"} submitted for admin approval (${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(result.totalAmount)})`,
            submittedCount: result.submittedCount,
            totalAmount: result.totalAmount,
            month,
            summary,
            monthClaim,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error submitting expense month:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}
