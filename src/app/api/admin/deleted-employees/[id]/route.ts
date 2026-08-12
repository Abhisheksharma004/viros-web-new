import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/deleted-employees/[id] -> Restore employee */
export async function POST(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminEmployeesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT employee_id FROM admin_employees WHERE id = ? LIMIT 1",
            [id]
        );
        const employee = rows[0];
        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const [result] = await pool.query(
            "UPDATE admin_employees SET is_deleted = 0, deleted_at = NULL, employee_status = IF(employee_status = 'Resigned', 'Active', employee_status) WHERE id = ?",
            [id]
        );
        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        if (employee.employee_id) {
            const empId = String(employee.employee_id);
            try {
                await Promise.all([
                    pool.query("UPDATE admin_employee_access SET portal_status = 'Active' WHERE employee_id = ?", [empId]),
                    pool.query("UPDATE admin_employee_salaries SET is_active = 1 WHERE employee_id = ?", [empId]),
                    pool.query("UPDATE admin_employee_shifts SET is_active = 1 WHERE employee_id = ?", [empId]),
                ]);
            } catch {
                // Ignore if dependent tables don't exist yet
            }
        }

        return NextResponse.json({ ok: true, message: "Employee restored successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error restoring admin employee:", error);
        return NextResponse.json({ message: "Failed to restore employee", error: message }, { status: 500 });
    }
}

/** DELETE /api/admin/deleted-employees/[id] -> Permanently delete employee */
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

        return NextResponse.json({ ok: true, message: "Employee permanently deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error permanently deleting admin employee:", error);
        return NextResponse.json({ message: "Failed to permanently delete employee", error: message }, { status: 500 });
    }
}
