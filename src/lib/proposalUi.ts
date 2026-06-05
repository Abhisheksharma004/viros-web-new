import { PROPOSAL_STATUSES, type ProposalStatus } from "@/lib/proposalConstants";

export type Proposal = {
    id: number;
    proposalNumber: string;
    clientName: string;
    clientContact: string;
    clientEmail: string;
    clientPhone: string;
    projectTitle: string;
    content: string;
    proposedAmount: number;
    validUntil: string | null;
    status: ProposalStatus;
    createdBy: string;
    createdAt: string;
};

export type ProposalApiRow = {
    id: number | string | null | undefined;
    proposal_number?: string | null;
    client_name?: string | null;
    client_contact?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    project_title?: string | null;
    content?: string | null;
    description?: string | null;
    proposed_amount?: number | string | null;
    valid_until?: string | null;
    status?: string | null;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string | null;
};

export type ProposalFormValues = {
    clientName: string;
    clientContact: string;
    clientEmail: string;
    clientPhone: string;
    projectTitle: string;
    content: string;
    proposedAmount: string;
    validUntil: string;
    status: ProposalStatus;
};

export const EMPTY_PROPOSAL_FORM: ProposalFormValues = {
    clientName: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    projectTitle: "",
    content: "",
    proposedAmount: "",
    validUntil: "",
    status: "Draft",
};

export function normalizeStatus(raw: string | undefined | null): ProposalStatus {
    return PROPOSAL_STATUSES.includes(raw as ProposalStatus) ? (raw as ProposalStatus) : "Draft";
}

export function mapApiRow(row: ProposalApiRow): Proposal {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    return {
        id: Number.isFinite(id) ? id : 0,
        proposalNumber: typeof row.proposal_number === "string" ? row.proposal_number : "",
        clientName: typeof row.client_name === "string" ? row.client_name : "",
        clientContact: typeof row.client_contact === "string" ? row.client_contact : "",
        clientEmail: typeof row.client_email === "string" ? row.client_email : "",
        clientPhone: typeof row.client_phone === "string" ? row.client_phone : "",
        projectTitle: typeof row.project_title === "string" ? row.project_title : "",
        content:
            typeof row.content === "string"
                ? row.content
                : typeof row.description === "string"
                  ? row.description
                  : "",
        proposedAmount: Number(row.proposed_amount) || 0,
        validUntil: row.valid_until ? String(row.valid_until).slice(0, 10) : null,
        status: normalizeStatus(row.status ?? undefined),
        createdBy: typeof row.created_by === "string" ? row.created_by : "",
        createdAt: typeof row.created_at === "string" ? row.created_at : "",
    };
}

export function proposalToFormValues(p: Proposal): ProposalFormValues {
    return {
        clientName: p.clientName,
        clientContact: p.clientContact,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone,
        projectTitle: p.projectTitle,
        content: p.content,
        proposedAmount: p.proposedAmount > 0 ? String(p.proposedAmount) : "",
        validUntil: p.validUntil ?? "",
        status: p.status,
    };
}

export function formValuesToApiBody(form: ProposalFormValues) {
    return {
        client_name: form.clientName.trim(),
        client_contact: form.clientContact.trim() || undefined,
        client_email: form.clientEmail.trim() || undefined,
        client_phone: form.clientPhone.trim() || undefined,
        project_title: form.projectTitle.trim(),
        content: form.content.trim() === "" ? undefined : form.content,
        proposed_amount: form.proposedAmount.trim() ? Number(form.proposedAmount) : 0,
        valid_until: form.validUntil.trim() || undefined,
        status: form.status,
    };
}

export function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatProposalDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function proposalStatusStyles(status: ProposalStatus): string {
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

export const PROPOSAL_INPUT_CLASS =
    "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20";
