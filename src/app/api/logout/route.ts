import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookie = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });

    const response = NextResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
    );

    response.headers.set('Set-Cookie', cookie);

    return response;
}
