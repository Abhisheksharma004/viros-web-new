import { NextResponse } from "next/server";
import {
    getNewsletterSubscriptionStats,
    listNewsletterSubscriptions,
    type NewsletterStatus,
} from "@/lib/newsletterSubscriptions";

function parseStatus(param: string | null): NewsletterStatus | "all" {
    if (param === "active" || param === "unsubscribed") return param;
    return "all";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = parseStatus(searchParams.get("status"));
        const query = searchParams.get("q")?.trim() || undefined;
        const limit = Number(searchParams.get("limit") ?? "500");

        const [subscriptions, stats] = await Promise.all([
            listNewsletterSubscriptions({ status, query, limit }),
            getNewsletterSubscriptionStats(),
        ]);

        return NextResponse.json(
            { subscriptions, stats },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error) {
        console.error("Admin newsletter list error:", error);
        return NextResponse.json(
            { message: "Failed to load newsletter subscriptions" },
            { status: 500 },
        );
    }
}
