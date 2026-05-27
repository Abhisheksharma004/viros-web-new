import { NextResponse } from "next/server";
import { buildBirthdayWishCards } from "@/lib/employeeBirthdayCards";
import { fetchEmployeeBirthdayAlerts } from "@/lib/employeeBirthdays";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ cards: [] }, { status: 401 });
        }

        const alerts = await fetchEmployeeBirthdayAlerts(session.employeeId);
        const cards = buildBirthdayWishCards(alerts);

        return NextResponse.json(
            { cards },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee birthdays:", error);
        return NextResponse.json(
            { message: "Failed to load birthdays", error: message, cards: [] },
            { status: 500 },
        );
    }
}
