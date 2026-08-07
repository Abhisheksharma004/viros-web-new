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
    max_days_per_month?: number;
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

export type ExistingLeaveRequestForValidation = {
    id?: number;
    policy_id?: number;
    policy_code?: string;
    days?: number;
    day_type?: LeaveDayType;
    start_date: string;
    end_date: string;
    status: string;
};

export type ValidateLeaveInput = {
    policy: LeavePolicyForValidation & { id?: number; code?: string; days_per_year?: number };
    settings: LeaveSettingsForValidation;
    joiningDate: string | null;
    startDate: string;
    endDate: string;
    dayType: LeaveDayType;
    requestedDays: number;
    balanceRemaining: number;
    existingRequests: ExistingLeaveRequestForValidation[];
    attachmentName?: string;
    reason?: string;
    currentRequestId?: number;
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
    options?: { weekdaysOnly?: boolean; excludeWeekends?: boolean; workingDays?: number[] },
) {
    if (!from || !to) return 0;
    const start = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    const workingDaysSet = options?.workingDays?.length ? new Set(options.workingDays) : null;

    let total = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const dayOfWeek = cur.getDay();
        const isSundayBetween = dayOfWeek === 0 && cur > start && cur < end;
        const isOffDay = workingDaysSet ? !workingDaysSet.has(dayOfWeek) : isWeekend(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`);
        
        let skip =
            (options?.weekdaysOnly && isOffDay) || (options?.excludeWeekends && isOffDay);
        
        if (isSundayBetween) {
            skip = false;
        }

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
        currentRequestId,
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

    if (policy.max_consecutive_days > 0 && requestedDays > policy.max_consecutive_days) {
        errors.push(
            `Maximum ${policy.max_consecutive_days} consecutive day(s) allowed for this leave type.`,
        );
    }

    if (policy.max_days_per_request > 0 && requestedDays > policy.max_days_per_request) {
        errors.push(
            `Maximum ${policy.max_days_per_request} day(s) per request for this leave type.`,
        );
    }

    if (requestedDays < policy.min_days_per_request) {
        errors.push(
            `Minimum ${policy.min_days_per_request} day(s) per request for this leave type.`,
        );
    }

    // -------------------------------------------------------------
    // CUMULATIVE LEAVE USAGE VALIDATION (Strict 2 Days Per Month Limit)
    // -------------------------------------------------------------
    const startMonth = startDate.slice(0, 7); // e.g. "2026-08"

    const getRequestDays = (r: ExistingLeaveRequestForValidation) => {
        if (typeof r.days === "number" && r.days > 0) return r.days;
        return countLeaveDays(r.start_date, r.end_date, r.day_type || "full", {
            weekdaysOnly: policy.weekdays_only,
            excludeWeekends: !settings.count_weekends_in_leave,
        });
    };

    // 1. Total monthly leave across all active requests for the same month
    const allActiveMonthlyRequests = (existingRequests || []).filter((r) => {
        if (currentRequestId && r.id === currentRequestId) return false;
        if (r.status === "cancelled" || r.status === "rejected") return false;
        return r.start_date && r.start_date.slice(0, 7) === startMonth;
    });

    const totalUsedInMonth = Math.round(
        allActiveMonthlyRequests.reduce((sum, r) => sum + getRequestDays(r), 0) * 100
    ) / 100;

    // Monthly leave limit validation: 0 means no limit
    let maxAllowedLeavesPerMonth = 0;
    if (typeof policy.max_days_per_month === "number" && policy.max_days_per_month > 0) {
        maxAllowedLeavesPerMonth = policy.max_days_per_month;
    } else if (
        policy.accrual_cycle === "monthly" &&
        typeof policy.days_per_year === "number" &&
        policy.days_per_year > 0
    ) {
        maxAllowedLeavesPerMonth = Math.round((policy.days_per_year / 12) * 100) / 100;
    }

    if (maxAllowedLeavesPerMonth > 0) {
        const totalMonthlyCombined = Math.round((totalUsedInMonth + requestedDays) * 100) / 100;
        if (totalMonthlyCombined > maxAllowedLeavesPerMonth) {
            if (totalUsedInMonth >= maxAllowedLeavesPerMonth) {
                errors.push(
                    `You have already used ${totalUsedInMonth} of ${maxAllowedLeavesPerMonth} allowed leaves for this month. You cannot apply for additional leave.`,
                );
            } else {
                const maxAvailableMonth = Math.max(
                    0,
                    Math.round((maxAllowedLeavesPerMonth - totalUsedInMonth) * 100) / 100,
                );
                errors.push(
                    `You have already used ${totalUsedInMonth} of ${maxAllowedLeavesPerMonth} allowed leaves for this month. You cannot apply for ${requestedDays} additional day(s) (maximum ${maxAvailableMonth} day(s) remaining for this month).`,
                );
            }
        }
    }

    // --- Yearly Period Validation ---
    const startYear = startDate.slice(0, 4); // YYYY
    const yearlyRequests = (existingRequests || []).filter((r) => {
        if (currentRequestId && r.id === currentRequestId) return false;
        if (r.status === "cancelled" || r.status === "rejected") return false;
        if (policy.id !== undefined && r.policy_id !== undefined && r.policy_id !== policy.id) return false;
        return r.start_date && r.start_date.slice(0, 4) === startYear;
    });

    const alreadyUsedInYear =
        Math.round(yearlyRequests.reduce((sum, r) => sum + getRequestDays(r), 0) * 100) / 100;

    let yearlyAllowedLimit = 0;
    if (
        policy.accrual_cycle !== "none" &&
        typeof policy.days_per_year === "number" &&
        policy.days_per_year > 0
    ) {
        yearlyAllowedLimit = Number(policy.days_per_year);
    }

    if (yearlyAllowedLimit > 0) {
        const totalYearlyDays = Math.round((alreadyUsedInYear + requestedDays) * 100) / 100;
        if (totalYearlyDays > yearlyAllowedLimit) {
            if (alreadyUsedInYear >= yearlyAllowedLimit) {
                errors.push(
                    `You have already used ${alreadyUsedInYear} of ${yearlyAllowedLimit} allowed leaves for this year. You cannot apply for additional leave.`,
                );
            } else {
                const maxAvailableYear = Math.max(
                    0,
                    Math.round((yearlyAllowedLimit - alreadyUsedInYear) * 100) / 100,
                );
                errors.push(
                    `You have already used ${alreadyUsedInYear} of ${yearlyAllowedLimit} allowed leaves for this year. You cannot apply for ${requestedDays} additional day(s) (maximum ${maxAvailableYear} day(s) remaining for this year).`,
                );
            }
        }
    }

    // Remaining Balance Cap Check
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

    // Max Requests Count Limits
    if (policy.max_requests_per_month > 0) {
        if (allActiveMonthlyRequests.length >= policy.max_requests_per_month) {
            errors.push(
                `Maximum ${policy.max_requests_per_month} request(s) per month for this leave type.`,
            );
        }
    }

    if (policy.max_requests_per_year > 0) {
        if (yearlyRequests.length >= policy.max_requests_per_year) {
            errors.push(
                `Maximum ${policy.max_requests_per_year} request(s) per year for this leave type.`,
            );
        }
    }

    if (policy.min_gap_days_between_requests > 0) {
        const last = allActiveMonthlyRequests.find(
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
