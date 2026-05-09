import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    // Paths that require authentication
    const isProtectedPath =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/admin-dashboard');

    // Paths that should not be accessible if already logged in
    const isAuthPath =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/admin-login');

    if (isProtectedPath && !token) {
        const loginTarget = request.nextUrl.pathname.startsWith('/admin-dashboard') ? '/admin-login' : '/login';
        return NextResponse.redirect(new URL(loginTarget, request.url));
    }

    if (isAuthPath && token) {
        const redirectTarget = request.nextUrl.pathname.startsWith('/admin-login') ? '/admin-dashboard' : '/dashboard';
        return NextResponse.redirect(new URL(redirectTarget, request.url));
    }

    const response = NextResponse.next();

    // Prevent browser from serving cached auth pages when navigating back.
    if (isAuthPath) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin-dashboard/:path*', '/login', '/admin-login'],
};
