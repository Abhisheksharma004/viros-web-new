import { NextResponse } from "next/server";
import {
    adminMarkEmployeePresent,
    getAdminDailyAttendance,
    getAdminEmployeeMonthlyDetail,
    getAdminMonthlySummary,
} from "@/lib/adminAttendance";
import { todayDateOnly } from "@/lib/dateOnly";

function parseYearMonth(searchParams: URLSearchParams) {
    const now = new Date();
    const year = Number(searchParams.get("year")) || now.getFullYear();
    const month = Number(searchParams.get("month")) || now.getMonth() + 1;
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return null;
    }
    return { year, month };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const view = searchParams.get("view") ?? "daily";

        if (view === "daily") {
            const date = searchParams.get("date") ?? todayDateOnly();
            const rows = await getAdminDailyAttendance(date);
            return NextResponse.json(
                { view: "daily", date, rows },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        if (view === "monthly") {
            const parsed = parseYearMonth(searchParams);
            if (!parsed) {
                return NextResponse.json({ message: "Invalid year or month" }, { status: 400 });
            }
            const rows = await getAdminMonthlySummary(parsed.year, parsed.month);
            return NextResponse.json(
                { view: "monthly", year: parsed.year, month: parsed.month, rows },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        if (view === "employee") {
            const employeeId = searchParams.get("employeeId")?.trim();
            if (!employeeId) {
                return NextResponse.json({ message: "employeeId is required" }, { status: 400 });
            }
            const parsed = parseYearMonth(searchParams);
            if (!parsed) {
                return NextResponse.json({ message: "Invalid year or month" }, { status: 400 });
            }
            const detail = await getAdminEmployeeMonthlyDetail(
                employeeId,
                parsed.year,
                parsed.month,
            );
            if (!detail) {
                return NextResponse.json({ message: "Employee not found" }, { status: 404 });
            }
            return NextResponse.json(
                {
                    view: "employee",
                    year: parsed.year,
                    month: parsed.month,
                    ...detail,
                },
                { headers: { "Cache-Control": "no-store" } },
            );
        }

        return NextResponse.json({ message: "Invalid view parameter" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin attendance GET error:", error);
        return NextResponse.json({ message: "Failed to fetch attendance", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const action = typeof body.action === "string" ? body.action : "";

        if (action !== "mark-present") {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const employeeId = typeof body.employeeId === "string" ? body.employeeId : "";
        const date = typeof body.date === "string" ? body.date : "";
        const note = typeof body.note === "string" ? body.note : undefined;

        if (!employeeId.trim() || !date.trim()) {
            return NextResponse.json(
                { message: "employeeId and date are required" },
                { status: 400 },
            );
        }

        const record = await adminMarkEmployeePresent(employeeId, date, note);
        return NextResponse.json({ message: "Marked present", record });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin attendance POST error:", error);
        const status = message.includes("not found") ? 404 : message.includes("already") ? 409 : 500;
        return NextResponse.json({ message }, { status });
    }
}
