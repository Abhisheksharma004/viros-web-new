import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request: Request) {
    try {
        const { email, password, rememberMe } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user in database
        const [rows]: any = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const user = rows[0];

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create JWT with extended expiration if "Remember Me" is checked
        const tokenExpiry = rememberMe ? '30d' : '1d';
        const cookieMaxAge = rememberMe ? (60 * 60 * 24 * 30) : (60 * 60 * 24); // 30 days or 1 day
        
        const token = signToken({ id: user.id, email: user.email }, tokenExpiry);

        // Set cookie with appropriate expiration
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieMaxAge,
            path: '/',
        });

        const response = NextResponse.json(
            { message: 'Login successful' },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', cookie);

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
