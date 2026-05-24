import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email-utils";
import { sanitizeEmail } from "@/lib/otp-utils";
import {
    findAdminUserByEmail,
    findEmployeeAccessByIdentifier,
    getOfficialEmailForOtp,
    type ResolvedPasswordResetAccount,
} from "@/lib/employeePasswordReset";
import { isPasswordResetEmailConfigured } from "@/lib/sendPasswordResetOtpEmail";
import { storeAndSendPasswordResetOtp } from "@/lib/storePasswordResetOtp";

async function resolveAccount(identifier: string): Promise<
    | { ok: true; account: ResolvedPasswordResetAccount }
    | { ok: false; status: number; message: string }
> {
    const trimmed = identifier.trim();
    const employee = await findEmployeeAccessByIdentifier(trimmed);

    if (employee) {
        if (employee.portal_status !== "Active") {
            return {
                ok: false,
                status: 403,
                message: "Portal access is not active. Contact your administrator.",
            };
        }

        const officialEmail = getOfficialEmailForOtp(employee);
        if (!officialEmail) {
            return {
                ok: false,
                status: 400,
                message: "No valid official email is registered for this employee. Contact your administrator.",
            };
        }

        return {
            ok: true,
            account: { accountType: "employee", employeeId: employee.employee_id, email: officialEmail },
        };
    }

    if (!trimmed.includes("@")) {
        return {
            ok: false,
            status: 404,
            message: "No account found with this employee ID or email.",
        };
    }

    const sanitizedEmail = sanitizeEmail(trimmed);
    if (!isValidEmail(sanitizedEmail)) {
        return { ok: false, status: 400, message: "Invalid email format." };
    }

    const admin = await findAdminUserByEmail(sanitizedEmail);
    if (!admin) {
        return {
            ok: false,
            status: 404,
            message: "No account found with this employee ID or email.",
        };
    }

    return {
        ok: true,
        account: { accountType: "admin", userId: admin.id, email: sanitizeEmail(admin.email) },
    };
}

export async function POST(request: Request) {
    try {
        if (!isPasswordResetEmailConfigured()) {
            console.error("[Password Reset] Email configuration missing.");
            return NextResponse.json(
                { message: "Email service is not configured. Please contact administrator." },
                { status: 500 },
            );
        }

        const body = await request.json();
        const identifier =
            typeof body.identifier === "string"
                ? body.identifier
                : typeof body.email === "string"
                  ? body.email
                  : "";

        if (!identifier.trim()) {
            return NextResponse.json({ message: "Employee ID or email is required" }, { status: 400 });
        }

        const resolved = await resolveAccount(identifier);
        if (!resolved.ok) {
            return NextResponse.json({ message: resolved.message }, { status: resolved.status });
        }

        const { account } = resolved;
        await storeAndSendPasswordResetOtp(account.email);

        const logLabel =
            account.accountType === "employee"
                ? `employee ${account.employeeId}`
                : `admin user #${account.userId}`;

        console.log(`[Password Reset] OTP sent to ${account.email} (${logLabel})`);

        return NextResponse.json(
            {
                message: "OTP sent to your registered email.",
                email: account.email,
                accountType: account.accountType,
                ...(account.accountType === "employee" ? { employeeId: account.employeeId } : {}),
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        console.error("[Password Reset Request] Error:", error);
        return NextResponse.json({ message: "Failed to process password reset request" }, { status: 500 });
    }
}
