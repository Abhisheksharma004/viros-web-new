"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    Pencil,
    Plus,
    Receipt,
    RefreshCw,
    Send,
    Trash2,
    Wallet,
} from "lucide-react";
import AddExpenseFormModal, {
    type AddExpenseFormValues,
    expenseRowToFormValues,
} from "@/components/employee-dashboard/AddExpenseFormModal";
import ExpenseViewModal from "@/components/employee-dashboard/ExpenseViewModal";
import type { EmployeeExpenseRow, EmployeeMonthClaimInfo } from "@/lib/employeeExpenses";
import {
    expensePrimaryButtonClass,
    formatCurrencyWhole,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
} from "@/lib/employeeExpenseUi";

type ExpenseSummary = {
    totalAmount: number;
    expenseCount: number;
    pendingCount: number;
    draftCount: number;
    draftAmount: number;
};

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
    summary: ExpenseSummary;
    monthClaim: EmployeeMonthClaimInfo;
    month: string;
    categories: string[];
    paymentModes: string[];
};

const EMPTY_MONTH_CLAIM: EmployeeMonthClaimInfo = {
    status: "empty",
    draftCount: 0,
    draftAmount: 0,
    submittedCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    canAdd: true,
    canSubmit: false,
    canEdit: true,
};

function getTodayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatMonthShort(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

type ExpenseStatusFilter = "all" | "rejected" | "pending" | "draft";

function parseStatusFilter(value: string | null): ExpenseStatusFilter {
    if (value === "rejected" || value === "pending" || value === "draft") {
        return value;
    }
    return "all";
}

function getStatusFilterLabel(filter: ExpenseStatusFilter): string {
    if (filter === "all") return "matching";
    return getExpenseStatusLabel(filter).toLowerCase();
}

function excludeApprovedExpenses(expenses: EmployeeExpenseRow[]) {
    return expenses.filter((exp) => exp.status !== "approved");
}

function AddExpensePageInner() {
    const searchParams = useSearchParams();
    const initialStatus = parseStatusFilter(searchParams.get("status"));

    const [month, setMonth] = useState(() => getTodayIso().slice(0, 7));
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [summary, setSummary] = useState<ExpenseSummary>({
        totalAmount: 0,
        expenseCount: 0,
        pendingCount: 0,
        draftCount: 0,
        draftAmount: 0,
    });
    const [monthClaim, setMonthClaim] = useState<EmployeeMonthClaimInfo>(EMPTY_MONTH_CLAIM);
    const [categories, setCategories] = useState<string[]>([]);
    const [paymentModes, setPaymentModes] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [successAlert, setSuccessAlert] = useState<{ open: boolean; message: string }>({
        open: false,
        message: "",
    });

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<EmployeeExpenseRow | null>(null);
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>(initialStatus);

    const loadExpenses = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const response = await fetch(
                `/api/employee/expenses?month=${encodeURIComponent(month)}&limit=50&excludeApproved=true`,
                { cache: "no-store" },
            );
            const data = (await response.json().catch(() => ({}))) as ExpensesPayload & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load expenses");
            }

            setExpenses(excludeApprovedExpenses(Array.isArray(data.expenses) ? data.expenses : []));
            setSummary(
                data.summary ?? {
                    totalAmount: 0,
                    expenseCount: 0,
                    pendingCount: 0,
                    draftCount: 0,
                    draftAmount: 0,
                },
            );
            setMonthClaim(data.monthClaim ?? EMPTY_MONTH_CLAIM);
            if (Array.isArray(data.categories)) setCategories(data.categories);
            if (Array.isArray(data.paymentModes)) setPaymentModes(data.paymentModes);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load expenses");
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    }, [month]);

    useEffect(() => {
        void loadExpenses();
    }, [loadExpenses]);

    useEffect(() => {
        setStatusFilter(parseStatusFilter(searchParams.get("status")));
    }, [searchParams]);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const monthShortLabel = useMemo(() => formatMonthShort(month), [month]);

    const filteredExpenses = useMemo(() => {
        if (statusFilter === "all") return expenses;
        return expenses.filter((exp) => exp.status === statusFilter);
    }, [expenses, statusFilter]);

    const handleAddExpense = async (form: AddExpenseFormValues) => {
        const expenseMonth = form.expense_date.slice(0, 7);
        if (expenseMonth !== month) {
            throw new Error(`Expense date must fall within ${formatMonthLabel(month)}`);
        }

        const isEdit = Boolean(editingExpense);
        const url = isEdit
            ? `/api/employee/expenses/${editingExpense!.id}`
            : "/api/employee/expenses";
        const response = await fetch(url, {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                expense_date: form.expense_date,
                category: form.category,
                from_address: form.from_address,
                to_address: form.to_address,
                title: form.title,
                amount: form.amount,
                payment_mode: form.payment_mode,
                receipt_reference: form.receipt_reference,
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(typeof data.message === "string" ? data.message : "Failed to save expense");
        }

        setSuccessAlert({
            open: true,
            message:
                typeof data.message === "string"
                    ? data.message
                    : isEdit
                      ? "Expense updated"
                      : "Expense saved as draft",
        });

        setEditingExpense(null);

        if (expenseMonth !== month) {
            setMonth(expenseMonth);
        } else {
            await loadExpenses();
        }
    };

    const handleDeleteExpense = async (expense: EmployeeExpenseRow) => {
        if (!window.confirm("Remove this draft expense?")) return;
        const response = await fetch(`/api/employee/expenses/${expense.id}`, {
            method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(typeof data.message === "string" ? data.message : "Failed to delete expense");
        }
        await loadExpenses();
    };

    const handleSubmitBatch = async () => {
        if (!monthClaim.canSubmit) return;
        if (
            !window.confirm(
                `Submit ${monthClaim.draftCount} expense${monthClaim.draftCount === 1 ? "" : "s"} (${formatCurrencyWhole(monthClaim.draftAmount)}) for admin approval?\n\nYou won't be able to add or edit expenses for ${monthLabel} after this.`,
            )
        ) {
            return;
        }

        setIsSubmittingBatch(true);
        setSubmitError("");
        try {
            const response = await fetch("/api/employee/expenses/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to submit batch");
            }
            setSuccessAlert({
                open: true,
                message: typeof data.message === "string" ? data.message : "Monthly expenses submitted",
            });
            await loadExpenses();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to submit batch");
        } finally {
            setIsSubmittingBatch(false);
        }
    };

    const openAddModal = () => {
        setEditingExpense(null);
        setAddModalOpen(true);
    };

    const openEditModal = (expense: EmployeeExpenseRow) => {
        setEditingExpense(expense);
        setAddModalOpen(true);
    };

    const stats = [
        {
            label: "Draft total",
            value: formatCurrencyWhole(summary.draftAmount),
            tone: "text-slate-800",
            ring: "ring-slate-200",
            hidden: monthClaim.status === "submitted",
        },
        {
            label: "Month total",
            value: formatCurrencyWhole(summary.totalAmount),
            tone: "text-[#0a2a5e]",
            ring: "ring-[#0a2a5e]/15",
            hidden: false,
        },
        {
            label: monthClaim.status === "submitted" ? "Pending" : "Draft entries",
            value:
                monthClaim.status === "submitted"
                    ? String(monthClaim.pendingCount)
                    : String(summary.draftCount),
            tone: monthClaim.status === "submitted" ? "text-amber-900" : "text-slate-700",
            ring: monthClaim.status === "submitted" ? "ring-amber-200" : "ring-slate-200",
            hidden: false,
        },
    ].filter((item) => !item.hidden);

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {loadError ? (
                <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => void loadExpenses()}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 touch-manipulation active:scale-[0.98]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Retry
                    </button>
                </div>
            ) : null}

            <div className={`grid gap-2 sm:gap-3 ${stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className={`min-w-0 rounded-md border bg-white p-2 shadow-sm ring-1 sm:p-4 ${item.ring}`}
                    >
                        <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-xs">
                            {item.label}
                        </p>
                        <p
                            className={`mt-1 max-w-full text-[clamp(0.6875rem,2.75vw,1.875rem)] font-black leading-tight tabular-nums sm:mt-2 sm:text-2xl ${item.tone}`}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {submitError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                </div>
            ) : null}

            <section className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <Receipt className="h-5 w-5 shrink-0 text-[#0a2a5e]" aria-hidden />
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                                        Monthly expenses
                                    </h2>
                                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                                        Add entries throughout the month, then submit in one batch
                                    </p>
                                </div>
                            </div>
                            <p className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                {filteredExpenses.length}/{expenses.length}
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1 text-xs font-semibold text-gray-800 sm:text-sm">
                                <Calendar className="h-4 w-4 shrink-0 text-[#0a2a5e]" aria-hidden />
                                <span className="truncate sm:hidden">{monthShortLabel}</span>
                                <span className="hidden truncate sm:inline">{monthLabel}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openAddModal}
                            disabled={!monthClaim.canAdd}
                            className={`${expensePrimaryButtonClass} !rounded-md !hidden sm:!inline-flex`}
                        >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add expense
                        </button>
                    </div>
                </div>

                <div className="px-3 py-3 sm:p-6">
                    {isLoading ? (
                        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#0a2a5e]" aria-hidden />
                            Loading expenses…
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <Wallet className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">
                                No expenses for {monthLabel}
                            </p>
                            <p className="max-w-sm text-xs text-gray-500">
                                Add each expense as a draft, then submit the full month for admin approval.
                            </p>
                            {monthClaim.canAdd ? (
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 py-2.5 text-sm font-semibold text-[#0a2a5e] touch-manipulation active:scale-[0.98] hover:bg-[#0a2a5e]/10"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add your first expense
                                </button>
                            ) : null}
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <Wallet className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">
                                No {getStatusFilterLabel(statusFilter)} expenses for {monthLabel}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {filteredExpenses.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className="flex flex-col rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setViewExpense(exp)}
                                            className="flex w-full cursor-pointer flex-col gap-3 p-4 pb-3 text-left touch-manipulation active:scale-[0.99]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#0a2a5e]">
                                                        {exp.expense_id}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                                        {formatExpenseDate(exp.expense_date)} · {exp.payment_mode}
                                                    </p>
                                                    <p className="mt-2 line-clamp-2 text-base font-bold leading-snug text-gray-900">
                                                        {exp.title}
                                                    </p>
                                                    <p className="mt-1 truncate text-sm font-medium text-[#0a2a5e]">
                                                        {exp.category}
                                                    </p>
                                                </div>
                                                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                                            </div>
                                        </button>
                                        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 pb-4 pt-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExpenseStatusStyles(exp.status)}`}
                                            >
                                                {getExpenseStatusLabel(exp.status)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {exp.status === "draft" && monthClaim.canEdit ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(exp)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0a2a5e]/15 text-[#0a2a5e] touch-manipulation"
                                                            aria-label="Edit expense"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleDeleteExpense(exp)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 touch-manipulation"
                                                            aria-label="Delete expense"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : null}
                                                <p className="text-sm font-bold text-gray-900">
                                                    {formatCurrencyWhole(exp.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="-mx-1 hidden overflow-x-auto lg:block">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <th className="px-3 py-2">Expense ID</th>
                                            <th className="px-3 py-2">Date</th>
                                            <th className="px-3 py-2">Category</th>
                                            <th className="px-3 py-2">Description</th>
                                            <th className="px-3 py-2">Amount</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-gray-50/80">
                                                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-[#0a2a5e]">
                                                    {exp.expense_id}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                                                    {formatExpenseDate(exp.expense_date)}
                                                </td>
                                                <td className="px-3 py-3 text-gray-700">{exp.category}</td>
                                                <td className="max-w-[240px] truncate px-3 py-3 font-medium text-gray-900">
                                                    {exp.title}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-900">
                                                    {formatCurrencyWhole(exp.amount)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpenseStatusStyles(exp.status)}`}
                                                    >
                                                        {getExpenseStatusLabel(exp.status)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {exp.status === "draft" && monthClaim.canEdit ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(exp)}
                                                                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition touch-manipulation hover:bg-[#06b6d4]/5 active:scale-95"
                                                                    title="Edit expense"
                                                                    aria-label="Edit expense"
                                                                >
                                                                    <Pencil className="h-4 w-4" aria-hidden />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleDeleteExpense(exp)}
                                                                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 shadow-sm transition touch-manipulation hover:bg-red-100 active:scale-95"
                                                                    title="Delete expense"
                                                                    aria-label="Delete expense"
                                                                >
                                                                    <Trash2 className="h-4 w-4" aria-hidden />
                                                                </button>
                                                            </>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewExpense(exp)}
                                                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition touch-manipulation hover:bg-[#06b6d4]/5 active:scale-95"
                                                            title="View expense"
                                                            aria-label="View expense"
                                                        >
                                                            <Eye className="h-4 w-4" aria-hidden />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {monthClaim.canSubmit ? (
                    <div className="border-t border-[#0a2a5e]/10 bg-gradient-to-r from-[#06124f]/5 to-[#0a2a5e]/5 px-3 py-4 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#0a2a5e]">Ready to submit?</p>
                                <p className="mt-0.5 text-xs text-gray-600">
                                    {monthClaim.draftCount} draft expense
                                    {monthClaim.draftCount === 1 ? "" : "s"} ·{" "}
                                    {formatCurrencyWhole(monthClaim.draftAmount)} will be sent to admin for approval
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void handleSubmitBatch()}
                                disabled={isSubmittingBatch}
                                className={`${expensePrimaryButtonClass} !rounded-md sm:min-w-[12rem]`}
                            >
                                {isSubmittingBatch ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden />
                                )}
                                {isSubmittingBatch ? "Submitting…" : "Submit for approval"}
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>

            {monthClaim.canAdd ? (
                <button
                    type="button"
                    onClick={openAddModal}
                    className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#06124f] to-[#0a2a5e] text-white shadow-lg touch-manipulation transition active:scale-95 sm:hidden"
                    aria-label="Add expense"
                >
                    <Plus className="h-6 w-6" aria-hidden />
                </button>
            ) : null}

            <AddExpenseFormModal
                open={addModalOpen}
                categories={categories}
                paymentModes={paymentModes}
                month={month}
                initialValues={editingExpense ? expenseRowToFormValues(editingExpense) : null}
                onClose={() => {
                    setAddModalOpen(false);
                    setEditingExpense(null);
                }}
                onSubmit={handleAddExpense}
            />

            <ExpenseViewModal
                expense={viewExpense}
                onClose={() => setViewExpense(null)}
                onEdit={monthClaim.canEdit ? openEditModal : undefined}
                onDelete={monthClaim.canEdit ? handleDeleteExpense : undefined}
            />

            <ExpenseSuccessAlert
                open={successAlert.open}
                message={successAlert.message}
                onClose={() => setSuccessAlert({ open: false, message: "" })}
            />
        </div>
    );
}

function parseExpenseSuccessMessage(message: string) {
    const match = message.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) {
        return { title: match[1].trim(), subtitle: match[2].trim() };
    }
    return { title: message, subtitle: "" };
}

export default function AddExpensePage() {
    return (
        <Suspense fallback={null}>
            <AddExpensePageInner />
        </Suspense>
    );
}

function ExpenseSuccessAlert({
    open,
    message,
    onClose,
}: {
    open: boolean;
    message: string;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open || !message) return null;

    const { title, subtitle } = parseExpenseSuccessMessage(message);

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="expense-success-title"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40" aria-hidden />
            <div
                className="relative w-full max-w-md overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                </div>
                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
                    <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                        <CheckCircle2
                            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                            aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                            <p id="expense-success-title" className="font-bold leading-snug">
                                {title}
                            </p>
                            {subtitle ? (
                                <p className="mt-1 font-semibold leading-snug text-emerald-900">
                                    {subtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white shadow-sm touch-manipulation active:scale-[0.98] hover:bg-emerald-700"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
