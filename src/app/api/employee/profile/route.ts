import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { employeeRowToFormState, ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { getEmployeeSession } from "@/lib/employeeSession";

type ProfileRow = RowDataPacket & {
    employee_id: string;
    portal_email: string | null;
    portal_status: string | null;
    full_name?: string | null;
};

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureAdminEmployeesTable();

        const [rows] = await pool.query<ProfileRow[]>(
            `SELECT ea.employee_id,
                    ea.official_email AS portal_email,
                    ea.portal_status,
                    e.*
             FROM admin_employee_access ea
             LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
             WHERE ea.employee_id = ?
             LIMIT 1`,
            [session.employeeId],
        );

        const row = rows[0];
        if (!row) {
            return NextResponse.json({ message: "Employee access not found" }, { status: 404 });
        }

        const profile = employeeRowToFormState(row as Record<string, unknown>);

        if (!profile.employeeId.trim()) {
            profile.employeeId = session.employeeId;
        }
        if (!profile.fullName.trim()) {
            profile.fullName = session.name || session.employeeId;
        }
        if (!profile.officialEmail.trim()) {
            profile.officialEmail =
                typeof row.portal_email === "string" ? row.portal_email : session.email;
        }

        return NextResponse.json({
            ...profile,
            portalEmail: typeof row.portal_email === "string" ? row.portal_email : profile.officialEmail,
            portalStatus: typeof row.portal_status === "string" ? row.portal_status : "Inactive",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee profile:", error);
        return NextResponse.json({ message: "Failed to fetch profile", error: message }, { status: 500 });
    }
}
