import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";
import {
    getEmployeePortalAccessStatus,
    missedPunchPortalBlockMessage,
} from "@/lib/attendancePortalAutoDisable";
import { getMissedPunchDisableDaysForEmployee } from "@/lib/adminEmployeeShifts";

type EmployeeTokenPayload = {
    role?: string;
    id?: number;
    employeeId?: string;
    email?: string;
    name?: string;
};

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("employee_auth_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as EmployeeTokenPayload | null;
    if (!decoded || decoded.role !== "employee" || !decoded.employeeId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const portalStatus = await getEmployeePortalAccessStatus(decoded.employeeId);
    if (portalStatus !== "Active") {
        const threshold = await getMissedPunchDisableDaysForEmployee(decoded.employeeId);
        return NextResponse.json(
            {
                message:
                    portalStatus === "Disabled"
                        ? missedPunchPortalBlockMessage(threshold)
                        : "Portal access is not active. Contact your administrator.",
                portalBlocked: true,
                code:
                    portalStatus === "Disabled"
                        ? "ATTENDANCE_PORTAL_DISABLED"
                        : "PORTAL_INACTIVE",
            },
            { status: 403 },
        );
    }

    let name = (decoded.name ?? "").trim();

    if (!name) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT e.full_name
             FROM admin_employee_access ea
             LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
             WHERE ea.employee_id = ?
             LIMIT 1`,
            [decoded.employeeId],
        );
        name = typeof rows[0]?.full_name === "string" ? rows[0].full_name.trim() : "";
    }

    return NextResponse.json({
        role: "employee",
        id: decoded.id,
        employeeId: decoded.employeeId,
        email: decoded.email ?? "",
        name,
    });
}
