import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const adminToken = request.cookies.get("auth_token")?.value;
    const employeeToken = request.cookies.get("employee_auth_token")?.value;
    const pathname = request.nextUrl.pathname;

    const isAdminProtected = pathname.startsWith("/admin-dashboard");
    const isEmployeeProtected = pathname.startsWith("/employee-dashboard");
    const isLegacyDashboardProtected = pathname.startsWith("/dashboard");

    const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/admin-login");

    if (isAdminProtected && !adminToken) {
        return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    if (isEmployeeProtected && !employeeToken) {
        return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    if (isLegacyDashboardProtected && !adminToken) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthPath) {
        if (pathname.startsWith("/admin-login")) {
            if (employeeToken) {
                return NextResponse.redirect(new URL("/employee-dashboard", request.url));
            }
            if (adminToken) {
                return NextResponse.redirect(new URL("/admin-dashboard", request.url));
            }
        } else if (adminToken) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        } else if (employeeToken) {
            return NextResponse.redirect(new URL("/employee-dashboard", request.url));
        }
    }

    const response = NextResponse.next();

    if (isAuthPath) {
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
    }

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin-dashboard/:path*",
        "/employee-dashboard/:path*",
        "/login",
        "/admin-login",
    ],
};
