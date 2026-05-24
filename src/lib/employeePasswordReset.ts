import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { sanitizeEmail } from "@/lib/otp-utils";
import { isValidEmail } from "@/lib/email-utils";
import { ensureEmployeeAccessDependencies } from "@/lib/adminEmployeeAccess";

export type EmployeeAccessForReset = RowDataPacket & {
    id: number;
    employee_id: string;
    official_email: string;
    portal_status: string;
    full_name: string | null;
};

/** Resolve employee portal access by employee ID or official email (same rules as login). */
export async function findEmployeeAccessByIdentifier(
    identifier: string,
): Promise<EmployeeAccessForReset | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    await ensureEmployeeAccessDependencies();

    const emailLookup = trimmed.includes("@") ? sanitizeEmail(trimmed) : trimmed;

    const [rows] = await pool.query<EmployeeAccessForReset[]>(
        `SELECT ea.id, ea.employee_id, ea.official_email, ea.portal_status, e.full_name
         FROM admin_employee_access ea
         LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
         WHERE ea.employee_id = ? OR ea.official_email = ?
         LIMIT 1`,
        [trimmed, emailLookup],
    );

    return rows[0] ?? null;
}

export function getOfficialEmailForOtp(access: EmployeeAccessForReset): string | null {
    const email = (access.official_email ?? "").trim();
    if (!email || !isValidEmail(sanitizeEmail(email))) return null;
    return sanitizeEmail(email);
}

export type AdminUserForReset = RowDataPacket & {
    id: number;
    email: string;
};

export type PasswordResetAccountType = "employee" | "admin";

export type ResolvedPasswordResetAccount =
    | { accountType: "employee"; employeeId: string; email: string }
    | { accountType: "admin"; userId: number; email: string };

/** Look up admin user in `users` table by email. */
export async function findAdminUserByEmail(email: string): Promise<AdminUserForReset | null> {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return null;

    const sanitizedEmail = sanitizeEmail(trimmed);
    if (!isValidEmail(sanitizedEmail)) return null;

    const [rows] = await pool.query<AdminUserForReset[]>(
        "SELECT id, email FROM users WHERE email = ? LIMIT 1",
        [sanitizedEmail],
    );

    return rows[0] ?? null;
}
