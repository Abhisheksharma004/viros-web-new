import { NextResponse } from "next/server";
import { getAdminWorkEntrySummary, listAdminWorkEntries } from "@/lib/employeeWorkEntries";
import { getAdminSession } from "@/lib/adminSession";

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month")?.trim() || currentMonth();
        const employeeId = searchParams.get("employeeId")?.trim() || undefined;
        const query = searchParams.get("q")?.trim() || undefined;
        const limit = Number(searchParams.get("limit") ?? "300");

        const [entries, summary] = await Promise.all([
            listAdminWorkEntries({ month, employeeId, query, limit }),
            getAdminWorkEntrySummary(month),
        ]);

        return NextResponse.json(
            { entries, summary, month },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin work entries GET error:", error);
        return NextResponse.json({ message: "Failed to load work entries", error: message }, { status: 500 });
    }
}
