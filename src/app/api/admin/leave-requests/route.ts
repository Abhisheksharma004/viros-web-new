import { NextResponse } from "next/server";
import {
    fetchAllLeaveRequestsForAdmin,
    fetchLeaveRequestStatsForAdmin,
    LEAVE_REQUEST_STATUSES,
    type LeaveRequestStatus,
} from "@/lib/employeeLeave";

const STATUSES = LEAVE_REQUEST_STATUSES;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get("status") ?? "all";
        const search = searchParams.get("search") ?? "";
        const withStats = searchParams.get("stats") === "1";

        const status =
            statusParam === "all" || STATUSES.includes(statusParam as LeaveRequestStatus)
                ? (statusParam as LeaveRequestStatus | "all")
                : "all";

        const requests = await fetchAllLeaveRequestsForAdmin({
            status,
            search: search || undefined,
        });

        const payload: Record<string, unknown> = { requests };
        if (withStats) {
            payload.stats = await fetchLeaveRequestStatsForAdmin();
        }

        return NextResponse.json(payload, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin leave requests:", error);
        return NextResponse.json(
            { message: "Failed to fetch leave requests", error: message },
            { status: 500 },
        );
    }
}
