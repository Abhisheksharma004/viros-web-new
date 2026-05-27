"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Loader2,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Wallet,
} from "lucide-react";
import AddExpenseFormModal, {
    type AddExpenseFormValues,
} from "@/components/employee-dashboard/AddExpenseFormModal";
import ExpenseViewModal from "@/components/employee-dashboard/ExpenseViewModal";
import type { EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    expenseInputClass,
    expenseLabelClass,
    expensePrimaryButtonClass,
    expenseSecondaryButtonClass,
    formatCurrency,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
} from "@/lib/employeeExpenseUi";

type ExpenseSummary = {
    totalAmount: number;
    expenseCount: number;
    pendingCount: number;
};

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
    summary: ExpenseSummary;
    month: string;
    categories: string[];
    paymentModes: string[];
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

function getMonthDateRange(month: string) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    return { from: start, to: end };
}

function matchesExpenseSearch(exp: EmployeeExpenseRow, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
        exp.expense_id,
        exp.title,
        exp.category,
        exp.from_address,
        exp.to_address,
        exp.payment_mode,
        exp.receipt_reference,
        getExpenseStatusLabel(exp.status),
        String(exp.amount),
        formatExpenseDate(exp.expense_date),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(q);
}

type ExpenseStatusFilter = "all" | "approved" | "rejected" | "pending";

function parseStatusFilter(value: string | null): ExpenseStatusFilter {
    if (value === "approved" || value === "rejected" || value === "pending") return value;
    return "all";
}

function filterExpenses(
    expenses: EmployeeExpenseRow[],
    fromDate: string,
    toDate: string,
    search: string,
    status: ExpenseStatusFilter,
) {
    return expenses.filter((exp) => {
        if (fromDate && exp.expense_date < fromDate) return false;
        if (toDate && exp.expense_date > toDate) return false;
        if (status !== "all" && exp.status !== status) return false;
        return matchesExpenseSearch(exp, search);
    });
}

export default function AddExpensePage() {
    const searchParams = useSearchParams();
    const initialStatus = parseStatusFilter(searchParams.get("status"));

    const [month, setMonth] = useState(() => getTodayIso().slice(0, 7));
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [summary, setSummary] = useState<ExpenseSummary>({
        totalAmount: 0,
        expenseCount: 0,
        pendingCount: 0,
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [paymentModes, setPaymentModes] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [successAlert, setSuccessAlert] = useState<{ open: boolean; message: string }>({
        open: false,
        message: "",
    });

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);
    const [filterFrom, setFilterFrom] = useState(() => getMonthDateRange(getTodayIso().slice(0, 7)).from);
    const [filterTo, setFilterTo] = useState(() => getMonthDateRange(getTodayIso().slice(0, 7)).to);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>(initialStatus);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const loadExpenses = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const response = await fetch(
                `/api/employee/expenses?month=${encodeURIComponent(month)}&limit=50`,
                { cache: "no-store" },
            );
            const data = (await response.json().catch(() => ({}))) as ExpensesPayload & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load expenses");
            }

            setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
            setSummary(data.summary ?? { totalAmount: 0, expenseCount: 0, pendingCount: 0 });
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
        const { from, to } = getMonthDateRange(month);
        setFilterFrom(from);
        setFilterTo(to);
        setSearch("");
        setMobileFiltersOpen(false);
    }, [month]);

    useEffect(() => {
        setStatusFilter(parseStatusFilter(searchParams.get("status")));
    }, [searchParams]);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const monthShortLabel = useMemo(() => formatMonthShort(month), [month]);
    const monthRange = useMemo(() => getMonthDateRange(month), [month]);

    const filteredExpenses = useMemo(
        () => filterExpenses(expenses, filterFrom, filterTo, search, statusFilter),
        [expenses, filterFrom, filterTo, search, statusFilter],
    );

    const hasActiveFilters =
        search.trim().length > 0 ||
        filterFrom !== monthRange.from ||
        filterTo !== monthRange.to ||
        statusFilter !== "all";

    const clearFilters = () => {
        setFilterFrom(monthRange.from);
        setFilterTo(monthRange.to);
        setSearch("");
        setStatusFilter("all");
    };

    const handleAddExpense = async (form: AddExpenseFormValues) => {
        const response = await fetch("/api/employee/expenses", {
            method: "POST",
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
            throw new Error(typeof data.message === "string" ? data.message : "Failed to submit expense");
        }

        setSuccessAlert({
            open: true,
            message:
                typeof data.message === "string" ? data.message : "Expense submitted successfully",
        });

        const expenseMonth = form.expense_date.slice(0, 7);
        if (expenseMonth !== month) {
            setMonth(expenseMonth);
        } else {
            await loadExpenses();
        }
    };

    const openAddModal = () => {
        setAddModalOpen(true);
    };

    const stats = [
        {
            label: "This month",
            value: formatCurrency(summary.totalAmount),
            tone: "text-[#0a2a5e]",
            ring: "ring-[#0a2a5e]/15",
        },
        {
            label: "Entries",
            value: String(summary.expenseCount),
            tone: "text-gray-900",
            ring: "ring-gray-200",
        },
        {
            label: "Pending",
            value: String(summary.pendingCount),
            tone: "text-amber-900",
            ring: "ring-amber-200",
        },
    ];

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {loadError ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => void loadExpenses()}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 touch-manipulation active:scale-[0.98]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className={`min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 sm:p-4 ${item.ring}`}
                    >
                        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            {item.label}
                        </p>
                        <p
                            className={`mt-1 truncate text-base font-black leading-none sm:mt-2 sm:text-2xl ${item.tone}`}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <Receipt className="h-5 w-5 shrink-0 text-[#0a2a5e]" aria-hidden />
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                                        Your expenses
                                    </h2>
                                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                                        {monthLabel}
                                    </p>
                                </div>
                            </div>
                            <p className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                {filteredExpenses.length}/{expenses.length}
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
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
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className={`${expensePrimaryButtonClass} hidden sm:inline-flex`}
                        >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add expense
                        </button>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 sm:mt-4 sm:space-y-3 sm:pt-4">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                id="expense_filter_search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search ID, category, description…"
                                className={`${expenseInputClass} pl-9`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen((open) => !open)}
                            className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold touch-manipulation active:scale-[0.98] sm:hidden ${
                                hasActiveFilters
                                    ? "border-[#0a2a5e]/20 bg-[#0a2a5e]/5 text-[#0a2a5e]"
                                    : "border-gray-200 bg-white text-gray-700"
                            }`}
                        >
                            <Filter className="h-4 w-4" aria-hidden />
                            {mobileFiltersOpen ? "Hide date filters" : "Date filters"}
                            {hasActiveFilters ? (
                                <span className="rounded-full bg-[#0a2a5e] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    On
                                </span>
                            ) : null}
                        </button>

                        <div
                            className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end ${
                                mobileFiltersOpen ? "grid" : "hidden sm:grid"
                            }`}
                        >
                            <div>
                                <label htmlFor="expense_filter_from" className={expenseLabelClass}>
                                    From date
                                </label>
                                <input
                                    id="expense_filter_from"
                                    type="date"
                                    value={filterFrom}
                                    max={filterTo || undefined}
                                    onChange={(e) => setFilterFrom(e.target.value)}
                                    className={expenseInputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="expense_filter_to" className={expenseLabelClass}>
                                    To date
                                </label>
                                <input
                                    id="expense_filter_to"
                                    type="date"
                                    value={filterTo}
                                    min={filterFrom || undefined}
                                    onChange={(e) => setFilterTo(e.target.value)}
                                    className={expenseInputClass}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className={`${expenseSecondaryButtonClass} lg:min-w-[7rem]`}
                            >
                                Clear
                            </button>
                        </div>
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
                            <p className="text-sm font-medium text-gray-600">No expenses this month</p>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 py-2.5 text-sm font-semibold text-[#0a2a5e] touch-manipulation active:scale-[0.98] hover:bg-[#0a2a5e]/10"
                            >
                                <Plus className="h-4 w-4" aria-hidden />
                                Add your first expense
                            </button>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <Search className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">No expenses match your filters</p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className={`${expenseSecondaryButtonClass} max-w-xs`}
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {filteredExpenses.map((exp) => (
                                    <button
                                        key={exp.id}
                                        type="button"
                                        onClick={() => setViewExpense(exp)}
                                        className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-[#0a2a5e]/10 bg-white p-4 text-left shadow-sm touch-manipulation active:scale-[0.99]"
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
                                        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExpenseStatusStyles(exp.status)}`}
                                            >
                                                {getExpenseStatusLabel(exp.status)}
                                            </span>
                                            <p className="text-sm font-bold text-gray-900">
                                                {formatCurrency(exp.amount)}
                                            </p>
                                        </div>
                                    </button>
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
                                                    {formatCurrency(exp.amount)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpenseStatusStyles(exp.status)}`}
                                                    >
                                                        {getExpenseStatusLabel(exp.status)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewExpense(exp)}
                                                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition touch-manipulation hover:bg-[#06b6d4]/5 active:scale-95"
                                                        title="View expense"
                                                        aria-label="View expense"
                                                    >
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <button
                type="button"
                onClick={openAddModal}
                className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#06124f] to-[#0a2a5e] text-white shadow-lg touch-manipulation transition active:scale-95 sm:hidden"
                aria-label="Add expense"
            >
                <Plus className="h-6 w-6" aria-hidden />
            </button>

            <AddExpenseFormModal
                open={addModalOpen}
                categories={categories}
                paymentModes={paymentModes}
                onClose={() => setAddModalOpen(false)}
                onSubmit={handleAddExpense}
            />

            <ExpenseViewModal expense={viewExpense} onClose={() => setViewExpense(null)} />

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
                className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                </div>
                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
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
                        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm touch-manipulation active:scale-[0.98] hover:bg-emerald-700"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
