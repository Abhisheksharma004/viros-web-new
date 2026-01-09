import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    // Paths that require authentication
    const isProtectedPath = request.nextUrl.pathname.startsWith('/dashboard');

    // Paths that should not be accessible if already logged in
    const isAuthPath = request.nextUrl.pathname.startsWith('/login');

    if (isProtectedPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthPath && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
