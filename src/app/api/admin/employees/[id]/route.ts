import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
    employeeFormToSqlValues,
    employeeRowToFormState,
    ensureAdminEmployeesTable,
    strFromBody,
} from "@/lib/adminEmployees";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
        }

        const [rows] = await pool.query("SELECT * FROM admin_employees WHERE id = ? LIMIT 1", [id]);
        const list = rows as RowDataPacket[];
        const row = list[0];
        if (!row) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json(employeeRowToFormState(row as Record<string, unknown>));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching admin employee:", error);
        return NextResponse.json({ message: "Failed to fetch employee", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const employeeId = strFromBody(body, "employeeId");
        const fullName = strFromBody(body, "fullName");
        if (!employeeId || !fullName) {
            return NextResponse.json({ message: "Employee ID and full name are required" }, { status: 400 });
        }

        const values = employeeFormToSqlValues(body);

        const [result] = await pool.query(
            `UPDATE admin_employees SET
                employee_id=?, full_name=?, gender=?, date_of_birth=?, marital_status=?, blood_group=?, nationality=?, religion=?, category=?,
                personal_mobile=?, official_mobile=?, personal_email=?, official_email=?, current_address=?, permanent_address=?,
                parent_name=?, parent_mobile=?, parent_occupation=?, guardian_relation=?,
                higher_education_qualification=?, higher_education_course_name=?, higher_education_institution=?,
                higher_education_passing_year=?, higher_education_cgpa=?, higher_education_specialization=?,
                department=?, designation=?, employee_type=?, employment_category=?, joining_date=?, probation_period=?,
                work_location=?, branch_name=?, reporting_manager=?, employee_status=?,
                previous_company_name=?, previous_designation=?, previous_salary=?, work_experience_years=?,
                previous_joining_date=?, previous_relieving_date=?, reason_for_leaving=?, reference_person_name=?, reference_contact_number=?,
                aadhaar_number=?, pan_number=?, passport_number=?, voter_id_number=?, driving_license_number=?, uan_number=?, esic_number=?, pf_number=?,
                bank_name=?, bank_branch_name=?, account_holder_name=?, account_number=?, ifsc_code=?, upi_id=?
             WHERE id=?`,
            [...values, id]
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const [rows] = await pool.query(
            `SELECT id, employee_id, full_name, designation, department, official_email, employee_status, created_at
             FROM admin_employees WHERE id = ?`,
            [id]
        );
        const list = rows as RowDataPacket[];
        const row = list[0] as {
            id: number;
            employee_id: string;
            full_name: string;
            designation: string | null;
            department: string | null;
            official_email: string | null;
            employee_status: string;
            created_at: Date;
        };

        return NextResponse.json({
            ...row,
            created_at:
                row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating admin employee:", error);
        const code = (error as { code?: string })?.code;
        if (code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { message: "This Employee ID is already used by another record." },
                { status: 409 }
            );
        }
        return NextResponse.json({ message: "Failed to update employee", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
        }

        const [result] = await pool.query("DELETE FROM admin_employees WHERE id = ?", [id]);
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting admin employee:", error);
        return NextResponse.json({ message: "Failed to delete employee", error: message }, { status: 500 });
    }
}
