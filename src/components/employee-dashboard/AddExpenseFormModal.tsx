"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Loader2, Plus, Send, X } from "lucide-react";
import {
    expenseInputClass,
    expenseLabelClass,
    expensePrimaryButtonClass,
    expenseSecondaryButtonClass,
} from "@/lib/employeeExpenseUi";
import { todayDateOnly } from "@/lib/dateOnly";

export type AddExpenseFormValues = {
    expense_date: string;
    category: string;
    from_address: string;
    to_address: string;
    title: string;
    amount: string;
    payment_mode: string;
    receipt_reference: string;
};

type AddExpenseFormModalProps = {
    open: boolean;
    categories: string[];
    paymentModes: string[];
    onClose: () => void;
    onSubmit: (form: AddExpenseFormValues) => Promise<void>;
};

export function emptyExpenseForm(todayIso: string): AddExpenseFormValues {
    return {
        expense_date: todayIso,
        category: "",
        from_address: "",
        to_address: "",
        title: "",
        amount: "",
        payment_mode: "",
        receipt_reference: "",
    };
}

export default function AddExpenseFormModal({
    open,
    categories,
    paymentModes,
    onClose,
    onSubmit,
}: AddExpenseFormModalProps) {
    const [form, setForm] = useState<AddExpenseFormValues>(() =>
        emptyExpenseForm(todayDateOnly()),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            setForm(emptyExpenseForm(today));
            setError("");
            setIsSubmitting(false);
        }
    }, [open]);

    if (!open) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            await onSubmit(form);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit expense");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
            <div
                className="absolute inset-0 bg-black/40"
                aria-hidden
                onClick={() => {
                    if (!isSubmitting) onClose();
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-expense-title"
                className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                </div>
                <div
                    className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6"
                    style={{
                        background:
                            "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <div className="min-w-0">
                        <h3
                            id="add-expense-title"
                            className="flex items-center gap-2 text-lg font-bold text-white"
                        >
                            <Plus className="h-5 w-5 shrink-0" aria-hidden />
                            Add expense
                        </h3>
                        <p className="mt-0.5 text-xs text-cyan-100/90">Submit a new claim for approval</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isSubmitting) onClose();
                        }}
                        disabled={isSubmitting}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/80 transition touch-manipulation hover:bg-white/10 hover:text-white disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                        {error ? (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </p>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="modal_expense_date" className={expenseLabelClass}>
                                    Expense date *
                                </label>
                                <input
                                    id="modal_expense_date"
                                    name="expense_date"
                                    type="date"
                                    required
                                    value={form.expense_date}
                                    onChange={handleChange}
                                    className={expenseInputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="modal_category" className={expenseLabelClass}>
                                    Category *
                                </label>
                                <select
                                    id="modal_category"
                                    name="category"
                                    required
                                    value={form.category}
                                    onChange={handleChange}
                                    className={expenseInputClass}
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="modal_from_address" className={expenseLabelClass}>
                                    From address
                                </label>
                                <input
                                    id="modal_from_address"
                                    name="from_address"
                                    type="text"
                                    placeholder="Starting location"
                                    value={form.from_address}
                                    onChange={handleChange}
                                    className={expenseInputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="modal_to_address" className={expenseLabelClass}>
                                    To address
                                </label>
                                <input
                                    id="modal_to_address"
                                    name="to_address"
                                    type="text"
                                    placeholder="Destination"
                                    value={form.to_address}
                                    onChange={handleChange}
                                    className={expenseInputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="modal_title" className={expenseLabelClass}>
                                Title / description *
                            </label>
                            <input
                                id="modal_title"
                                name="title"
                                type="text"
                                required
                                placeholder="e.g. Client visit cab fare"
                                value={form.title}
                                onChange={handleChange}
                                className={expenseInputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="modal_amount" className={expenseLabelClass}>
                                    Amount (₹) *
                                </label>
                                <div className="relative">
                                    <IndianRupee
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                        aria-hidden
                                    />
                                    <input
                                        id="modal_amount"
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={handleChange}
                                        className={`${expenseInputClass} pl-9`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="modal_payment_mode" className={expenseLabelClass}>
                                    Payment mode *
                                </label>
                                <select
                                    id="modal_payment_mode"
                                    name="payment_mode"
                                    required
                                    value={form.payment_mode}
                                    onChange={handleChange}
                                    className={expenseInputClass}
                                >
                                    <option value="">Select mode</option>
                                    {paymentModes.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="modal_receipt_reference" className={expenseLabelClass}>
                                Receipt / bill no.
                            </label>
                            <input
                                id="modal_receipt_reference"
                                name="receipt_reference"
                                type="text"
                                placeholder="Optional reference number"
                                value={form.receipt_reference}
                                onChange={handleChange}
                                className={expenseInputClass}
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className={expenseSecondaryButtonClass}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={expensePrimaryButtonClass}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <Send className="h-4 w-4" aria-hidden />
                            )}
                            {isSubmitting ? "Submitting…" : "Submit expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
