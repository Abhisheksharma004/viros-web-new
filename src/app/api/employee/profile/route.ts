import { NextResponse } from "next/server";
import {
    fetchEmployeeProfileResponse,
    pickEmployeeProfileBody,
    updateEmployeeSelfProfile,
} from "@/lib/employeeProfileUpdate";
import { getEmployeeSession } from "@/lib/employeeSession";

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const profile = await fetchEmployeeProfileResponse(session);
        if (!profile) {
            return NextResponse.json({ message: "Employee access not found" }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee profile:", error);
        return NextResponse.json({ message: "Failed to fetch profile", error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        if (!Object.keys(pickEmployeeProfileBody(body)).length) {
            return NextResponse.json({ message: "No profile fields to update" }, { status: 400 });
        }

        const result = await updateEmployeeSelfProfile(session, body);
        if (!result.ok) {
            return NextResponse.json({ message: result.message }, { status: result.status });
        }

        const profile = await fetchEmployeeProfileResponse(session);
        if (!profile) {
            return NextResponse.json({ message: "Employee access not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Profile updated successfully", profile });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee profile:", error);
        return NextResponse.json({ message: "Failed to update profile", error: message }, { status: 500 });
    }
}
