import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    SALARY_SELECT_JOIN,
    ensureAdminEmployeeSalariesTable,
    mapSalaryRowToApi,
    parseSalaryBody,
    type AdminEmployeeSalaryRow,
} from "@/lib/adminEmployeeSalaries";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeSalariesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid salary id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseSalaryBody(body);

        if (parsed.basicSalary <= 0) {
            return NextResponse.json({ message: "Basic salary must be greater than zero" }, { status: 400 });
        }

        const [result] = await pool.query(
            `UPDATE admin_employee_salaries
             SET basic_salary = ?, hra = ?, conveyance = ?, special_allowance = ?, performance_allowance = ?,
                 bonus = ?, other_allowance = ?, pf = ?, pf_percent = ?, esi = ?, tds = ?,
                 advance_deduction = ?, leave_deduction = ?, is_active = ?, notes = ?
             WHERE id = ?`,
            [
                parsed.basicSalary,
                parsed.hra,
                parsed.conveyance,
                parsed.specialAllowance,
                parsed.performanceAllowance,
                parsed.bonus,
                parsed.otherAllowance,
                parsed.pf,
                parsed.pfPercent,
                parsed.esi,
                parsed.tds,
                parsed.advanceDeduction,
                parsed.leaveDeduction,
                parsed.isActive ? 1 : 0,
                parsed.notes || null,
                id,
            ],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Salary record not found" }, { status: 404 });
        }

        const [rows] = await pool.query(`${SALARY_SELECT_JOIN} WHERE s.id = ?`, [id]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Salary record not found" }, { status: 404 });
        }

        return NextResponse.json(mapSalaryRowToApi(row as AdminEmployeeSalaryRow));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating employee salary:", error);
        return NextResponse.json(
            { message: "Failed to update salary", error: message },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeeSalariesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid salary id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_employee_salaries WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Salary record not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting employee salary:", error);
        return NextResponse.json(
            { message: "Failed to delete salary", error: message },
            { status: 500 },
        );
    }
}
