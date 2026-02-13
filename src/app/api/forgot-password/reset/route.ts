import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isValidOTPFormat, isOTPExpired, sanitizeEmail } from '@/lib/otp-utils';

export async function POST(request: Request) {
    try {
        const { email, otp, newPassword } = await request.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { message: 'Email, OTP, and new password are required' },
                { status: 400 }
            );
        }

        const sanitizedEmail = sanitizeEmail(email);

        // Validate password strength
        if (newPassword.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Validate OTP format
        if (!isValidOTPFormat(otp)) {
            return NextResponse.json(
                { message: 'Invalid OTP format' },
                { status: 400 }
            );
        }

        // Find and verify OTP
        const [otps]: any = await pool.query(
            `SELECT id, email, otp, expires_at, used 
             FROM password_reset_otps 
             WHERE email = ? AND otp = ? AND used = FALSE
             ORDER BY created_at DESC
             LIMIT 1`,
            [sanitizedEmail, otp]
        );

        if (otps.length === 0) {
            return NextResponse.json(
                { message: 'Invalid or already used OTP' },
                { status: 400 }
            );
        }

        const otpRecord = otps[0];

        // Check if OTP is expired
        if (isOTPExpired(otpRecord.expires_at)) {
            return NextResponse.json(
                { message: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check if user exists
        const [users]: any = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [sanitizedEmail]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update user password
            await connection.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, sanitizedEmail]
            );

            // Mark OTP as used
            await connection.query(
                'UPDATE password_reset_otps SET used = TRUE WHERE id = ?',
                [otpRecord.id]
            );

            // Commit transaction
            await connection.commit();

            console.log(`[Password Reset] Password updated successfully for ${sanitizedEmail}`);

            return NextResponse.json(
                { message: 'Password reset successfully. You can now login with your new password.' },
                { status: 200 }
            );

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('[Password Reset] Error:', error);
        return NextResponse.json(
            { message: 'Failed to reset password' },
            { status: 500 }
        );
    }
}
