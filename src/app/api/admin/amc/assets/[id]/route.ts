import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcAssetsTable } from "@/lib/adminAmcAssets";
import { ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";

const ALLOWED_STATUSES = ["Active", "Inactive", "Maintenance"] as const;

type Ctx = { params: Promise<{ id: string }> };

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function optStr(value: unknown): string | null {
    const s = str(value);
    return s === "" ? null : s;
}

async function verifyCompanyId(companyId: number | null): Promise<{ ok: true } | { ok: false; message: string }> {
    if (companyId === null) return { ok: true };
    await ensureAdminAmcCompaniesTable();
    const [rows] = await pool.query("SELECT id FROM admin_amc_companies WHERE id = ? LIMIT 1", [companyId]);
    if (!(rows as RowDataPacket[])[0]) {
        return { ok: false, message: "Selected company does not exist" };
    }
    return { ok: true };
}

function normalizeStatus(raw: string): string {
    return ALLOWED_STATUSES.includes(raw as (typeof ALLOWED_STATUSES)[number]) ? raw : "Active";
}

const ASSET_ROW_SQL = `
  SELECT a.id, a.company_id, a.asset_name, a.asset_description, a.tag_code, a.category, a.status,
         c.company_name AS company_name
  FROM admin_amc_assets a
  LEFT JOIN admin_amc_companies c ON c.id = a.company_id
  WHERE a.id = ?
  LIMIT 1
`;

export async function GET(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcCompaniesTable();
        await ensureAdminAmcAssetsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid asset id" }, { status: 400 });
        }

        const [rows] = await pool.query(ASSET_ROW_SQL, [id]);
        const row = (rows as RowDataPacket[])[0];
        if (!row) {
            return NextResponse.json({ message: "Asset not found" }, { status: 404 });
        }
        return NextResponse.json(row);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching AMC asset:", error);
        return NextResponse.json({ message: "Failed to fetch asset", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcAssetsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid asset id" }, { status: 400 });
        }

        const body = await request.json();
        const assetName = str(body.asset_name ?? body.assetName ?? body.name);
        if (!assetName) {
            return NextResponse.json({ message: "Asset name is required" }, { status: 400 });
        }

        let companyId: number | null = null;
        const rawCompany = (body as Record<string, unknown>).company_id ?? (body as Record<string, unknown>).companyId;
        if (rawCompany !== undefined && rawCompany !== null && rawCompany !== "") {
            const n = Number(rawCompany);
            if (!Number.isFinite(n) || n < 1) {
                return NextResponse.json({ message: "Invalid company id" }, { status: 400 });
            }
            companyId = n;
        }

        const vc = await verifyCompanyId(companyId);
        if (!vc.ok) {
            return NextResponse.json({ message: vc.message }, { status: 400 });
        }

        const status = normalizeStatus(str(body.status));

        const [result] = await pool.query(
            `UPDATE admin_amc_assets
             SET company_id = ?, asset_name = ?, asset_description = ?, tag_code = ?, category = ?, status = ?
             WHERE id = ?`,
            [
                companyId,
                assetName,
                optStr(body.asset_description ?? body.assetDescription),
                optStr(body.tag_code ?? body.tagCode),
                optStr(body.category),
                status,
                id,
            ],
        );

        const affected = (result as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Asset not found" }, { status: 404 });
        }

        const [rows] = await pool.query(ASSET_ROW_SQL, [id]);
        return NextResponse.json((rows as RowDataPacket[])[0]);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating AMC asset:", error);
        return NextResponse.json({ message: "Failed to update asset", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminAmcAssetsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid asset id" }, { status: 400 });
        }

        const [del] = await pool.query("DELETE FROM admin_amc_assets WHERE id = ?", [id]);
        const affected = (del as ResultSetHeader).affectedRows;
        if (!affected) {
            return NextResponse.json({ message: "Asset not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting AMC asset:", error);
        return NextResponse.json({ message: "Failed to delete asset", error: message }, { status: 500 });
    }
}
