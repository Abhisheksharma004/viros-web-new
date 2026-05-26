import { NextResponse } from "next/server";
import { buildEmployeeDashboard } from "@/lib/employeeDashboard";
import { getEmployeeSession } from "@/lib/employeeSession";

function greetingForHour() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const greeting = greetingForHour();
        const dashboard = await buildEmployeeDashboard(session, greeting);

        return NextResponse.json(
            { greeting, ...dashboard },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee dashboard:", error);
        return NextResponse.json(
            { message: "Failed to load dashboard", error: message },
            { status: 500 },
        );
    }
}
