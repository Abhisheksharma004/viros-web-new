import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    ADVANCE_PAYMENT_SELECT_JOIN,
    deriveAdvanceStatus,
    ensureAdminEmployeeAdvancePaymentsTable,
    getAdvancePaymentById,
    mapAdvancePaymentRowToApi,
    parseAdvancePaymentBody,
    type AdminEmployeeAdvancePaymentRow,
} from "@/lib/adminEmployeeAdvancePayments";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeAdvancePaymentsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid advance id" }, { status: 400 });
        }

        const existing = await getAdvancePaymentById(id);
        if (!existing) {
            return NextResponse.json({ message: "Advance record not found" }, { status: 404 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseAdvancePaymentBody(body);
        const recoveredAmount = Number(existing.recovered_amount) || 0;

        if (parsed.amount <= 0) {
            return NextResponse.json(
                { message: "Advance amount must be greater than zero" },
                { status: 400 },
            );
        }
        if (!parsed.advanceDate) {
            return NextResponse.json({ message: "Advance date is required" }, { status: 400 });
        }

        const status = deriveAdvanceStatus(parsed.amount, recoveredAmount, parsed.status);

        const [result] = await pool.query(
            `UPDATE admin_employee_advance_payments
             SET amount = ?, advance_date = ?, recovery_start_month = ?, monthly_deduction = ?,
                 emi_months = ?, payment_mode = ?, status = ?, purpose = ?, notes = ?
             WHERE id = ?`,
            [
                parsed.amount,
                parsed.advanceDate,
                parsed.recoveryStartMonth || null,
                parsed.monthlyDeduction,
                parsed.emiMonths,
                parsed.paymentMode,
                status,
                parsed.purpose || "",
                parsed.notes || null,
                id,
            ],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Advance record not found" }, { status: 404 });
        }

        const [rows] = await pool.query(`${ADVANCE_PAYMENT_SELECT_JOIN} WHERE a.id = ?`, [id]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Advance record not found" }, { status: 404 });
        }

        return NextResponse.json(mapAdvancePaymentRowToApi(row as AdminEmployeeAdvancePaymentRow));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating advance payment:", error);
        return NextResponse.json(
            { message: "Failed to update advance payment", error: message },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeAdvancePaymentsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid advance id" }, { status: 400 });
        }

        const [result] = await pool.query(
            "DELETE FROM admin_employee_advance_payments WHERE id = ?",
            [id],
        );
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Advance record not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting advance payment:", error);
        return NextResponse.json(
            { message: "Failed to delete advance payment", error: message },
            { status: 500 },
        );
    }
}
