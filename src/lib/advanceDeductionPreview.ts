"use client";

export type AdvancePaymentStatus = "pending" | "recovering" | "recovered" | "cancelled";

const PAYROLL_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export function parsePayrollMonth(value: unknown): string {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().slice(0, 7);
    return PAYROLL_MONTH_PATTERN.test(trimmed) ? trimmed : "";
}

export function isPayrollMonthOnOrAfterRecoveryStart(
    recoveryStartMonth: string | null | undefined,
    payrollMonth: string,
): boolean {
    const month = parsePayrollMonth(payrollMonth);
    const start = (recoveryStartMonth ?? "").trim().slice(0, 7);
    if (!month || !PAYROLL_MONTH_PATTERN.test(start)) return false;
    return month >= start;
}

function monthsBetweenInclusive(startYm: string, endYm: string): number {
    const [sy, sm] = startYm.split("-").map(Number);
    const [ey, em] = endYm.split("-").map(Number);
    if (!sy || !sm || !ey || !em) return 0;
    return (ey - sy) * 12 + (em - sm) + 1;
}

export type AdvanceDeductionPreviewRow = {
    employee_id: string;
    amount: number;
    recovered_amount: number;
    recovery_start_month: string;
    monthly_deduction: number;
    emi_months: number;
    status: AdvancePaymentStatus;
};

/** Planned advance deduction for payroll month (0 before recovery start month). */
export function computeAdvanceDeductionForPayrollMonth(
    advances: AdvanceDeductionPreviewRow[],
    employeeId: string,
    payrollMonth: string,
): number {
    const month = parsePayrollMonth(payrollMonth);
    if (!month) return 0;

    let total = 0;
    const empKey = employeeId.trim().toUpperCase();

    for (const row of advances) {
        if (row.employee_id.trim().toUpperCase() !== empKey) continue;
        if (row.status === "cancelled" || row.status === "recovered") continue;
        if (!isPayrollMonthOnOrAfterRecoveryStart(row.recovery_start_month, month)) continue;

        const remaining = roundMoney(
            Math.max(0, Number(row.amount) - Number(row.recovered_amount)),
        );
        const monthlyDeduction = Number(row.monthly_deduction) || 0;
        if (remaining <= 0 || monthlyDeduction <= 0) continue;

        const emiMonths = Number(row.emi_months) || 0;
        if (emiMonths > 0) {
            const start = row.recovery_start_month.trim().slice(0, 7);
            const monthsElapsed = monthsBetweenInclusive(start, month);
            if (monthsElapsed > emiMonths) continue;
        }

        total = roundMoney(total + Math.min(monthlyDeduction, remaining));
    }

    return total;
}

