import { NextResponse } from "next/server";
import {
    ensureEmployeeAttendanceTable,
    punchAttendance,
    type PunchInput,
} from "@/lib/employeeAttendance";
import { getEmployeeSession } from "@/lib/employeeSession";
import {
    evaluateMissedPunchPortalAccess,
    missedPunchPortalBlockMessage,
} from "@/lib/attendancePortalAutoDisable";
import {
    trySendOverdueTaskReminder,
    trySendPendingTaskReminder,
} from "@/lib/pendingTaskReminderEmail";

function parsePunchBody(body: Record<string, unknown>): PunchInput | null {
    const type = body.type === "check-out" ? "check-out" : body.type === "check-in" ? "check-in" : null;
    if (!type) return null;

    const time = typeof body.time === "string" ? body.time.trim() : "";
    const punchedAt =
        typeof body.punched_at === "string"
            ? body.punched_at
            : typeof body.punchedAt === "string"
              ? body.punchedAt
              : "";
    const photoDataUrl =
        typeof body.photo_data_url === "string"
            ? body.photo_data_url
            : typeof body.photoDataUrl === "string"
              ? body.photoDataUrl
              : "";

    const locRaw =
        body.location && typeof body.location === "object"
            ? (body.location as Record<string, unknown>)
            : null;

    if (!time || !punchedAt || !photoDataUrl || !locRaw) return null;

    const latitude = Number(locRaw.latitude);
    const longitude = Number(locRaw.longitude);
    const accuracy = Number(locRaw.accuracy);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
        type,
        time,
        punchedAt,
        photoDataUrl,
        location: {
            latitude,
            longitude,
            accuracy: Number.isFinite(accuracy) ? accuracy : 0,
            address: typeof locRaw.address === "string" ? locRaw.address : undefined,
        },
    };
}

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const employeeId = session.employeeId.trim();
        const portalEval = await evaluateMissedPunchPortalAccess(employeeId);
        if (portalEval.accessBlocked) {
            return NextResponse.json(
                {
                    message: missedPunchPortalBlockMessage(portalEval.disableThresholdDays),
                    portalAccess: {
                        status: portalEval.portalStatus,
                        blocked: true,
                        consecutiveMissedWorkingDays: portalEval.consecutiveMissedWorkingDays,
                        disableThresholdDays: portalEval.disableThresholdDays,
                    },
                },
                { status: 403 },
            );
        }

        await ensureEmployeeAttendanceTable();

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const punch = parsePunchBody(body);
        if (!punch) {
            return NextResponse.json({ message: "Invalid punch payload" }, { status: 400 });
        }

        const today = await punchAttendance(employeeId, punch);

        if (punch.type === "check-in") {
            void trySendPendingTaskReminder(employeeId).catch((err) => {
                console.error("[Pending task reminder] Check-in trigger failed:", err);
            });
            void trySendOverdueTaskReminder(employeeId).catch((err) => {
                console.error("[Overdue task reminder] Check-in trigger failed:", err);
            });
        }

        return NextResponse.json({ today });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const status =
            message.includes("Already") ||
            message.includes("Check in first") ||
            message.includes("Cannot check in")
                ? 409
                : 500;
        console.error("Error saving attendance punch:", error);
        return NextResponse.json({ message: message || "Failed to save punch" }, { status });
    }
}
