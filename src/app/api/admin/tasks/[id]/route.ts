import { NextResponse } from "next/server";
import {
    deleteAdminTask,
    getTaskAssigneeEmployeeIds,
    parseTaskPriority,
    parseTaskStatus,
    updateAdminTask,
} from "@/lib/adminTasks";
import { sendTaskAssignmentEmails } from "@/lib/taskAssignmentEmail";

type RouteContext = { params: Promise<{ id: string }> };

function parseAssignees(body: Record<string, unknown>) {
    const assigneesRaw = body.assignees;
    if (!Array.isArray(assigneesRaw)) return [];
    return assigneesRaw
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const employee_id = typeof row.employee_id === "string" ? row.employee_id.trim() : "";
            const full_name = typeof row.full_name === "string" ? row.full_name.trim() : "";
            const department =
                typeof row.department === "string" ? row.department.trim() || null : null;
            if (!employee_id || !full_name) return null;
            return { employee_id, full_name, department };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const recordId = Number.parseInt(id, 10);
        if (!Number.isFinite(recordId) || recordId <= 0) {
            return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.description === "string" ? body.description.trim() : "";
        const priority = parseTaskPriority(body.priority) ?? "medium";
        const status = parseTaskStatus(body.status) ?? "pending";
        const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
        const assignees = parseAssignees(body);

        if (!title) {
            return NextResponse.json({ message: "Task title is required" }, { status: 400 });
        }
        if (assignees.length === 0) {
            return NextResponse.json({ message: "Select at least one assignee" }, { status: 400 });
        }

        const previousAssigneeIds = await getTaskAssigneeEmployeeIds(recordId);
        const previousSet = new Set(previousAssigneeIds);

        const task = await updateAdminTask(recordId, {
            title,
            description,
            priority,
            status,
            dueDate,
            assignees,
        });

        if (!task) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        const newlyAssignedIds = assignees
            .map((a) => a.employee_id)
            .filter((id) => !previousSet.has(id));

        if (newlyAssignedIds.length > 0) {
            void sendTaskAssignmentEmails(task, newlyAssignedIds, { isNewTask: false });
            const { notifyTaskAssigned } = await import("@/lib/employeeNotifications");
            for (const employeeId of newlyAssignedIds) {
                void notifyTaskAssigned(employeeId, {
                    recordId: task.recordId,
                    title: task.title,
                    dueDate: task.dueDate,
                });
            }
        }

        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating admin task:", error);
        return NextResponse.json({ message: "Failed to update task", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const recordId = Number.parseInt(id, 10);
        if (!Number.isFinite(recordId) || recordId <= 0) {
            return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
        }

        const deleted = await deleteAdminTask(recordId);
        if (!deleted) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Task deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting admin task:", error);
        return NextResponse.json({ message: "Failed to delete task", error: message }, { status: 500 });
    }
}
