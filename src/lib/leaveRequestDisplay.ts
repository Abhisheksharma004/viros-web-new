export type LeaveRequestStatus =
    | "pending"
    | "l1_approved"
    | "approved"
    | "rejected"
    | "cancelled";

export type LeaveRejectionStage = "l1" | "l2";

/** Which approval stage the request was in when it was rejected. */
export function rejectionStageFromPriorStatus(
    priorStatus: LeaveRequestStatus,
): LeaveRejectionStage | null {
    if (priorStatus === "pending") return "l1";
    if (priorStatus === "l1_approved") return "l2";
    return null;
}

export function rejectionStageLabel(stage: LeaveRejectionStage | null | undefined): string | null {
    return rejectionStageShortLabel(stage);
}

export function rejectionStageShortLabel(
    stage: LeaveRejectionStage | null | undefined,
): string | null {
    if (!stage) return null;
    return stage === "l1" ? "Rejected at L1" : "Rejected at L2";
}

export function formatRejectionDetail(
    stage: LeaveRejectionStage | null | undefined,
    reason: string | null | undefined,
): { stageLine: string | null; reasonLine: string | null } {
    return {
        stageLine: rejectionStageLabel(stage),
        reasonLine: reason?.trim() ? reason.trim() : null,
    };
}

export function statusDisplayLabel(
    status: LeaveRequestStatus,
    rejectedAtStage?: LeaveRejectionStage | null,
): string {
    if (status === "rejected" && rejectedAtStage) {
        return rejectionStageShortLabel(rejectedAtStage) ?? "Rejected";
    }
    switch (status) {
        case "pending":
            return "Pending L1";
        case "l1_approved":
            return "L1 Approved";
        case "approved":
            return "L2 Approved";
        case "rejected":
            return "Rejected";
        case "cancelled":
            return "Cancelled";
        default:
            return status;
    }
}
