import type { OfferType } from "@/lib/offerLetterConstants";
import { formatOfferDateLong, formatOfferPhone, offerSalutation, offerSalutationName } from "@/lib/offerLetterDocument";
import type { OfferLetter } from "@/lib/offerLetterUi";

export const OFFER_LETTER_COMPANY = {
    name: "VIROS ENTREPRENEURS",
    subtitle: "IT Solutions Private Limited",
    tagline1: "Deals In Complete Software and Hardware Solutions",
    tagline2: "We Provide Complete Industrial Solutions",
    address:
        "25/2, Street -2, 1st Floor, Molarband Market, Beside Om TVS bike Showroom, Badarpur, New Delhi INDIA, Delhi - 110044",
    email: "sales@virosentrepreneurs.com",
    phone: "9871029141",
    website: "www.virosentrepreneurs.com",
    logoPath: "/payslip-logo.png",
};

export type OfferLetterDetailRow = { label: string; value: string };

export function getOfferLetterTitle(offerType: OfferType): string {
    switch (offerType) {
        case "Internship":
            return "INTERNSHIP OFFER LETTER";
        case "Contract":
            return "CONTRACT OFFER LETTER";
        case "Consultant":
            return "CONSULTANT OFFER LETTER";
        default:
            return "JOB OFFER LETTER";
    }
}

export function formatJoiningDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatSalaryDisplay(letter: Pick<OfferLetter, "currency" | "compensation" | "salaryType">): string {
    if (!letter.compensation.trim()) return "—";
    const amount = letter.compensation.trim();
    const prefix = letter.currency === "INR" ? "Rs." : letter.currency;
    const type = letter.salaryType.toLowerCase();
    return `${prefix} ${amount} ${type}`;
}

export function benefitLines(benefits: string): string[] {
    return benefits
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function joinPhrases(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function benefitsParagraph(benefits: string): string {
    const lines = benefitLines(benefits);
    if (lines.length === 0) return "";
    return `As part of your employment package, you will be entitled to ${joinPhrases(lines)}.`;
}

export function responsibilityLines(text: string): string[] {
    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
}

export function termsLines(text: string): string[] {
    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
}

export function offerIntroParagraph(letter: Pick<OfferLetter, "designation" | "department">): string {
    const position = letter.designation.trim() || "the offered role";
    const dept = letter.department.trim() ? `our ${letter.department} department` : "our organization";
    return `We are pleased to offer you the position of ${position} in ${dept}. We believe your skills and experience will be valuable assets to our organization.`;
}

function formatWorkLocationPhrase(location: string): string {
    const normalized = location.trim().toLowerCase();
    if (normalized === "remote" || normalized === "work from home") return "working remotely";
    if (location.trim()) return `working from ${location.trim()}`;
    return "";
}

export function positionDetailsParagraph(letter: OfferLetter): string {
    const parts: string[] = [];
    const department = letter.department.trim();
    const position = letter.designation.trim();
    const employmentType = letter.employmentType;
    const locationPhrase = formatWorkLocationPhrase(letter.location);
    const reportingTo = letter.reportingTo.trim();
    const joining = formatJoiningDate(letter.joiningDate);
    const duration = letter.duration.trim();

    if (department && position) {
        parts.push(
            `You will be joining our ${department} department as ${position} on a ${employmentType} basis.`,
        );
    } else if (position) {
        parts.push(`You will be offered the position of ${position} on a ${employmentType} basis.`);
    } else if (department) {
        parts.push(`You will be joining our ${department} department on a ${employmentType} basis.`);
    }

    if (locationPhrase && reportingTo) {
        parts.push(`You will be ${locationPhrase} and reporting to ${reportingTo}.`);
    } else if (locationPhrase) {
        parts.push(`You will be ${locationPhrase}.`);
    } else if (reportingTo) {
        parts.push(`You will be reporting to ${reportingTo}.`);
    }

    if (joining !== "—") {
        parts.push(`Your joining date will be ${joining}.`);
    }

    if (duration) {
        parts.push(`The duration of this engagement is ${duration}.`);
    }

    return parts.join(" ");
}

export function compensationParagraph(letter: OfferLetter): string {
    const salary = formatSalaryDisplay(letter);
    const hours = letter.workingHours.trim() || "9:00 AM - 6:00 PM";

    return [
        `Your compensation will be ${salary}.`,
        `Standard working hours are ${hours}.`,
        `You will be on a probation period of ${letter.probationPeriod}, and the notice period will be ${letter.noticePeriod}.`,
    ].join(" ");
}

export function positionDetailRows(letter: OfferLetter): OfferLetterDetailRow[] {
    const rows: OfferLetterDetailRow[] = [
        { label: "Department", value: letter.department || "—" },
        { label: "Position", value: letter.designation || "—" },
        { label: "Employment Type", value: letter.employmentType.toUpperCase() },
        { label: "Location", value: letter.location || "—" },
        { label: "Reporting To", value: letter.reportingTo || "—" },
        { label: "Joining Date", value: formatJoiningDate(letter.joiningDate) },
    ];
    if (letter.duration.trim()) {
        rows.push({ label: "Duration", value: letter.duration });
    }
    return rows;
}

export function compensationRows(letter: OfferLetter): OfferLetterDetailRow[] {
    return [
        { label: "Salary", value: formatSalaryDisplay(letter) },
        { label: "Working Hours", value: letter.workingHours || "—" },
        { label: "Probation Period", value: letter.probationPeriod },
        { label: "Notice Period", value: letter.noticePeriod },
    ];
}

export function offerLetterDisplayMeta(letter: OfferLetter) {
    const phone = letter.candidatePhone.trim() ? formatOfferPhone(letter.candidatePhone) : "";
    return {
        title: getOfferLetterTitle(letter.offerType),
        ref: letter.offerNumber,
        date: formatOfferDateLong(letter.offerDate),
        salutation: offerSalutation(letter),
        firstName: offerSalutationName(letter.candidateName),
        intro: offerIntroParagraph(letter),
        candidateName: letter.candidateName,
        address: letter.candidateAddress,
        email: letter.candidateEmail,
        phone,
        positionParagraph: positionDetailsParagraph(letter),
        compensationParagraph: compensationParagraph(letter),
        positionRows: positionDetailRows(letter),
        compensationRows: compensationRows(letter),
        benefitsParagraph: benefitsParagraph(letter.benefits),
        benefits: benefitLines(letter.benefits),
        responsibilities: responsibilityLines(letter.keyResponsibilities),
        terms: termsLines(letter.termsAndConditions),
        expiryDate: letter.offerExpiryDate ? formatJoiningDate(letter.offerExpiryDate) : "",
    };
}
