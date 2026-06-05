"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPayrollMonthDisplay } from "@/lib/payrollCalculation";
import { downloadPayslipPdf, type PayslipPaymentRecord } from "@/lib/payrollPayslipExport";
import {
    ArrowLeft,
    Download,
    Loader2,
    Search,
} from "lucide-react";

type PayrollPaymentApi = PayslipPaymentRecord & {
    id: number;
    payment_status: string;
};

function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatPaidAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function PayrollHistoryPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto flex max-w-7xl items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0a2a5e]" />
                </div>
            }
        >
            <PayrollHistoryContent />
        </Suspense>
    );
}

function PayrollHistoryContent() {
    const searchParams = useSearchParams();
    const initialMonth = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

    const [payrollMonth, setPayrollMonth] = useState(initialMonth);
    const [search, setSearch] = useState("");
    const [payments, setPayments] = useState<PayrollPaymentApi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const inputClass =
        "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20";

    const fetchPayments = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const params = new URLSearchParams({ limit: "500" });
            if (payrollMonth) params.set("payroll_month", payrollMonth);

            const resp = await fetch(`/api/admin/payroll/payments?${params}`, {
                cache: "no-store",
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : "Failed to load payment history",
                );
            }
            setPayments(
                Array.isArray(data.payments) ? (data.payments as PayrollPaymentApi[]) : [],
            );
        } catch (error) {
            console.error("Payment history load failed:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load history");
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, [payrollMonth]);

    useEffect(() => {
        void fetchPayments();
    }, [fetchPayments]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return payments;
        return payments.filter(
            (p) =>
                p.employee_name.toLowerCase().includes(q) ||
                p.employee_id.toLowerCase().includes(q) ||
                p.payslip_number.toLowerCase().includes(q) ||
                p.department.toLowerCase().includes(q),
        );
    }, [payments, search]);

    const totalPaid = useMemo(
        () => filtered.reduce((sum, p) => sum + p.net_payable, 0),
        [filtered],
    );

    const handleDownload = async (payment: PayrollPaymentApi) => {
        setDownloadingId(payment.id);
        try {
            const resp = await fetch(
                `/api/admin/payroll/payments/${payment.id}?payslip=1`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : "Failed to load payslip data",
                );
            }
            await downloadPayslipPdf(data.payment as PayrollPaymentApi);
        } catch (error) {
            console.error("Payslip download failed:", error);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <div className="flex flex-col gap-3 rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin-dashboard/payroll"
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-3 w-3" aria-hidden />
                        Back to payroll
                    </Link>
                    <div className="sm:w-44">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Payroll month
                        </label>
                        <input
                            type="month"
                            value={payrollMonth}
                            onChange={(e) => setPayrollMonth(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <p className="text-sm text-gray-600 sm:pt-5">
                        {formatPayrollMonthDisplay(payrollMonth)}
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search employee or payslip…"
                        className={`${inputClass} pl-9`}
                    />
                </div>
            </div>

            {loadError ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Payments recorded
                    </p>
                    <p className="mt-2 text-3xl font-black tabular-nums text-[#0a2a5e]">
                        {isLoading ? "—" : filtered.length}
                    </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Total paid
                    </p>
                    <p className="mt-2 text-3xl font-black tabular-nums text-emerald-700">
                        {isLoading ? "—" : formatInr(totalPaid)}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Payment history</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Salary payments with payslip numbers and receipts.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Payslip
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Month
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Net paid
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Advance recovered
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Paid at
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Receipt
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No payments found for this period.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((payment, idx) => (
                                    <tr
                                        key={payment.id}
                                        className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-[#0a2a5e] sm:px-6">
                                            {payment.payslip_number}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {payment.employee_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{payment.employee_id}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                            {formatPayrollMonthDisplay(payment.payroll_month)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold tabular-nums text-emerald-800">
                                            {formatInr(payment.net_payable)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-blue-700">
                                            {formatInr(payment.advance_deduction)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                                            {formatPaidAt(payment.paid_at)}
                                        </td>
                                        <td className="px-4 py-4 text-right sm:px-6">
                                            <button
                                                type="button"
                                                onClick={() => void handleDownload(payment)}
                                                disabled={downloadingId === payment.id}
                                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#0a2a5e] hover:bg-gray-50 disabled:opacity-60"
                                            >
                                                {downloadingId === payment.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Download className="h-3.5 w-3.5" />
                                                )}
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
