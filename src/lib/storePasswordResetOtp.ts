import pool from "@/lib/db";
import { generateOTP, getOTPExpiration } from "@/lib/otp-utils";
import { sendPasswordResetOtpEmail } from "@/lib/sendPasswordResetOtpEmail";

export async function storeAndSendPasswordResetOtp(email: string): Promise<string> {
    const otp = generateOTP();
    const expiresAt = getOTPExpiration();

    await pool.query("DELETE FROM password_reset_otps WHERE email = ? AND used = FALSE", [email]);

    await pool.query("INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (?, ?, ?)", [
        email,
        otp,
        expiresAt,
    ]);

    await sendPasswordResetOtpEmail(email, otp);

    return otp;
}
