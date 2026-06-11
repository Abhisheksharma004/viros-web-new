import type { Letter } from "@/lib/letterUi";

export const LETTER_SIGNATORY = {
    company: "VIROS ENTREPRENEURS",
    subtitle: "IT Solutions Private Limited",
    title: "Authorized Signatory",
};

export function formatLetterDateLong(iso: string | null): string {
    const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
    if (Number.isNaN(d.getTime())) return iso ?? "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const HONORIFIC_RE = /^(mr|mrs|ms|miss|dr|shri|smt)\.?$/i;

function isHonorificOnly(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return HONORIFIC_RE.test(trimmed.replace(/\.$/, ""));
}

export function letterSalutationName(clientName: string, clientContact: string): string {
    const name = clientName.trim();
    const contact = clientContact.trim();

    if (name && !isHonorificOnly(name)) {
        return name;
    }

    if (contact && !isHonorificOnly(contact)) {
        return contact;
    }

    if (name) return name;
    return "Sir/Madam";
}

export function letterSalutation(letter: Pick<Letter, "clientName" | "clientContact">): string {
    return `Dear ${letterSalutationName(letter.clientName, letter.clientContact)},`;
}

/** Remove duplicate salutation/name prefixes; preserve trailing line breaks from the editor. */
export function normalizeLetterContent(
    content: string,
    letter: Pick<Letter, "clientName" | "clientContact">,
): string {
    let text = content.replace(/\r\n/g, "\n");
    if (!text.trim()) return "";

    const trailingNewlines = text.match(/\n*$/)?.[0] ?? "";
    text = text.replace(/\n+$/, "").replace(/[ \t]+$/, "");

    text = text.replace(/^Dear\s+[^\n]+,?\s*\n+/i, "");

    const names = [letter.clientName, letter.clientContact, letterSalutationName(letter.clientName, letter.clientContact)]
        .map((value) => value.trim())
        .filter((value) => value.length > 1 && !isHonorificOnly(value));

    for (const name of names) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const leadingName = new RegExp(`^${escaped}\\s*,\\s*`, "i");
        if (leadingName.test(text)) {
            text = text.replace(leadingName, "");
            break;
        }
    }

    return text.trimStart() + trailingNewlines;
}

export function formatLetterPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91-${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+91-${digits.slice(2)}`;
    return phone.trim();
}
