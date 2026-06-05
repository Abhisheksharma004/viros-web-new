import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    ADVANCE_PAYMENT_SELECT_JOIN,
    employeeExists,
    ensureAdminEmployeeAdvancePaymentsTable,
    generateNextAdvanceId,
    mapAdvancePaymentRowToApi,
    parseAdvancePaymentBody,
    type AdminEmployeeAdvancePaymentRow,
} from "@/lib/adminEmployeeAdvancePayments";

export async function GET() {
    try {
        await ensureAdminEmployeeAdvancePaymentsTable();
        const [rows] = await pool.query(
            `${ADVANCE_PAYMENT_SELECT_JOIN} ORDER BY a.created_at DESC`,
        );

        const list = (rows as RowDataPacket[]).map((row) =>
            mapAdvancePaymentRowToApi(row as AdminEmployeeAdvancePaymentRow),
        );

        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching advance payments:", error);
        return NextResponse.json(
            { message: "Failed to fetch advance payments", error: message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    const conn = await pool.getConnection();
    try {
        await ensureAdminEmployeeAdvancePaymentsTable();
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseAdvancePaymentBody(body, { requireEmployeeId: true });

        if (!parsed.employeeId) {
            return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
        }
        if (parsed.amount <= 0) {
            return NextResponse.json(
                { message: "Advance amount must be greater than zero" },
                { status: 400 },
            );
        }
        if (!parsed.advanceDate) {
            return NextResponse.json({ message: "Advance date is required" }, { status: 400 });
        }
        if (!(await employeeExists(parsed.employeeId))) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        await conn.beginTransaction();
        const advanceId = await generateNextAdvanceId(conn, parsed.advanceDate);

        const [result] = await conn.query(
            `INSERT INTO admin_employee_advance_payments (
                advance_id, employee_id, amount, recovered_amount, advance_date,
                recovery_start_month, monthly_deduction, emi_months, payment_mode,
                status, purpose, notes
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                advanceId,
                parsed.employeeId,
                parsed.amount,
                0,
                parsed.advanceDate,
                parsed.recoveryStartMonth || null,
                parsed.monthlyDeduction,
                parsed.emiMonths,
                parsed.paymentMode,
                parsed.status,
                parsed.purpose || "",
                parsed.notes || null,
            ],
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await conn.query(`${ADVANCE_PAYMENT_SELECT_JOIN} WHERE a.id = ?`, [
            insertId,
        ]);
        await conn.commit();

        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json(
                { message: "Advance created but could not be loaded" },
                { status: 201 },
            );
        }

        return NextResponse.json(
            mapAdvancePaymentRowToApi(row as AdminEmployeeAdvancePaymentRow),
            { status: 201 },
        );
    } catch (error: unknown) {
        await conn.rollback();
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating advance payment:", error);
        return NextResponse.json(
            { message: "Failed to create advance payment", error: message },
            { status: 500 },
        );
    } finally {
        conn.release();
    }
}
