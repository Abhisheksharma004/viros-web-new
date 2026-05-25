import { NextResponse } from "next/server";
import { listTasksForEmployee } from "@/lib/adminTasks";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const tasks = await listTasksForEmployee(session.employeeId);

        return NextResponse.json(
            {
                employeeId: session.employeeId,
                employeeName: session.name,
                tasks,
            },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                },
            },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee tasks:", error);
        return NextResponse.json({ message: "Failed to fetch tasks", error: message }, { status: 500 });
    }
}
