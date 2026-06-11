import { NextResponse } from "next/server";
import {
    EXPENSE_ADMIN_STATUSES,
    deleteExpenseForAdmin,
    reworkExpenseForAdmin,
    updateExpenseStatusForAdmin,
} from "@/lib/employeeExpenses";
import type { ExpenseStatus } from "@/lib/employeeExpenses";

type RouteContext = { params: Promise<{ id: string }> };

function parseRecordId(raw: string) {
    const recordId = Number.parseInt(raw, 10);
    return Number.isFinite(recordId) && recordId > 0 ? recordId : null;
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const recordId = parseRecordId(id);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid expense id" }, { status: 400 });
        }

        const deleted = await deleteExpenseForAdmin(recordId);
        if (!deleted) {
            return NextResponse.json({ message: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Expense deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin expense DELETE error:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const recordId = parseRecordId(id);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid expense id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const action = typeof body.action === "string" ? body.action.trim() : "";

        if (action === "rework") {
            const reworkReason =
                typeof body.rework_reason === "string" ? body.rework_reason.trim() : "";
            const updated = await reworkExpenseForAdmin(recordId, { reworkReason });
            if (!updated) {
                return NextResponse.json({ message: "Expense not found" }, { status: 404 });
            }
            return NextResponse.json(updated);
        }

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

