"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, LayoutList, Loader2, RefreshCw, Search, Users, XCircle } from "lucide-react";
import type { AdminExpenseEmployeeSummary, EmployeeExpenseRow, ExpenseStatus } from "@/lib/employeeExpenses";
import { formatCurrency, formatExpenseDate, getExpenseStatusLabel, getExpenseStatusStyles } from "@/lib/employeeExpenseUi";

type StatusFilter = ExpenseStatus | "all";
type TabId = "all" | "employee-wise";

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
};

type EmployeeSummariesPayload = {
    employees: AdminExpenseEmployeeSummary[];
};

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ExpenseManagementPage() {
    const [tab, setTab] = useState<TabId>("all");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [month, setMonth] = useState(() => currentMonth());
    const [query, setQuery] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [employeeSummaries, setEmployeeSummaries] = useState<AdminExpenseEmployeeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [rejectModal, setRejectModal] = useState<EmployeeExpenseRow | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("status", status);
            params.set("month", month);
            if (query.trim()) params.set("q", query.trim());
            if (employeeFilter.trim()) params.set("employeeId", employeeFilter.trim());
            params.set("limit", "300");

            const resp = await fetch(`/api/admin/expenses?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as ExpensesPayload & { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load expenses");
            }
            setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load expenses");
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    }, [status, month, query, employeeFilter]);

    const loadEmployeeSummaries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("view", "employee-wise");
            params.set("status", status);
            params.set("month", month);
            if (query.trim()) params.set("q", query.trim());

            const resp = await fetch(`/api/admin/expenses?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as EmployeeSummariesPayload & { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load employee summaries");
            }
            setEmployeeSummaries(Array.isArray(data.employees) ? data.employees : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load employee summaries");
            setEmployeeSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [status, month, query]);

    useEffect(() => {
        if (tab === "all") {
            void loadExpenses();
        } else {
            void loadEmployeeSummaries();
        }
    }, [tab, loadExpenses, loadEmployeeSummaries]);

    const stats = useMemo(() => {
        if (tab === "employee-wise") {
            const total = employeeSummaries.reduce((sum, e) => sum + e.totalCount, 0);
            const totalAmount = employeeSummaries.reduce((sum, e) => sum + e.totalAmount, 0);
            const pending = employeeSummaries.reduce((sum, e) => sum + e.pendingCount, 0);
            const approved = employeeSummaries.reduce((sum, e) => sum + e.approvedCount, 0);
            const rejected = employeeSummaries.reduce((sum, e) => sum + e.rejectedCount, 0);
            return { total, totalAmount, pending, approved, rejected };
        }

        const total = expenses.length;
        const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const pending = expenses.filter((e) => e.status === "pending").length;
        const approved = expenses.filter((e) => e.status === "approved").length;
        const rejected = expenses.filter((e) => e.status === "rejected").length;
        return { total, totalAmount, pending, approved, rejected };
    }, [tab, expenses, employeeSummaries]);

    const selectedEmployeeLabel = useMemo(() => {
        if (!employeeFilter.trim()) return "";
        const match = expenses.find((e) => e.employee_id === employeeFilter) ?? employeeSummaries.find((e) => e.employeeId === employeeFilter);
        if (!match) return employeeFilter;
        return "employee_name" in match
            ? `${match.employee_name || "Employee"} (${match.employee_id})`
            : `${match.employeeName || "Employee"} (${match.employeeId})`;
    }, [employeeFilter, expenses, employeeSummaries]);

    const setExpenseStatus = async (
        row: EmployeeExpenseRow,
        next: ExpenseStatus,
        rejectionReason?: string,
    ) => {
        setUpdatingId(row.id);
        try {
            const payload: Record<string, string> = { status: next };
            if (next === "rejected" && rejectionReason) {
                payload.reject_reason = rejectionReason;
            }

            const resp = await fetch(`/api/admin/expenses/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update expense");
            }
            const updated = data as EmployeeExpenseRow;
            setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            if (viewExpense?.id === updated.id) setViewExpense(updated);
            if (rejectModal?.id === updated.id) {
                setRejectModal(null);
                setRejectReason("");
                setRejectError("");
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to update expense";
            if (rejectModal) {
                setRejectError(message);
            } else {
                setError(message);
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const openRejectModal = (row: EmployeeExpenseRow) => {
        setRejectModal(row);
        setRejectReason("");
        setRejectError("");
    };

    const closeRejectModal = () => {
        if (updatingId === rejectModal?.id) return;
        setRejectModal(null);
        setRejectReason("");
        setRejectError("");
    };

    const confirmReject = () => {
        if (!rejectModal) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError("Please enter a rejection reason.");
            return;
        }
        void setExpenseStatus(rejectModal, "rejected", reason);
    };

    const openEmployeeExpenses = (employeeId: string) => {
        setEmployeeFilter(employeeId);
        setTab("all");
    };

    const clearEmployeeFilter = () => setEmployeeFilter("");

    const refreshCurrentTab = () => {
        if (tab === "all") void loadExpenses();
        else void loadEmployeeSummaries();
    };

    const tabs: { id: TabId; label: string; icon: typeof LayoutList }[] = [
        { id: "all", label: "All expenses", icon: LayoutList },
        { id: "employee-wise", label: "Employee-wise", icon: Users },
    ];

    return (
        <div className="space-y-5">
            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="min-w-0 break-words">{error}</span>
                    <button
                        type="button"
                        onClick={refreshCurrentTab}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-800"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                                active
                                    ? "bg-[#0a2a5e] text-white shadow-sm"
                                    : "text-gray-800 hover:bg-gray-100"
                            }`}
                        >
                            <Icon className="h-4 w-4" aria-hidden />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{formatMonthLabel(month)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {tab === "employee-wise" ? "Employees" : "Total"}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">Pending</p>
                    <p className="mt-1 text-xl font-bold text-amber-900">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">Approved</p>
                    <p className="mt-1 text-xl font-bold text-emerald-900">{stats.approved}</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800/80">Rejected</p>
                    <p className="mt-1 text-xl font-bold text-red-900">{stats.rejected}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                Month
                            </label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={tab === "employee-wise" ? "Employee name or ID…" : "Expense ID, employee, title…"}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {tab === "all" && employeeFilter ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 px-3 py-2">
                        <span className="text-xs font-semibold text-[#0a2a5e]">
                            Filtered by employee: {selectedEmployeeLabel}
                        </span>
                        <button
                            type="button"
                            onClick={clearEmployeeFilter}
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#0a2a5e] shadow-sm hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                ) : null}
            </div>

            {tab === "all" ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                        <h2 className="text-sm font-bold text-gray-900 sm:text-base">Expense claims</h2>
                        <p className="shrink-0 text-xs text-gray-500">{expenses.length} records</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            Loading expenses…
                        </div>
                    ) : expenses.length === 0 ? (
                        <p className="px-4 py-14 text-center text-sm text-gray-500">No expenses found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-6 py-3">Expense ID</th>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Title</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expenses.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/80">
                                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-semibold text-[#0a2a5e]">
                                                {row.expense_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {row.employee_name || "—"}
                                                </p>
                                                <p className="text-xs text-gray-500">{row.employee_id}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                                                {formatExpenseDate(row.expense_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-gray-700">{row.category}</td>
                                            <td className="max-w-[320px] truncate px-6 py-4 font-medium text-gray-900">
                                                {row.title}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                                                {formatCurrency(row.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpenseStatusStyles(row.status)}`}>
                                                    {getExpenseStatusLabel(row.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewExpense(row)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
                                                        title="View"
                                                        aria-label="View"
                                                    >
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    </button>
                                                    {row.status === "pending" ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={updatingId === row.id}
                                                                onClick={() => void setExpenseStatus(row, "approved")}
                                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={updatingId === row.id}
                                                                onClick={() => openRejectModal(row)}
                                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                        <h2 className="text-sm font-bold text-gray-900 sm:text-base">Employee-wise summary</h2>
                        <p className="shrink-0 text-xs text-gray-500">{employeeSummaries.length} employees</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            Loading employee summaries…
                        </div>
                    ) : employeeSummaries.length === 0 ? (
                        <p className="px-4 py-14 text-center text-sm text-gray-500">No employee expense data found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3 text-center">Claims</th>
                                        <th className="px-6 py-3 text-right">Total amount</th>
                                        <th className="px-6 py-3 text-center">Pending</th>
                                        <th className="px-6 py-3 text-center">Approved</th>
                                        <th className="px-6 py-3 text-center">Rejected</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {employeeSummaries.map((row) => (
                                        <tr
                                            key={row.employeeId}
                                            className="cursor-pointer hover:bg-[#06b6d4]/5"
                                            onClick={() => openEmployeeExpenses(row.employeeId)}
                                            title="View all expenses for this employee"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {row.employeeName || "—"}
                                                </p>
                                                <p className="text-xs text-gray-500">{row.employeeId}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900">
                                                {row.totalCount}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-[#0a2a5e]">
                                                {formatCurrency(row.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="font-bold text-amber-800">{row.pendingCount}</p>
                                                <p className="text-xs text-amber-700/80">{formatCurrency(row.pendingAmount)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="font-bold text-emerald-800">{row.approvedCount}</p>
                                                <p className="text-xs text-emerald-700/80">{formatCurrency(row.approvedAmount)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="font-bold text-red-800">{row.rejectedCount}</p>
                                                <p className="text-xs text-red-700/80">{formatCurrency(row.rejectedAmount)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && employeeSummaries.length > 0 ? (
                        <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-6">
                            Click a row to open all expenses for that employee.
                        </p>
                    ) : null}
                </div>
            )}

            {viewExpense ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
                    <div className="absolute inset-0 bg-black/40" aria-hidden onClick={() => setViewExpense(null)} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-white">Expense details</h3>
                                <p className="mt-0.5 font-mono text-xs text-cyan-100/90">{viewExpense.expense_id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewExpense(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Employee</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewExpense.employee_name || "—"}</p>
                                    <p className="text-xs text-gray-500">{viewExpense.employee_id}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</p>
                                    <p className="mt-1">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpenseStatusStyles(viewExpense.status)}`}>
                                            {getExpenseStatusLabel(viewExpense.status)}
                                        </span>
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Date</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatExpenseDate(viewExpense.expense_date)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Amount</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(viewExpense.amount)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Title</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewExpense.title}</p>
                                </div>
                                {viewExpense.from_address?.trim() ? (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">From address</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">{viewExpense.from_address}</p>
                                    </div>
                                ) : null}
                                {viewExpense.to_address?.trim() ? (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">To address</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">{viewExpense.to_address}</p>
                                    </div>
                                ) : null}
                                {viewExpense.status === "rejected" && viewExpense.reject_reason?.trim() ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-red-800">Rejection reason</p>
                                        <p className="mt-1 text-sm font-semibold text-red-900 whitespace-pre-wrap break-words">
                                            {viewExpense.reject_reason}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            {viewExpense.status === "pending" ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={updatingId === viewExpense.id}
                                        onClick={() => void setExpenseStatus(viewExpense, "approved")}
                                        className="h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updatingId === viewExpense.id}
                                        onClick={() => openRejectModal(viewExpense)}
                                        className="h-11 w-full rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setViewExpense(null)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {rejectModal ? (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="expense-reject-modal-title"
                    onClick={closeRejectModal}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-white/10 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-5 py-4 text-white">
                            <h2 id="expense-reject-modal-title" className="text-lg font-bold">
                                Reject expense
                            </h2>
                            <p className="mt-0.5 font-mono text-xs text-cyan-100/90">{rejectModal.expense_id}</p>
                            <p className="mt-1 text-xs text-white/75">
                                {rejectModal.employee_name || "Employee"} · {rejectModal.employee_id}
                            </p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <p className="text-sm text-gray-600">
                                Enter why this expense claim is being rejected. The employee will see this reason.
                            </p>
                            <div>
                                <label htmlFor="expense-reject-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                    Rejection reason <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="expense-reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => {
                                        setRejectReason(e.target.value);
                                        setRejectError("");
                                    }}
                                    rows={4}
                                    placeholder="Reason for rejection…"
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                            {rejectError ? (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {rejectError}
                                </p>
                            ) : null}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    disabled={updatingId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmReject}
                                    disabled={updatingId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {updatingId === rejectModal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <XCircle className="h-4 w-4" aria-hidden />
                                    )}
                                    Confirm reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
