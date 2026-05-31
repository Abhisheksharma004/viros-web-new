import { NextResponse } from "next/server";
import { createAdminTask, listAdminTasks, parseTaskPriority } from "@/lib/adminTasks";
import { sendTaskAssignmentEmails } from "@/lib/taskAssignmentEmail";

export async function GET() {
    try {
        const tasks = await listAdminTasks();
        return NextResponse.json(tasks, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin tasks:", error);
        return NextResponse.json({ message: "Failed to fetch tasks", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;

        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.description === "string" ? body.description.trim() : "";
        const priority = parseTaskPriority(body.priority) ?? "medium";
        const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";

        const assigneesRaw = body.assignees;
        const assignees = Array.isArray(assigneesRaw)
            ? assigneesRaw
                  .map((item) => {
                      if (!item || typeof item !== "object") return null;
                      const row = item as Record<string, unknown>;
                      const employee_id =
                          typeof row.employee_id === "string" ? row.employee_id.trim() : "";
                      const full_name = typeof row.full_name === "string" ? row.full_name.trim() : "";
                      const department =
                          typeof row.department === "string"
                              ? row.department.trim() || null
                              : null;
                      if (!employee_id || !full_name) return null;
                      return { employee_id, full_name, department };
                  })
                  .filter((a): a is NonNullable<typeof a> => a !== null)
            : [];

        if (!title) {
            return NextResponse.json({ message: "Task title is required" }, { status: 400 });
        }
        if (assignees.length === 0) {
            return NextResponse.json({ message: "Select at least one assignee" }, { status: 400 });
        }

        const task = await createAdminTask({
            title,
            description,
            priority,
            dueDate,
            assignees,
        });

        void sendTaskAssignmentEmails(
            task,
            assignees.map((a) => a.employee_id),
            { isNewTask: true },
        );

        return NextResponse.json(task, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating admin task:", error);
        return NextResponse.json({ message: "Failed to create task", error: message }, { status: 500 });
    }
}
