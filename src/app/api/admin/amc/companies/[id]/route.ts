import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { COMPANY_LIST_COLUMNS, ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";

const ALLOWED_STATUSES = ["Active", "Inactive"] as const;

type Ctx = { params: Promise<{ id: string }> };

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function optStr(value: unknown): string | null {
    const s = str(value);
    return s === "" ? null : s;
}

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcCompaniesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid company id" }, { status: 400 });
        }

        const [rows] = await pool.query(`SELECT ${COMPANY_LIST_COLUMNS} FROM admin_amc_companies WHERE id = ? LIMIT 1`, [
            id,
        ]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Company not found" }, { status: 404 });
        }
        return NextResponse.json(row);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching AMC company:", error);
        return NextResponse.json({ message: "Failed to fetch company", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcCompaniesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid company id" }, { status: 400 });
        }

        const body = await request.json();
        const companyName = str(body.company_name ?? body.companyName ?? body.name);
        const statusRaw = str(body.status);
        const status = ALLOWED_STATUSES.includes(statusRaw as (typeof ALLOWED_STATUSES)[number]) ? statusRaw : "Active";

        if (!companyName) {
            return NextResponse.json({ message: "Company name is required" }, { status: 400 });
        }

        const [result] = await pool.query(
            `UPDATE admin_amc_companies
             SET company_name = ?, contact_person = ?, email = ?, phone = ?, status = ?
             WHERE id = ?`,
            [
                companyName,
                optStr(body.contact_person ?? body.contactPerson),
                optStr(body.email),
                optStr(body.phone),
                status,
                id,
            ],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Company not found" }, { status: 404 });
        }

        const [rows] = await pool.query(`SELECT ${COMPANY_LIST_COLUMNS} FROM admin_amc_companies WHERE id = ?`, [id]);
        return NextResponse.json((rows as RowDataPacket[])[0]);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating AMC company:", error);
        return NextResponse.json({ message: "Failed to update company", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcCompaniesTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid company id" }, { status: 400 });
        }

        const [deleteResult] = await pool.query("DELETE FROM admin_amc_companies WHERE id = ?", [id]);
        const affected = (deleteResult as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Company not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting AMC company:", error);
        return NextResponse.json({ message: "Failed to delete company", error: message }, { status: 500 });
    }
}
