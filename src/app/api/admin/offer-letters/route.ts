import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapOfferLetterRow, parseOfferLetterBody } from "@/lib/adminOfferLetterApi";
import {
    OFFER_LETTER_LIST_COLUMNS,
    createOfferLetterRecord,
    ensureAdminOfferLettersTable,
    getOfferLetterRowById,
    normalizeOfferLetterStatus,
} from "@/lib/adminOfferLetters";

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
    try {
        await ensureAdminOfferLettersTable();
        const { searchParams } = new URL(request.url);
        const status = str(searchParams.get("status"));
        const q = str(searchParams.get("q"));

        const clauses: string[] = [];
        const params: unknown[] = [];

        if (status) {
            clauses.push("status = ?");
            params.push(normalizeOfferLetterStatus(status));
        }
        if (q) {
            clauses.push(
                "(candidate_name LIKE ? OR subject LIKE ? OR offer_number LIKE ? OR designation LIKE ? OR department LIKE ? OR content LIKE ?)",
            );
            const like = `%${q}%`;
            params.push(like, like, like, like, like, like);
        }

        const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
        const [rows] = await pool.query(
            `SELECT ${OFFER_LETTER_LIST_COLUMNS} FROM admin_offer_letters ${where} ORDER BY id DESC`,
            params,
        );

        return NextResponse.json(
            { offer_letters: (rows as RowDataPacket[]).map(mapOfferLetterRow) },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching offer letters:", error);
        return NextResponse.json({ message: "Failed to fetch offer letters", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseOfferLetterBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const insertId = await createOfferLetterRecord(parsed);
        const row = await getOfferLetterRowById(insertId);
        if (!row) {
            return NextResponse.json({ message: "Offer letter not found after create" }, { status: 500 });
        }

        return NextResponse.json({ offer_letter: mapOfferLetterRow(row) }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating offer letter:", error);
        return NextResponse.json({ message: "Failed to create offer letter", error: message }, { status: 500 });
    }
}
