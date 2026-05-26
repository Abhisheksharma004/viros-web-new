import { NextResponse } from "next/server";
import { EXPENSE_STATUSES, updateExpenseStatusForAdmin } from "@/lib/employeeExpenses";
import type { ExpenseStatus } from "@/lib/employeeExpenses";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const recordId = Number.parseInt(id, 10);
        if (!Number.isFinite(recordId) || recordId <= 0) {
            return NextResponse.json({ message: "Invalid expense id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
        const status = statusRaw as ExpenseStatus;
        if (!EXPENSE_STATUSES.includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const rejectReason =
            typeof body.reject_reason === "string" ? body.reject_reason.trim() : "";
        if (status === "rejected" && !rejectReason) {
            return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 });
        }

        const updated = await updateExpenseStatusForAdmin(recordId, status, {
            rejectReason: status === "rejected" ? rejectReason : undefined,
        });
        if (!updated) {
            return NextResponse.json({ message: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message === "Rejection reason is required") {
            return NextResponse.json({ message }, { status: 400 });
        }
        console.error("Admin expense PATCH error:", error);
        return NextResponse.json({ message: "Failed to update expense", error: message }, { status: 500 });
    }
}

