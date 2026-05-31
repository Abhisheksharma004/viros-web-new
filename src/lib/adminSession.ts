import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
    getAdminUserById,
    resolveAdminDisplayName,
} from "@/lib/adminUsers";

export type AdminSession = {
    id: number;
    email: string;
    name: string;
};

export { displayNameFromAdminEmail, resolveAdminDisplayName } from "@/lib/adminUsers";

export async function getAdminSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token) as {
        id?: number | string;
        email?: string;
        name?: string;
    } | null;
    const email = typeof decoded?.email === "string" ? decoded.email.trim() : "";
    if (!email) return null;

    const rawId = decoded?.id;
    const id =
        typeof rawId === "number"
            ? rawId
            : typeof rawId === "string"
              ? Number.parseInt(rawId, 10)
              : NaN;
    if (!Number.isFinite(id) || id <= 0) return null;

    const user = await getAdminUserById(id);
    if (user) {
        return {
            id,
            email: user.email,
            name: resolveAdminDisplayName(user),
        };
    }

    const tokenName = typeof decoded?.name === "string" ? decoded.name.trim() : "";
    if (tokenName) {
        return { id, email, name: tokenName };
    }

    return { id, email, name: resolveAdminDisplayName({ email, name: null }) };
}
