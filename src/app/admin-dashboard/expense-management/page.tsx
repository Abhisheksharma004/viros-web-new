"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CheckCheck,
    Eye,
    FileSpreadsheet,
    FileText,
    Inbox,
    IndianRupee,
    LayoutList,
    Loader2,
    RefreshCw,
    Search,
    XCircle,
} from "lucide-react";
import type {
    AdminExpenseBatchSummary,
    AdminExpenseEmployeeSummary,
    EmployeeExpenseRow,
    ExpenseStatus,
} from "@/lib/employeeExpenses";
import {
    exportAdminExpenseEmployeeSummaryToExcel,
    exportAdminExpenseEmployeeSummaryToPdf,
    exportAdminExpensesToExcel,
    exportAdminExpensesToPdf,
    mapEmployeeSummariesToExportRows,
    mapExpensesToExportRows,
} from "@/lib/adminExpenseExport";
import {
    formatCurrency,
    formatExpenseDate,
    getAdminBatchReviewStatusLabel,
    getAdminBatchReviewStatusStyles,
    getExpenseStatusLabel,
    getExpenseStatusStyles,
    resolveExpenseApprovedAmount,
} from "@/lib/employeeExpenseUi";

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type TabId = "batches" | "lines";

type ExpensesPayload = {
    expenses: EmployeeExpenseRow[];
};

type EmployeeSummariesPayload = {
    employees: AdminExpenseEmployeeSummary[];
    batches: AdminExpenseBatchSummary[];
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
    const [tab, setTab] = useState<TabId>("batches");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [month, setMonth] = useState(() => currentMonth());
    const [query, setQuery] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [expenses, setExpenses] = useState<EmployeeExpenseRow[]>([]);
    const [batchSummaries, setBatchSummaries] = useState<AdminExpenseBatchSummary[]>([]);
    const [employeeSummaries, setEmployeeSummaries] = useState<AdminExpenseEmployeeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewExpense, setViewExpense] = useState<EmployeeExpenseRow | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [batchUpdatingId, setBatchUpdatingId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<EmployeeExpenseRow | null>(null);
    const [approveModal, setApproveModal] = useState<EmployeeExpenseRow | null>(null);
    const [approveAmount, setApproveAmount] = useState("");
    const [approveError, setApproveError] = useState("");
    const [batchRejectModal, setBatchRejectModal] = useState<AdminExpenseBatchSummary | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");
    const [exportBusy, setExportBusy] = useState<"excel" | "pdf" | null>(null);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);

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

    const loadBatchSummaries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("view", "monthly-batches");
            params.set("status", status);
            params.set("month", month);
            if (query.trim()) params.set("q", query.trim());

            const resp = await fetch(`/api/admin/expenses?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as EmployeeSummariesPayload & {
                message?: string;
            };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load batches");
            }
            setBatchSummaries(Array.isArray(data.batches) ? data.batches : []);
            setEmployeeSummaries(Array.isArray(data.employees) ? data.employees : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load batches");
            setBatchSummaries([]);
            setEmployeeSummaries([]);
        } finally {
            setLoading(false);
        }
    }, [status, month, query]);

    useEffect(() => {
        if (tab === "lines") {
            void loadExpenses();
        } else {
            void loadBatchSummaries();
        }
    }, [tab, loadExpenses, loadBatchSummaries]);

    const stats = useMemo(() => {
        if (tab === "batches") {
            const total = batchSummaries.reduce((sum, e) => sum + e.totalCount, 0);
            const totalAmount = batchSummaries.reduce((sum, e) => sum + e.totalAmount, 0);
            const pending = batchSummaries.reduce((sum, e) => sum + e.pendingCount, 0);
            const approved = batchSummaries.reduce((sum, e) => sum + e.approvedCount, 0);
            const rejected = batchSummaries.reduce((sum, e) => sum + e.rejectedCount, 0);
            const batchesAwaitingReview = batchSummaries.filter(
                (b) => b.batchStatus === "pending_review" || b.batchStatus === "partial",
            ).length;
            return { total, totalAmount, pending, approved, rejected, batchesAwaitingReview };
        }

        const total = expenses.length;
        const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const pending = expenses.filter((e) => e.status === "pending").length;
        const approved = expenses.filter((e) => e.status === "approved").length;
        const rejected = expenses.filter((e) => e.status === "rejected").length;
        return { total, totalAmount, pending, approved, rejected, batchesAwaitingReview: 0 };
    }, [tab, expenses, batchSummaries]);

    const selectedEmployeeLabel = useMemo(() => {
        if (!employeeFilter.trim()) return "";
        const match =
            expenses.find((e) => e.employee_id === employeeFilter) ??
            batchSummaries.find((e) => e.employeeId === employeeFilter) ??
            employeeSummaries.find((e) => e.employeeId === employeeFilter);
        if (!match) return employeeFilter;
        return "employee_name" in match
            ? `${match.employee_name || "Employee"} (${match.employee_id})`
            : `${match.employeeName || "Employee"} (${match.employeeId})`;
    }, [employeeFilter, expenses, batchSummaries, employeeSummaries]);

    const refreshAfterUpdate = () => {
        if (tab === "lines") void loadExpenses();
        else void loadBatchSummaries();
    };

    const setExpenseStatus = async (
        row: EmployeeExpenseRow,
        next: ExpenseStatus,
        options?: { rejectionReason?: string; approvedAmount?: number },
    ) => {
        setUpdatingId(row.id);
        try {
            const payload: Record<string, string | number> = { status: next };
            if (next === "rejected" && options?.rejectionReason) {
                payload.reject_reason = options.rejectionReason;
            }
            if (next === "approved" && options?.approvedAmount !== undefined) {
                payload.approved_amount = options.approvedAmount;
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
            if (approveModal?.id === updated.id) {
                setApproveModal(null);
                setApproveAmount("");
                setApproveError("");
            }
            refreshAfterUpdate();
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to update expense";
            if (rejectModal) {
                setRejectError(message);
            } else if (approveModal) {
                setApproveError(message);
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

    const openApproveModal = (row: EmployeeExpenseRow) => {
        setApproveModal(row);
        setApproveAmount(String(row.amount));
        setApproveError("");
    };

    const closeApproveModal = () => {
        if (updatingId === approveModal?.id) return;
        setApproveModal(null);
        setApproveAmount("");
        setApproveError("");
    };

    const confirmApprove = () => {
        if (!approveModal) return;
        const claimed = Number(approveModal.amount) || 0;
        const approved = Number.parseFloat(approveAmount);
        if (!Number.isFinite(approved) || approved <= 0) {
            setApproveError("Enter a valid approved amount greater than zero.");
            return;
        }
        if (approved > claimed) {
            setApproveError("Approved amount cannot exceed the claimed amount.");
            return;
        }
        void setExpenseStatus(approveModal, "approved", {
            approvedAmount: Math.round(approved * 100) / 100,
        });
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
        void setExpenseStatus(rejectModal, "rejected", { rejectionReason: reason });
    };

    const reviewBatch = async (
        batch: AdminExpenseBatchSummary,
        action: "approve" | "reject",
        rejectionReason?: string,
    ) => {
        if (action === "approve") {
            const confirmed = window.confirm(
                `Approve all ${batch.pendingCount} pending expense${batch.pendingCount === 1 ? "" : "s"} for ${batch.employeeName || batch.employeeId}?\n\nTotal claimed: ${formatCurrency(batch.pendingAmount)}\nEach expense will be approved at its full claimed amount.`,
            );
            if (!confirmed) return;
        }
        const batchKey = `${batch.employeeId}-${batch.month}`;
        setBatchUpdatingId(batchKey);
        setError("");
        try {
            const payload: Record<string, string> = {
                action,
                employee_id: batch.employeeId,
                month: batch.month || month,
            };
            if (action === "reject" && rejectionReason) {
                payload.reject_reason = rejectionReason;
            }

            const resp = await fetch("/api/admin/expenses/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update batch");
            }

            if (batchRejectModal?.employeeId === batch.employeeId) {
                setBatchRejectModal(null);
                setRejectReason("");
                setRejectError("");
            }
            refreshAfterUpdate();
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to update batch";
            if (batchRejectModal) setRejectError(message);
            else setError(message);
        } finally {
            setBatchUpdatingId(null);
        }
    };

    const openBatchRejectModal = (batch: AdminExpenseBatchSummary) => {
        setBatchRejectModal(batch);
        setRejectReason("");
        setRejectError("");
    };

    const closeBatchRejectModal = () => {
        if (batchUpdatingId) return;
        setBatchRejectModal(null);
        setRejectReason("");
        setRejectError("");
    };

    const confirmBatchReject = () => {
        if (!batchRejectModal) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError("Please enter a rejection reason.");
            return;
        }
        void reviewBatch(batchRejectModal, "reject", reason);
    };

    const openEmployeeExpenses = (employeeId: string) => {
        setEmployeeFilter(employeeId);
        setTab("lines");
    };

    const clearEmployeeFilter = () => setEmployeeFilter("");

    const refreshCurrentTab = () => {
        if (tab === "lines") void loadExpenses();
        else void loadBatchSummaries();
    };

    const expenseExportRows = useMemo(() => mapExpensesToExportRows(expenses), [expenses]);
    const employeeSummaryExportRows = useMemo(
        () => mapEmployeeSummariesToExportRows(batchSummaries.length ? batchSummaries : employeeSummaries),
        [batchSummaries, employeeSummaries],
    );

    const exportCount = tab === "lines" ? expenseExportRows.length : employeeSummaryExportRows.length;
    const canExport = !loading && exportCount > 0;

    const runExportExcel = async () => {
        if (!canExport) return;
        setExportBusy("excel");
        try {
            if (tab === "lines") {
                await exportAdminExpensesToExcel(expenseExportRows, monthLabel);
            } else {
                await exportAdminExpenseEmployeeSummaryToExcel(employeeSummaryExportRows, monthLabel);
            }
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Failed to export Excel file.");
        } finally {
            setExportBusy(null);
        }
    };

    const runExportPdf = async () => {
        if (!canExport) return;
        setExportBusy("pdf");
        try {
            if (tab === "lines") {
                await exportAdminExpensesToPdf(expenseExportRows, monthLabel);
            } else {
                await exportAdminExpenseEmployeeSummaryToPdf(employeeSummaryExportRows, monthLabel);
            }
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Failed to export PDF.");
        } finally {
            setExportBusy(null);
        }
    };

    const tabs: { id: TabId; label: string; icon: typeof Inbox }[] = [
        { id: "batches", label: "Monthly batches", icon: Inbox },
        { id: "lines", label: "Expense lines", icon: LayoutList },
    ];

    return (
        <div className="space-y-5">
            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="min-w-0 break-words">{error}</span>
                    <button
                        type="button"
                        onClick={refreshCurrentTab}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-2 text-xs font-semibold text-red-800"
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

            <div className="flex items-start gap-3 rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 px-4 py-3.5">
                <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-[#0a2a5e]" aria-hidden />
                <div>
                    <p className="text-sm font-bold text-[#0a2a5e]">Monthly batch submissions</p>
                    <p className="mt-0.5 text-xs text-[#0a2a5e]/80">
                        Employees add expenses throughout the month and submit them in one batch. Review each
                        employee&apos;s batch here, or open expense lines for line-by-line approval.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{monthLabel}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {tab === "batches" ? "Batches" : "Expense lines"}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                        {tab === "batches" ? batchSummaries.length : stats.total}
                    </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">Pending</p>
                    <p className="mt-1 text-xl font-bold text-amber-900">{stats.pending}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">Approved</p>
                    <p className="mt-1 text-xl font-bold text-emerald-900">{stats.approved}</p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800/80">Rejected</p>
                    <p className="mt-1 text-xl font-bold text-red-900">{stats.rejected}</p>
                </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
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
                                className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
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
                                    placeholder={tab === "batches" ? "Employee name or ID…" : "Expense ID, employee, title…"}
                                    className="h-11 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void runExportExcel()}
                            disabled={!canExport || exportBusy !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                                canExport
                                    ? `Export ${exportCount} row(s) from current tab to Excel`
                                    : "No data to export"
                            }
                        >
                            {exportBusy === "excel" ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <FileSpreadsheet className="h-4 w-4 text-green-700" aria-hidden />
                            )}
                            Export Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => void runExportPdf()}
                            disabled={!canExport || exportBusy !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                                canExport
                                    ? `Export ${exportCount} row(s) from current tab to PDF`
                                    : "No data to export"
                            }
                        >
                            {exportBusy === "pdf" ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <FileText className="h-4 w-4 text-red-700" aria-hidden />
                            )}
                            Export PDF
                        </button>
                        <button
                            type="button"
                            onClick={refreshCurrentTab}
                            disabled={loading || exportBusy !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <RefreshCw className="h-4 w-4" aria-hidden />
                            )}
                            Refresh
                        </button>
                    </div>
                </div>

                {tab === "lines" && employeeFilter ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 px-3 py-2">
                        <span className="text-xs font-semibold text-[#0a2a5e]">
                            Filtered by employee: {selectedEmployeeLabel}
                        </span>
                        <button
                            type="button"
                            onClick={clearEmployeeFilter}
                            className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#0a2a5e] shadow-sm hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                ) : null}
            </div>

            {tab === "lines" ? (
                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                        <h2 className="text-sm font-bold text-gray-900 sm:text-base">Expense lines</h2>
                        <p className="shrink-0 text-xs text-gray-500">{expenses.length} submitted records</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            Loading expenses…
                        </div>
                    ) : expenses.length === 0 ? (
                        <p className="px-4 py-14 text-center text-sm text-gray-500">
                            No submitted expenses found for {monthLabel}.
                        </p>
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
                                        <th className="px-6 py-3">Approved amt.</th>
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
                                            <td className="whitespace-nowrap px-6 py-4 font-semibold text-emerald-800">
                                                {row.status === "approved" ? (
                                                    (() => {
                                                        const approved = resolveExpenseApprovedAmount(row);
                                                        const partial =
                                                            approved !== null && approved < row.amount;
                                                        return (
                                                            <span className={partial ? "text-amber-800" : ""}>
                                                                {formatCurrency(approved ?? row.amount)}
                                                                {partial ? (
                                                                    <span className="ml-1 text-[10px] font-bold uppercase text-amber-700">
                                                                        Partial
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
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
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
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
                                                                onClick={() => openApproveModal(row)}
                                                                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={updatingId === row.id}
                                                                onClick={() => openRejectModal(row)}
                                                                className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
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
                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                        <h2 className="text-sm font-bold text-gray-900 sm:text-base">Monthly batches</h2>
                        <p className="shrink-0 text-xs text-gray-500">{batchSummaries.length} employees</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                            Loading monthly batches…
                        </div>
                    ) : batchSummaries.length === 0 ? (
                        <p className="px-4 py-14 text-center text-sm text-gray-500">
                            No submitted expense batches for {monthLabel}.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3 text-center">Expenses</th>
                                        <th className="px-6 py-3 text-right">Batch total</th>
                                        <th className="px-6 py-3">Batch status</th>
                                        <th className="px-6 py-3 text-center">Pending</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {batchSummaries.map((row) => {
                                        const batchKey = `${row.employeeId}-${row.month || month}`;
                                        const isUpdating = batchUpdatingId === batchKey;
                                        const canReviewBatch = row.pendingCount > 0;

                                        return (
                                            <tr key={row.employeeId} className="hover:bg-gray-50/80">
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
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getAdminBatchReviewStatusStyles(row.batchStatus)}`}
                                                    >
                                                        {getAdminBatchReviewStatusLabel(row.batchStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="font-bold text-amber-800">{row.pendingCount}</p>
                                                    <p className="text-xs text-amber-700/80">
                                                        {formatCurrency(row.pendingAmount)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEmployeeExpenses(row.employeeId)}
                                                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#0a2a5e]/15 bg-white px-3 text-xs font-semibold text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
                                                        >
                                                            <Eye className="h-4 w-4" aria-hidden />
                                                            View lines
                                                        </button>
                                                        {canReviewBatch ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={isUpdating}
                                                                    onClick={() => void reviewBatch(row, "approve")}
                                                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                                                                >
                                                                    {isUpdating ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                                    ) : (
                                                                        <CheckCheck className="h-4 w-4" aria-hidden />
                                                                    )}
                                                                    Approve all
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={isUpdating}
                                                                    onClick={() => openBatchRejectModal(row)}
                                                                    className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                                                                >
                                                                    Reject all
                                                                </button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && batchSummaries.length > 0 ? (
                        <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-6">
                            Approve or reject an employee&apos;s entire pending batch, or open expense lines for
                            individual review.
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
                        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-md"
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
                                className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Employee</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewExpense.employee_name || "—"}</p>
                                    <p className="text-xs text-gray-500">{viewExpense.employee_id}</p>
                                </div>
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</p>
                                    <p className="mt-1">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpenseStatusStyles(viewExpense.status)}`}>
                                            {getExpenseStatusLabel(viewExpense.status)}
                                        </span>
                                    </p>
                                </div>
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Date</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatExpenseDate(viewExpense.expense_date)}</p>
                                </div>
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Claimed amount</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(viewExpense.amount)}</p>
                                </div>
                                {viewExpense.status === "approved" ? (
                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Approved amount</p>
                                        <p className="mt-1 text-sm font-semibold text-emerald-900">
                                            {formatCurrency(resolveExpenseApprovedAmount(viewExpense) ?? viewExpense.amount)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Approved amount</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-400">—</p>
                                    </div>
                                )}
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Title</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewExpense.title}</p>
                                </div>
                                {viewExpense.from_address?.trim() ? (
                                    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">From address</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">{viewExpense.from_address}</p>
                                    </div>
                                ) : null}
                                {viewExpense.to_address?.trim() ? (
                                    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">To address</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">{viewExpense.to_address}</p>
                                    </div>
                                ) : null}
                                {viewExpense.status === "rejected" && viewExpense.reject_reason?.trim() ? (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 sm:col-span-2">
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
                                        onClick={() => openApproveModal(viewExpense)}
                                        className="h-11 w-full rounded-md bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updatingId === viewExpense.id}
                                        onClick={() => openRejectModal(viewExpense)}
                                        className="h-11 w-full rounded-md bg-red-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setViewExpense(null)}
                                className="h-11 w-full rounded-md border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {approveModal ? (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="expense-approve-modal-title"
                    onClick={closeApproveModal}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-white/10 bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4 text-white">
                            <h2 id="expense-approve-modal-title" className="text-lg font-bold">
                                Approve expense
                            </h2>
                            <p className="mt-0.5 font-mono text-xs text-emerald-100/90">{approveModal.expense_id}</p>
                            <p className="mt-1 text-xs text-white/85">
                                {approveModal.employee_name || "Employee"} · Claimed{" "}
                                {formatCurrency(approveModal.amount)}
                            </p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <p className="text-sm text-gray-600">
                                Enter the amount you are approving. You can approve the full claimed amount or a
                                lower partial amount.
                            </p>
                            <div>
                                <label
                                    htmlFor="expense-approve-amount"
                                    className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600"
                                >
                                    Approved amount (₹) <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <IndianRupee
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                        aria-hidden
                                    />
                                    <input
                                        id="expense-approve-amount"
                                        type="number"
                                        min="0.01"
                                        max={approveModal.amount}
                                        step="0.01"
                                        value={approveAmount}
                                        onChange={(e) => {
                                            setApproveAmount(e.target.value);
                                            setApproveError("");
                                        }}
                                        className="h-11 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Maximum: {formatCurrency(approveModal.amount)}
                                </p>
                            </div>
                            {approveError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {approveError}
                                </p>
                            ) : null}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeApproveModal}
                                    disabled={updatingId === approveModal.id}
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmApprove}
                                    disabled={updatingId === approveModal.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {updatingId === approveModal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <CheckCheck className="h-4 w-4" aria-hidden />
                                    )}
                                    Confirm approve
                                </button>
                            </div>
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
                        className="relative w-full max-w-md overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
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
                                    className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                            {rejectError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {rejectError}
                                </p>
                            ) : null}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    disabled={updatingId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmReject}
                                    disabled={updatingId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
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

            {batchRejectModal ? (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="batch-reject-modal-title"
                    onClick={closeBatchRejectModal}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-white/10 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-5 py-4 text-white">
                            <h2 id="batch-reject-modal-title" className="text-lg font-bold">
                                Reject entire batch
                            </h2>
                            <p className="mt-1 text-xs text-white/75">
                                {batchRejectModal.employeeName || "Employee"} · {batchRejectModal.employeeId}
                            </p>
                            <p className="mt-1 text-xs text-cyan-100/90">
                                {batchRejectModal.pendingCount} pending expense
                                {batchRejectModal.pendingCount === 1 ? "" : "s"} · {monthLabel}
                            </p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <p className="text-sm text-gray-600">
                                All pending expenses in this employee&apos;s monthly batch will be rejected with the
                                same reason.
                            </p>
                            <div>
                                <label
                                    htmlFor="batch-reject-reason"
                                    className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600"
                                >
                                    Rejection reason <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="batch-reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => {
                                        setRejectReason(e.target.value);
                                        setRejectError("");
                                    }}
                                    rows={4}
                                    placeholder="Reason for rejection…"
                                    className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                            {rejectError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {rejectError}
                                </p>
                            ) : null}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeBatchRejectModal}
                                    disabled={Boolean(batchUpdatingId)}
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmBatchReject}
                                    disabled={Boolean(batchUpdatingId)}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {batchUpdatingId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <XCircle className="h-4 w-4" aria-hidden />
                                    )}
                                    Reject batch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
