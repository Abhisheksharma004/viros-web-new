import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { serialize } from "cookie";
import pool from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";
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

type AdminUserRow = RowDataPacket & {
    id: number;
    email: string;
    password: string;
};

function cookieOptions(rememberMe: boolean, isSecure: boolean) {
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    return { httpOnly: true, secure: isSecure, sameSite: "lax" as const, maxAge, path: "/" };
}

async function matchesEmployeePassword(password: string, access: AccessRow): Promise<boolean> {
    const passwordHash = access.password_hash ?? "";
    const defaultHash = access.default_password ?? "";
    if (passwordHash && (await comparePassword(password, passwordHash))) return true;
    if (defaultHash && (await comparePassword(password, defaultHash))) return true;
    return false;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const identifier =
            (typeof body.identifier === "string" ? body.identifier : typeof body.email === "string" ? body.email : "").trim();
        const password = typeof body.password === "string" ? body.password : "";
        const rememberMe = Boolean(body.rememberMe);

        if (!identifier || !password) {
            return NextResponse.json({ message: "Employee ID or email and password are required" }, { status: 400 });
        }

        const tokenExpiry = rememberMe ? "30d" : "1d";
        const isSecure = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") || false;

        await ensureEmployeeAccessDependencies();

        const [accessRows] = await pool.query<AccessRow[]>(
            `SELECT ea.id, ea.employee_id, ea.official_email, ea.password_hash, ea.default_password,
                    ea.portal_status, e.full_name
             FROM admin_employee_access ea
             LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
             WHERE ea.employee_id = ? OR ea.official_email = ?
             LIMIT 1`,
            [identifier, identifier],
        );

        const access = accessRows[0];
        if (access) {
            if (access.portal_status !== "Active") {
                return NextResponse.json(
                    { message: "Portal access is not active. Contact your administrator." },
                    { status: 403 },
                );
            }

            if (await matchesEmployeePassword(password, access)) {
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

                const response = NextResponse.json(
                    { message: "Login successful", role: "employee" },
                    { status: 200 },
                );
                response.headers.set(
                    "Set-Cookie",
                    serialize("employee_auth_token", token, cookieOptions(rememberMe, isSecure)),
                );
                return response;
            }
        }

        const [userRows] = await pool.query<AdminUserRow[]>("SELECT id, email, password FROM users WHERE email = ? LIMIT 1", [
            identifier,
        ]);
        const user = userRows[0];

        if (user && (await comparePassword(password, user.password))) {
            const token = signToken({ id: user.id, email: user.email }, tokenExpiry);
            const response = NextResponse.json({ message: "Login successful", role: "admin" }, { status: 200 });
            response.headers.set("Set-Cookie", serialize("auth_token", token, cookieOptions(rememberMe, isSecure)));
            return response;
        }

        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    } catch (error: unknown) {
        console.error("Login error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
