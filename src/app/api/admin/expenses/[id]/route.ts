import { NextResponse } from "next/server";
import { EXPENSE_ADMIN_STATUSES, updateExpenseStatusForAdmin } from "@/lib/employeeExpenses";
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
        if (!(EXPENSE_ADMIN_STATUSES as readonly string[]).includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const rejectReason =
            typeof body.reject_reason === "string" ? body.reject_reason.trim() : "";
        if (status === "rejected" && !rejectReason) {
            return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 });
        }

        let approvedAmount: number | undefined;
        if (status === "approved") {
            const amountRaw = body.approved_amount;
            approvedAmount =
                typeof amountRaw === "number"
                    ? amountRaw
                    : typeof amountRaw === "string"
                      ? Number.parseFloat(amountRaw)
                      : undefined;
        }

        const updated = await updateExpenseStatusForAdmin(recordId, status, {
            rejectReason: status === "rejected" ? rejectReason : undefined,
            approvedAmount,
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
        if (
            message === "Enter a valid approved amount greater than zero" ||
            message === "Approved amount cannot exceed the claimed amount"
        ) {
            return NextResponse.json({ message }, { status: 400 });
        }
        console.error("Admin expense PATCH error:", error);
        return NextResponse.json({ message: "Failed to update expense", error: message }, { status: 500 });
    }
}

