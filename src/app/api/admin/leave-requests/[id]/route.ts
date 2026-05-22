import { NextResponse } from "next/server";
import {
    fetchAdminLeaveRequestById,
    updateLeaveRequestStatus,
    LEAVE_REQUEST_STATUSES,
    type LeaveRequestStatus,
} from "@/lib/employeeLeave";
import { sendLeaveStatusNotificationToEmployee } from "@/lib/leaveNotificationEmail";

const STATUSES = LEAVE_REQUEST_STATUSES;

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await context.params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
        }

        const row = await fetchAdminLeaveRequestById(id);
        if (!row) {
            return NextResponse.json({ message: "Leave request not found" }, { status: 404 });
        }

        return NextResponse.json(row, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching leave request:", error);
        return NextResponse.json(
            { message: "Failed to fetch leave request", error: message },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await context.params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const status = body.status;
        if (typeof status !== "string" || !STATUSES.includes(status as LeaveRequestStatus)) {
            return NextResponse.json(
                { message: "Valid status is required (l1_approved, approved, rejected, or cancelled)" },
                { status: 400 },
            );
        }

        const rejectionReason =
            typeof body.rejection_reason === "string" ? body.rejection_reason : "";

        const updated = await updateLeaveRequestStatus(id, status as LeaveRequestStatus, {
            rejectionReason,
        });

        if (
            updated.status === "l1_approved" ||
            updated.status === "approved" ||
            updated.status === "rejected"
        ) {
            void sendLeaveStatusNotificationToEmployee({
                employee_id: updated.employee_id,
                employee_name: updated.employee_name,
                request_id: updated.request_id,
                policy_name: updated.policy_name,
                policy_code: updated.policy_code,
                start_date: updated.start_date,
                end_date: updated.end_date,
                days: updated.days,
                day_type: updated.day_type,
                reason: updated.reason,
                status: updated.status,
                rejected_at_stage: updated.rejected_at_stage,
                rejection_reason: updated.rejection_reason,
            });
        }

        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating leave request:", error);
        const statusCode =
            message.includes("not found")
                ? 404
                : message.includes("Cannot") ||
                    message.includes("required") ||
                    message.includes("Invalid")
                  ? 400
                  : 500;
        return NextResponse.json(
            { message: message || "Failed to update leave request" },
            { status: statusCode },
        );
    }
}
