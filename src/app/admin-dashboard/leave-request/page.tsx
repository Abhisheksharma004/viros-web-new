"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    Check,
    Eye,
    FileText,
    Loader2,
    Search,
    User,
    X,
    XCircle,
} from "lucide-react";
import {
    formatRejectionDetail,
    rejectionStageLabel,
    statusDisplayLabel,
    type LeaveRejectionStage,
} from "@/lib/leaveRequestDisplay";

type LeaveStatus = "pending" | "l1_approved" | "approved" | "rejected" | "cancelled";
type StatusFilter = LeaveStatus | "all";
type DayType = "full" | "first-half" | "second-half";

type LeaveRequestRow = {
    id: number;
    request_id: string;
    employee_id: string;
    employee_name: string;
    department: string;
    designation: string;
    policy_id: number;
    policy_code: string;
    policy_name: string;
    start_date: string;
    end_date: string;
    days: number;
    day_type: DayType;
    reason: string;
    attachment_name: string;
    status: LeaveStatus;
    rejected_at_stage: LeaveRejectionStage | null;
    rejection_reason: string | null;
    applied_on: string;
};

type RejectModalTarget = {
    id: number;
    requestId: string;
    stage: LeaveRejectionStage;
    employeeName: string;
};

type LeaveStats = {
    pending: number;
    l1_approved: number;
    approved: number;
    rejected: number;
    cancelled: number;
    total: number;
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending L1" },
    { id: "l1_approved", label: "Pending L2" },
    { id: "approved", label: "L2 Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<LeaveStatus, { label: string; className: string }> = {
    pending: { label: "Pending L1", className: "bg-amber-50 text-amber-900 ring-amber-600/20" },
    l1_approved: { label: "L1 Approved", className: "bg-sky-50 text-sky-900 ring-sky-600/20" },
    approved: { label: "L2 Approved", className: "bg-emerald-50 text-emerald-900 ring-emerald-600/20" },
    rejected: { label: "Rejected", className: "bg-red-50 text-red-900 ring-red-600/20" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 ring-gray-300/50" },
};

function RejectionStageNote({
    status,
    rejectedAtStage,
    rejectionReason,
}: {
    status: LeaveStatus;
    rejectedAtStage?: LeaveRejectionStage | null;
    rejectionReason?: string | null;
}) {
    if (status !== "rejected") return null;
    const { stageLine, reasonLine } = formatRejectionDetail(rejectedAtStage, rejectionReason);
    if (!stageLine && !reasonLine) {
        return (
            <p className="mt-1.5 text-xs font-medium text-red-700">
                Rejection details were not recorded.
            </p>
        );
    }
    return (
        <div className="mt-1.5 space-y-1 rounded-md border border-red-200 bg-red-50/80 px-2 py-1.5 text-xs text-red-800">
            {stageLine ? <p className="font-semibold">{stageLine}</p> : null}
            {reasonLine ? (
                <p>
                    <span className="font-bold">Reason:</span> {reasonLine}
                </p>
            ) : null}
        </div>
    );
}

function ApprovalStageBadges({ status }: { status: LeaveStatus }) {
    const l1Done = status === "l1_approved" || status === "approved";
    const l2Done = status === "approved";
    const rejected = status === "rejected";
    return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    rejected
                        ? "bg-gray-100 text-gray-500"
                        : l1Done
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/30"
                          : "bg-amber-100 text-amber-800 ring-1 ring-amber-500/30"
                }`}
            >
                L1 {l1Done ? "✓" : "○"}
            </span>
            <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    rejected
                        ? "bg-gray-100 text-gray-500"
                        : l2Done
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/30"
                          : l1Done
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-500/30"
                            : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                }`}
            >
                L2 {l2Done ? "✓" : "○"}
            </span>
        </div>
    );
}

const inputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700";

function formatDisplayDate(value: string) {
    if (!value?.trim()) return "—";
    const iso = /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function dayTypeLabel(dayType: DayType) {
    if (dayType === "first-half") return "First half";
    if (dayType === "second-half") return "Second half";
    return "Full day";
}

function periodLabel(row: LeaveRequestRow) {
    if (!row.start_date || !row.end_date) return "—";
    if (row.start_date === row.end_date) return formatDisplayDate(row.start_date);
    return `${formatDisplayDate(row.start_date)} – ${formatDisplayDate(row.end_date)}`;
}

export default function AdminLeaveRequestPage() {
    const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
    const [stats, setStats] = useState<LeaveStats>({
        pending: 0,
        l1_approved: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0,
    });
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionBusyId, setActionBusyId] = useState<number | null>(null);
    const [viewRow, setViewRow] = useState<LeaveRequestRow | null>(null);
    const [rejectModal, setRejectModal] = useState<RejectModalTarget | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState("");
    const [toast, setToast] = useState("");

    const openRejectModal = (row: LeaveRequestRow) => {
        const stage: LeaveRejectionStage = row.status === "l1_approved" ? "l2" : "l1";
        setRejectModal({
            id: row.id,
            requestId: row.request_id,
            stage,
            employeeName: row.employee_name,
        });
        setRejectReason("");
        setRejectError("");
    };

    const closeRejectModal = () => {
        setRejectModal(null);
        setRejectReason("");
        setRejectError("");
    };

    const fetchRequests = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const params = new URLSearchParams({ stats: "1" });
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (search.trim()) params.set("search", search.trim());

            const resp = await fetch(`/api/admin/leave-requests?${params}`, { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to load leave requests",
                );
            }
            setRequests(Array.isArray(data.requests) ? data.requests : []);
            if (data.stats && typeof data.stats === "object") {
                setStats({
                    pending: Number(data.stats.pending) || 0,
                    l1_approved: Number(data.stats.l1_approved) || 0,
                    approved: Number(data.stats.approved) || 0,
                    rejected: Number(data.stats.rejected) || 0,
                    cancelled: Number(data.stats.cancelled) || 0,
                    total: Number(data.stats.total) || 0,
                });
            }
        } catch (error) {
            console.error("Load leave requests failed:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load leave requests");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        const t = window.setTimeout(() => void fetchRequests(), search ? 300 : 0);
        return () => window.clearTimeout(t);
    }, [fetchRequests, search]);

    const statCards = useMemo(
        () => [
            {
                label: "Pending L1",
                value: stats.pending,
                tone: "text-amber-700",
                filter: "pending" as const,
            },
            {
                label: "Pending L2",
                value: stats.l1_approved,
                tone: "text-sky-700",
                filter: "l1_approved" as const,
            },
            {
                label: "L2 Approved",
                value: stats.approved,
                tone: "text-emerald-700",
                filter: "approved" as const,
            },
            {
                label: "Rejected",
                value: stats.rejected,
                tone: "text-red-700",
                filter: "rejected" as const,
            },
        ],
        [stats],
    );

    const updateStatus = async (
        id: number,
        status: LeaveStatus,
        rejectionReason?: string,
    ) => {
        try {
            setActionBusyId(id);
            setToast("");
            const resp = await fetch(`/api/admin/leave-requests/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    rejection_reason: rejectionReason ?? "",
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Update failed");
            }
            const row = data as LeaveRequestRow;
            let msg = `Request marked as ${STATUS_STYLES[status].label.toLowerCase()}.`;
            if (status === "rejected") {
                const { stageLine, reasonLine } = formatRejectionDetail(
                    row.rejected_at_stage,
                    row.rejection_reason,
                );
                msg = [stageLine, reasonLine ? `Reason: ${reasonLine}` : null]
                    .filter(Boolean)
                    .join(" ");
            }
            setToast(msg);
            if (viewRow?.id === id) setViewRow(row);
            closeRejectModal();
            await fetchRequests();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update request";
            if (rejectModal) setRejectError(message);
            else setToast(message);
        } finally {
            setActionBusyId(null);
        }
    };

    const confirmReject = () => {
        if (!rejectModal) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError(
                `Please enter a reason for ${rejectModal.stage === "l2" ? "L2" : "L1"} rejection.`,
            );
            return;
        }
        void updateStatus(rejectModal.id, "rejected", reason);
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 pb-8 sm:space-y-6">
            {loadError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            {toast && (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                        toast.includes("Failed") || toast.includes("Cannot")
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                >
                    {toast}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {statCards.map((card) => (
                    <button
                        key={card.label}
                        type="button"
                        onClick={() => setStatusFilter(card.filter)}
                        className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                            statusFilter === card.filter
                                ? "border-[#06b6d4] ring-2 ring-[#06b6d4]/25"
                                : "border-gray-100"
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            {card.label}
                        </p>
                        <p className={`mt-1 text-2xl font-black tabular-nums ${card.tone}`}>
                            {card.value}
                        </p>
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setStatusFilter(f.id)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                statusFilter === f.id
                                    ? "bg-[#0a2a5e] text-white"
                                    : "bg-white text-[#0a2a5e] ring-1 ring-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search ID, employee, type…"
                        className={`${inputClass} pl-10`}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Requested leave</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading
                            ? "Loading…"
                            : `${requests.length} request${requests.length === 1 ? "" : "s"}`}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin text-[#06b6d4]" />
                        Loading leave requests…
                    </div>
                ) : requests.length === 0 ? (
                    <p className="px-6 py-14 text-center text-sm text-gray-500">
                        No leave requests found for this filter.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#0a2a5e]/8">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                        Request
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Employee
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Leave type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Period
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Days
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                        Manage
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((row, idx) => {
                                    const statusStyle = STATUS_STYLES[row.status];
                                    const statusLabel = statusDisplayLabel(
                                        row.status,
                                        row.rejected_at_stage,
                                    );
                                    const busy = actionBusyId === row.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            className={idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}
                                        >
                                            <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {row.request_id}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Applied {formatDisplayDate(row.applied_on)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {row.employee_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {row.employee_id}
                                                    {row.department ? ` · ${row.department}` : ""}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-800">
                                                {row.policy_name}
                                                <span className="ml-1 text-xs text-gray-500">
                                                    ({row.policy_code})
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-gray-800">
                                                <p className="font-medium">{periodLabel(row)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {dayTypeLabel(row.day_type)}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold tabular-nums text-gray-900">
                                                {row.days}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyle.className}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                                <ApprovalStageBadges status={row.status} />
                                                <RejectionStageNote
                                                    status={row.status}
                                                    rejectedAtStage={row.rejected_at_stage}
                                                    rejectionReason={row.rejection_reason}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        title="View details"
                                                        onClick={() => setViewRow(row)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-[#0a2a5e] hover:bg-gray-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {row.status === "pending" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    void updateStatus(row.id, "l1_approved")
                                                                }
                                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-sky-600 px-2.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
                                                            >
                                                                {busy ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                )}
                                                                Approve L1
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() => openRejectModal(row)}
                                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject L1
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === "l1_approved" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    void updateStatus(row.id, "approved")
                                                                }
                                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                            >
                                                                {busy ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                )}
                                                                Approve L2
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() => openRejectModal(row)}
                                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject L2
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === "approved" && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                void updateStatus(row.id, "cancelled")
                                                            }
                                                            className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewRow && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setViewRow(null)}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="sticky top-0 flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 text-white"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                                    <FileText className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold">{viewRow.request_id}</h2>
                                    <p className="text-xs text-white/75">Leave request details</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewRow(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-5 sm:p-6">
                            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <User className="h-8 w-8 text-[#0a2a5e]" />
                                <div>
                                    <p className="font-bold text-gray-900">{viewRow.employee_name}</p>
                                    <p className="text-sm text-gray-600">
                                        {viewRow.employee_id}
                                        {viewRow.designation ? ` · ${viewRow.designation}` : ""}
                                    </p>
                                    {viewRow.department && (
                                        <p className="text-xs text-gray-500">{viewRow.department}</p>
                                    )}
                                </div>
                            </div>

                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs font-bold uppercase text-gray-500">
                                        Leave type
                                    </dt>
                                    <dd className="mt-0.5 font-semibold text-gray-900">
                                        {viewRow.policy_name} ({viewRow.policy_code})
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase text-gray-500">Status</dt>
                                    <dd className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${STATUS_STYLES[viewRow.status].className}`}
                                        >
                                            {statusDisplayLabel(
                                                viewRow.status,
                                                viewRow.rejected_at_stage,
                                            )}
                                        </span>
                                        <ApprovalStageBadges status={viewRow.status} />
                                        <RejectionStageNote
                                            status={viewRow.status}
                                            rejectedAtStage={viewRow.rejected_at_stage}
                                            rejectionReason={viewRow.rejection_reason}
                                        />
                                    </dd>
                                </div>
                                {viewRow.status === "rejected" && viewRow.rejection_reason && (
                                    <div className="col-span-2">
                                        <dt className="text-xs font-bold uppercase text-gray-500">
                                            Rejection reason
                                        </dt>
                                        <dd className="mt-1 rounded-lg border border-red-100 bg-red-50/50 p-3 text-sm text-red-900">
                                            {viewRow.rejection_reason}
                                        </dd>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <dt className="text-xs font-bold uppercase text-gray-500">Period</dt>
                                    <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-900">
                                        <Calendar className="h-4 w-4 text-[#06b6d4]" />
                                        {periodLabel(viewRow)} · {dayTypeLabel(viewRow.day_type)} ·{" "}
                                        {viewRow.days} day{viewRow.days === 1 ? "" : "s"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase text-gray-500">
                                        Applied on
                                    </dt>
                                    <dd className="mt-0.5 font-semibold text-gray-900">
                                        {formatDisplayDate(viewRow.applied_on)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase text-gray-500">
                                        Attachment
                                    </dt>
                                    <dd className="mt-0.5 font-medium text-gray-800">
                                        {viewRow.attachment_name || "—"}
                                    </dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-xs font-bold uppercase text-gray-500">Reason</dt>
                                    <dd className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-gray-800">
                                        {viewRow.reason || "—"}
                                    </dd>
                                </div>
                            </dl>

                            {viewRow.status === "pending" && (
                                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={actionBusyId === viewRow.id}
                                        onClick={() => void updateStatus(viewRow.id, "l1_approved")}
                                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
                                    >
                                        {actionBusyId === viewRow.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Approve L1
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionBusyId === viewRow.id}
                                        onClick={() => openRejectModal(viewRow)}
                                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject L1
                                    </button>
                                </div>
                            )}
                            {viewRow.status === "l1_approved" && (
                                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={actionBusyId === viewRow.id}
                                        onClick={() => void updateStatus(viewRow.id, "approved")}
                                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {actionBusyId === viewRow.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Approve L2
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionBusyId === viewRow.id}
                                        onClick={() => openRejectModal(viewRow)}
                                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject L2
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rejectModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reject-modal-title"
                    onClick={closeRejectModal}
                >
                    <div className="absolute inset-0 bg-black/50" aria-hidden />
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="border-b border-white/10 px-5 py-4 text-white"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <h2 id="reject-modal-title" className="text-lg font-bold">
                                Reject at {rejectModal.stage === "l2" ? "L2" : "L1"}
                            </h2>
                            <p className="mt-0.5 text-xs text-white/75">
                                {rejectModal.requestId} · {rejectModal.employeeName}
                            </p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <p className="text-sm text-gray-600">
                                {rejectModal.stage === "l2"
                                    ? "This request passed L1. Enter why L2 approval is denied."
                                    : "Enter why this request is denied at first-level (L1) approval."}
                            </p>
                            <div>
                                <label htmlFor="reject-reason" className={labelClass}>
                                    Rejection reason <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => {
                                        setRejectReason(e.target.value);
                                        setRejectError("");
                                    }}
                                    rows={4}
                                    placeholder={`Reason for ${rejectModal.stage === "l2" ? "L2" : "L1"} rejection…`}
                                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                            {rejectError && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {rejectError}
                                </p>
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    disabled={actionBusyId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmReject}
                                    disabled={actionBusyId === rejectModal.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {actionBusyId === rejectModal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    Confirm reject {rejectModal.stage === "l2" ? "L2" : "L1"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
