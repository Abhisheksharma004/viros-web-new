import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
    );

    // Match login cookie options so deletion is reliable.
    const isSecure = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") || false;

    response.cookies.set({
        name: "auth_token",
        value: "",
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
    });

    return response;
}
