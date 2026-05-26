"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronRight as ChevronRightIcon,
    Eye,
    Filter,
    Loader2,
    Search,
    XCircle,
} from "lucide-react";
import ExpenseViewModal from "@/components/employee-dashboard/ExpenseViewModal";
import type { EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    expenseInputClass,
    expenseLabelClass,
    expenseSecondaryButtonClass,
    formatCurrency,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
} from "@/lib/employeeExpenseUi";

type RejectedSummary = {
    totalAmount: number;
    expenseCount: number;
};

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
    summary: RejectedSummary & { pendingCount?: number };
    month: string;
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

function matchesSearch(exp: EmployeeExpenseRow, query: string) {
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
        formatExpenseDate(exp.expense_date),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return haystack.includes(q);
}

export default function RejectExpensePage() {
    const [month, setMonth] = useState(() => getTodayIso().slice(0, 7));
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [summary, setSummary] = useState<RejectedSummary>({ totalAmount: 0, expenseCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);
    const [filterFrom, setFilterFrom] = useState(() => getMonthDateRange(getTodayIso().slice(0, 7)).from);
    const [filterTo, setFilterTo] = useState(() => getMonthDateRange(getTodayIso().slice(0, 7)).to);
    const [search, setSearch] = useState("");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const loadRejected = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch(
                `/api/employee/expenses?month=${encodeURIComponent(month)}&status=rejected&limit=100`,
                { cache: "no-store" },
            );
            const data = (await response.json().catch(() => ({}))) as ExpensesPayload & {
                message?: string;
            };
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load expenses");
            }
            setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
            setSummary({
                totalAmount: Number(data.summary?.totalAmount) || 0,
                expenseCount: Number(data.summary?.expenseCount) || 0,
            });
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load rejected expenses");
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    }, [month]);

    useEffect(() => {
        void loadRejected();
    }, [loadRejected]);

    useEffect(() => {
        const { from, to } = getMonthDateRange(month);
        setFilterFrom(from);
        setFilterTo(to);
        setSearch("");
        setMobileFiltersOpen(false);
    }, [month]);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const monthShortLabel = useMemo(() => formatMonthShort(month), [month]);
    const monthRange = useMemo(() => getMonthDateRange(month), [month]);

    const filteredExpenses = useMemo(
        () =>
            expenses.filter((exp) => {
                if (filterFrom && exp.expense_date < filterFrom) return false;
                if (filterTo && exp.expense_date > filterTo) return false;
                return matchesSearch(exp, search);
            }),
        [expenses, filterFrom, filterTo, search],
    );

    const hasActiveFilters =
        search.trim().length > 0 ||
        filterFrom !== monthRange.from ||
        filterTo !== monthRange.to;

    const clearFilters = () => {
        setFilterFrom(monthRange.from);
        setFilterTo(monthRange.to);
        setSearch("");
    };

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 ring-red-200 sm:p-4">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                        Rejected
                    </p>
                    <p className="mt-1 text-xl font-black leading-none text-red-700 sm:mt-2 sm:text-3xl">
                        {summary.expenseCount}
                    </p>
                </div>
                <div className="min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 ring-red-200 sm:p-4">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                        Amount
                    </p>
                    <p className="mt-1 truncate text-base font-black leading-none text-red-700 sm:mt-2 sm:text-2xl">
                        {formatCurrency(summary.totalAmount)}
                    </p>
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                                        Rejected expenses
                                    </h2>
                                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">{monthLabel}</p>
                                </div>
                            </div>
                            <p className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                {filteredExpenses.length}/{expenses.length}
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 touch-manipulation active:scale-95 hover:bg-white"
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
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 touch-manipulation active:scale-95 hover:bg-white"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 sm:mt-4 sm:space-y-3 sm:pt-4">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search rejected expenses…"
                                className={`${expenseInputClass} pl-9`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen((open) => !open)}
                            className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold touch-manipulation active:scale-[0.98] sm:hidden ${
                                hasActiveFilters
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-gray-200 bg-white text-gray-700"
                            }`}
                        >
                            <Filter className="h-4 w-4" aria-hidden />
                            {mobileFiltersOpen ? "Hide date filters" : "Date filters"}
                        </button>

                        <div
                            className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end ${
                                mobileFiltersOpen ? "grid" : "hidden sm:grid"
                            }`}
                        >
                            <div>
                                <label htmlFor="reject_filter_from" className={expenseLabelClass}>
                                    From date
                                </label>
                                <input
                                    id="reject_filter_from"
                                    type="date"
                                    value={filterFrom}
                                    max={filterTo || undefined}
                                    onChange={(e) => setFilterFrom(e.target.value)}
                                    className={expenseInputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="reject_filter_to" className={expenseLabelClass}>
                                    To date
                                </label>
                                <input
                                    id="reject_filter_to"
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
                            Loading rejected expenses…
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <XCircle className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">No rejected expenses this month</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <Search className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">No matches for your filters</p>
                            <button type="button" onClick={clearFilters} className={`${expenseSecondaryButtonClass} max-w-xs`}>
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
                                        className="flex w-full flex-col gap-3 rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm touch-manipulation active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#0a2a5e]">
                                                    {exp.expense_id}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-gray-500">
                                                    {formatExpenseDate(exp.expense_date)} · {exp.payment_mode}
                                                </p>
                                                <p className="mt-2 line-clamp-2 text-base font-bold text-gray-900">
                                                    {exp.title}
                                                </p>
                                                <p className="mt-1 truncate text-sm font-medium text-[#0a2a5e]">
                                                    {exp.category}
                                                </p>
                                            </div>
                                            <ChevronRightIcon className="mt-1 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
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
                                                <td className="px-3 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewExpense(exp)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm touch-manipulation hover:bg-[#06b6d4]/5 active:scale-95"
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

            <ExpenseViewModal expense={viewExpense} onClose={() => setViewExpense(null)} />
        </div>
    );
}
