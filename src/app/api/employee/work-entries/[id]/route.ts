import { NextResponse } from "next/server";
import {
    deleteEmployeeWorkEntry,
    getEmployeeWorkEntryById,
    getEmployeeWorkEntrySummary,
} from "@/lib/employeeWorkEntries";
import { getEmployeeSession } from "@/lib/employeeSession";

type RouteContext = { params: Promise<{ id: string }> };

function parseRecordId(raw: string) {
    const id = Number.parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
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
