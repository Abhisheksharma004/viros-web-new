"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Clock, FileText, Loader2, Undo2 } from "lucide-react";
import {
    type EmployeeLeaveRequestRow,
    type LeaveHistoryFilter,
    LeaveHistoryFilterBar,
    LeaveRequestsSection,
    filterLeaveHistory,
    getTodayIso,
    isLeaveRequestInHistory,
    leaveHistoryEmptyMessage,
    sortLeaveByEndDateDesc,
} from "@/components/employee-dashboard/EmployeeLeaveRequestList";

export default function EmployeeLeaveHistoryPage() {
    const today = useMemo(() => getTodayIso(), []);
    const [requests, setRequests] = useState<EmployeeLeaveRequestRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [historyFilter, setHistoryFilter] = useState<LeaveHistoryFilter>("all");

    const fetchLeaveHistory = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const resp = await fetch("/api/employee/leave", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to load leave history",
                );
            }
            setRequests(Array.isArray(data.requests) ? data.requests : []);
        } catch (error) {
            const msg =
                error instanceof Error ? error.message : "Failed to load leave history";
            setLoadError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLeaveHistory();
    }, [fetchLeaveHistory]);

    const [withdrawBusyId, setWithdrawBusyId] = useState<number | null>(null);
    const [withdrawConfirmTarget, setWithdrawConfirmTarget] = useState<EmployeeLeaveRequestRow | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const promptWithdrawLeave = useCallback((row: EmployeeLeaveRequestRow) => {
        setWithdrawConfirmTarget(row);
    }, []);

    const handleConfirmWithdraw = useCallback(async () => {
        if (!withdrawConfirmTarget || isWithdrawing) return;
        const target = withdrawConfirmTarget;
        try {
            setIsWithdrawing(true);
            setWithdrawBusyId(target.id);
            const resp = await fetch(`/api/employee/leave/${target.id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : "Failed to withdraw leave",
                );
            }
            setWithdrawConfirmTarget(null);
            void fetchLeaveHistory();
        } catch (error) {
            console.error("Withdraw leave failed:", error);
            alert(error instanceof Error ? error.message : "Failed to withdraw leave");
        } finally {
            setIsWithdrawing(false);
            setWithdrawBusyId(null);
        }
    }, [withdrawConfirmTarget, isWithdrawing, fetchLeaveHistory]);

    const leaveHistory = useMemo(
        () =>
            sortLeaveByEndDateDesc(requests.filter((r) => isLeaveRequestInHistory(r, today))),
        [requests, today],
    );

    const historyRejectedCount = useMemo(
        () => leaveHistory.filter((r) => r.status === "rejected").length,
        [leaveHistory],
    );

    const filteredLeaveHistory = useMemo(
        () => filterLeaveHistory(leaveHistory, historyFilter),
        [leaveHistory, historyFilter],
    );

    const emptyMessage = useMemo(
        () => leaveHistoryEmptyMessage(leaveHistory.length, historyFilter),
        [leaveHistory.length, historyFilter],
    );

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4 pb-8 sm:space-y-6">
            {withdrawConfirmTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md overflow-hidden rounded-md bg-white p-6 shadow-xl ring-1 ring-gray-900/10">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Withdraw Leave Request {withdrawConfirmTarget.request_id}?
                                </h3>
                                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                                    Are you sure you want to withdraw your leave request for{" "}
                                    <span className="font-semibold text-gray-900">{withdrawConfirmTarget.policy_name}</span>?
                                    This action cannot be undone and your leave days will be restored.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setWithdrawConfirmTarget(null)}
                                disabled={isWithdrawing}
                                className="inline-flex h-10 touch-manipulation items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConfirmWithdraw()}
                                disabled={isWithdrawing}
                                className="inline-flex h-10 touch-manipulation items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
                            >
                                {isWithdrawing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Undo2 className="h-4 w-4" />
                                )}
                                Yes, withdraw request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Link
                href="/employee-dashboard/leave"
                className="inline-flex touch-manipulation items-center gap-2 text-sm font-bold text-[#0a2a5e] hover:text-[#06b6d4]"
            >
                <FileText className="h-4 w-4" aria-hidden />
                Back to leave request
            </Link>

            {loadError ? (
                <button
                    type="button"
                    onClick={() => void fetchLeaveHistory()}
                    className="flex w-full items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100/80"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                        {loadError}
                        <span className="mt-0.5 block text-xs font-semibold text-amber-800">
                            Tap to retry
                        </span>
                    </span>
                </button>
            ) : null}

            {isLoading ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
                    <p>Loading leave history…</p>
                </div>
            ) : (
                <LeaveRequestsSection
                    title="Leave history"
                    subtitle={`${leaveHistory.length} record${leaveHistory.length === 1 ? "" : "s"}${historyRejectedCount > 0 ? ` · ${historyRejectedCount} rejected` : ""}`}
                    rows={filteredLeaveHistory}
                    emptyMessage={emptyMessage}
                    showWithdrawAction={true}
                    policiesAvailable
                    withdrawBusyId={withdrawBusyId}
                    onWithdraw={(r) => promptWithdrawLeave(r)}
                    toolbar={
                        <LeaveHistoryFilterBar
                            filter={historyFilter}
                            onFilterChange={setHistoryFilter}
                        />
                    }
                />
            )}

            {!isLoading && leaveHistory.length > 0 ? (
                <p className="flex items-center gap-2 text-center text-xs text-gray-500 sm:text-left">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Includes past leave, manager rejections, and requests you withdrew.
                </p>
            ) : null}
        </div>
    );
}
