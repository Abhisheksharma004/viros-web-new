import { NextResponse } from "next/server";
import { withdrawEmployeeLeaveRequest } from "@/lib/employeeLeave";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
        }

        const updated = await withdrawEmployeeLeaveRequest(session.employeeId, id);
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error withdrawing leave request:", error);
        const statusCode =
            message.includes("not found") ? 404 : message.includes("no longer") ? 400 : 500;
        return NextResponse.json(
            { message: message || "Failed to withdraw leave request" },
            { status: statusCode },
        );
    }
}
