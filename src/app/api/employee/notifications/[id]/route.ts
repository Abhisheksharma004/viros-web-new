import { NextResponse } from "next/server";
import {
    countUnreadEmployeeNotifications,
    markEmployeeNotificationRead,
} from "@/lib/employeeNotifications";
import { getEmployeeSession } from "@/lib/employeeSession";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const notificationId = Number.parseInt(idParam, 10);
        if (!Number.isFinite(notificationId) || notificationId < 1) {
            return NextResponse.json({ message: "Invalid notification id" }, { status: 400 });
        }

        const updated = await markEmployeeNotificationRead(
            session.employeeId.trim(),
            notificationId,
        );
        if (!updated) {
            return NextResponse.json({ message: "Notification not found" }, { status: 404 });
        }

        const unreadCount = await countUnreadEmployeeNotifications(session.employeeId.trim());
        return NextResponse.json({ message: "Notification marked as read", unreadCount });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error marking notification read:", error);
        return NextResponse.json(
            { message: "Failed to update notification", error: message },
            { status: 500 },
        );
    }
}
