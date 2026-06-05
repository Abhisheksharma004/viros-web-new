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

export function letterSalutationName(clientName: string, clientContact: string): string {
    const primary = clientName.trim() || clientContact.trim();
    if (!primary) return "Sir/Madam";
    return primary.split(/\s+/)[0] ?? primary;
}

export function letterSalutation(letter: Pick<Letter, "clientName" | "clientContact">): string {
    return `Dear ${letterSalutationName(letter.clientName, letter.clientContact)},`;
}

export function formatLetterPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91-${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+91-${digits.slice(2)}`;
    return phone.trim();
}
