import { NextResponse } from "next/server";
import { reviewEmployeeExpenseBatch } from "@/lib/employeeExpenses";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const action = body.action === "reject" ? "reject" : body.action === "approve" ? "approve" : null;
        const employeeId = typeof body.employee_id === "string" ? body.employee_id.trim() : "";
        const month = typeof body.month === "string" ? body.month.trim() : "";
        const rejectReason =
            typeof body.reject_reason === "string" ? body.reject_reason.trim() : "";

        if (!action) {
            return NextResponse.json({ message: "Action must be approve or reject" }, { status: 400 });
        }
        if (!employeeId) {
            return NextResponse.json({ message: "Employee id is required" }, { status: 400 });
        }
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ message: "Valid month (YYYY-MM) is required" }, { status: 400 });
        }
        if (action === "reject" && !rejectReason) {
            return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 });
        }

        const result = await reviewEmployeeExpenseBatch(employeeId, month, action, {
            rejectReason: action === "reject" ? rejectReason : undefined,
        });

        const actionLabel = action === "approve" ? "approved" : "rejected";
        const amountNote =
            action === "approve" && result.totalApprovedAmount !== undefined
                ? ` (${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(result.totalApprovedAmount)} approved)`
                : "";
        return NextResponse.json({
            message: `${result.updatedCount} expense${result.updatedCount === 1 ? "" : "s"} ${actionLabel} in batch${amountNote}`,
            updatedCount: result.updatedCount,
            totalApprovedAmount: result.totalApprovedAmount,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin expense batch POST error:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}
