import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
    ensureUsersNameColumn,
    getAdminUserById,
    resolveAdminDisplayName,
    updateAdminUserName,
} from "@/lib/adminUsers";

type TokenPayload = {
    id?: number | string;
    email?: string;
    name?: string;
};

function parseAdminId(decoded: TokenPayload | null): number | null {
    const rawId = decoded?.id;
    const id =
        typeof rawId === "number"
            ? rawId
            : typeof rawId === "string"
              ? Number.parseInt(rawId, 10)
              : NaN;
    return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    const email = typeof decoded?.email === "string" ? decoded.email.trim() : "";
    const id = parseAdminId(decoded);

    if (!email || !id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureUsersNameColumn();
    const user = await getAdminUserById(id);
    const name = user
        ? resolveAdminDisplayName(user)
        : typeof decoded?.name === "string" && decoded.name.trim()
          ? decoded.name.trim()
          : resolveAdminDisplayName({ email, name: null });

    return NextResponse.json({ id, email, name }, { status: 200 });
}

export async function PATCH(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    const id = parseAdminId(decoded);
    const email = typeof decoded?.email === "string" ? decoded.email.trim() : "";

    if (!id || !email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
        return NextResponse.json({ message: "Display name is required" }, { status: 400 });
    }
    if (name.length > 255) {
        return NextResponse.json({ message: "Display name is too long" }, { status: 400 });
    }

    const updated = await updateAdminUserName(id, name);
    if (!updated) {
        return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ id, email, name, message: "Profile updated" });
}
