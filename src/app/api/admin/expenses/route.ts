import { NextResponse } from "next/server";
import {
    EXPENSE_ADMIN_STATUSES,
    listAdminExpenseBatchSummaries,
    listAdminExpenseEmployeeSummaries,
    listAllExpensesForAdmin,
} from "@/lib/employeeExpenses";
import type { AdminExpenseFilters, ExpenseStatus } from "@/lib/employeeExpenses";

type StatusFilter = ExpenseStatus | "all";

function parseStatusFilter(param: string | undefined): StatusFilter {
    if (!param || param === "all") return "all";
    if ((EXPENSE_ADMIN_STATUSES as readonly string[]).includes(param)) {
        return param as ExpenseStatus;
    }
    return "all";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const view = searchParams.get("view")?.trim();
        const status = parseStatusFilter(searchParams.get("status")?.trim());

        const month = searchParams.get("month")?.trim() || undefined;
        const fromDate = searchParams.get("from")?.trim() || undefined;
        const toDate = searchParams.get("to")?.trim() || undefined;
        const employeeId = searchParams.get("employeeId")?.trim() || undefined;
        const query = searchParams.get("q")?.trim() || undefined;
        const limit = Number(searchParams.get("limit") ?? "200");

        const filters: AdminExpenseFilters = {
            status,
            month,
            fromDate,
            toDate,
            employeeId,
            query,
            limit,
        };

        if (view === "employee-wise" || view === "monthly-batches") {
            const employees = await listAdminExpenseEmployeeSummaries(filters);
            const batches = await listAdminExpenseBatchSummaries(filters);
            return NextResponse.json(
                { employees, batches, month: month ?? null },
                { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
            );
        }

        const expenses = await listAllExpensesForAdmin(filters);

        return NextResponse.json(
            { expenses },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin expenses GET error:", error);
        return NextResponse.json({ message: "Failed to load expenses", error: message }, { status: 500 });
    }
}

