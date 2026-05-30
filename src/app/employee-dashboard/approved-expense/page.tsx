"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    RefreshCw,
    Wallet,
} from "lucide-react";
import ExpenseViewModal from "@/components/employee-dashboard/ExpenseViewModal";
import type { EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    formatCurrencyWhole,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
    isPartialExpenseApproval,
    resolveExpenseApprovedAmount,
} from "@/lib/employeeExpenseUi";

type ApprovedSummary = {
    totalAmount: number;
    expenseCount: number;
};

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
    summary: ApprovedSummary & { pendingCount?: number };
    month: string;
    status?: string | null;
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

function getApprovedAmount(exp: EmployeeExpenseRow) {
    return resolveExpenseApprovedAmount(exp) ?? exp.amount;
}

function filterApprovedExpenses(expenses: EmployeeExpenseRow[]) {
    return expenses.filter((exp) => exp.status === "approved");
}

function ApprovedAmountBlock({
    exp,
    align = "right",
}: {
    exp: EmployeeExpenseRow;
    align?: "left" | "right";
}) {
    const approved = getApprovedAmount(exp);
    const partial = isPartialExpenseApproval(exp);
    const alignClass = align === "right" ? "text-right" : "text-left";

    return (
        <div className={alignClass}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Approved</p>
            <p className="text-sm font-bold tabular-nums text-emerald-900 sm:text-base">
                {formatCurrencyWhole(approved)}
            </p>
            {partial ? (
                <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
                    Claimed {formatCurrencyWhole(exp.amount)}
                </p>
            ) : null}
        </div>
    );
}

export default function ApprovedExpensePage() {
    const [month, setMonth] = useState(() => getTodayIso().slice(0, 7));
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [summary, setSummary] = useState<ApprovedSummary>({ totalAmount: 0, expenseCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);

    const loadApproved = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch(
                `/api/employee/expenses?month=${encodeURIComponent(month)}&status=approved&limit=100`,
                { cache: "no-store" },
            );
            const data = (await response.json().catch(() => ({}))) as ExpensesPayload & {
                message?: string;
            };
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load expenses");
            }

            const approvedExpenses = filterApprovedExpenses(
                Array.isArray(data.expenses) ? data.expenses : [],
            );

            setExpenses(approvedExpenses);
            setSummary({
                totalAmount: Number(data.summary?.totalAmount) || 0,
                expenseCount: Number(data.summary?.expenseCount) || approvedExpenses.length,
            });
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load approved expenses");
            setExpenses([]);
            setSummary({ totalAmount: 0, expenseCount: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [month]);

    useEffect(() => {
        void loadApproved();
    }, [loadApproved]);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const monthShortLabel = useMemo(() => formatMonthShort(month), [month]);

    const stats = [
        {
            label: "Approved total",
            value: formatCurrencyWhole(summary.totalAmount),
            tone: "text-[#0a2a5e]",
            ring: "ring-[#0a2a5e]/15",
        },
        {
            label: "Approved entries",
            value: String(summary.expenseCount),
            tone: "text-emerald-800",
            ring: "ring-emerald-200",
        },
    ];

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {loadError ? (
                <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => void loadApproved()}
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 touch-manipulation active:scale-[0.98]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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

            <section className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                                        Approved expense
                                    </h2>
                                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                                        Claimed vs approved amount for each expense
                                    </p>
                                </div>
                            </div>
                            <p className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {expenses.length}
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
                    </div>
                </div>

                <div className="px-3 py-3 sm:p-6">
                    {isLoading ? (
                        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#0a2a5e]" aria-hidden />
                            Loading approved expenses…
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <Wallet className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">
                                No approved expenses for {monthLabel}
                            </p>
                            <p className="max-w-sm text-xs text-gray-500">
                                Once admin approves your submitted expenses, they will show up here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {expenses.map((exp) => (
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
                                        <div className="flex items-end justify-between gap-2 border-t border-gray-100 px-4 pb-4 pt-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExpenseStatusStyles(exp.status)}`}
                                            >
                                                {getExpenseStatusLabel(exp.status)}
                                            </span>
                                            <ApprovedAmountBlock exp={exp} />
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
                                            <th className="px-3 py-2">Claimed</th>
                                            <th className="px-3 py-2">Approved</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {expenses.map((exp) => (
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
                                                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-gray-600">
                                                    {formatCurrencyWhole(exp.amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <p className="font-semibold tabular-nums text-emerald-800">
                                                        {formatCurrencyWhole(getApprovedAmount(exp))}
                                                    </p>
                                                    {isPartialExpenseApproval(exp) ? (
                                                        <p className="text-[11px] font-medium text-amber-700">
                                                            Partial approval
                                                        </p>
                                                    ) : null}
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
                                                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition touch-manipulation hover:bg-[#06b6d4]/5 active:scale-95"
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

            <ExpenseViewModal expense={viewExpense} onClose={() => setViewExpense(null)} />
        </div>
    );
}
