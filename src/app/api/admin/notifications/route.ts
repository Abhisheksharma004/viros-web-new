import { NextResponse } from "next/server";
import {
    countUnreadAdminNotifications,
    listAdminNotifications,
    markAllAdminNotificationsRead,
    upsertAdminNotification,
} from "@/lib/adminNotifications";

export async function GET() {
    try {
        const [notifications, unreadCount] = await Promise.all([
            listAdminNotifications(),
            countUnreadAdminNotifications(),
        ]);

        return NextResponse.json(
            { notifications, unreadCount },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                },
            },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load notifications";
        console.error("Admin notifications GET error:", error);
        return NextResponse.json({ message, notifications: [], unreadCount: 0 }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const action = typeof body.action === "string" ? body.action.trim() : "";

        if (action === "mark_all_read") {
            const updated = await markAllAdminNotificationsRead();
            return NextResponse.json({ ok: true, updated });
        }

        if (action === "create") {
            const type = (typeof body.type === "string" ? body.type : "system") as import("@/lib/adminNotifications").AdminNotificationType;
            const title = typeof body.title === "string" ? body.title : "";
            const message = typeof body.message === "string" ? body.message : "";
            const href = typeof body.href === "string" ? body.href : null;
            const referenceKey = typeof body.referenceKey === "string" ? body.referenceKey : `sys:${Date.now()}`;

            if (!title || !message) {
                return NextResponse.json({ message: "Title and message are required" }, { status: 400 });
            }

            await upsertAdminNotification({ type, title, message, href, referenceKey });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to process notification action";
        console.error("Admin notifications POST error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
