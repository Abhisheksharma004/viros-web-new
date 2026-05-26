"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import type { EmployeeExpenseMonthlySummary } from "@/lib/employeeExpenses";
import { formatCurrency } from "@/lib/employeeExpenseUi";

type MonthlyPayload = {
    months: EmployeeExpenseMonthlySummary[];
};

function formatMonthLabel(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function MonthlyHistoryPage() {
    const [months, setMonths] = useState<EmployeeExpenseMonthlySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const loadMonthlyHistory = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch("/api/employee/expenses/monthly?limit=24", {
                cache: "no-store",
            });
            const data = (await response.json().catch(() => ({}))) as MonthlyPayload & {
                message?: string;
            };
            if (!response.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to load monthly history",
                );
            }
            setMonths(Array.isArray(data.months) ? data.months : []);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load monthly history");
            setMonths([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMonthlyHistory();
    }, [loadMonthlyHistory]);

    const totals = useMemo(
        () =>
            months.reduce(
                (acc, row) => ({
                    totalCount: acc.totalCount + row.totalCount,
                    totalAmount: acc.totalAmount + row.totalAmount,
                    approvedCount: acc.approvedCount + row.approvedCount,
                    approvedAmount: acc.approvedAmount + row.approvedAmount,
                    rejectedCount: acc.rejectedCount + row.rejectedCount,
                    rejectedAmount: acc.rejectedAmount + row.rejectedAmount,
                    pendingCount: acc.pendingCount + row.pendingCount,
                }),
                {
                    totalCount: 0,
                    totalAmount: 0,
                    approvedCount: 0,
                    approvedAmount: 0,
                    rejectedCount: 0,
                    rejectedAmount: 0,
                    pendingCount: 0,
                },
            ),
        [months],
    );

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 ring-[#0a2a5e]/15 sm:p-4">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                        Total
                    </p>
                    <p className="mt-1 text-base font-black leading-none text-[#0a2a5e] sm:mt-2 sm:text-2xl">
                        {totals.totalCount}
                    </p>
                </div>
                <div className="min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 ring-emerald-200 sm:p-4">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                        Approved
                    </p>
                    <p className="mt-1 text-base font-black leading-none text-emerald-700 sm:mt-2 sm:text-2xl">
                        {totals.approvedCount}
                    </p>
                </div>
                <div className="min-w-0 rounded-2xl border bg-white p-2.5 shadow-sm ring-1 ring-red-200 sm:p-4">
                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                        Rejected
                    </p>
                    <p className="mt-1 text-base font-black leading-none text-red-700 sm:mt-2 sm:text-2xl">
                        {totals.rejectedCount}
                    </p>
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 shrink-0 text-[#0a2a5e]" aria-hidden />
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 sm:text-base">Monthly expense summary</h2>
                            <p className="text-[11px] text-gray-500 sm:text-xs">Month-wise total, approved & rejected</p>
                        </div>
                    </div>
                </div>

                <div className="px-3 py-3 sm:p-6">
                    {isLoading ? (
                        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#0a2a5e]" aria-hidden />
                            Loading monthly history…
                        </div>
                    ) : months.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                            <CalendarDays className="h-10 w-10 text-gray-300" aria-hidden />
                            <p className="text-sm font-medium text-gray-600">No expense records yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {months.map((row) => (
                                    <div
                                        key={row.month}
                                        className="rounded-2xl border border-[#0a2a5e]/10 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {formatMonthLabel(row.month)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {row.totalCount} expense{row.totalCount === 1 ? "" : "s"}
                                                </p>
                                            </div>
                                            <p className="text-base font-bold text-[#0a2a5e]">
                                                {formatCurrency(row.totalAmount)}
                                            </p>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-xl bg-emerald-50 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-emerald-800">
                                                    Approved
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-emerald-900">
                                                    {row.approvedCount}
                                                </p>
                                                <p className="text-[11px] font-medium text-emerald-700">
                                                    {formatCurrency(row.approvedAmount)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-red-50 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-red-800">
                                                    Rejected
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-red-900">
                                                    {row.rejectedCount}
                                                </p>
                                                <p className="text-[11px] font-medium text-red-700">
                                                    {formatCurrency(row.rejectedAmount)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-amber-50 px-2 py-2">
                                                <p className="text-[10px] font-bold uppercase text-amber-800">
                                                    Pending
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-amber-900">
                                                    {row.pendingCount}
                                                </p>
                                                <p className="text-[11px] font-medium text-amber-700">
                                                    {formatCurrency(row.pendingAmount)}
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
                                            <th className="px-3 py-2">Month</th>
                                            <th className="px-3 py-2">Total</th>
                                            <th className="px-3 py-2">Total amount</th>
                                            <th className="px-3 py-2">Approved</th>
                                            <th className="px-3 py-2">Approved amount</th>
                                            <th className="px-3 py-2">Rejected</th>
                                            <th className="px-3 py-2">Rejected amount</th>
                                            <th className="px-3 py-2">Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {months.map((row) => (
                                            <tr key={row.month} className="hover:bg-gray-50/80">
                                                <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-900">
                                                    {formatMonthLabel(row.month)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                                                    {row.totalCount}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#0a2a5e]">
                                                    {formatCurrency(row.totalAmount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-emerald-700">
                                                    {row.approvedCount}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-medium text-emerald-700">
                                                    {formatCurrency(row.approvedAmount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-red-700">
                                                    {row.rejectedCount}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-medium text-red-700">
                                                    {formatCurrency(row.rejectedAmount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-amber-700">
                                                    {row.pendingCount}
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
        </div>
    );
}
