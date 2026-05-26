import { NextResponse } from "next/server";
import {
    EXPENSE_CATEGORIES,
    EXPENSE_PAYMENT_MODES,
    EXPENSE_STATUSES,
    createEmployeeExpense,
    getEmployeeExpenseSummary,
    getEmployeeExpenseSummaryByStatus,
    listEmployeeExpenses,
} from "@/lib/employeeExpenses";
import type { ExpenseStatus } from "@/lib/employeeExpenses";
import { getEmployeeSession } from "@/lib/employeeSession";

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month")?.trim() || currentMonth();
        const limit = Number(searchParams.get("limit") ?? "30");
        const statusParam = searchParams.get("status")?.trim() as ExpenseStatus | undefined;
        const status =
            statusParam && EXPENSE_STATUSES.includes(statusParam) ? statusParam : undefined;

        const [expenses, summary] = await Promise.all([
            listEmployeeExpenses(session.employeeId, { month, limit, status }),
            status
                ? getEmployeeExpenseSummaryByStatus(session.employeeId, month, status)
                : getEmployeeExpenseSummary(session.employeeId, month),
        ]);

        return NextResponse.json({
            expenses,
            summary: status
                ? { ...summary, pendingCount: 0 }
                : summary,
            month,
            status: status ?? null,
            categories: EXPENSE_CATEGORIES,
            paymentModes: EXPENSE_PAYMENT_MODES,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee expenses:", error);
        return NextResponse.json({ message: "Failed to load expenses", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const expenseDate =
            typeof body.expense_date === "string" ? body.expense_date.slice(0, 10) : "";
        const category = typeof body.category === "string" ? body.category.trim() : "";
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const paymentMode = typeof body.payment_mode === "string" ? body.payment_mode.trim() : "";
        const amountRaw = body.amount;
        const amount =
            typeof amountRaw === "number"
                ? amountRaw
                : typeof amountRaw === "string"
                  ? Number.parseFloat(amountRaw)
                  : NaN;

        if (!expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
            return NextResponse.json({ message: "Valid expense date is required" }, { status: 400 });
        }
        if (!category || !EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) {
            return NextResponse.json({ message: "Select a valid category" }, { status: 400 });
        }
        if (!title) {
            return NextResponse.json({ message: "Title / description is required" }, { status: 400 });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ message: "Enter a valid amount greater than zero" }, { status: 400 });
        }
        if (
            !paymentMode ||
            !EXPENSE_PAYMENT_MODES.includes(paymentMode as (typeof EXPENSE_PAYMENT_MODES)[number])
        ) {
            return NextResponse.json({ message: "Select a valid payment mode" }, { status: 400 });
        }

        const fromAddress =
            typeof body.from_address === "string" ? body.from_address.trim() : "";
        const toAddress = typeof body.to_address === "string" ? body.to_address.trim() : "";

        const expense = await createEmployeeExpense({
            employeeId: session.employeeId,
            employeeName: session.name || session.employeeId,
            expenseDate,
            category,
            fromAddress: fromAddress || null,
            toAddress: toAddress || null,
            title,
            amount: Math.round(amount * 100) / 100,
            paymentMode,
            receiptReference:
                typeof body.receipt_reference === "string" ? body.receipt_reference : null,
        });

        const month = expenseDate.slice(0, 7);
        const summary = await getEmployeeExpenseSummary(session.employeeId, month);

        return NextResponse.json(
            {
                message: `Expense submitted successfully (${expense.expense_id})`,
                expense,
                summary,
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating employee expense:", error);
        return NextResponse.json({ message: "Failed to submit expense", error: message }, { status: 500 });
    }
}
