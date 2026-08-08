import { NextResponse } from "next/server";
import { sendExpenseEmail } from "@/lib/expenseEmail";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const employeeId = typeof body.employee_id === "string" ? body.employee_id.trim() : "";
        const month = typeof body.month === "string" ? body.month.trim() : "";

        const result = await sendExpenseEmail(employeeId, month);
        if (!result.success) {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }
        return NextResponse.json({ message: result.message });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send email";
        return NextResponse.json({ message }, { status: 500 });
    }
}
