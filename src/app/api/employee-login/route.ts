import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { comparePassword, signToken } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureEmployeeAccessDependencies } from "@/lib/adminEmployeeAccess";

type AccessRow = RowDataPacket & {
    id: number;
    employee_id: string;
    official_email: string;
    password_hash: string;
    default_password: string;
    portal_status: string;
    full_name: string | null;
};

export async function POST(request: Request) {
    try {
        await ensureEmployeeAccessDependencies();
        const body = await request.json();
        const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const rememberMe = Boolean(body.rememberMe);

        if (!identifier || !password) {
            return NextResponse.json({ message: "Employee ID or email and password are required" }, { status: 400 });
        }

        const [rows] = await pool.query<AccessRow[]>(
            `SELECT ea.id, ea.employee_id, ea.official_email, ea.password_hash, ea.default_password,
                    ea.portal_status, e.full_name
             FROM admin_employee_access ea
             LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
             WHERE ea.employee_id = ? OR ea.official_email = ?
             LIMIT 1`,
            [identifier, identifier],
        );

        const access = rows[0];
        if (!access) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        if (access.portal_status !== "Active") {
            return NextResponse.json(
                { message: "Portal access is not active. Contact your administrator." },
                { status: 403 },
            );
        }

        const passwordHash = access.password_hash ?? "";
        const defaultHash = access.default_password ?? "";
        const matchesLogin =
            (passwordHash && (await comparePassword(password, passwordHash))) ||
            (defaultHash && (await comparePassword(password, defaultHash)));

        if (!matchesLogin) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const tokenExpiry = rememberMe ? "30d" : "1d";
        const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        const token = signToken(
            {
                role: "employee",
                id: access.id,
                employeeId: access.employee_id,
                email: access.official_email,
                name: access.full_name ?? "",
            },
            tokenExpiry,
        );

        const isSecure = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") || false;
        const cookie = serialize("employee_auth_token", token, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: cookieMaxAge,
            path: "/",
        });

        const response = NextResponse.json({ message: "Login successful", role: "employee" }, { status: 200 });
        response.headers.set("Set-Cookie", cookie);
        return response;
    } catch (error: unknown) {
        console.error("Employee login error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
