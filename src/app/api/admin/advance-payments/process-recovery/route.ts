import { NextResponse } from "next/server";
import {
    ensureAdminEmployeeAdvancePaymentsTable,
    parsePayrollMonth,
    processAdvanceRecoveryForPayrollMonth,
} from "@/lib/adminEmployeeAdvancePayments";

export async function POST(request: Request) {
    try {
        await ensureAdminEmployeeAdvancePaymentsTable();
        const body = (await request.json()) as Record<string, unknown>;
        const payrollMonth = parsePayrollMonth(body.payroll_month);

        if (!payrollMonth) {
            return NextResponse.json(
                { message: "payroll_month is required (YYYY-MM)" },
                { status: 400 },
            );
        }

        const result = await processAdvanceRecoveryForPayrollMonth(payrollMonth);

        return NextResponse.json({
            message:
                result.processed.length > 0
                    ? `Recovery applied for ${result.processed.length} advance(s).`
                    : "No advances were eligible for recovery this month.",
            ...result,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error processing advance recovery:", error);
        return NextResponse.json(
            { message: "Failed to process advance recovery", error: message },
            { status: 500 },
        );
    }
}
