import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export type EmployeeSession = {
    accessId: number;
    employeeId: string;
    email: string;
    name: string;
};

type EmployeeTokenPayload = {
    role?: string;
    id?: number;
    employeeId?: string;
    email?: string;
    name?: string;
};

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("employee_auth_token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token) as EmployeeTokenPayload | null;
    if (!decoded || decoded.role !== "employee" || !decoded.employeeId) return null;

    return {
        accessId: typeof decoded.id === "number" ? decoded.id : 0,
        employeeId: decoded.employeeId,
        email: decoded.email ?? "",
        name: (decoded.name ?? "").trim(),
    };
}
