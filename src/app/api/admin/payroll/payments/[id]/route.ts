import { NextResponse } from "next/server";
import { getPayrollPaymentById, getPaymentForPayslip } from "@/lib/adminPayroll";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const paymentId = Number(id);
        if (!Number.isFinite(paymentId) || paymentId <= 0) {
            return NextResponse.json({ message: "Invalid payment ID" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const forPayslip = searchParams.get("payslip") === "1";

        const payment = forPayslip
            ? await getPaymentForPayslip(paymentId)
            : await getPayrollPaymentById(paymentId);
        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        return NextResponse.json(
            { payment },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Payroll payment GET error:", error);
        return NextResponse.json(
            { message: "Failed to fetch payment", error: message },
            { status: 500 },
        );
    }
}
