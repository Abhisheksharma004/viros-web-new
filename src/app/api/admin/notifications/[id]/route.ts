import { NextResponse } from "next/server";
import { markAdminNotificationRead } from "@/lib/adminNotifications";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid notification id" }, { status: 400 });
        }

        const success = await markAdminNotificationRead(id);
        if (!success) {
            return NextResponse.json({ message: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, message: "Marked as read" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update notification";
        console.error("Error marking admin notification as read:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
