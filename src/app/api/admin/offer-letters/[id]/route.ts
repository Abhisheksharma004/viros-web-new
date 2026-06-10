import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapOfferLetterRow, parseOfferLetterBody } from "@/lib/adminOfferLetterApi";
import {
    ensureAdminOfferLettersTable,
    getOfferLetterRowById,
    updateOfferLetterRecord,
} from "@/lib/adminOfferLetters";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid offer letter id" }, { status: 400 });
        }

        const row = await getOfferLetterRowById(id);
        if (!row) {
            return NextResponse.json({ message: "Offer letter not found" }, { status: 404 });
        }
        return NextResponse.json({ offer_letter: mapOfferLetterRow(row) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching offer letter:", error);
        return NextResponse.json({ message: "Failed to fetch offer letter", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid offer letter id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseOfferLetterBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const updated = await updateOfferLetterRecord(id, parsed);
        if (!updated) {
            return NextResponse.json({ message: "Offer letter not found" }, { status: 404 });
        }

        const row = await getOfferLetterRowById(id);
        return NextResponse.json({ offer_letter: mapOfferLetterRow(row!) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating offer letter:", error);
        return NextResponse.json({ message: "Failed to update offer letter", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminOfferLettersTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid offer letter id" }, { status: 400 });
        }

        const [deleteResult] = await pool.query<ResultSetHeader>(
            "DELETE FROM admin_offer_letters WHERE id = ?",
            [id],
        );
        if (!deleteResult.affectedRows) {
            return NextResponse.json({ message: "Offer letter not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting offer letter:", error);
        return NextResponse.json({ message: "Failed to delete offer letter", error: message }, { status: 500 });
    }
}
