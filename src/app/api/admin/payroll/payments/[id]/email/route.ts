import { NextResponse } from "next/server";
import { sendPayslipEmail } from "@/lib/payslipEmail";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const paymentId = Number(id);
        if (!Number.isFinite(paymentId) || paymentId <= 0) {
            return NextResponse.json({ message: "Invalid payment ID" }, { status: 400 });
        }

        const result = await sendPayslipEmail(paymentId);
        if (!result.success) {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Payslip email POST error:", error);
        return NextResponse.json(
            { message: "Failed to send email", error: message },
            { status: 500 },
        );
    }
}
