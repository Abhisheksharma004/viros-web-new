import type { RowDataPacket } from "mysql2";
import {
    normalizeCurrency,
    normalizeEmploymentType,
    normalizeNoticePeriod,
    normalizeOfferPriority,
    normalizeOfferType,
    normalizeProbationPeriod,
    normalizeSalaryType,
    normalizeOfferLetterStatus,
} from "@/lib/offerLetterConstants";
import type { OfferLetterRecordInput } from "@/lib/adminOfferLetters";

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

export function parseOfferLetterBody(body: Record<string, unknown>): OfferLetterRecordInput | { error: string } {
    const candidateName = str(body.candidate_name ?? body.candidateName);
    const candidateEmail = str(body.candidate_email ?? body.candidateEmail);
    const candidatePhone = str(body.candidate_phone ?? body.candidatePhone);
    const candidateAddress = str(body.candidate_address ?? body.candidateAddress);
    const designation = str(body.designation);
    const department = str(body.department);
    const location = str(body.location);
    const reportingTo = str(body.reporting_to ?? body.reportingTo);
    const joiningDate = optDate(body.joining_date ?? body.joiningDate);
    const compensation = str(body.compensation);
    const subject = str(body.subject);

    if (!candidateName) return { error: "Full name is required" };
    if (!candidateEmail) return { error: "Email is required" };
    if (!candidatePhone) return { error: "Phone is required" };
    if (!candidateAddress) return { error: "Address is required" };
    if (!designation) return { error: "Position is required" };
    if (!department) return { error: "Department is required" };
    if (!location) return { error: "Location is required" };
    if (!reportingTo) return { error: "Reporting to is required" };
    if (!joiningDate) return { error: "Joining date is required" };
    if (!compensation) return { error: "Salary is required" };

    const keyResponsibilities = str(body.key_responsibilities ?? body.keyResponsibilities);
    const termsAndConditions = str(body.terms_and_conditions ?? body.termsAndConditions);
    if (!keyResponsibilities) return { error: "Key responsibilities are required" };
    if (!termsAndConditions) return { error: "Terms & conditions are required" };

    return {
        offer_type: normalizeOfferType(body.offer_type ?? body.offerType),
        priority: normalizeOfferPriority(body.priority),
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        candidate_phone: candidatePhone,
        candidate_address: candidateAddress,
        designation,
        department,
        employment_type: normalizeEmploymentType(body.employment_type ?? body.employmentType),
        location,
        reporting_to: reportingTo,
        joining_date: joiningDate,
        compensation,
        salary_type: normalizeSalaryType(body.salary_type ?? body.salaryType),
        currency: normalizeCurrency(body.currency),
        working_hours: optStr(body.working_hours ?? body.workingHours) ?? "9:00 AM - 6:00 PM",
        probation_period: normalizeProbationPeriod(body.probation_period ?? body.probationPeriod),
        notice_period: normalizeNoticePeriod(body.notice_period ?? body.noticePeriod),
        duration: optStr(body.duration),
        offer_expiry_date: optDate(body.offer_expiry_date ?? body.offerExpiryDate),
        benefits: optContent(body.benefits),
        key_responsibilities: keyResponsibilities,
        terms_and_conditions: termsAndConditions,
        subject: subject || "Offer of Employment",
        content: optContent(body.content),
        offer_date: optDate(body.offer_date ?? body.offerDate),
        status: normalizeOfferLetterStatus(body.status),
        notes: optStr(body.notes ?? body.internalNotes),
        created_by: optStr(body.created_by ?? body.createdBy),
    };
}

export function mapOfferLetterRow(row: RowDataPacket) {
    return {
        id: row.id,
        offer_number: typeof row.offer_number === "string" ? row.offer_number : "",
        offer_type: normalizeOfferType(row.offer_type),
        priority: normalizeOfferPriority(row.priority),
        candidate_name: typeof row.candidate_name === "string" ? row.candidate_name : "",
        candidate_email: typeof row.candidate_email === "string" ? row.candidate_email : "",
        candidate_phone: typeof row.candidate_phone === "string" ? row.candidate_phone : "",
        candidate_address: typeof row.candidate_address === "string" ? row.candidate_address : "",
        designation: typeof row.designation === "string" ? row.designation : "",
        department: typeof row.department === "string" ? row.department : "",
        employment_type: normalizeEmploymentType(row.employment_type),
        location: typeof row.location === "string" ? row.location : "",
        reporting_to: typeof row.reporting_to === "string" ? row.reporting_to : "",
        joining_date: row.joining_date ? String(row.joining_date).slice(0, 10) : null,
        compensation: typeof row.compensation === "string" ? row.compensation : "",
        salary_type: normalizeSalaryType(row.salary_type),
        currency: normalizeCurrency(row.currency),
        working_hours: typeof row.working_hours === "string" ? row.working_hours : "9:00 AM - 6:00 PM",
        probation_period: normalizeProbationPeriod(row.probation_period),
        notice_period: normalizeNoticePeriod(row.notice_period),
        duration: typeof row.duration === "string" ? row.duration : "",
        offer_expiry_date: row.offer_expiry_date ? String(row.offer_expiry_date).slice(0, 10) : null,
        benefits: typeof row.benefits === "string" ? row.benefits : "",
        key_responsibilities: typeof row.key_responsibilities === "string" ? row.key_responsibilities : "",
        terms_and_conditions: typeof row.terms_and_conditions === "string" ? row.terms_and_conditions : "",
        subject: typeof row.subject === "string" ? row.subject : "",
        content: typeof row.content === "string" ? row.content : "",
        status: normalizeOfferLetterStatus(row.status),
        offer_date: row.offer_date ? String(row.offer_date).slice(0, 10) : null,
        notes: typeof row.notes === "string" ? row.notes : "",
        created_by: typeof row.created_by === "string" ? row.created_by : "",
        created_at: row.created_at ? String(row.created_at) : "",
        updated_at: row.updated_at ? String(row.updated_at) : "",
    };
}
