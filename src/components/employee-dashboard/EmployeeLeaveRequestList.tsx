"use client";

import type { ReactNode } from "react";
import {
    formatRejectionDetail,
    statusDisplayLabel,
    type LeaveRejectionStage,
} from "@/lib/leaveRequestDisplay";
import { Loader2, Plus, Undo2 } from "lucide-react";

export type LeaveDayType = "full" | "first-half" | "second-half";
export type LeaveStatus = "pending" | "l1_approved" | "approved" | "rejected" | "cancelled";

export type EmployeeLeaveRequestRow = {
    id: number;
    request_id: string;
    policy_id: number;
    policy_code: string;
    policy_name: string;
    start_date: string;
    end_date: string;
    days: number;
    day_type: LeaveDayType;
    reason: string;
    status: LeaveStatus;
    rejected_at_stage: LeaveRejectionStage | null;
    rejection_reason: string | null;
    applied_on: string;
};

export type LeaveHistoryFilter = "all" | "rejected" | "withdrawn" | "past";

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, { label: string; className: string }> = {
    pending: { label: "Pending L1", className: "bg-amber-100 text-amber-900 ring-amber-500/25" },
    l1_approved: {
        label: "L1 Approved",
        className: "bg-sky-100 text-sky-900 ring-sky-500/25",
    },
    approved: {
        label: "L2 Approved",
        className: "bg-emerald-100 text-emerald-900 ring-emerald-500/25",
    },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-900 ring-red-500/25" },
    cancelled: { label: "Withdrawn", className: "bg-gray-100 text-gray-700 ring-gray-400/25" },
};

export function getTodayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatLeaveDisplayDate(value: string) {
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

export function leaveDayTypeLabel(dayType: LeaveDayType) {
    if (dayType === "first-half") return "First half";
    if (dayType === "second-half") return "Second half";
    return "Full day";
}

function isLeavePeriodStillActive(endDate: string, today: string) {
    const end = endDate?.trim().slice(0, 10);
    if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return true;
    return today <= end;
}

function isLeavePeriodCompleted(endDate: string, today: string) {
    const end = endDate?.trim().slice(0, 10);
    if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return false;
    return today > end;
}

export function isLeaveRequestIncomplete(row: EmployeeLeaveRequestRow, today: string) {
    if (row.status === "rejected" || row.status === "cancelled") return false;
    return isLeavePeriodStillActive(row.end_date, today);
}

export function isLeaveRequestInHistory(row: EmployeeLeaveRequestRow, today: string) {
    if (row.status === "rejected" || row.status === "cancelled") return true;
    return isLeavePeriodCompleted(row.end_date, today);
}

export function sortLeaveByEndDateDesc(rows: EmployeeLeaveRequestRow[]) {
    return [...rows].sort((a, b) => {
        const endA = a.end_date?.slice(0, 10) ?? "";
        const endB = b.end_date?.slice(0, 10) ?? "";
        if (endB !== endA) return endB.localeCompare(endA);
        return (b.applied_on ?? "").localeCompare(a.applied_on ?? "");
    });
}

export function filterLeaveHistory(
    rows: EmployeeLeaveRequestRow[],
    filter: LeaveHistoryFilter,
): EmployeeLeaveRequestRow[] {
    switch (filter) {
        case "rejected":
            return rows.filter((r) => r.status === "rejected");
        case "withdrawn":
            return rows.filter((r) => r.status === "cancelled");
        case "past":
            return rows.filter((r) => r.status !== "rejected" && r.status !== "cancelled");
        default:
            return rows;
    }
}

export function leaveHistoryEmptyMessage(
    totalHistory: number,
    filter: LeaveHistoryFilter,
): string {
    if (totalHistory === 0) {
        return "No completed, rejected, or withdrawn leave yet.";
    }
    if (filter === "rejected") return "No rejected leave in your history.";
    if (filter === "withdrawn") return "No withdrawn leave in your history.";
    if (filter === "past") return "No past leave periods in your history.";
    return "No matching leave in your history.";
}

function canWithdrawLeave(status: LeaveStatus) {
    return status === "pending" || status === "l1_approved";
}

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
            <p className="mt-1 text-xs font-medium text-red-700">
                Rejection details were not recorded.
            </p>
        );
    }
    return (
        <div className="mt-1 space-y-0.5">
            {stageLine ? (
                <p className="text-xs font-semibold text-red-800">{stageLine}</p>
            ) : null}
            {reasonLine ? (
                <p className="text-xs text-red-700">
                    <span className="font-bold">Reason:</span> {reasonLine}
                </p>
            ) : null}
        </div>
    );
}

function ApprovalStagePills({ status }: { status: LeaveStatus }) {
    const l1Done = status === "l1_approved" || status === "approved";
    const l2Done = status === "approved";
    const rejected = status === "rejected";
    return (
        <div className="mt-1 flex flex-wrap items-center gap-1">
            <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    rejected
                        ? "bg-gray-100 text-gray-500"
                        : l1Done
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-500"
                }`}
            >
                L1 {l1Done ? "✓" : "○"}
            </span>
            <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    rejected
                        ? "bg-gray-100 text-gray-500"
                        : l2Done
                          ? "bg-emerald-100 text-emerald-800"
                          : l1Done
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-500"
                }`}
            >
                L2 {l2Done ? "✓" : "○"}
            </span>
        </div>
    );
}

function LeaveRequestMobileCard({
    row,
    statusLabel,
    statusStyle,
    showWithdrawAction = false,
    withdrawBusyId = null,
    onWithdraw,
}: {
    row: EmployeeLeaveRequestRow;
    statusLabel: string;
    statusStyle: { label: string; className: string };
    showWithdrawAction?: boolean;
    withdrawBusyId?: number | null;
    onWithdraw?: (row: EmployeeLeaveRequestRow) => void;
}) {
    const period =
        row.start_date && row.end_date
            ? row.start_date === row.end_date
                ? formatLeaveDisplayDate(row.start_date)
                : `${formatLeaveDisplayDate(row.start_date)} – ${formatLeaveDisplayDate(row.end_date)}`
            : "—";

    return (
        <article className="px-4 py-4 active:bg-gray-50/80 sm:px-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#06b6d4]">
                        {row.request_id}
                    </p>
                    <p className="mt-0.5 text-base font-bold leading-snug text-gray-900">
                        {row.policy_name}
                        <span className="ml-1 text-sm font-semibold text-gray-500">
                            ({row.policy_code})
                        </span>
                    </p>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle.className}`}
                >
                    {statusLabel}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Period
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{period}</p>
                    <p className="text-xs text-gray-500">{leaveDayTypeLabel(row.day_type)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Days
                    </p>
                    <p className="mt-0.5 text-2xl font-black tabular-nums text-gray-900">
                        {row.days}
                    </p>
                    <p className="text-xs text-gray-500">
                        Applied {formatLeaveDisplayDate(row.applied_on)}
                    </p>
                </div>
            </div>

            {row.reason ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    <span className="font-bold text-gray-800">Reason:</span> {row.reason}
                </p>
            ) : null}

            <ApprovalStagePills status={row.status} />
            <RejectionStageNote
                status={row.status}
                rejectedAtStage={row.rejected_at_stage}
                rejectionReason={row.rejection_reason}
            />

            {showWithdrawAction && canWithdrawLeave(row.status) && onWithdraw ? (
                <button
                    type="button"
                    disabled={withdrawBusyId === row.id}
                    onClick={() => onWithdraw(row)}
                    className="mt-3 flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 shadow-sm active:bg-gray-50 disabled:opacity-60"
                >
                    {withdrawBusyId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                        <Undo2 className="h-4 w-4" aria-hidden />
                    )}
                    Withdraw request
                </button>
            ) : null}
        </article>
    );
}

export function LeaveHistoryFilterBar({
    filter,
    onFilterChange,
}: {
    filter: LeaveHistoryFilter;
    onFilterChange: (f: LeaveHistoryFilter) => void;
}) {
    const filters = [
        { id: "all" as const, label: "All" },
        { id: "rejected" as const, label: "Rejected" },
        { id: "withdrawn" as const, label: "Withdrawn" },
        { id: "past" as const, label: "Past leave" },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
                <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterChange(f.id)}
                    className={`touch-manipulation rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        filter === f.id
                            ? f.id === "rejected"
                                ? "bg-red-600 text-white"
                                : "bg-[#0a2a5e] text-white"
                            : "border border-gray-200 bg-white text-gray-700 active:bg-gray-50"
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}

export function LeaveRequestsSection({
    title,
    subtitle,
    rows,
    emptyMessage,
    showWithdrawAction,
    showNewRequestButton,
    onNewRequest,
    policiesAvailable,
    withdrawBusyId,
    onWithdraw,
    toolbar,
}: {
    title: string;
    subtitle: string;
    rows: EmployeeLeaveRequestRow[];
    emptyMessage: string;
    showWithdrawAction: boolean;
    showNewRequestButton?: boolean;
    onNewRequest?: () => void;
    policiesAvailable: boolean;
    withdrawBusyId: number | null;
    onWithdraw?: (row: EmployeeLeaveRequestRow) => void;
    toolbar?: ReactNode;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
                        <p className="text-sm text-gray-600">{subtitle}</p>
                    </div>
                    {showNewRequestButton && onNewRequest ? (
                        <button
                            type="button"
                            onClick={onNewRequest}
                            disabled={!policiesAvailable}
                            className="hidden h-9 w-full touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-[#0a2a5e] active:bg-gray-50 disabled:opacity-60 sm:inline-flex sm:w-auto sm:rounded-lg md:inline-flex"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New request
                        </button>
                    ) : null}
                </div>
                {toolbar ? <div className="mt-3">{toolbar}</div> : null}
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
                {rows.length === 0 ? (
                    <p className="px-4 py-12 text-center text-sm text-gray-500">{emptyMessage}</p>
                ) : (
                    rows.map((row) => {
                        const statusStyle = LEAVE_STATUS_STYLES[row.status];
                        const statusLabel = statusDisplayLabel(
                            row.status,
                            row.rejected_at_stage,
                        );
                        return (
                            <LeaveRequestMobileCard
                                key={row.id}
                                row={row}
                                statusLabel={statusLabel}
                                statusStyle={statusStyle}
                                showWithdrawAction={showWithdrawAction}
                                withdrawBusyId={withdrawBusyId}
                                onWithdraw={onWithdraw}
                            />
                        );
                    })
                )}
            </div>

            <div className="hidden overflow-x-auto md:block">
                {rows.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-gray-500">{emptyMessage}</p>
                ) : (
                    <table className="w-full min-w-[720px] text-left">
                        <thead>
                            <tr className="bg-[#0a2a5e]/8">
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Request ID
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Type
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Period
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Days
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Status
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                    Applied on
                                </th>
                                {showWithdrawAction ? (
                                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#0a2a5e]">
                                        Action
                                    </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, idx) => {
                                const statusStyle = LEAVE_STATUS_STYLES[row.status];
                                const statusLabel = statusDisplayLabel(
                                    row.status,
                                    row.rejected_at_stage,
                                );
                                return (
                                    <tr
                                        key={row.id}
                                        className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                                    >
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-gray-900">
                                            {row.request_id}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-gray-800">
                                            {row.policy_name}
                                            <span className="ml-1 text-xs text-gray-500">
                                                ({row.policy_code})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-800">
                                            <p className="font-semibold">
                                                {row.start_date && row.end_date
                                                    ? row.start_date === row.end_date
                                                        ? formatLeaveDisplayDate(row.start_date)
                                                        : `${formatLeaveDisplayDate(row.start_date)} – ${formatLeaveDisplayDate(row.end_date)}`
                                                    : "—"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {leaveDayTypeLabel(row.day_type)}
                                            </p>
                                            {row.reason ? (
                                                <p
                                                    className="mt-1 line-clamp-2 text-xs text-gray-600"
                                                    title={row.reason}
                                                >
                                                    {row.reason}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold tabular-nums text-gray-900">
                                            {row.days}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusStyle.className}`}
                                            >
                                                {statusLabel}
                                            </span>
                                            <ApprovalStagePills status={row.status} />
                                            <RejectionStageNote
                                                status={row.status}
                                                rejectedAtStage={row.rejected_at_stage}
                                                rejectionReason={row.rejection_reason}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600">
                                            {formatLeaveDisplayDate(row.applied_on)}
                                        </td>
                                        {showWithdrawAction ? (
                                            <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                {canWithdrawLeave(row.status) && onWithdraw ? (
                                                    <button
                                                        type="button"
                                                        disabled={withdrawBusyId === row.id}
                                                        onClick={() => void onWithdraw(row)}
                                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                                                    >
                                                        {withdrawBusyId === row.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Undo2 className="h-3.5 w-3.5" />
                                                        )}
                                                        Withdraw
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        ) : null}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
