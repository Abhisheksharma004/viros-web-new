import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { COMPANY_LIST_COLUMNS, ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";

const ALLOWED_STATUSES = ["Active", "Inactive"] as const;

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function optStr(value: unknown): string | null {
    const s = str(value);
    return s === "" ? null : s;
}

export async function GET() {
    try {
        await ensureAdminAmcCompaniesTable();
        const [rows] = await pool.query(`SELECT ${COMPANY_LIST_COLUMNS} FROM admin_amc_companies ORDER BY id DESC`);

        const list = (rows as RowDataPacket[]).map((row) => ({
            ...row,
            email: typeof row.email === "string" ? row.email : "",
            phone: typeof row.phone === "string" ? row.phone : "",
            contact_person: typeof row.contact_person === "string" ? row.contact_person : "",
            company_name: typeof row.company_name === "string" ? row.company_name : "",
            status:
                ALLOWED_STATUSES.includes(row.status as (typeof ALLOWED_STATUSES)[number])
                    ? row.status
                    : "Active",
        }));

        return NextResponse.json(list, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching AMC companies:", error);
        return NextResponse.json({ message: "Failed to fetch companies", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureAdminAmcCompaniesTable();
        const body = await request.json();
        const companyName = str(body.company_name ?? body.companyName ?? body.name);
        const statusRaw = str(body.status);
        const status = ALLOWED_STATUSES.includes(statusRaw as (typeof ALLOWED_STATUSES)[number]) ? statusRaw : "Active";

        if (!companyName) {
            return NextResponse.json({ message: "Company name is required" }, { status: 400 });
        }

        const [result] = await pool.query(
            `INSERT INTO admin_amc_companies (company_name, contact_person, email, phone, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                companyName,
                optStr(body.contact_person ?? body.contactPerson),
                optStr(body.email),
                optStr(body.phone),
                status,
            ],
        );

        const insertId = (result as ResultSetHeader).insertId;
        const [rows] = await pool.query(`SELECT ${COMPANY_LIST_COLUMNS} FROM admin_amc_companies WHERE id = ?`, [
            insertId,
        ]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Company not found after create" }, { status: 500 });
        }

        return NextResponse.json(row, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating AMC company:", error);
        return NextResponse.json({ message: "Failed to create company", error: message }, { status: 500 });
    }
}
