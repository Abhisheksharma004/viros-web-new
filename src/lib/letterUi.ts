import { LETTER_STATUSES, type LetterStatus } from "@/lib/letterConstants";

export type Letter = {
    id: number;
    letterNumber: string;
    clientName: string;
    designation: string;
    clientContact: string;
    clientEmail: string;
    clientPhone: string;
    subject: string;
    content: string;
    letterDate: string | null;
    status: LetterStatus;
    createdBy: string;
    createdAt: string;
};

export type LetterApiRow = {
    id: number | string | null | undefined;
    letter_number?: string | null;
    client_name?: string | null;
    designation?: string | null;
    client_contact?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    subject?: string | null;
    content?: string | null;
    letter_date?: string | null;
    status?: string | null;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string | null;
};

export type LetterFormValues = {
    clientName: string;
    designation: string;
    clientContact: string;
    clientEmail: string;
    clientPhone: string;
    subject: string;
    content: string;
    letterDate: string;
    status: LetterStatus;
};

export const EMPTY_LETTER_FORM: LetterFormValues = {
    clientName: "",
    designation: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    subject: "",
    content: "",
    letterDate: "",
    status: "Draft",
};

export function normalizeStatus(raw: string | undefined | null): LetterStatus {
    return LETTER_STATUSES.includes(raw as LetterStatus) ? (raw as LetterStatus) : "Draft";
}

export function mapApiRow(row: LetterApiRow): Letter {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    return {
        id: Number.isFinite(id) ? id : 0,
        letterNumber: typeof row.letter_number === "string" ? row.letter_number : "",
        clientName: typeof row.client_name === "string" ? row.client_name : "",
        designation: typeof row.designation === "string" ? row.designation : "",
        clientContact: typeof row.client_contact === "string" ? row.client_contact : "",
        clientEmail: typeof row.client_email === "string" ? row.client_email : "",
        clientPhone: typeof row.client_phone === "string" ? row.client_phone : "",
        subject: typeof row.subject === "string" ? row.subject : "",
        content: typeof row.content === "string" ? row.content : "",
        letterDate: row.letter_date ? String(row.letter_date).slice(0, 10) : null,
        status: normalizeStatus(row.status ?? undefined),
        createdBy: typeof row.created_by === "string" ? row.created_by : "",
        createdAt: typeof row.created_at === "string" ? row.created_at : "",
    };
}

export function letterToFormValues(l: Letter): LetterFormValues {
    return {
        clientName: l.clientName,
        designation: l.designation,
        clientContact: l.clientContact,
        clientEmail: l.clientEmail,
        clientPhone: l.clientPhone,
        subject: l.subject,
        content: l.content,
        letterDate: l.letterDate ?? "",
        status: l.status,
    };
}

export function formValuesToApiBody(form: LetterFormValues) {
    return {
        client_name: form.clientName.trim(),
        designation: form.designation.trim() || undefined,
        client_contact: form.clientContact.trim() || undefined,
        client_email: form.clientEmail.trim() || undefined,
        client_phone: form.clientPhone.trim() || undefined,
        subject: form.subject.trim(),
        content: form.content.trim() === "" ? undefined : form.content,
        letter_date: form.letterDate.trim() || undefined,
        status: form.status,
    };
}

export function formatLetterDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function letterStatusStyles(status: LetterStatus): string {
    switch (status) {
        case "Draft":
            return "bg-gray-100 text-gray-700";
        case "Sent":
            return "bg-blue-50 text-blue-800";
        case "Approved":
            return "bg-green-50 text-green-800";
        case "Rejected":
            return "bg-red-50 text-red-800";
        case "Expired":
            return "bg-amber-50 text-amber-800";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export const LETTER_INPUT_CLASS =
    "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20";
