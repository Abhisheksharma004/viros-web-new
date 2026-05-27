import { NextResponse } from "next/server";
import { buildAdminDashboardOverview } from "@/lib/adminDashboard";

export async function GET() {
    try {
        const overview = await buildAdminDashboardOverview();
        return NextResponse.json(overview, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error) {
        console.error("Admin dashboard overview error:", error);
        return NextResponse.json(
            { message: "Failed to load dashboard overview" },
            { status: 500 },
        );
    }
}
