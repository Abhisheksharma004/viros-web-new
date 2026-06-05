import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { mapProposalRow, parseProposalBody } from "@/lib/adminProposalApi";
import {
    PROPOSAL_LIST_COLUMNS,
    createProposalRecord,
    ensureAdminProposalsTable,
    getProposalRowById,
    normalizeProposalStatus,
} from "@/lib/adminProposals";

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
    try {
        await ensureAdminProposalsTable();
        const { searchParams } = new URL(request.url);
        const status = str(searchParams.get("status"));
        const q = str(searchParams.get("q"));

        const clauses: string[] = [];
        const params: unknown[] = [];

        if (status) {
            clauses.push("status = ?");
            params.push(normalizeProposalStatus(status));
        }
        if (q) {
            clauses.push(
                "(client_name LIKE ? OR project_title LIKE ? OR proposal_number LIKE ? OR client_contact LIKE ? OR content LIKE ?)",
            );
            const like = `%${q}%`;
            params.push(like, like, like, like, like);
        }

        const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
        const [rows] = await pool.query(
            `SELECT ${PROPOSAL_LIST_COLUMNS} FROM admin_proposals ${where} ORDER BY id DESC`,
            params,
        );

        return NextResponse.json(
            { proposals: (rows as RowDataPacket[]).map(mapProposalRow) },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching proposals:", error);
        return NextResponse.json({ message: "Failed to fetch proposals", error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const parsed = parseProposalBody(body);
        if ("error" in parsed) {
            return NextResponse.json({ message: parsed.error }, { status: 400 });
        }

        const insertId = await createProposalRecord(parsed);
        const row = await getProposalRowById(insertId);
        if (!row) {
            return NextResponse.json({ message: "Proposal not found after create" }, { status: 500 });
        }

        return NextResponse.json({ proposal: mapProposalRow(row) }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating proposal:", error);
        return NextResponse.json({ message: "Failed to create proposal", error: message }, { status: 500 });
    }
}
