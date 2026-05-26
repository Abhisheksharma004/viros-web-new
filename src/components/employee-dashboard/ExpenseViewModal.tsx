"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    formatCurrency,
    formatExpenseDate,
    formatExpenseDateTime,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
} from "@/lib/employeeExpenseUi";

type ExpenseViewModalProps = {
    expense: EmployeeExpenseRow | null;
    onClose: () => void;
};

function ViewField({
    label,
    value,
    className = "",
    multiline,
}: {
    label: string;
    value: string;
    className?: string;
    multiline?: boolean;
}) {
    return (
        <div className={className}>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p
                className={`mt-1 text-sm font-semibold text-gray-900 ${multiline ? "whitespace-pre-wrap break-words" : "break-words"}`}
            >
                {value}
            </p>
        </div>
    );
}

export default function ExpenseViewModal({ expense, onClose }: ExpenseViewModalProps) {
    useEffect(() => {
        if (!expense) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [expense, onClose]);

    if (!expense) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
            <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="expense-view-title"
                className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,640px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                </div>
                <div
                    className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6"
                    style={{
                        background:
                            "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <h3 id="expense-view-title" className="text-lg font-bold text-white">
                        Expense details
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                    <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#0a2a5e]/10 bg-[#0a2a5e]/5 px-4 py-3">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExpenseStatusStyles(expense.status)}`}
                        >
                            {getExpenseStatusLabel(expense.status)}
                        </span>
                        <p className="text-xl font-bold text-[#0a2a5e]">{formatCurrency(expense.amount)}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                        <ViewField
                            label="Expense ID"
                            value={expense.expense_id}
                            className="sm:col-span-2"
                        />
                        <ViewField label="Date" value={formatExpenseDate(expense.expense_date)} />
                        <ViewField label="Category" value={expense.category} />
                        <ViewField label="Payment mode" value={expense.payment_mode} />
                        <ViewField
                            label="Receipt ref."
                            value={expense.receipt_reference?.trim() || "—"}
                        />
                        {expense.from_address?.trim() ? (
                            <ViewField
                                label="From address"
                                value={expense.from_address}
                                className="sm:col-span-2"
                                multiline
                            />
                        ) : null}
                        {expense.to_address?.trim() ? (
                            <ViewField
                                label="To address"
                                value={expense.to_address}
                                className="sm:col-span-2"
                                multiline
                            />
                        ) : null}
                        <ViewField
                            label="Description"
                            value={expense.title}
                            className="sm:col-span-2"
                            multiline
                        />
                        <ViewField
                            label="Submitted"
                            value={formatExpenseDateTime(expense.created_at)}
                            className="sm:col-span-2"
                        />
                        {expense.status === "rejected" && expense.reject_reason?.trim() ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 sm:col-span-2">
                                <p className="text-xs font-medium text-red-800">Rejection reason</p>
                                <p className="mt-1 text-sm font-semibold text-red-900 whitespace-pre-wrap break-words">
                                    {expense.reject_reason}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 w-full cursor-pointer rounded-xl bg-[#06b6d4] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#05a8b8] sm:w-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
