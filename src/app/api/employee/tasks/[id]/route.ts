import { NextResponse } from "next/server";
import { employeeUpdateTask, parseTaskStatus } from "@/lib/adminTasks";
import { getEmployeeSession } from "@/lib/employeeSession";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const recordId = Number.parseInt(id, 10);
        if (!Number.isFinite(recordId) || recordId <= 0) {
            return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const statusRaw = parseTaskStatus(body.status);
        const status =
            statusRaw === "pending" || statusRaw === "in-progress" || statusRaw === "completed"
                ? statusRaw
                : undefined;
        const remark = typeof body.remark === "string" ? body.remark : "";

        if (!status && !remark.trim()) {
            return NextResponse.json(
                { message: "Select a status and/or enter a remark." },
                { status: 400 },
            );
        }

        const task = await employeeUpdateTask(recordId, session.employeeId, session.name, {
            status,
            remark: remark.trim() || undefined,
        });

        if (!task) {
            return NextResponse.json({ message: "Task not found or not assigned to you" }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee task:", error);
        return NextResponse.json({ message: "Failed to update task", error: message }, { status: 500 });
    }
}
