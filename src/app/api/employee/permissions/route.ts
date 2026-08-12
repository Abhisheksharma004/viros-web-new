import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employeeSession";
import { getEmployeeGrantedPermissions } from "@/lib/userModulePermissions";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let empId = (searchParams.get("employee_id") ?? "").trim();

        if (!empId) {
            const session = await getEmployeeSession();
            if (session) {
                empId = session.employeeId;
            }
        }

        if (!empId) {
            return NextResponse.json({
                role: "Standard User",
                status: "Inactive",
                permissions: [],
            });
        }

        const data = await getEmployeeGrantedPermissions(empId);
        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee granted permissions:", error);
        return NextResponse.json({ message: "Failed to fetch permissions", error: message }, { status: 500 });
    }
}
