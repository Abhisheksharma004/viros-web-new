import { NextResponse } from "next/server";
import { listEmployeeExpenseMonthlySummaries } from "@/lib/employeeExpenses";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get("limit") ?? "12");

        const months = await listEmployeeExpenseMonthlySummaries(session.employeeId, { limit });

        return NextResponse.json({ months });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching monthly expense summaries:", error);
        return NextResponse.json(
            { message: "Failed to load monthly expense history", error: message },
            { status: 500 },
        );
    }
}
