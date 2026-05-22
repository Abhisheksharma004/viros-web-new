export type LeaveDayType = "full" | "first-half" | "second-half";

export type LeavePolicyForValidation = {
    allow_backdated_leave: boolean;
    min_notice_days: number;
    max_advance_booking_days: number;
    all_months_applicable: boolean;
    applicable_months: number[];
    applicable_from_joining: boolean;
    months_after_joining: number;
    half_day_allowed: boolean;
    max_consecutive_days: number;
    max_days_per_request: number;
    min_days_per_request: number;
    accrual_cycle: string;
    enforce_remaining_balance_cap: boolean;
    must_use_full_balance_when_low: boolean;
    full_balance_threshold_days: number;
    document_required: boolean;
    max_requests_per_month: number;
    max_requests_per_year: number;
    min_gap_days_between_requests: number;
    weekdays_only: boolean;
};

export type LeaveSettingsForValidation = {
    default_min_notice_days: number;
    allow_half_day: boolean;
    count_weekends_in_leave: boolean;
};

export type ValidateLeaveInput = {
    policy: LeavePolicyForValidation;
    settings: LeaveSettingsForValidation;
    joiningDate: string | null;
    startDate: string;
    endDate: string;
    dayType: LeaveDayType;
    requestedDays: number;
    balanceRemaining: number;
    existingRequests: {
        start_date: string;
        end_date: string;
        status: string;
    }[];
    attachmentName?: string;
    reason?: string;
};

function isoToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(iso: string, days: number) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekend(iso: string) {
    const day = new Date(iso + "T12:00:00").getDay();
    return day === 0 || day === 6;
}

export function countLeaveDays(
    from: string,
    to: string,
    dayType: LeaveDayType,
    options?: { weekdaysOnly?: boolean; excludeWeekends?: boolean },
) {
    if (!from || !to) return 0;
    const start = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    let total = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        const weekend = isWeekend(iso);
        const skip =
            (options?.weekdaysOnly && weekend) || (options?.excludeWeekends && weekend);
        if (!skip) total += 1;
        cur.setDate(cur.getDate() + 1);
    }

    if (dayType === "full") return total;
    return total === 1 ? 0.5 : total;
}

function isMonthApplicable(policy: LeavePolicyForValidation, startDate: string) {
    if (policy.all_months_applicable) return true;
    const month = new Date(startDate + "T12:00:00").getMonth() + 1;
    return policy.applicable_months.includes(month);
}

function isJoiningEligible(
    policy: LeavePolicyForValidation,
    joiningDate: string | null,
    startDate: string,
) {
    if (!policy.applicable_from_joining) return true;
    if (!joiningDate) return false;
    const join = new Date(joiningDate + "T12:00:00");
    const eligible = new Date(join);
    eligible.setMonth(eligible.getMonth() + policy.months_after_joining);
    const start = new Date(startDate + "T12:00:00");
    return start >= eligible;
}

/** Returns every validation message that applies (client-safe, no DB). */
export function collectLeaveRequestErrors(input: ValidateLeaveInput): string[] {
    const {
        policy,
        settings,
        joiningDate,
        startDate,
        endDate,
        dayType,
        requestedDays,
        balanceRemaining,
        existingRequests,
        attachmentName,
        reason,
    } = input;

    const errors: string[] = [];
    const today = isoToday();

    if (!reason?.trim()) {
        errors.push("Reason is required.");
    }

    if (!startDate || !endDate) {
        errors.push("Please select both start and end dates.");
        return errors;
    }

    if (endDate < startDate) {
        errors.push("End date cannot be before start date.");
    }

    if (!policy.allow_backdated_leave && startDate < today) {
        errors.push("This leave type does not allow backdated applications.");
    }

    const minNotice = policy.min_notice_days || settings.default_min_notice_days;
    const earliest = addDays(today, minNotice);
    if (!policy.allow_backdated_leave && startDate < earliest) {
        errors.push(`Apply at least ${minNotice} day(s) before leave starts.`);
    }

    if (policy.max_advance_booking_days > 0) {
        const latest = addDays(today, policy.max_advance_booking_days);
        if (startDate > latest) {
            errors.push(
                `Leave can only be booked up to ${policy.max_advance_booking_days} days in advance.`,
            );
        }
    }

    if (!isMonthApplicable(policy, startDate)) {
        errors.push("This leave type is not applicable for the selected month.");
    }

    if (!isJoiningEligible(policy, joiningDate, startDate)) {
        errors.push(
            `This leave is available only after ${policy.months_after_joining} month(s) from your joining date.`,
        );
    }

    if (dayType !== "full") {
        if (!settings.allow_half_day || !policy.half_day_allowed) {
            errors.push("Half-day leave is not allowed for this leave type.");
        }
        if (startDate !== endDate) {
            errors.push("Half-day leave must be for a single date only.");
        }
    }

    if (requestedDays <= 0) {
        errors.push("Invalid date range or no working days in selection.");
    }

    if (requestedDays > policy.max_consecutive_days) {
        errors.push(
            `Maximum ${policy.max_consecutive_days} consecutive day(s) allowed for this leave type.`,
        );
    }

    if (requestedDays > policy.max_days_per_request) {
        errors.push(
            `Maximum ${policy.max_days_per_request} day(s) per request for this leave type.`,
        );
    }

    if (requestedDays < policy.min_days_per_request) {
        errors.push(
            `Minimum ${policy.min_days_per_request} day(s) per request for this leave type.`,
        );
    }

    if (policy.accrual_cycle !== "none" && policy.enforce_remaining_balance_cap) {
        if (requestedDays > balanceRemaining) {
            errors.push(`You only have ${balanceRemaining} day(s) remaining for this leave type.`);
        }
    }

    if (
        policy.must_use_full_balance_when_low &&
        balanceRemaining > 0 &&
        balanceRemaining <= policy.full_balance_threshold_days &&
        requestedDays !== balanceRemaining
    ) {
        errors.push(`You must apply for exactly ${balanceRemaining} day(s) (remaining balance).`);
    }

    if (policy.document_required && !attachmentName?.trim()) {
        errors.push("An attachment is required for this leave type.");
    }

    if (policy.max_requests_per_month > 0) {
        const startMonth = startDate.slice(0, 7);
        const count = existingRequests.filter(
            (r) =>
                r.status !== "cancelled" &&
                r.status !== "rejected" &&
                r.start_date.slice(0, 7) === startMonth,
        ).length;
        if (count >= policy.max_requests_per_month) {
            errors.push(
                `Maximum ${policy.max_requests_per_month} request(s) per month for this leave type.`,
            );
        }
    }

    if (policy.max_requests_per_year > 0) {
        const count = existingRequests.filter(
            (r) => r.status !== "cancelled" && r.status !== "rejected",
        ).length;
        if (count >= policy.max_requests_per_year) {
            errors.push(
                `Maximum ${policy.max_requests_per_year} request(s) per year for this leave type.`,
            );
        }
    }

    if (policy.min_gap_days_between_requests > 0) {
        const last = existingRequests.find(
            (r) =>
                r.status === "pending" ||
                r.status === "l1_approved" ||
                r.status === "approved",
        );
        if (last) {
            const gapEnd = addDays(last.end_date, policy.min_gap_days_between_requests);
            if (startDate <= gapEnd) {
                errors.push(
                    `Wait at least ${policy.min_gap_days_between_requests} day(s) after your last leave.`,
                );
            }
        }
    }

    return errors;
}

export function validateLeaveRequest(input: ValidateLeaveInput): string | null {
    const errors = collectLeaveRequestErrors(input);
    return errors[0] ?? null;
}
