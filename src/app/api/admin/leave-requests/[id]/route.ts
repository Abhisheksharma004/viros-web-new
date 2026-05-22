import { NextResponse } from "next/server";
import {
    fetchAdminLeaveRequestById,
    updateLeaveRequestStatus,
    LEAVE_REQUEST_STATUSES,
    type LeaveRequestStatus,
} from "@/lib/employeeLeave";

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
