import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapLetterRow, parseLetterBody } from "@/lib/adminLetterApi";
import {
    ensureAdminLettersTable,
    getLetterRowById,
    updateLetterRecord,
} from "@/lib/adminLetters";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid letter id" }, { status: 400 });
        }

        const row = await getLetterRowById(id);
        if (!row) {
            return NextResponse.json({ message: "Letter not found" }, { status: 404 });
        }
        return NextResponse.json({ letter: mapLetterRow(row) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching letter:", error);
        return NextResponse.json({ message: "Failed to fetch letter", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid letter id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseLetterBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const updated = await updateLetterRecord(id, parsed);
        if (!updated) {
            return NextResponse.json({ message: "Letter not found" }, { status: 404 });
        }

        const row = await getLetterRowById(id);
        return NextResponse.json({ letter: mapLetterRow(row!) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating letter:", error);
        return NextResponse.json({ message: "Failed to update letter", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminLettersTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid letter id" }, { status: 400 });
        }

        const [deleteResult] = await pool.query<ResultSetHeader>("DELETE FROM admin_letters WHERE id = ?", [id]);
        if (!deleteResult.affectedRows) {
            return NextResponse.json({ message: "Letter not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting letter:", error);
        return NextResponse.json({ message: "Failed to delete letter", error: message }, { status: 500 });
    }
}
