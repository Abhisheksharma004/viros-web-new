import { NextResponse } from "next/server";
import {
    updateCorporateEvent,
    deleteCorporateEvent,
    getCorporateEventById,
    CORPORATE_EVENT_TYPES,
    type CorporateEventType,
} from "@/lib/corporateCalendar";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
        }

        const existing = await getCorporateEventById(id);
        if (!existing) {
            return NextResponse.json({ message: "Corporate event not found" }, { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const title = typeof body.title === "string" ? body.title.trim() : existing.title;
        const event_type = typeof body.event_type === "string" && CORPORATE_EVENT_TYPES.includes(body.event_type as CorporateEventType)
            ? (body.event_type as CorporateEventType)
            : existing.event_type;
        const start_date = typeof body.start_date === "string" ? body.start_date.trim() : existing.start_date;
        const end_date = typeof body.end_date === "string" ? body.end_date.trim() : existing.end_date;
        const start_time = typeof body.start_time === "string" ? body.start_time.trim() : existing.start_time;
        const end_time = typeof body.end_time === "string" ? body.end_time.trim() : existing.end_time;
        const is_all_day = body.is_all_day !== undefined ? Boolean(body.is_all_day) : existing.is_all_day;
        const location = typeof body.location === "string" ? body.location.trim() : existing.location;
        const audience = typeof body.audience === "string" ? body.audience.trim() : existing.audience;
        const color_tag = typeof body.color_tag === "string" ? body.color_tag.trim() : existing.color_tag;
        const description = typeof body.description === "string" ? body.description.trim() : existing.description;
        const is_mandatory = body.is_mandatory !== undefined ? Boolean(body.is_mandatory) : existing.is_mandatory;

        const updated = await updateCorporateEvent(id, {
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

        if (!updated) {
            return NextResponse.json({ message: "Failed to update corporate event" }, { status: 500 });
        }

        return NextResponse.json({ message: "Corporate event updated successfully" });
    } catch (error) {
        console.error("PUT corporate calendar error:", error);
        return NextResponse.json(
            { message: "Failed to update corporate event" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
        }

        const deleted = await deleteCorporateEvent(id);
        if (!deleted) {
            return NextResponse.json({ message: "Corporate event not found or already deleted" }, { status: 404 });
        }

        return NextResponse.json({ message: "Corporate event deleted successfully" });
    } catch (error) {
        console.error("DELETE corporate calendar error:", error);
        return NextResponse.json(
            { message: "Failed to delete corporate event" },
            { status: 500 }
        );
    }
}
