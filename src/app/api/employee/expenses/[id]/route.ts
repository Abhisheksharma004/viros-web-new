import { NextResponse } from "next/server";
import {
    EXPENSE_CATEGORIES,
    EXPENSE_PAYMENT_MODES,
    deleteEmployeeExpense,
    getEmployeeExpenseById,
    updateEmployeeExpense,
} from "@/lib/employeeExpenses";
import { getEmployeeSession } from "@/lib/employeeSession";

type RouteContext = { params: Promise<{ id: string }> };

function parseRecordId(raw: string) {
    const id = Number.parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const recordId = parseRecordId(idParam);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid expense id" }, { status: 400 });
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

        const expense = await updateEmployeeExpense(session.employeeId, recordId, {
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

        if (!expense) {
            return NextResponse.json({ message: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Expense updated", expense });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee expense:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const recordId = parseRecordId(idParam);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid expense id" }, { status: 400 });
        }

        const existing = await getEmployeeExpenseById(session.employeeId, recordId);
        if (!existing) {
            return NextResponse.json({ message: "Expense not found" }, { status: 404 });
        }

        const deleted = await deleteEmployeeExpense(session.employeeId, recordId);
        if (!deleted) {
            return NextResponse.json({ message: "Failed to delete expense" }, { status: 400 });
        }

        return NextResponse.json({ message: "Expense deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting employee expense:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}
