import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import { getEmployeeSession } from "@/lib/employeeSession";

type ColleagueRow = RowDataPacket & {
    id: number;
    employee_id: string;
    full_name: string;
    official_email: string | null;
    official_mobile: string | null;
    department: string | null;
    designation: string | null;
    employee_status: string | null;
    work_location: string | null;
};

function isResignedOrInactive(status: string | null): boolean {
    if (!status) return false;
    const s = status.trim().toLowerCase();
    return (
        s.includes("resign") ||
        s === "terminated" ||
        s === "inactive" ||
        s === "disabled font" ||
        s === "left"
    );
}

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureAdminEmployeesTable();

        const [rows] = await pool.query<ColleagueRow[]>(
            `SELECT 
                e.id,
                e.employee_id,
                COALESCE(NULLIF(TRIM(e.full_name), ''), 'Employee') AS full_name,
                COALESCE(NULLIF(TRIM(e.official_email), ''), NULLIF(TRIM(ea.official_email), ''), e.personal_email, '') AS official_email,
                COALESCE(NULLIF(TRIM(e.official_mobile), ''), e.personal_mobile, '') AS official_mobile,
                COALESCE(NULLIF(TRIM(e.department), ''), 'General') AS department,
                COALESCE(NULLIF(TRIM(e.designation), ''), 'Team Member') AS designation,
                COALESCE(NULLIF(TRIM(e.employee_status), ''), 'Active') AS employee_status,
                COALESCE(NULLIF(TRIM(e.work_location), ''), '') AS work_location
             FROM admin_employees e
             LEFT JOIN admin_employee_access ea ON ea.employee_id = e.employee_id
             WHERE (e.employee_status IS NULL OR TRIM(e.employee_status) = '' OR LOWER(TRIM(e.employee_status)) NOT LIKE '%resign%')
               AND (ea.portal_status IS NULL OR ea.portal_status = 'Active')
             
             UNION ALL
             
             SELECT 
                ea.id + 100000 AS id,
                ea.employee_id,
                'Employee' AS full_name,
                ea.official_email,
                '' AS official_mobile,
                'General' AS department,
                'Team Member' AS designation,
                'Active' AS employee_status,
                '' AS work_location
             FROM admin_employee_access ea
             LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
             WHERE e.id IS NULL
               AND ea.portal_status = 'Active'
             
             ORDER BY full_name ASC`
        );

        const colleagues = rows
            .filter((r) => !isResignedOrInactive(r.employee_status))
            .map((r) => ({
                id: r.id,
                employeeId: r.employee_id,
                fullName: r.full_name || "Employee",
                officialEmail: (r.official_email || "").trim(),
                officialMobile: (r.official_mobile || "").trim(),
                department: (r.department || "General").trim(),
                designation: (r.designation || "Team Member").trim(),
                employeeStatus: r.employee_status || "Active",
                workLocation: (r.work_location || "").trim(),
            }));

        return NextResponse.json(
            { colleagues },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                },
            }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching colleagues:", error);
        return NextResponse.json({ message: "Failed to fetch colleagues", error: message }, { status: 500 });
    }
}
