import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import { getEmployeeSession } from "@/lib/employeeSession";

type AccessPasswordRow = RowDataPacket & {
    password_hash: string;
    default_password: string;
};

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
        const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: "Current and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
        }

        const [rows] = await pool.query<AccessPasswordRow[]>(
            `SELECT password_hash, default_password FROM admin_employee_access WHERE employee_id = ? LIMIT 1`,
            [session.employeeId],
        );

        const access = rows[0];
        if (!access) {
            return NextResponse.json({ message: "Access record not found" }, { status: 404 });
        }

        const passwordHash = access.password_hash ?? "";
        const defaultHash = access.default_password ?? "";
        const matchesCurrent =
            (passwordHash && (await comparePassword(currentPassword, passwordHash))) ||
            (defaultHash && (await comparePassword(currentPassword, defaultHash)));

        if (!matchesCurrent) {
            return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
        }

        const newHash = await hashPassword(newPassword);
        const [result] = await pool.query(
            `UPDATE admin_employee_access SET password_hash = ? WHERE employee_id = ?`,
            [newHash, session.employeeId],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Failed to update password" }, { status: 500 });
        }

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error changing employee password:", error);
        return NextResponse.json({ message: "Failed to update password", error: message }, { status: 500 });
    }
}
