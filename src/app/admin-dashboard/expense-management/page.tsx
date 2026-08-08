"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Check,
    CheckCheck,
    CreditCard,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Inbox,
    IndianRupee,
    LayoutList,
    Loader2,
    Mail,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import Toast from "@/components/Toast";
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
    exportEmployeeWiseExpensesToPdf,
    mapEmployeeSummariesToExportRows,
    mapExpensesToExportRows,
} from "@/lib/adminExpenseExport";
import {
    formatCurrency,
    formatExpenseDate,
    getAdminBatchPaymentStatusLabel,
    getAdminBatchPaymentStatusStyles,
    getAdminBatchReviewStatusLabel,
    getAdminBatchReviewStatusStyles,
    getExpensePaymentStatusLabel,
    getExpensePaymentStatusStyles,
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
    const [reworkModal, setReworkModal] = useState<EmployeeExpenseRow | null>(null);
    const [reworkReason, setReworkReason] = useState("");
    const [reworkError, setReworkError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [exportBusy, setExportBusy] = useState<"excel" | "pdf" | null>(null);
    const [pdfDownloadingId, setPdfDownloadingId] = useState<string | null>(null);
    const [emailSendingId, setEmailSendingId] = useState<string | null>(null);
    const [toastState, setToastState] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [emailConfirmTarget, setEmailConfirmTarget] = useState<AdminExpenseBatchSummary | null>(null);
    const [payConfirmTarget, setPayConfirmTarget] = useState<{ batch: AdminExpenseBatchSummary; paymentStatus: "paid" | "hold" | "unpaid" } | null>(null);
    const [approveAllConfirmTarget, setApproveAllConfirmTarget] = useState<AdminExpenseBatchSummary | null>(null);
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<EmployeeExpenseRow | null>(null);

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

    const executeDeleteExpense = async (row: EmployeeExpenseRow) => {
        setDeletingId(row.id);
        setError("");
        try {
            const resp = await fetch(`/api/admin/expenses/${row.id}`, { method: "DELETE" });
            const data = (await resp.json().catch(() => ({}))) as { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to delete expense");
            }
            setExpenses((prev) => prev.filter((e) => e.id !== row.id));
            if (viewExpense?.id === row.id) setViewExpense(null);
            setDeleteConfirmTarget(null);
            refreshAfterUpdate();
            setToastState({ message: `Expense claim ${row.expense_id} permanently deleted.`, type: "success" });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to delete expense";
            setError(msg);
            setToastState({ message: msg, type: "error" });
        } finally {
            setDeletingId(null);
        }
    };

    const openReworkModal = (row: EmployeeExpenseRow) => {
        setReworkModal(row);
        setReworkReason("");
        setReworkError("");
    };

    const closeReworkModal = () => {
        if (updatingId === reworkModal?.id) return;
        setReworkModal(null);
        setReworkReason("");
        setReworkError("");
    };

    const confirmRework = async () => {
        if (!reworkModal) return;
        setUpdatingId(reworkModal.id);
        setReworkError("");
        try {
            const payload: Record<string, string> = { action: "rework" };
            const reason = reworkReason.trim();
            if (reason) payload.rework_reason = reason;

            const resp = await fetch(`/api/admin/expenses/${reworkModal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to send for rework");
            }

            setExpenses((prev) => prev.filter((e) => e.id !== reworkModal.id));
            if (viewExpense?.id === reworkModal.id) setViewExpense(null);
            setReworkModal(null);
            setReworkReason("");
            refreshAfterUpdate();
        } catch (e) {
            setReworkError(e instanceof Error ? e.message : "Failed to send for rework");
        } finally {
            setUpdatingId(null);
        }
    };

    const reviewBatch = async (
        batch: AdminExpenseBatchSummary,
        action: "approve" | "reject",
        rejectionReason?: string,
    ) => {
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
            setApproveAllConfirmTarget(null);
            refreshAfterUpdate();
            setToastState({
                message: action === "approve"
                    ? `All pending claims approved for ${batch.employeeName || batch.employeeId}.`
                    : `Batch rejected for ${batch.employeeName || batch.employeeId}.`,
                type: "success",
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to update batch";
            if (batchRejectModal) setRejectError(message);
            else setError(message);
            setToastState({ message, type: "error" });
        } finally {
            setBatchUpdatingId(null);
        }
    };

    const markBatchPayment = async (
        batch: AdminExpenseBatchSummary,
        paymentStatus: "paid" | "hold" | "unpaid",
    ) => {
        const batchKey = `${batch.employeeId}-${batch.month || month}`;
        setBatchUpdatingId(batchKey);
        setError("");
        try {
            const resp = await fetch("/api/admin/expenses/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: paymentStatus === "paid" ? "mark_paid" : "mark_unpaid",
                    employee_id: batch.employeeId,
                    month: batch.month || month,
                }),
            });
            const data = (await resp.json().catch(() => ({}))) as { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update payment status");
            }
            setPayConfirmTarget(null);
            refreshAfterUpdate();
            setToastState({
                message: `Payment status updated to ${paymentStatus === "paid" ? "Paid" : "Hold"} for ${batch.employeeName || batch.employeeId}.`,
                type: "success",
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to update payment status";
            setError(msg);
            setToastState({ message: msg, type: "error" });
        } finally {
            setBatchUpdatingId(null);
        }
    };

    const sendBatchEmail = async (batch: AdminExpenseBatchSummary) => {
        const batchKey = `${batch.employeeId}-${batch.month || month}`;
        setEmailSendingId(batchKey);
        setError("");
        try {
            const resp = await fetch("/api/admin/expenses/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: batch.employeeId,
                    month: batch.month || month,
                }),
            });
            const data = (await resp.json().catch(() => ({}))) as { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to send email");
            }
            setEmailConfirmTarget(null);
            setToastState({
                message: data.message || `Expense Reimbursement Statement PDF emailed successfully to ${batch.employeeName || batch.employeeId}.`,
                type: "success",
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to send email";
            setError(msg);
            setToastState({ message: msg, type: "error" });
        } finally {
            setEmailSendingId(null);
        }
    };

    const markExpensePayment = async (
        row: EmployeeExpenseRow,
        paymentStatus: "paid" | "hold" | "unpaid",
    ) => {
        setUpdatingId(row.id);
        setError("");
        try {
            const resp = await fetch(`/api/admin/expenses/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_status: paymentStatus }),
            });
            const data = (await resp.json().catch(() => ({}))) as { message?: string };
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update payment status");
            }
            setExpenses((prev) =>
                prev.map((e) => (e.id === row.id ? { ...e, payment_status: paymentStatus } : e)),
            );
            if (viewExpense?.id === row.id) {
                setViewExpense((prev) => (prev ? { ...prev, payment_status: paymentStatus } : null));
            }
            refreshAfterUpdate();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update payment status");
        } finally {
            setUpdatingId(null);
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

    const downloadEmployeePdf = async (row: AdminExpenseBatchSummary) => {
        const key = `${row.employeeId}-${row.month || month}`;
        setPdfDownloadingId(key);
        try {
            const params = new URLSearchParams();
            params.set("employeeId", row.employeeId);
            params.set("month", row.month || month);
            params.set("limit", "500");

            const resp = await fetch(`/api/admin/expenses?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as {
                expenses?: EmployeeExpenseRow[];
                message?: string;
            };

            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load employee expenses");
            }

            const empExpenses = Array.isArray(data.expenses) ? data.expenses : [];
            if (empExpenses.length === 0) {
                window.alert(`No submitted expenses found for ${row.employeeName || row.employeeId}.`);
                return;
            }

            await exportEmployeeWiseExpensesToPdf(
                empExpenses,
                {
                    employeeId: row.employeeId,
                    employeeName: row.employeeName || row.employeeId,
                },
                formatMonthLabel(row.month || month),
            );
        } catch (e) {
            window.alert(e instanceof Error ? e.message : "Failed to download PDF");
        } finally {
            setPdfDownloadingId(null);
        }
    };

    const downloadSingleExpensePdf = async (row: EmployeeExpenseRow) => {
        setPdfDownloadingId(`single-${row.id}`);
        try {
            await exportEmployeeWiseExpensesToPdf(
                [row],
                {
                    employeeId: row.employee_id,
                    employeeName: row.employee_name || row.employee_id,
                },
                formatExpenseDate(row.expense_date),
            );
        } catch (e) {
            window.alert(e instanceof Error ? e.message : "Failed to download PDF");
        } finally {
            setPdfDownloadingId(null);
        }
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
                                        <th className="px-6 py-3">Expense ID / Date</th>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Category / Title</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Approved amt.</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Payment status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expenses.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50/80">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <p className="font-mono text-xs font-semibold text-[#0a2a5e]">
                                                    {row.expense_id}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {formatExpenseDate(row.expense_date)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {row.employee_name || "—"}
                                                </p>
                                                <p className="text-xs text-gray-500">{row.employee_id}</p>
                                            </td>
                                            <td className="max-w-[280px] px-6 py-4">
                                                <p className="truncate font-medium text-gray-900">{row.category}</p>
                                                <p className="mt-0.5 truncate text-xs text-gray-500">{row.title}</p>
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
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getExpensePaymentStatusStyles(row.payment_status)}`}>
                                                    {getExpensePaymentStatusLabel(row.payment_status)}
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
                                                    <button
                                                        type="button"
                                                        disabled={pdfDownloadingId === `single-${row.id}`}
                                                        onClick={() => void downloadSingleExpensePdf(row)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                                                        title="Download PDF"
                                                        aria-label="Download PDF"
                                                    >
                                                        {pdfDownloadingId === `single-${row.id}` ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                        ) : (
                                                            <Download className="h-4 w-4" aria-hidden />
                                                        )}
                                                    </button>
                                                    {row.status === "approved" ? (
                                                        <button
                                                            type="button"
                                                            disabled={updatingId === row.id}
                                                            onClick={() => void markExpensePayment(row, row.payment_status === "paid" ? "hold" : "paid")}
                                                            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
                                                                row.payment_status === "paid"
                                                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                                    : "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                                                            }`}
                                                            title={row.payment_status === "paid" ? "Click to mark Hold" : "Click to mark Paid"}
                                                        >
                                                            {updatingId === row.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                            ) : row.payment_status === "paid" ? (
                                                                <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                                                            ) : (
                                                                <CreditCard className="h-4 w-4 text-white" aria-hidden />
                                                            )}
                                                            {row.payment_status === "paid" ? "Paid" : "Pay"}
                                                        </button>
                                                    ) : null}
                                                    {row.status === "pending" ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={updatingId === row.id || deletingId === row.id}
                                                                onClick={() => openApproveModal(row)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                                                                title="Approve"
                                                                aria-label="Approve"
                                                            >
                                                                {updatingId === row.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                                ) : (
                                                                    <CheckCheck className="h-4 w-4" aria-hidden />
                                                                )}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={updatingId === row.id || deletingId === row.id}
                                                                onClick={() => openRejectModal(row)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                                                                title="Reject"
                                                                aria-label="Reject"
                                                            >
                                                                <XCircle className="h-4 w-4" aria-hidden />
                                                            </button>
                                                        </>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        disabled={updatingId === row.id || deletingId === row.id}
                                                        onClick={() => openReworkModal(row)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-amber-300 bg-amber-50 text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:opacity-60"
                                                        title="Send back to employee for rework"
                                                        aria-label="Rework"
                                                    >
                                                        <RotateCcw className="h-4 w-4" aria-hidden />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={updatingId === row.id || deletingId === row.id}
                                                        onClick={() => setDeleteConfirmTarget(row)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-60"
                                                        title="Delete expense"
                                                        aria-label="Delete expense"
                                                    >
                                                        {deletingId === row.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" aria-hidden />
                                                        )}
                                                    </button>
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
                                        <th className="px-6 py-3">Payment status</th>
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
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getAdminBatchPaymentStatusStyles(row.paymentStatus)}`}
                                                    >
                                                        {getAdminBatchPaymentStatusLabel(row.paymentStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="font-bold text-amber-800">{row.pendingCount}</p>
                                                    <p className="text-xs text-amber-700/80">
                                                        {formatCurrency(row.pendingAmount)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEmployeeExpenses(row.employeeId)}
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
                                                            title="View lines"
                                                            aria-label="View lines"
                                                        >
                                                            <Eye className="h-4 w-4" aria-hidden />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={pdfDownloadingId === `${row.employeeId}-${row.month || month}`}
                                                            onClick={() => void downloadEmployeePdf(row)}
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                                                            title="Download PDF"
                                                            aria-label="Download PDF"
                                                        >
                                                            {pdfDownloadingId === `${row.employeeId}-${row.month || month}` ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                            ) : (
                                                                <Download className="h-4 w-4 text-red-600" aria-hidden />
                                                            )}
                                                        </button>
                                                        {row.approvedCount > 0 ? (
                                                            <button
                                                                type="button"
                                                                disabled={isUpdating}
                                                                onClick={() => setPayConfirmTarget({ batch: row, paymentStatus: row.paymentStatus === "paid" ? "hold" : "paid" })}
                                                                className={`inline-flex h-10 w-10 items-center justify-center rounded-md border shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
                                                                    row.paymentStatus === "paid"
                                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                                        : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                                                                }`}
                                                                title={row.paymentStatus === "paid" ? "Paid (Click to mark Hold)" : "Pay approved reimbursement"}
                                                                aria-label={row.paymentStatus === "paid" ? "Paid" : "Pay"}
                                                            >
                                                                {isUpdating ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                                ) : row.paymentStatus === "paid" ? (
                                                                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                                                                ) : (
                                                                    <CreditCard className="h-4 w-4 text-white" aria-hidden />
                                                                )}
                                                            </button>
                                                        ) : null}
                                                        {row.paymentStatus === "paid" ? (
                                                            <button
                                                                type="button"
                                                                disabled={emailSendingId === `${row.employeeId}-${row.month || month}`}
                                                                onClick={() => setEmailConfirmTarget(row)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-60"
                                                                title="Send Expense Statement PDF via Email"
                                                                aria-label="Send Expense Statement PDF via Email"
                                                            >
                                                                {emailSendingId === `${row.employeeId}-${row.month || month}` ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                                ) : (
                                                                    <Mail className="h-4 w-4 text-sky-600" aria-hidden />
                                                                )}
                                                            </button>
                                                        ) : null}
                                                        {canReviewBatch ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={isUpdating}
                                                                    onClick={() => setApproveAllConfirmTarget(row)}
                                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-emerald-600 bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
                                                                    title="Approve all pending claims"
                                                                    aria-label="Approve all pending claims"
                                                                >
                                                                    {isUpdating ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                                    ) : (
                                                                        <CheckCheck className="h-4 w-4" aria-hidden />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={isUpdating}
                                                                    onClick={() => openBatchRejectModal(row)}
                                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-600 bg-red-600 text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
                                                                    title="Reject all pending claims"
                                                                    aria-label="Reject all pending claims"
                                                                >
                                                                    <XCircle className="h-4 w-4" aria-hidden />
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
                        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
                            {viewExpense.status === "pending" ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={updatingId === viewExpense.id || deletingId === viewExpense.id}
                                        onClick={() => openApproveModal(viewExpense)}
                                        className="h-11 w-full rounded-md bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updatingId === viewExpense.id || deletingId === viewExpense.id}
                                        onClick={() => openRejectModal(viewExpense)}
                                        className="h-11 w-full rounded-md bg-red-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : null}
                            <button
                                type="button"
                                disabled={updatingId === viewExpense.id || deletingId === viewExpense.id}
                                onClick={() => openReworkModal(viewExpense)}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-60 sm:w-auto"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden />
                                Send for rework
                            </button>
                            <button
                                type="button"
                                disabled={updatingId === viewExpense.id || deletingId === viewExpense.id}
                                onClick={() => setDeleteConfirmTarget(viewExpense)}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:w-auto"
                            >
                                {deletingId === viewExpense.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                ) : (
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                )}
                                Delete
                            </button>
                            <button
                                type="button"
                                disabled={pdfDownloadingId === `single-${viewExpense.id}`}
                                onClick={() => void downloadSingleExpensePdf(viewExpense)}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:w-auto"
                            >
                                {pdfDownloadingId === `single-${viewExpense.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                ) : (
                                    <Download className="h-4 w-4" aria-hidden />
                                )}
                                Download PDF
                            </button>
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

            {reworkModal ? (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="expense-rework-modal-title"
                    onClick={closeReworkModal}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-white/10 bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-4 text-white">
                            <h2 id="expense-rework-modal-title" className="text-lg font-bold">
                                Send for rework
                            </h2>
                            <p className="mt-0.5 font-mono text-xs text-amber-100/90">{reworkModal.expense_id}</p>
                            <p className="mt-1 text-xs text-white/85">
                                {reworkModal.employee_name || "Employee"} · {formatCurrency(reworkModal.amount)}
                            </p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <p className="text-sm text-gray-600">
                                This expense will return to the employee as a draft. They can edit it and
                                resubmit for approval. Optionally add a note explaining what needs to be fixed.
                            </p>
                            <div>
                                <label
                                    htmlFor="expense-rework-reason"
                                    className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600"
                                >
                                    Rework note (optional)
                                </label>
                                <textarea
                                    id="expense-rework-reason"
                                    value={reworkReason}
                                    onChange={(e) => {
                                        setReworkReason(e.target.value);
                                        setReworkError("");
                                    }}
                                    rows={4}
                                    placeholder="What should the employee update?"
                                    className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                                />
                            </div>
                            {reworkError ? (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {reworkError}
                                </p>
                            ) : null}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeReworkModal}
                                    disabled={updatingId === reworkModal.id}
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void confirmRework()}
                                    disabled={updatingId === reworkModal.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-600 px-6 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                    {updatingId === reworkModal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <RotateCcw className="h-4 w-4" aria-hidden />
                                    )}
                                    Confirm rework
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

            {/* Email Confirmation Popup Modal */}
            {emailConfirmTarget ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => !emailSendingId && setEmailConfirmTarget(null)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setEmailConfirmTarget(null)}
                            disabled={Boolean(emailSendingId)}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Expense Email</h3>
                                <p className="text-xs font-medium text-gray-500">{monthLabel}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Employee</span>
                                <span className="font-semibold text-gray-900">{emailConfirmTarget.employeeName || emailConfirmTarget.employeeId} ({emailConfirmTarget.employeeId})</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Approved Claims</span>
                                <span className="font-semibold text-gray-900">{emailConfirmTarget.approvedCount} record(s)</span>
                            </div>
                            <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">Reimbursement Paid</span>
                                <span className="text-xl font-black text-sky-700">{formatCurrency(emailConfirmTarget.approvedAmount)}</span>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            Official Expense Reimbursement Statement PDF document will be emailed directly to the employee&apos;s registered email address(es).
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setEmailConfirmTarget(null)}
                                disabled={Boolean(emailSendingId)}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void sendBatchEmail(emailConfirmTarget)}
                                disabled={Boolean(emailSendingId)}
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 disabled:opacity-60 transition-all"
                            >
                                {emailSendingId ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        Confirm & Send Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Payment Confirmation Popup Modal */}
            {payConfirmTarget ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => !batchUpdatingId && setPayConfirmTarget(null)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setPayConfirmTarget(null)}
                            disabled={Boolean(batchUpdatingId)}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {payConfirmTarget.paymentStatus === "paid" ? "Confirm Payment" : "Revert to Hold"}
                                </h3>
                                <p className="text-xs font-medium text-gray-500">{monthLabel}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Employee</span>
                                <span className="font-semibold text-gray-900">{payConfirmTarget.batch.employeeName || payConfirmTarget.batch.employeeId} ({payConfirmTarget.batch.employeeId})</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Approved Claims</span>
                                <span className="font-semibold text-gray-900">{payConfirmTarget.batch.approvedCount} record(s)</span>
                            </div>
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">Total Approved Amount</span>
                                <span className="text-xl font-black text-emerald-700">{formatCurrency(payConfirmTarget.batch.approvedAmount)}</span>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            {payConfirmTarget.paymentStatus === "paid"
                                ? "This action will mark all approved reimbursement claims for this employee as Paid."
                                : "This action will revert payment status to Hold."}
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setPayConfirmTarget(null)}
                                disabled={Boolean(batchUpdatingId)}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void markBatchPayment(payConfirmTarget.batch, payConfirmTarget.paymentStatus)}
                                disabled={Boolean(batchUpdatingId)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                            >
                                {batchUpdatingId ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating…
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        {payConfirmTarget.paymentStatus === "paid" ? "Confirm & Mark Paid" : "Confirm & Set Hold"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Approve All Confirmation Popup Modal */}
            {approveAllConfirmTarget ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => !batchUpdatingId && setApproveAllConfirmTarget(null)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setApproveAllConfirmTarget(null)}
                            disabled={Boolean(batchUpdatingId)}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Batch Approval</h3>
                                <p className="text-xs font-medium text-gray-500">{monthLabel}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Employee</span>
                                <span className="font-semibold text-gray-900">{approveAllConfirmTarget.employeeName || approveAllConfirmTarget.employeeId} ({approveAllConfirmTarget.employeeId})</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Pending Claims</span>
                                <span className="font-semibold text-gray-900">{approveAllConfirmTarget.pendingCount} record(s)</span>
                            </div>
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">Total Pending Amount</span>
                                <span className="text-xl font-black text-emerald-700">{formatCurrency(approveAllConfirmTarget.pendingAmount)}</span>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            All pending claims will be approved at full claimed value, and payment status will become Hold.
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setApproveAllConfirmTarget(null)}
                                disabled={Boolean(batchUpdatingId)}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void reviewBatch(approveAllConfirmTarget, "approve")}
                                disabled={Boolean(batchUpdatingId)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                            >
                                {batchUpdatingId ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Approving…
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck className="h-4 w-4" />
                                        Confirm & Approve All
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Delete Expense Confirmation Popup Modal */}
            {deleteConfirmTarget ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => !deletingId && setDeleteConfirmTarget(null)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget(null)}
                            disabled={Boolean(deletingId)}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Expense Claim</h3>
                                <p className="text-xs font-medium text-gray-500">{deleteConfirmTarget.expense_id}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Employee</span>
                                <span className="font-semibold text-gray-900">{deleteConfirmTarget.employee_name || deleteConfirmTarget.employee_id}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Title / Purpose</span>
                                <span className="font-semibold text-gray-900">{deleteConfirmTarget.title}</span>
                            </div>
                            <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">Claim Amount</span>
                                <span className="text-xl font-black text-red-700">{formatCurrency(deleteConfirmTarget.amount)}</span>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            This will permanently delete this expense claim from the database. This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget(null)}
                                disabled={Boolean(deletingId)}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void executeDeleteExpense(deleteConfirmTarget)}
                                disabled={Boolean(deletingId)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-all"
                            >
                                {deletingId ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Deleting…
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Confirm & Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {toastState ? (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                    duration={4500}
                />
            ) : null}
        </div>
    );
}
