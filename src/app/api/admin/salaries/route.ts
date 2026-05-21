import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    SALARY_INSERT_COLUMNS,
    SALARY_SELECT_JOIN,
    employeeExists,
    ensureAdminEmployeeSalariesTable,
    mapSalaryRowToApi,
    parseSalaryBody,
    salaryInsertValues,
    type AdminEmployeeSalaryRow,
} from "@/lib/adminEmployeeSalaries";

export async function GET() {
    try {
        await ensureAdminEmployeeSalariesTable();
        const [rows] = await pool.query(`${SALARY_SELECT_JOIN} ORDER BY s.updated_at DESC`);

        const list = (rows as RowDataPacket[]).map((row) =>
            mapSalaryRowToApi(row as AdminEmployeeSalaryRow),
        );

        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee salaries:", error);
        return NextResponse.json(
            { message: "Failed to fetch salaries", error: message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminEmployeeSalariesTable();
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseSalaryBody(body, { requireEmployeeId: true });

        if (!parsed.employeeId) {
            return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
        }
        if (parsed.basicSalary <= 0) {
            return NextResponse.json({ message: "Basic salary must be greater than zero" }, { status: 400 });
        }
        if (!(await employeeExists(parsed.employeeId))) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM admin_employee_salaries WHERE employee_id = ? LIMIT 1",
            [parsed.employeeId],
        );
        if (existing.length > 0) {
            return NextResponse.json(
                {
                    message:
                        "Salary is already set up for this employee. Edit the existing record instead.",
                },
                { status: 409 },
            );
        }

        const values = salaryInsertValues(parsed);
        const placeholders = values.map(() => "?").join(", ");
        const [result] = await pool.query(
            `INSERT INTO admin_employee_salaries (${SALARY_INSERT_COLUMNS}) VALUES (${placeholders})`,
            values,
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query(`${SALARY_SELECT_JOIN} WHERE s.id = ?`, [insertId]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json(
                { message: "Salary created but could not be loaded" },
                { status: 201 },
            );
        }

        return NextResponse.json(mapSalaryRowToApi(row as AdminEmployeeSalaryRow), { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating employee salary:", error);
        return NextResponse.json(
            { message: "Failed to create salary", error: message },
            { status: 500 },
        );
    }
}
