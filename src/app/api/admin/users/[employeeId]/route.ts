import { NextResponse } from "next/server";
import {
    revokeUserAccess,
    saveUserAccessPermissions,
} from "@/lib/userModulePermissions";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    try {
        const { employeeId } = await params;
        if (!employeeId) {
            return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
        }

        await revokeUserAccess(employeeId);
        return NextResponse.json({ message: "User access revoked successfully", employeeId });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error revoking user access:", error);
        return NextResponse.json({ message: "Failed to revoke user access", error: message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    try {
        const { employeeId } = await params;
        const body = await request.json();

        await saveUserAccessPermissions({
            employeeId: employeeId || body.employeeId,
            fullName: body.fullName,
            email: body.email || "",
            username: body.username || "",
            role: body.role || "Standard User",
            status: body.status || "Active",
            department: body.department || "General",
            permissions: body.permissions || [],
        });

        return NextResponse.json({ message: "User access updated successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating user access:", error);
        return NextResponse.json({ message: "Failed to update user access", error: message }, { status: 500 });
    }
}
