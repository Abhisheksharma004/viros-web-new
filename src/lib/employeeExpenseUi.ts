import type { AdminBatchReviewStatus, ExpenseStatus } from "@/lib/employeeExpenses";

export function formatExpenseDate(iso: string) {
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatExpenseDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatCurrencyWhole(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Payable amount after approval; null when not approved. Client-safe (no DB imports). */
export function resolveExpenseApprovedAmount(row: {
    status: ExpenseStatus;
    amount: number;
    approved_amount: number | null;
}): number | null {
    if (row.status !== "approved") return null;
    return row.approved_amount ?? row.amount;
}

export function isPartialExpenseApproval(row: {
    status: ExpenseStatus;
    amount: number;
    approved_amount: number | null;
}) {
    if (row.status !== "approved") return false;
    const approved = resolveExpenseApprovedAmount(row) ?? row.amount;
    return Math.abs(approved - row.amount) > 0.001;
}

export function isEmployeeEditableExpenseStatus(status: ExpenseStatus) {
    return status === "draft" || status === "rework";
}

export function getExpenseStatusStyles(status: ExpenseStatus) {
    switch (status) {
        case "approved":
            return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15";
        case "rejected":
            return "bg-red-50 text-red-800 ring-1 ring-red-600/15";
        case "draft":
            return "bg-slate-100 text-slate-700 ring-1 ring-slate-300/50";
        case "rework":
            return "bg-orange-50 text-orange-900 ring-1 ring-orange-500/25";
        default:
            return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15";
    }
}

export function getExpenseStatusLabel(status: ExpenseStatus) {
    switch (status) {
        case "approved":
            return "Approved";
        case "rejected":
            return "Rejected";
        case "draft":
            return "Draft";
        case "rework":
            return "Rework";
        default:
            return "Pending";
    }
}

export function getAdminBatchReviewStatusLabel(status: AdminBatchReviewStatus) {
    switch (status) {
        case "pending_review":
            return "Awaiting review";
        case "partial":
            return "Partially reviewed";
        case "all_approved":
            return "All approved";
        case "all_rejected":
            return "All rejected";
        default:
            return "Mixed";
    }
}

export function getAdminBatchReviewStatusStyles(status: AdminBatchReviewStatus) {
    switch (status) {
        case "pending_review":
            return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15";
        case "partial":
            return "bg-sky-50 text-sky-800 ring-1 ring-sky-600/15";
        case "all_approved":
            return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15";
        case "all_rejected":
            return "bg-red-50 text-red-800 ring-1 ring-red-600/15";
        default:
            return "bg-violet-50 text-violet-800 ring-1 ring-violet-600/15";
    }
}

export const expenseInputClass =
    "h-11 min-h-[2.75rem] w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-medium text-gray-900 outline-none touch-manipulation focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 sm:text-sm";

export const expenseLabelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600 sm:text-xs";

export const expensePrimaryButtonClass =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition touch-manipulation active:scale-[0.98] hover:opacity-90 disabled:opacity-60 sm:w-auto";

export const expenseSecondaryButtonClass =
    "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition touch-manipulation active:scale-[0.98] hover:bg-gray-50 disabled:opacity-60 sm:w-auto";
