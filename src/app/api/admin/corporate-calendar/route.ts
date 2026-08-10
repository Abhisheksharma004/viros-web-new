import { NextResponse } from "next/server";
import {
    getAllCorporateEvents,
    createCorporateEvent,
    CORPORATE_EVENT_TYPES,
    type CorporateEventType,
} from "@/lib/corporateCalendar";

export async function GET() {
    try {
        const events = await getAllCorporateEvents();
        return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("GET corporate calendar error:", error);
        return NextResponse.json(
            { message: "Failed to fetch corporate calendar events" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const event_type = typeof body.event_type === "string" && CORPORATE_EVENT_TYPES.includes(body.event_type as CorporateEventType)
            ? (body.event_type as CorporateEventType)
            : "company_event";
        const start_date = typeof body.start_date === "string" ? body.start_date.trim() : "";
        const end_date = typeof body.end_date === "string" ? body.end_date.trim() : start_date;
        const start_time = typeof body.start_time === "string" ? body.start_time.trim() : null;
        const end_time = typeof body.end_time === "string" ? body.end_time.trim() : null;
        const is_all_day = Boolean(body.is_all_day ?? true);
        const location = typeof body.location === "string" ? body.location.trim() : "";
        const audience = typeof body.audience === "string" ? body.audience.trim() : "";
        const color_tag = typeof body.color_tag === "string" ? body.color_tag.trim() : "blue";
        const description = typeof body.description === "string" ? body.description.trim() : "";
        const is_mandatory = Boolean(body.is_mandatory);

        if (!title) {
            return NextResponse.json({ message: "Event title is required" }, { status: 400 });
        }
        if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
            return NextResponse.json({ message: "Valid start date (YYYY-MM-DD) is required" }, { status: 400 });
        }

        const insertId = await createCorporateEvent({
            title,
            event_type,
            start_date,
            end_date: end_date || start_date,
            start_time,
            end_time,
            is_all_day,
            location,
            audience,
            color_tag,
            description,
            is_mandatory,
        });

        return NextResponse.json({ message: "Corporate event created successfully", id: insertId });
    } catch (error) {
        console.error("POST corporate calendar error:", error);
        return NextResponse.json(
            { message: "Failed to create corporate event" },
            { status: 500 }
        );
    }
}
