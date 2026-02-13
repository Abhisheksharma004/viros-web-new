import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isValidOTPFormat, isOTPExpired, sanitizeEmail } from '@/lib/otp-utils';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        const sanitizedEmail = sanitizeEmail(email);

        // Validate OTP format
        if (!isValidOTPFormat(otp)) {
            return NextResponse.json(
                { message: 'Invalid OTP format. OTP must be 7 digits.' },
                { status: 400 }
            );
        }

        // Find OTP in database
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
                { message: 'Invalid or expired OTP' },
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

        // OTP is valid
        return NextResponse.json(
            { 
                message: 'OTP verified successfully',
                valid: true
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('[OTP Verification] Error:', error);
        return NextResponse.json(
            { message: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
