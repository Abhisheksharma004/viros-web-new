import { NextResponse } from "next/server";
import {
    listPayrollPayments,
    recordPayrollPayment,
    type PayrollPaymentMode,
} from "@/lib/adminPayroll";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const payrollMonth = searchParams.get("payroll_month") ?? undefined;
        const employeeId = searchParams.get("employee_id") ?? undefined;
        const limit = Number(searchParams.get("limit")) || undefined;

        const payments = await listPayrollPayments({
            payrollMonth,
            employeeId,
            limit,
        });

        return NextResponse.json(
            { payments },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Payroll payments GET error:", error);
        return NextResponse.json(
            { message: "Failed to fetch payroll payments", error: message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const employeeId = typeof body.employee_id === "string" ? body.employee_id : "";
        const payrollMonth = typeof body.payroll_month === "string" ? body.payroll_month : "";
        const paymentMode =
            typeof body.payment_mode === "string" ? body.payment_mode : "bank_transfer";
        const paidBy = typeof body.paid_by === "string" ? body.paid_by : "Admin";
        const notes = typeof body.notes === "string" ? body.notes : undefined;

        if (!employeeId.trim() || !payrollMonth.trim()) {
            return NextResponse.json(
                { message: "employee_id and payroll_month are required" },
                { status: 400 },
            );
        }

        const payment = await recordPayrollPayment({
            employeeId,
            payrollMonth,
            paymentMode: paymentMode as PayrollPaymentMode,
            paidBy,
            notes,
        });

        return NextResponse.json({
            message: "Salary payment recorded",
            payment,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Payroll payment POST error:", error);
        const status = message.includes("already paid") ? 409 : 400;
        return NextResponse.json({ message }, { status });
    }
}
