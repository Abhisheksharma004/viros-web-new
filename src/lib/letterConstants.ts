export const LETTER_STATUSES = ["Draft", "Sent", "Approved", "Rejected", "Expired"] as const;
export type LetterStatus = (typeof LETTER_STATUSES)[number];

export function normalizeLetterStatus(raw: unknown): LetterStatus {
    return LETTER_STATUSES.includes(raw as LetterStatus) ? (raw as LetterStatus) : "Draft";
}
