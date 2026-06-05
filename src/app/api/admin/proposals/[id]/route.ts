import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapProposalRow, parseProposalBody } from "@/lib/adminProposalApi";
import {
    ensureAdminProposalsTable,
    getProposalRowById,
    updateProposalRecord,
} from "@/lib/adminProposals";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid proposal id" }, { status: 400 });
        }

        const row = await getProposalRowById(id);
        if (!row) {
            return NextResponse.json({ message: "Proposal not found" }, { status: 404 });
        }
        return NextResponse.json({ proposal: mapProposalRow(row) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching proposal:", error);
        return NextResponse.json({ message: "Failed to fetch proposal", error: message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Ctx) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid proposal id" }, { status: 400 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseProposalBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const updated = await updateProposalRecord(id, parsed);
        if (!updated) {
            return NextResponse.json({ message: "Proposal not found" }, { status: 404 });
        }

        const row = await getProposalRowById(id);
        return NextResponse.json({ proposal: mapProposalRow(row!) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating proposal:", error);
        return NextResponse.json({ message: "Failed to update proposal", error: message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    try {
        await ensureAdminProposalsTable();
        const { id: idParam } = await params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid proposal id" }, { status: 400 });
        }

        const [deleteResult] = await pool.query<ResultSetHeader>("DELETE FROM admin_proposals WHERE id = ?", [id]);
        if (!deleteResult.affectedRows) {
            return NextResponse.json({ message: "Proposal not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error deleting proposal:", error);
        return NextResponse.json({ message: "Failed to delete proposal", error: message }, { status: 500 });
    }
}
