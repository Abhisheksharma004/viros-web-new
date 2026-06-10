import type { OfferLetter } from "@/lib/offerLetterUi";

export const OFFER_SIGNATORY = {
    company: "VIROS ENTREPRENEURS",
    subtitle: "IT Solutions Private Limited",
    title: "Authorized Signatory",
};

export function formatOfferDateLong(iso: string | null): string {
    const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
    if (Number.isNaN(d.getTime())) return iso ?? "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function offerSalutationName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "Candidate";
    return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function offerSalutation(letter: Pick<OfferLetter, "candidateName">): string {
    return `Dear ${offerSalutationName(letter.candidateName)},`;
}

export function formatOfferPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91-${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+91-${digits.slice(2)}`;
    return phone.trim();
}
