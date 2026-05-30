import { NextResponse } from "next/server";
import { buildBirthdayWishCards } from "@/lib/employeeBirthdayCards";
import { fetchAdminBirthdayAlerts } from "@/lib/employeeBirthdays";

/** Public birthday cards for the main website What's New panel (no login required). */
export async function GET() {
    try {
        const alerts = await fetchAdminBirthdayAlerts();
        const cards = buildBirthdayWishCards(alerts);

        return NextResponse.json(
            { cards },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching public birthday cards:", error);
        return NextResponse.json(
            { message: "Failed to load birthdays", error: message, cards: [] },
            { status: 500 },
        );
    }
}
