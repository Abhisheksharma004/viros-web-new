import { NextResponse } from "next/server";
import {
    countUnreadEmployeeNotifications,
    listEmployeeNotifications,
    markAllEmployeeNotificationsRead,
    syncRecentEmployeeNotifications,
} from "@/lib/employeeNotifications";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const employeeId = session.employeeId.trim();
        await syncRecentEmployeeNotifications(employeeId);

        const [notifications, unreadCount] = await Promise.all([
            listEmployeeNotifications(employeeId),
            countUnreadEmployeeNotifications(employeeId),
        ]);

        return NextResponse.json(
            { notifications, unreadCount },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee notifications:", error);
        return NextResponse.json(
            { message: "Failed to load notifications", error: message },
            { status: 500 },
        );
    }
}

export async function PATCH() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const marked = await markAllEmployeeNotificationsRead(session.employeeId.trim());
        const unreadCount = await countUnreadEmployeeNotifications(session.employeeId.trim());

        return NextResponse.json({ message: "All notifications marked as read", marked, unreadCount });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error marking notifications read:", error);
        return NextResponse.json(
            { message: "Failed to update notifications", error: message },
            { status: 500 },
        );
    }
}
