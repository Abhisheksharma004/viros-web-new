import {
    CURRENCIES,
    EMPLOYMENT_TYPES,
    NOTICE_PERIODS,
    OFFER_PRIORITIES,
    OFFER_TYPES,
    PROBATION_PERIODS,
    SALARY_TYPES,
    normalizeCurrency,
    normalizeEmploymentType,
    normalizeNoticePeriod,
    normalizeOfferPriority,
    normalizeOfferType,
    normalizeProbationPeriod,
    normalizeSalaryType,
    OFFER_LETTER_STATUSES,
    type Currency,
    type EmploymentType,
    type NoticePeriod,
    type OfferLetterStatus,
    type OfferPriority,
    type OfferType,
    type ProbationPeriod,
    type SalaryType,
    normalizeOfferLetterStatus,
} from "@/lib/offerLetterConstants";

export const DEFAULT_OFFER_LETTER_SUBJECT = "Offer of Employment";

export const DEFAULT_BENEFITS = "Health Insurance\nPaid Leave\nProfessional Development";

function linesToMarkdownBullets(text: string): string {
    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join("\n");
}

function linesToMarkdownParagraphs(text: string): string {
    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n\n");
}

export function buildOfferLetterContent(
    form: Pick<
        OfferLetterFormValues,
        | "designation"
        | "department"
        | "joiningDate"
        | "compensation"
        | "salaryType"
        | "currency"
        | "location"
        | "employmentType"
        | "reportingTo"
        | "workingHours"
        | "probationPeriod"
        | "noticePeriod"
        | "duration"
        | "offerExpiryDate"
        | "benefits"
        | "keyResponsibilities"
        | "termsAndConditions"
    >,
): string {
    const salaryLine =
        form.compensation.trim() !== ""
            ? `${form.currency} ${form.compensation} (${form.salaryType})`
            : "[Enter salary]";
    const joining = form.joiningDate || "[Enter joining date]";
    const expiry = form.offerExpiryDate || "[Enter expiry date]";
    const benefitsBlock = form.benefits.trim()
        ? `## Benefits\n\n${linesToMarkdownBullets(form.benefits)}\n`
        : "";
    const responsibilitiesBlock = form.keyResponsibilities.trim()
        ? `## Key Responsibilities\n\n${linesToMarkdownParagraphs(form.keyResponsibilities)}\n`
        : "";
    const termsBlock = form.termsAndConditions.trim()
        ? `${linesToMarkdownParagraphs(form.termsAndConditions)}\n`
        : "";

    return `We are pleased to offer you employment with **VIROS ENTREPRENEURS, IT Solutions Private Limited** on the following terms and conditions:

## Position Details

| Particulars | Details |
| --- | --- |
| Position | ${form.designation || "[Enter position]"} |
| Department | ${form.department || "[Enter department]"} |
| Employment Type | ${form.employmentType} |
| Reporting To | ${form.reportingTo || "[Enter manager name]"} |
| Date of Joining | ${joining} |
| Compensation | ${salaryLine} |
| Work Location | ${form.location || "New Delhi"} |
| Working Hours | ${form.workingHours} |
${form.duration.trim() ? `| Duration | ${form.duration} |\n` : ""}
${benefitsBlock}${responsibilitiesBlock}## Terms & Conditions

${termsBlock}- You will be on probation for a period of **${form.probationPeriod}** from your date of joining.
- Notice period: **${form.noticePeriod}**.
- Your employment will be subject to satisfactory verification of documents and references.
- Either party may terminate employment by giving notice as per company policy.
- You shall abide by all company rules, policies, and code of conduct.
- This offer is valid until **${expiry}**.

Please sign and return a copy of this letter as confirmation of your acceptance of this offer.

We look forward to welcoming you to our team.`;
}

export type OfferLetter = {
    id: number;
    offerNumber: string;
    offerType: OfferType;
    priority: OfferPriority;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    candidateAddress: string;
    designation: string;
    department: string;
    employmentType: EmploymentType;
    location: string;
    reportingTo: string;
    joiningDate: string | null;
    compensation: string;
    salaryType: SalaryType;
    currency: Currency;
    workingHours: string;
    probationPeriod: ProbationPeriod;
    noticePeriod: NoticePeriod;
    duration: string;
    offerExpiryDate: string | null;
    benefits: string;
    keyResponsibilities: string;
    termsAndConditions: string;
    subject: string;
    content: string;
    offerDate: string | null;
    status: OfferLetterStatus;
    internalNotes: string;
    createdBy: string;
    createdAt: string;
};

export type OfferLetterApiRow = {
    id: number | string | null | undefined;
    offer_number?: string | null;
    offer_type?: string | null;
    priority?: string | null;
    candidate_name?: string | null;
    candidate_email?: string | null;
    candidate_phone?: string | null;
    candidate_address?: string | null;
    designation?: string | null;
    department?: string | null;
    employment_type?: string | null;
    location?: string | null;
    reporting_to?: string | null;
    joining_date?: string | null;
    compensation?: string | null;
    salary_type?: string | null;
    currency?: string | null;
    working_hours?: string | null;
    probation_period?: string | null;
    notice_period?: string | null;
    duration?: string | null;
    offer_expiry_date?: string | null;
    benefits?: string | null;
    key_responsibilities?: string | null;
    terms_and_conditions?: string | null;
    subject?: string | null;
    content?: string | null;
    offer_date?: string | null;
    status?: string | null;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string | null;
};

export type OfferLetterFormValues = {
    offerType: OfferType;
    priority: OfferPriority;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    candidateAddress: string;
    designation: string;
    department: string;
    employmentType: EmploymentType;
    location: string;
    reportingTo: string;
    joiningDate: string;
    compensation: string;
    salaryType: SalaryType;
    currency: Currency;
    workingHours: string;
    probationPeriod: ProbationPeriod;
    noticePeriod: NoticePeriod;
    duration: string;
    offerExpiryDate: string;
    offerDate: string;
    benefits: string;
    keyResponsibilities: string;
    termsAndConditions: string;
    status: OfferLetterStatus;
    internalNotes: string;
};

export const EMPTY_OFFER_LETTER_FORM: OfferLetterFormValues = {
    offerType: "Job",
    priority: "Medium",
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidateAddress: "",
    designation: "",
    department: "",
    employmentType: "Full Time",
    location: "New Delhi",
    reportingTo: "",
    joiningDate: "",
    compensation: "",
    salaryType: "Monthly",
    currency: "INR",
    workingHours: "9:00 AM - 6:00 PM",
    probationPeriod: "3 months",
    noticePeriod: "1 month",
    duration: "",
    offerExpiryDate: "",
    offerDate: "",
    benefits: DEFAULT_BENEFITS,
    keyResponsibilities: "",
    termsAndConditions: "",
    status: "Draft",
    internalNotes: "",
};

export function normalizeStatus(raw: string | undefined | null): OfferLetterStatus {
    return normalizeOfferLetterStatus(raw);
}

export function mapApiRow(row: OfferLetterApiRow): OfferLetter {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    const mapped: OfferLetter = {
        id: Number.isFinite(id) ? id : 0,
        offerNumber: typeof row.offer_number === "string" ? row.offer_number : "",
        offerType: normalizeOfferType(row.offer_type),
        priority: normalizeOfferPriority(row.priority),
        candidateName: typeof row.candidate_name === "string" ? row.candidate_name : "",
        candidateEmail: typeof row.candidate_email === "string" ? row.candidate_email : "",
        candidatePhone: typeof row.candidate_phone === "string" ? row.candidate_phone : "",
        candidateAddress: typeof row.candidate_address === "string" ? row.candidate_address : "",
        designation: typeof row.designation === "string" ? row.designation : "",
        department: typeof row.department === "string" ? row.department : "",
        employmentType: normalizeEmploymentType(row.employment_type),
        location: typeof row.location === "string" ? row.location : "",
        reportingTo: typeof row.reporting_to === "string" ? row.reporting_to : "",
        joiningDate: row.joining_date ? String(row.joining_date).slice(0, 10) : null,
        compensation: typeof row.compensation === "string" ? row.compensation : "",
        salaryType: normalizeSalaryType(row.salary_type),
        currency: normalizeCurrency(row.currency),
        workingHours: typeof row.working_hours === "string" ? row.working_hours : "9:00 AM - 6:00 PM",
        probationPeriod: normalizeProbationPeriod(row.probation_period),
        noticePeriod: normalizeNoticePeriod(row.notice_period),
        duration: typeof row.duration === "string" ? row.duration : "",
        offerExpiryDate: row.offer_expiry_date ? String(row.offer_expiry_date).slice(0, 10) : null,
        benefits: typeof row.benefits === "string" ? row.benefits : "",
        keyResponsibilities: typeof row.key_responsibilities === "string" ? row.key_responsibilities : "",
        termsAndConditions: typeof row.terms_and_conditions === "string" ? row.terms_and_conditions : "",
        subject: typeof row.subject === "string" ? row.subject : DEFAULT_OFFER_LETTER_SUBJECT,
        content: typeof row.content === "string" ? row.content : "",
        offerDate: row.offer_date ? String(row.offer_date).slice(0, 10) : null,
        status: normalizeStatus(row.status ?? undefined),
        internalNotes: typeof row.notes === "string" ? row.notes : "",
        createdBy: typeof row.created_by === "string" ? row.created_by : "",
        createdAt: typeof row.created_at === "string" ? row.created_at : "",
    };

    if (!mapped.content.trim()) {
        mapped.content = buildOfferLetterContent({
            designation: mapped.designation,
            department: mapped.department,
            joiningDate: mapped.joiningDate ?? "",
            compensation: mapped.compensation,
            salaryType: mapped.salaryType,
            currency: mapped.currency,
            location: mapped.location,
            employmentType: mapped.employmentType,
            reportingTo: mapped.reportingTo,
            workingHours: mapped.workingHours,
            probationPeriod: mapped.probationPeriod,
            noticePeriod: mapped.noticePeriod,
            duration: mapped.duration,
            offerExpiryDate: mapped.offerExpiryDate ?? "",
            benefits: mapped.benefits,
            keyResponsibilities: mapped.keyResponsibilities,
            termsAndConditions: mapped.termsAndConditions,
        });
    }

    return mapped;
}

export function offerLetterToFormValues(o: OfferLetter): OfferLetterFormValues {
    return {
        offerType: o.offerType,
        priority: o.priority,
        candidateName: o.candidateName,
        candidateEmail: o.candidateEmail,
        candidatePhone: o.candidatePhone,
        candidateAddress: o.candidateAddress,
        designation: o.designation,
        department: o.department,
        employmentType: o.employmentType,
        location: o.location,
        reportingTo: o.reportingTo,
        joiningDate: o.joiningDate ?? "",
        compensation: o.compensation,
        salaryType: o.salaryType,
        currency: o.currency,
        workingHours: o.workingHours,
        probationPeriod: o.probationPeriod,
        noticePeriod: o.noticePeriod,
        duration: o.duration,
        offerExpiryDate: o.offerExpiryDate ?? "",
        offerDate: o.offerDate ?? "",
        benefits: o.benefits || DEFAULT_BENEFITS,
        keyResponsibilities: o.keyResponsibilities,
        termsAndConditions: o.termsAndConditions,
        status: o.status,
        internalNotes: o.internalNotes,
    };
}

export function formValuesToApiBody(form: OfferLetterFormValues) {
    return {
        offer_type: form.offerType,
        priority: form.priority,
        candidate_name: form.candidateName.trim(),
        candidate_email: form.candidateEmail.trim(),
        candidate_phone: form.candidatePhone.trim(),
        candidate_address: form.candidateAddress.trim(),
        designation: form.designation.trim(),
        department: form.department.trim(),
        employment_type: form.employmentType,
        location: form.location.trim(),
        reporting_to: form.reportingTo.trim(),
        joining_date: form.joiningDate.trim() || undefined,
        compensation: form.compensation.trim(),
        salary_type: form.salaryType,
        currency: form.currency,
        working_hours: form.workingHours.trim(),
        probation_period: form.probationPeriod,
        notice_period: form.noticePeriod,
        duration: form.duration.trim() || undefined,
        offer_expiry_date: form.offerExpiryDate.trim() || undefined,
        offer_date: form.offerDate.trim() || undefined,
        benefits: form.benefits.trim() || undefined,
        key_responsibilities: form.keyResponsibilities.trim(),
        terms_and_conditions: form.termsAndConditions.trim(),
        subject: DEFAULT_OFFER_LETTER_SUBJECT,
        content: buildOfferLetterContent(form),
        status: form.status,
        notes: form.internalNotes.trim() || undefined,
    };
}

export function formatOfferLetterDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function offerLetterStatusStyles(status: OfferLetterStatus): string {
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

export const OFFER_LETTER_INPUT_CLASS =
    "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20";

export {
    CURRENCIES,
    EMPLOYMENT_TYPES,
    NOTICE_PERIODS,
    OFFER_PRIORITIES,
    OFFER_TYPES,
    PROBATION_PERIODS,
    SALARY_TYPES,
    OFFER_LETTER_STATUSES,
};
