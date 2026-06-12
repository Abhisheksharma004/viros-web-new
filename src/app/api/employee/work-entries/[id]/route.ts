import { NextResponse } from "next/server";
import {
    WORK_STATUSES,
    deleteEmployeeWorkEntry,
    getEmployeeWorkEntryById,
    getEmployeeWorkEntrySummary,
    isValidWorkDuration,
    updateEmployeeWorkEntry,
} from "@/lib/employeeWorkEntries";
import type { WorkStatus } from "@/lib/employeeWorkEntries";
import { isFutureWorkDate } from "@/lib/employeeWorkShared";
import { getEmployeeSession } from "@/lib/employeeSession";

type RouteContext = { params: Promise<{ id: string }> };

function parseRecordId(raw: string) {
    const id = Number.parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const recordId = parseRecordId(idParam);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid work entry id" }, { status: 400 });
        }

        const existing = await getEmployeeWorkEntryById(session.employeeId, recordId);
        if (!existing) {
            return NextResponse.json({ message: "Work entry not found" }, { status: 404 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const workDate = typeof body.work_date === "string" ? body.work_date.slice(0, 10) : "";
        const task = typeof body.task === "string" ? body.task.trim() : "";
        const activity = typeof body.activity === "string" ? body.activity.trim() : "";
        const duration = typeof body.duration === "string" ? body.duration.trim() : "";
        const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
        const remark = typeof body.remark === "string" ? body.remark.trim() : "";

        if (!workDate || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
            return NextResponse.json({ message: "Valid work date is required" }, { status: 400 });
        }
        if (isFutureWorkDate(workDate)) {
            return NextResponse.json({ message: "Work date cannot be in the future" }, { status: 400 });
        }
        if (!task) {
            return NextResponse.json({ message: "Task is required" }, { status: 400 });
        }
        if (!activity) {
            return NextResponse.json({ message: "Activity is required" }, { status: 400 });
        }
        if (duration && !isValidWorkDuration(duration)) {
            return NextResponse.json({ message: "Select a valid duration" }, { status: 400 });
        }

        const status = WORK_STATUSES.includes(statusRaw as WorkStatus)
            ? (statusRaw as WorkStatus)
            : "In Progress";

        const entry = await updateEmployeeWorkEntry(session.employeeId, recordId, {
            workDate,
            task,
            activity,
            duration: duration || null,
            status,
            remark: remark || null,
        });

        if (!entry) {
            return NextResponse.json({ message: "Failed to update work entry" }, { status: 400 });
        }

        const month = workDate.slice(0, 7);
        const summary = await getEmployeeWorkEntrySummary(session.employeeId, month);

        return NextResponse.json({
            message: "Work entry updated",
            entry,
            summary,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee work entry:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const recordId = parseRecordId(idParam);
        if (!recordId) {
            return NextResponse.json({ message: "Invalid work entry id" }, { status: 400 });
        }

        const existing = await getEmployeeWorkEntryById(session.employeeId, recordId);
        if (!existing) {
            return NextResponse.json({ message: "Work entry not found" }, { status: 404 });
        }

        const deleted = await deleteEmployeeWorkEntry(session.employeeId, recordId);
        if (!deleted) {
            return NextResponse.json({ message: "Failed to delete work entry" }, { status: 400 });
        }

        const month = existing.work_date.slice(0, 7);
        const summary = await getEmployeeWorkEntrySummary(session.employeeId, month);

        return NextResponse.json({ message: "Work entry deleted", summary });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting employee work entry:", error);
        return NextResponse.json({ message }, { status: 400 });
    }
}
