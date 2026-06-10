export const OFFER_LETTER_STATUSES = ["Draft", "Sent", "Approved", "Rejected", "Expired"] as const;
export type OfferLetterStatus = (typeof OFFER_LETTER_STATUSES)[number];

export const OFFER_TYPES = ["Job", "Internship", "Contract", "Consultant"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type OfferPriority = (typeof OFFER_PRIORITIES)[number];

export const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const SALARY_TYPES = ["Monthly", "Annual", "Hourly"] as const;
export type SalaryType = (typeof SALARY_TYPES)[number];

export const CURRENCIES = ["INR", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PROBATION_PERIODS = ["1 month", "3 months", "6 months", "No probation"] as const;
export type ProbationPeriod = (typeof PROBATION_PERIODS)[number];

export const NOTICE_PERIODS = ["15 days", "1 month", "2 months", "3 months"] as const;
export type NoticePeriod = (typeof NOTICE_PERIODS)[number];

export const WORK_LOCATIONS = ["New Delhi", "Mumbai", "Bangalore", "Hyderabad", "Remote", "On-site"] as const;

export function normalizeOfferLetterStatus(raw: unknown): OfferLetterStatus {
    return OFFER_LETTER_STATUSES.includes(raw as OfferLetterStatus) ? (raw as OfferLetterStatus) : "Draft";
}

export function normalizeOfferType(raw: unknown): OfferType {
    return OFFER_TYPES.includes(raw as OfferType) ? (raw as OfferType) : "Job";
}

export function normalizeOfferPriority(raw: unknown): OfferPriority {
    return OFFER_PRIORITIES.includes(raw as OfferPriority) ? (raw as OfferPriority) : "Medium";
}

export function normalizeEmploymentType(raw: unknown): EmploymentType {
    return EMPLOYMENT_TYPES.includes(raw as EmploymentType) ? (raw as EmploymentType) : "Full Time";
}

export function normalizeSalaryType(raw: unknown): SalaryType {
    return SALARY_TYPES.includes(raw as SalaryType) ? (raw as SalaryType) : "Monthly";
}

export function normalizeCurrency(raw: unknown): Currency {
    return CURRENCIES.includes(raw as Currency) ? (raw as Currency) : "INR";
}

export function normalizeProbationPeriod(raw: unknown): ProbationPeriod {
    return PROBATION_PERIODS.includes(raw as ProbationPeriod) ? (raw as ProbationPeriod) : "3 months";
}

export function normalizeNoticePeriod(raw: unknown): NoticePeriod {
    return NOTICE_PERIODS.includes(raw as NoticePeriod) ? (raw as NoticePeriod) : "1 month";
}

export function previewOfferNumber(date = new Date()): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `JITOFFER${mm}${yy}000`;
}
