import { NextResponse } from "next/server";
import {
    WORK_STATUSES,
    countEmployeeWorkEntries,
    createEmployeeWorkEntry,
    getEmployeeWorkEntrySummary,
    isValidWorkDuration,
    listEmployeeWorkEntries,
} from "@/lib/employeeWorkEntries";
import type { WorkStatus } from "@/lib/employeeWorkEntries";
import { isFutureWorkDate } from "@/lib/employeeWorkShared";
import { getEmployeeSession } from "@/lib/employeeSession";

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month")?.trim() || currentMonth();
        const limit = Number(searchParams.get("limit") ?? "100");

        const [entries, summary, totalCount] = await Promise.all([
            listEmployeeWorkEntries(session.employeeId, { month, limit }),
            getEmployeeWorkEntrySummary(session.employeeId, month),
            countEmployeeWorkEntries(session.employeeId),
        ]);

        return NextResponse.json({
            entries,
            summary,
            totalCount,
            month,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee work entries:", error);
        return NextResponse.json({ message: "Failed to load work entries", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

        const entry = await createEmployeeWorkEntry({
            employeeId: session.employeeId,
            employeeName: session.name || session.employeeId,
            workDate,
            task,
            activity,
            duration: duration || null,
            status,
            remark: remark || null,
        });

        const month = workDate.slice(0, 7);
        const summary = await getEmployeeWorkEntrySummary(session.employeeId, month);
        const totalCount = await countEmployeeWorkEntries(session.employeeId);

        return NextResponse.json(
            {
                message: "Work entry saved",
                entry,
                summary,
                totalCount,
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating employee work entry:", error);
        return NextResponse.json({ message: "Failed to save work entry", error: message }, { status: 500 });
    }
}
