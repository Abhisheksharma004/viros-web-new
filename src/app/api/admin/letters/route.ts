import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapLetterRow, parseLetterBody } from "@/lib/adminLetterApi";
import {
    LETTER_LIST_COLUMNS,
    createLetterRecord,
    ensureAdminLettersTable,
    getLetterRowById,
    normalizeLetterStatus,
} from "@/lib/adminLetters";

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
    try {
        await ensureAdminLettersTable();
        const { searchParams } = new URL(request.url);
        const status = str(searchParams.get("status"));
        const q = str(searchParams.get("q"));

        const clauses: string[] = [];
        const params: unknown[] = [];

        if (status) {
            clauses.push("status = ?");
            params.push(normalizeLetterStatus(status));
        }
        if (q) {
            clauses.push(
                "(client_name LIKE ? OR subject LIKE ? OR letter_number LIKE ? OR client_contact LIKE ? OR content LIKE ?)",
            );
            const like = `%${q}%`;
            params.push(like, like, like, like, like);
        }

        const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
        const [rows] = await pool.query(
            `SELECT ${LETTER_LIST_COLUMNS} FROM admin_letters ${where} ORDER BY id DESC`,
            params,
        );

        return NextResponse.json(
            { letters: (rows as RowDataPacket[]).map(mapLetterRow) },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching letters:", error);
        return NextResponse.json({ message: "Failed to fetch letters", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseLetterBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const insertId = await createLetterRecord(parsed);
        const row = await getLetterRowById(insertId);
        if (!row) {
            return NextResponse.json({ message: "Letter not found after create" }, { status: 500 });
        }

        return NextResponse.json({ letter: mapLetterRow(row) }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating letter:", error);
        return NextResponse.json({ message: "Failed to create letter", error: message }, { status: 500 });
    }
}
