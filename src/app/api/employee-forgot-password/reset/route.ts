import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isValidOTPFormat, isOTPExpired, sanitizeEmail } from "@/lib/otp-utils";
import {
    findAdminUserByEmail,
    findEmployeeAccessByIdentifier,
    getOfficialEmailForOtp,
    type PasswordResetAccountType,
} from "@/lib/employeePasswordReset";

type OtpRow = RowDataPacket & {
    id: number;
    email: string;
    otp: string;
    expires_at: Date | string;
    used: boolean;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string" ? body.email : "";
        const otp = typeof body.otp === "string" ? body.otp : "";
        const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
        const accountType: PasswordResetAccountType =
            body.accountType === "admin" ? "admin" : "employee";

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ message: "Email, OTP, and new password are required" }, { status: 400 });
        }

        const sanitizedEmail = sanitizeEmail(email);
        const minLength = accountType === "admin" ? 8 : 6;

        if (newPassword.length < minLength) {
            return NextResponse.json(
                { message: `Password must be at least ${minLength} characters long` },
                { status: 400 },
            );
        }

        if (!isValidOTPFormat(otp)) {
            return NextResponse.json({ message: "Invalid OTP format. OTP must be 7 digits." }, { status: 400 });
        }

        const [otps] = await pool.query<OtpRow[]>(
            `SELECT id, email, otp, expires_at, used
             FROM password_reset_otps
             WHERE email = ? AND otp = ? AND used = FALSE
             ORDER BY created_at DESC
             LIMIT 1`,
            [sanitizedEmail, otp],
        );

        if (otps.length === 0) {
            return NextResponse.json({ message: "Invalid or already used OTP" }, { status: 400 });
        }

        const otpRecord = otps[0];

        if (isOTPExpired(otpRecord.expires_at)) {
            return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
        }

        const passwordHash = await hashPassword(newPassword);
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            if (accountType === "admin") {
                const admin = await findAdminUserByEmail(sanitizedEmail);
                if (!admin || sanitizeEmail(admin.email) !== sanitizedEmail) {
                    await connection.rollback();
                    return NextResponse.json(
                        { message: "Admin account not found. Please request a new OTP." },
                        { status: 404 },
                    );
                }

                const [updateResult] = await connection.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [passwordHash, admin.id],
                );

                const affected = (updateResult as ResultSetHeader).affectedRows;
                if (!affected) {
                    throw new Error("Failed to update admin password");
                }

                console.log(`[Password Reset] users.password updated for admin #${admin.id}`);
            } else {
                const access = await findEmployeeAccessByIdentifier(sanitizedEmail);
                if (!access) {
                    await connection.rollback();
                    return NextResponse.json({ message: "Employee account not found" }, { status: 404 });
                }

                const officialEmail = getOfficialEmailForOtp(access);
                if (!officialEmail || officialEmail !== sanitizedEmail) {
                    await connection.rollback();
                    return NextResponse.json(
                        { message: "Invalid reset session. Please request a new OTP." },
                        { status: 400 },
                    );
                }

                if (access.portal_status !== "Active") {
                    await connection.rollback();
                    return NextResponse.json(
                        { message: "Portal access is not active. Contact your administrator." },
                        { status: 403 },
                    );
                }

                const [updateResult] = await connection.query(
                    `UPDATE admin_employee_access SET password_hash = ? WHERE employee_id = ?`,
                    [passwordHash, access.employee_id],
                );

                const affected = (updateResult as ResultSetHeader).affectedRows;
                if (!affected) {
                    throw new Error("Failed to update password_hash");
                }

                console.log(`[Password Reset] password_hash updated for ${access.employee_id}`);
            }

            await connection.query("UPDATE password_reset_otps SET used = TRUE WHERE id = ?", [otpRecord.id]);
            await connection.commit();

            return NextResponse.json(
                { message: "Password reset successfully. You can now sign in with your new password." },
                { status: 200 },
            );
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error: unknown) {
        console.error("[Password Reset] Error:", error);
        return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
    }
}
