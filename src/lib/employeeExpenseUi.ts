import type { ExpenseStatus } from "@/lib/employeeExpenses";

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

export function getExpenseStatusStyles(status: ExpenseStatus) {
    switch (status) {
        case "approved":
            return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15";
        case "rejected":
            return "bg-red-50 text-red-800 ring-1 ring-red-600/15";
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
        default:
            return "Pending";
    }
}

export const expenseInputClass =
    "h-11 min-h-[2.75rem] w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-medium text-gray-900 outline-none touch-manipulation focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 sm:text-sm";

export const expenseLabelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600 sm:text-xs";

export const expensePrimaryButtonClass =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition touch-manipulation active:scale-[0.98] hover:opacity-90 disabled:opacity-60 sm:w-auto";

export const expenseSecondaryButtonClass =
    "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition touch-manipulation active:scale-[0.98] hover:bg-gray-50 disabled:opacity-60 sm:w-auto";
