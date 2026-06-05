import type { RowDataPacket } from "mysql2";
import { normalizeLetterStatus } from "@/lib/letterConstants";
import type { LetterRecordInput } from "@/lib/adminLetters";

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

function optDate(value: unknown): string | null {
    const s = str(value);
    if (!s) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return s;
}

export function parseLetterBody(body: Record<string, unknown>): LetterRecordInput | { error: string } {
    const clientName = str(body.client_name ?? body.clientName);
    const subject = str(body.subject ?? body.letterSubject);

    if (!clientName) {
        return { error: "Recipient name is required" };
    }
    if (!subject) {
        return { error: "Subject is required" };
    }

    return {
        client_name: clientName,
        designation: optStr(body.designation),
        client_contact: optStr(body.client_contact ?? body.clientContact),
        client_email: optStr(body.client_email ?? body.clientEmail),
        client_phone: optStr(body.client_phone ?? body.clientPhone),
        subject,
        content: optContent(body.content),
        letter_date: optDate(body.letter_date ?? body.letterDate),
        status: normalizeLetterStatus(body.status),
        notes: optStr(body.notes),
        created_by: optStr(body.created_by ?? body.createdBy),
    };
}

export function mapLetterRow(row: RowDataPacket) {
    const content = typeof row.content === "string" ? row.content : "";

    return {
        id: row.id,
        letter_number: typeof row.letter_number === "string" ? row.letter_number : "",
        client_name: typeof row.client_name === "string" ? row.client_name : "",
        designation: typeof row.designation === "string" ? row.designation : "",
        client_contact: typeof row.client_contact === "string" ? row.client_contact : "",
        client_email: typeof row.client_email === "string" ? row.client_email : "",
        client_phone: typeof row.client_phone === "string" ? row.client_phone : "",
        subject: typeof row.subject === "string" ? row.subject : "",
        content,
        status: normalizeLetterStatus(row.status),
        letter_date: row.letter_date ? String(row.letter_date).slice(0, 10) : null,
        notes: typeof row.notes === "string" ? row.notes : "",
        created_by: typeof row.created_by === "string" ? row.created_by : "",
        created_at: row.created_at ? String(row.created_at) : "",
        updated_at: row.updated_at ? String(row.updated_at) : "",
    };
}
