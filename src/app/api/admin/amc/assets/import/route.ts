import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureAdminAmcAssetsTable } from "@/lib/adminAmcAssets";
import { ensureAdminAmcCompaniesTable } from "@/lib/adminAmcCompanies";
import { parseCsvLines } from "@/lib/simpleCsv";

const ALLOWED_STATUSES = new Set(["Active", "Inactive", "Maintenance"]);

const MAX_ROWS = 2000;
const MAX_CSV_BYTES = 4 * 1024 * 1024;

const COL_ASSET_NAME = new Set(["asset_name", "name", "asset"]);
const COL_DESC = new Set(["asset_description", "description", "desc"]);
const COL_TAG = new Set(["tag_code", "tag_serial", "serial", "rfid"]);
const COL_CATEGORY = new Set(["category"]);
const COL_COMPANY_ID = new Set(["company_id"]);
const COL_COMPANY_NAME = new Set(["company_name", "company"]);

type ImportErr = { row: number; message: string };

type PreparedRow = {
    company_id: number | null;
    asset_name: string;
    asset_description: string | null;
    tag_code: string | null;
    category: string | null;
    status: string;
};

function normHeader(raw: string): string {
    return raw
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function normalizeStatus(raw: string): string {
    const t = raw.trim();
    return ALLOWED_STATUSES.has(t) ? t : "Active";
}

/** Text field truncation for DB safety (characters, not UTF-8 bytes). */
function optStr(raw: string, maxChars: number): string | null {
    const t = raw.trim();
    if (t === "") return null;
    return t.length > maxChars ? t.slice(0, maxChars) : t;
}

async function bulkInsert(conn: PoolConnection, rows: PreparedRow[]): Promise<void> {
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map((r) => [
            r.company_id,
            r.asset_name,
            r.asset_description,
            r.tag_code,
            r.category,
            r.status,
        ]);
        await conn.query(
            `INSERT INTO admin_amc_assets (company_id, asset_name, asset_description, tag_code, category, status) VALUES ?`,
            [values],
        );
    }
}

export async function POST(request: Request) {
    try {
        const bodyUnknown: unknown = await request.json().catch(() => null);
        const body = bodyUnknown && typeof bodyUnknown === "object" ? (bodyUnknown as Record<string, unknown>) : null;
        const csvRaw = typeof body?.csv === "string" ? body.csv : "";

        if (!csvRaw.trim()) {
            return NextResponse.json({ message: "Missing or empty csv field", created: 0, errors: [] }, { status: 400 });
        }

        const byteLen = Buffer.byteLength(csvRaw, "utf8");
        if (byteLen > MAX_CSV_BYTES) {
            return NextResponse.json(
                { message: `CSV exceeds maximum size (${MAX_CSV_BYTES} bytes)`, created: 0, errors: [] },
                { status: 413 },
            );
        }

        await ensureAdminAmcCompaniesTable();
        await ensureAdminAmcAssetsTable();

        const [companyRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, company_name FROM admin_amc_companies`,
        );
        const nameToId = new Map<string, number>();
        const idSet = new Set<number>();
        for (const row of companyRows) {
            const id = typeof row.id === "number" ? row.id : Number(row.id);
            const name = typeof row.company_name === "string" ? row.company_name.trim().toLowerCase() : "";
            if (Number.isFinite(id)) idSet.add(id);
            if (name && !nameToId.has(name)) nameToId.set(name, id);
        }

        const grid = parseCsvLines(csvRaw);
        if (grid.length < 2) {
            return NextResponse.json(
                { message: "CSV must include a header row and at least one data row", created: 0, errors: [] },
                { status: 400 },
            );
        }

        const headerCells = grid[0].map((h) => normHeader(String(h ?? "")));

        const idxAssetName = headerCells.findIndex((h) => COL_ASSET_NAME.has(h));
        const idxDesc = headerCells.findIndex((h) => COL_DESC.has(h));
        const idxTag = headerCells.findIndex((h) => COL_TAG.has(h));
        const idxCat = headerCells.findIndex((h) => COL_CATEGORY.has(h));
        const idxCompanyId = headerCells.findIndex((h) => COL_COMPANY_ID.has(h));
        const idxCompanyName = headerCells.findIndex((h) => COL_COMPANY_NAME.has(h));
        const idxStatus = headerCells.findIndex((h) => h === "status");

        if (idxAssetName < 0) {
            return NextResponse.json(
                {
                    message:
                        "Missing required header for asset name. Use one of: asset_name, name, asset in the header row.",
                    created: 0,
                    errors: [],
                },
                { status: 400 },
            );
        }

        let dataRows = 0;
        for (let gi = 1; gi < grid.length; gi++) {
            if (grid[gi].some((c) => String(c ?? "").trim() !== "")) dataRows++;
        }
        if (dataRows === 0) {
            return NextResponse.json({
                created: 0,
                errors: [],
                message: "No non-empty data rows found after the header",
            });
        }
        if (dataRows > MAX_ROWS) {
            return NextResponse.json(
                { message: `Too many rows (${dataRows}). Maximum is ${MAX_ROWS}.`, created: 0, errors: [] },
                { status: 400 },
            );
        }

        const errors: ImportErr[] = [];
        const prepared: PreparedRow[] = [];

        /* Row numbers: sheet row = grid index + 1 (header is row 1). */
        for (let gi = 1; gi < grid.length; gi++) {
            const line = grid[gi];
            if (!line.some((c) => String(c ?? "").trim() !== "")) continue;
            const sheetRow = gi + 1;

            const get = (i: number) => {
                if (i < 0) return "";
                return String(line[i] ?? "").trim();
            };

            const assetNameRaw = get(idxAssetName);
            if (!assetNameRaw) {
                errors.push({ row: sheetRow, message: "asset_name is empty" });
                continue;
            }
            if (assetNameRaw.length > 255) {
                errors.push({ row: sheetRow, message: "asset_name exceeds 255 characters" });
                continue;
            }

            const tagRaw = idxTag >= 0 ? get(idxTag) : "";
            if (tagRaw.length > 120) {
                errors.push({ row: sheetRow, message: "tag_code exceeds 120 characters" });
                continue;
            }
            const catRaw = idxCat >= 0 ? get(idxCat) : "";
            if (catRaw.length > 120) {
                errors.push({ row: sheetRow, message: "category exceeds 120 characters" });
                continue;
            }

            let company_id: number | null = null;
            const cidStr = idxCompanyId >= 0 ? get(idxCompanyId) : "";
            const cnameStr = idxCompanyName >= 0 ? get(idxCompanyName) : "";

            if (cidStr && cnameStr) {
                errors.push({ row: sheetRow, message: "Provide only company_id or company_name, not both" });
                continue;
            }

            if (cidStr) {
                const n = Number(cidStr);
                if (!Number.isFinite(n) || n < 1 || !idSet.has(n)) {
                    errors.push({ row: sheetRow, message: "company_id does not match an existing company" });
                    continue;
                }
                company_id = n;
            } else if (cnameStr) {
                const found = nameToId.get(cnameStr.toLowerCase());
                if (found === undefined) {
                    errors.push({ row: sheetRow, message: `Unknown company_name: "${cnameStr}"` });
                    continue;
                }
                company_id = found;
            }

            const status = idxStatus >= 0 ? normalizeStatus(get(idxStatus)) : "Active";

            prepared.push({
                company_id,
                asset_name: assetNameRaw,
                asset_description: optStr(idxDesc >= 0 ? get(idxDesc) : "", 60000),
                tag_code: optStr(tagRaw, 120),
                category: optStr(catRaw, 120),
                status,
            });
        }

        if (prepared.length === 0) {
            return NextResponse.json({
                created: 0,
                errors,
                message:
                    errors.length > 0
                        ? "No rows imported. Fix CSV errors or use the downloadable template."
                        : "No data rows imported",
            });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await bulkInsert(conn, prepared);
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            const msg = e instanceof Error ? e.message : "Bulk insert failed";
            console.error("Asset CSV import bulk insert:", e);
            return NextResponse.json(
                {
                    created: 0,
                    errors: [{ row: 0, message: msg }],
                    message: "Import failed — no rows were saved.",
                },
                { status: 500 },
            );
        } finally {
            conn.release();
        }

        return NextResponse.json({
            created: prepared.length,
            errors,
            message:
                errors.length > 0
                    ? `Imported ${prepared.length} rows; ${errors.length} row(s) skipped.`
                    : `Imported ${prepared.length} row(s).`,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error importing AMC assets CSV:", error);
        return NextResponse.json({ message: "Import failed", error: message, created: 0, errors: [] }, { status: 500 });
    }
}
