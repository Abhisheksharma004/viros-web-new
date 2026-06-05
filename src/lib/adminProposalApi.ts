import type { RowDataPacket } from "mysql2";
import { normalizeProposalStatus } from "@/lib/proposalConstants";
import type { ProposalRecordInput } from "@/lib/adminProposals";

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function optStr(value: unknown): string | null {
    const s = str(value);
    return s === "" ? null : s;
}

function optContent(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : value;
}

function num(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function optDate(value: unknown): string | null {
    const s = str(value);
    if (!s) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return s;
}

export function parseProposalBody(body: Record<string, unknown>): ProposalRecordInput | { error: string } {
    const clientName = str(body.client_name ?? body.clientName);
    const projectTitle = str(body.project_title ?? body.projectTitle);

    if (!clientName) {
        return { error: "Client name is required" };
    }
    if (!projectTitle) {
        return { error: "Project title is required" };
    }

    return {
        client_name: clientName,
        client_contact: optStr(body.client_contact ?? body.clientContact),
        client_email: optStr(body.client_email ?? body.clientEmail),
        client_phone: optStr(body.client_phone ?? body.clientPhone),
        project_title: projectTitle,
        content: optContent(body.content ?? body.description),
        proposed_amount: num(body.proposed_amount ?? body.proposedAmount),
        valid_until: optDate(body.valid_until ?? body.validUntil),
        status: normalizeProposalStatus(body.status),
        notes: optStr(body.notes),
        created_by: optStr(body.created_by ?? body.createdBy),
    };
}

export function mapProposalRow(row: RowDataPacket) {
    const content =
        typeof row.content === "string"
            ? row.content
            : typeof row.description === "string"
              ? row.description
              : "";

    return {
        id: row.id,
        proposal_number: typeof row.proposal_number === "string" ? row.proposal_number : "",
        client_name: typeof row.client_name === "string" ? row.client_name : "",
        client_contact: typeof row.client_contact === "string" ? row.client_contact : "",
        client_email: typeof row.client_email === "string" ? row.client_email : "",
        client_phone: typeof row.client_phone === "string" ? row.client_phone : "",
        project_title: typeof row.project_title === "string" ? row.project_title : "",
        content,
        proposed_amount: num(row.proposed_amount),
        status: normalizeProposalStatus(row.status),
        valid_until: row.valid_until ? String(row.valid_until).slice(0, 10) : null,
        notes: typeof row.notes === "string" ? row.notes : "",
        created_by: typeof row.created_by === "string" ? row.created_by : "",
        created_at: row.created_at ? String(row.created_at) : "",
        updated_at: row.updated_at ? String(row.updated_at) : "",
    };
}
