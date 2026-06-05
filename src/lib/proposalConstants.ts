export const PROPOSAL_STATUSES = ["Draft", "Sent", "Approved", "Rejected", "Expired"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export function normalizeProposalStatus(raw: unknown): ProposalStatus {
    return PROPOSAL_STATUSES.includes(raw as ProposalStatus) ? (raw as ProposalStatus) : "Draft";
}
