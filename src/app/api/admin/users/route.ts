import { NextResponse } from "next/server";
import {
    getAllGrantedUserAccessRecords,
    saveUserAccessPermissions,
} from "@/lib/userModulePermissions";

export async function GET() {
    try {
        const records = await getAllGrantedUserAccessRecords();
        return NextResponse.json(records);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching user access records:", error);
        return NextResponse.json({ message: "Failed to fetch user access records", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeId, fullName, email, username, role, status, department, permissions } = body;

        if (!employeeId || !fullName) {
            return NextResponse.json({ message: "Employee ID and Full Name are required" }, { status: 400 });
        }

        await saveUserAccessPermissions({
            employeeId,
            fullName,
            email: email || "",
            username: username || employeeId.toLowerCase(),
            role: role || "Standard User",
            status: status || "Active",
            department: department || "General",
            permissions: permissions || [],
        });

        return NextResponse.json({ message: "User access granted successfully", employeeId });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error saving user access:", error);
        return NextResponse.json({ message: "Failed to save user access", error: message }, { status: 500 });
    }
}
