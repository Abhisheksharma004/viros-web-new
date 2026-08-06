"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collectLeaveRequestErrors, countLeaveDays } from "@/lib/leaveValidation";
import {
    type EmployeeLeaveRequestRow,
    type LeaveDayType,
    LeaveRequestsSection,
    formatLeaveDisplayDate,
    getTodayIso,
    isLeaveRequestIncomplete,
} from "@/components/employee-dashboard/EmployeeLeaveRequestList";
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Info,
    Loader2,
    Paperclip,
    Plus,
    RotateCcw,
    Send,
    Umbrella,
    Undo2,
    X,
} from "lucide-react";

type DayType = LeaveDayType;
type LeaveRequestRow = EmployeeLeaveRequestRow;

type LeavePolicy = {
    id: number;
    code: string;
    name: string;
    description: string;
    days_per_year: number;
    accrual_cycle: string;
    half_day_allowed: boolean;
    document_required: boolean;
    min_notice_days: number;
    max_consecutive_days: number;
    requires_approval: boolean;
    all_months_applicable: boolean;
    applicable_months: number[];
    applicable_from_joining: boolean;
    months_after_joining: number;
    max_days_per_request: number;
    max_days_per_month: number;
    min_days_per_request: number;
    enforce_remaining_balance_cap: boolean;
    must_use_full_balance_when_low: boolean;
    full_balance_threshold_days: number;
    max_requests_per_month: number;
    max_requests_per_year: number;
    min_gap_days_between_requests: number;
    weekdays_only: boolean;
    allow_backdated_leave: boolean;
    max_advance_booking_days: number;
};

type OrgSettings = {
    fiscal_year_start_month: number;
    default_min_notice_days: number;
    max_consecutive_days_default: number;
    allow_half_day: boolean;
    count_weekends_in_leave: boolean;
};

type LeaveBalance = {
    policy_id: number;
    code: string;
    name: string;
    accrual_cycle: string;
    paid?: boolean;
    total: number;
    used: number;
    remaining: number;
};

const CARD_COLORS = [
    { color: "from-[#06b6d4] to-[#0891b2]", accent: "text-[#06b6d4]" },
    { color: "from-emerald-500 to-emerald-600", accent: "text-emerald-700" },
    { color: "from-[#0a2a5e] to-[#0d3a7a]", accent: "text-[#0a2a5e]" },
    { color: "from-amber-500 to-orange-500", accent: "text-amber-700" },
    { color: "from-violet-500 to-purple-600", accent: "text-violet-700" },
    { color: "from-rose-500 to-pink-600", accent: "text-rose-700" },
];

const INPUT =
    "h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-base font-semibold text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 sm:text-sm";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700";

function addDays(iso: string, days: number) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function policyHints(policy: LeavePolicy, settings: OrgSettings, joiningDate: string | null) {
    const hints: string[] = [];
    const notice = policy.min_notice_days || settings.default_min_notice_days;
    if (notice > 0) hints.push(`Apply at least ${notice} day(s) before leave starts.`);
    if (policy.max_advance_booking_days > 0) {
        hints.push(`Book up to ${policy.max_advance_booking_days} days in advance.`);
    }
    if (!policy.all_months_applicable && policy.applicable_months.length > 0) {
        hints.push("Only allowed in specific months (see policy).");
    }
    if (policy.applicable_from_joining && joiningDate) {
        hints.push(`Available ${policy.months_after_joining} month(s) after joining.`);
    }
    if (policy.document_required) hints.push("Supporting document required.");
    if (policy.half_day_allowed && settings.allow_half_day) {
        hints.push("Half-day allowed on a single date.");
    } else {
        hints.push("Full-day only for this leave type.");
    }
    if (policy.requires_approval) hints.push("Manager approval required.");
    return hints;
}

function LeaveAlertPopup({
    open,
    onClose,
    variant = "error",
    messages = [],
    title,
    subtitle,
}: {
    open: boolean;
    onClose: () => void;
    variant?: "error" | "success";
    messages?: string[];
    title?: string;
    subtitle?: string;
}) {
    const isSuccess = variant === "success";

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;
    if (isSuccess && !title) return null;
    if (!isSuccess && messages.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-alert-title"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-hidden />
            <div
                className="relative max-h-[min(85dvh,520px)] w-full max-w-md overflow-y-auto rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-none sm:rounded-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 sm:p-6">
                    <div
                        className={`flex items-start gap-3 rounded-md border px-4 py-3.5 text-sm ${
                            isSuccess
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-800"
                        }`}
                    >
                        {isSuccess ? (
                            <CheckCircle2
                                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                                aria-hidden
                            />
                        ) : (
                            <AlertCircle
                                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                                aria-hidden
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            {isSuccess ? (
                                <>
                                    <p id="leave-alert-title" className="font-bold leading-snug">
                                        {title}
                                    </p>
                                    {subtitle ? (
                                        <p className="mt-0.5 font-medium leading-snug">{subtitle}</p>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <p
                                        id="leave-alert-title"
                                        className="text-xs font-bold uppercase tracking-wide text-red-700"
                                    >
                                        {messages.length === 1
                                            ? "Cannot submit leave"
                                            : `${messages.length} issues found`}
                                    </p>
                                    {messages.length === 1 ? (
                                        <p className="mt-1.5 font-semibold leading-snug">
                                            {messages[0]}
                                        </p>
                                    ) : (
                                        <ul className="mt-2 list-none space-y-2">
                                            {messages.map((msg) => (
                                                <li
                                                    key={msg}
                                                    className="flex gap-2 font-semibold leading-snug"
                                                >
                                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                                    {msg}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`mt-4 flex h-11 w-full items-center justify-center rounded-md text-sm font-bold text-white shadow-sm ${
                            isSuccess
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-[#0a2a5e] hover:bg-[#06124f]"
                        }`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

function LeaveApplyModal({
    open,
    onClose,
    onSuccess,
    today,
    policies,
    settings,
    joiningDate,
    balances,
    existingRequests,
    initialPolicyId,
    workingDays,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    today: string;
    policies: LeavePolicy[];
    settings: OrgSettings;
    joiningDate: string | null;
    balances: LeaveBalance[];
    existingRequests: LeaveRequestRow[];
    /** When set, pre-selects this leave type when the modal opens (e.g. from balance card click). */
    initialPolicyId?: number | null;
    workingDays?: number[];
}) {
    const [policyId, setPolicyId] = useState<number>(policies[0]?.id ?? 0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dayType, setDayType] = useState<DayType>("full");
    const [reason, setReason] = useState("");
    const [attachmentName, setAttachmentName] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessages, setAlertMessages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showAlert = useCallback((messages: string[]) => {
        if (messages.length === 0) return;
        setAlertMessages(messages);
        setAlertOpen(true);
    }, []);

    const selectedPolicy = policies.find((p) => p.id === policyId);
    const selectedBalance = balances.find((b) => b.policy_id === policyId);
    const remaining = selectedBalance?.remaining ?? 0;
    const hasQuota = selectedPolicy?.accrual_cycle !== "none" && (selectedBalance?.total ?? 0) > 0;

    const halfDayEnabled =
        Boolean(selectedPolicy?.half_day_allowed) && settings.allow_half_day;

    const requestedDays = useMemo(
        () =>
            countLeaveDays(startDate, endDate, dayType, {
                weekdaysOnly: selectedPolicy?.weekdays_only,
                excludeWeekends: !settings.count_weekends_in_leave,
                workingDays,
            }),
        [startDate, endDate, dayType, selectedPolicy, settings.count_weekends_in_leave, workingDays],
    );

    const minDate = useMemo(() => {
        if (!selectedPolicy) return today;
        if (selectedPolicy.allow_backdated_leave) return "";
        const notice = selectedPolicy.min_notice_days || settings.default_min_notice_days;
        return addDays(today, notice);
    }, [selectedPolicy, settings.default_min_notice_days, today]);

    const maxDate = useMemo(() => {
        if (!selectedPolicy?.max_advance_booking_days) return "";
        return addDays(today, selectedPolicy.max_advance_booking_days);
    }, [selectedPolicy, today]);

    const resetForm = useCallback(() => {
        setPolicyId(policies[0]?.id ?? 0);
        setStartDate("");
        setEndDate("");
        setDayType("full");
        setReason("");
        setAttachmentName("");
        setAlertOpen(false);
        setAlertMessages([]);
    }, [policies]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    useEffect(() => {
        if (!open || !policies.length) return;
        if (
            initialPolicyId != null &&
            policies.some((p) => p.id === initialPolicyId)
        ) {
            setPolicyId(initialPolicyId);
            return;
        }
        if (!policies.some((p) => p.id === policyId)) {
            setPolicyId(policies[0].id);
        }
    }, [open, initialPolicyId, policies, policyId]);

    useEffect(() => {
        if (!halfDayEnabled && dayType !== "full") setDayType("full");
    }, [halfDayEnabled, dayType]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKeyDown);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
    }, [open, handleClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPolicy) {
            showAlert(["No leave type available."]);
            return;
        }

        const balanceRemaining = hasQuota ? remaining : 999;
        const clientErrors = collectLeaveRequestErrors({
            policy: selectedPolicy,
            settings,
            joiningDate,
            startDate,
            endDate,
            dayType,
            requestedDays,
            balanceRemaining,
            existingRequests: existingRequests.map((r) => ({
                id: r.id,
                policy_id: r.policy_id,
                policy_code: r.policy_code,
                days: r.days,
                day_type: r.day_type,
                start_date: r.start_date,
                end_date: r.end_date,
                status: r.status,
            })),
            attachmentName,
            reason,
        });
        if (clientErrors.length > 0) {
            showAlert(clientErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            const resp = await fetch("/api/employee/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    policy_id: policyId,
                    start_date: startDate,
                    end_date: endDate,
                    day_type: dayType,
                    reason,
                    attachment_name: attachmentName,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const apiMessages = Array.isArray(data.messages)
                    ? data.messages.filter((m: unknown) => typeof m === "string")
                    : [];
                if (apiMessages.length > 0) {
                    showAlert(apiMessages);
                    return;
                }
                showAlert([
                    typeof data.message === "string" ? data.message : "Submit failed",
                ]);
                return;
            }
            resetForm();
            onClose();
            onSuccess();
        } catch (error) {
            showAlert([
                error instanceof Error ? error.message : "Failed to submit request",
            ]);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    const hints = selectedPolicy ? policyHints(selectedPolicy, settings, joiningDate) : [];

    return (
        <>
            <LeaveAlertPopup
                open={alertOpen}
                variant="error"
                messages={alertMessages}
                onClose={() => setAlertOpen(false)}
            />
            <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            onClick={handleClose}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden />

            <div
                className="relative flex max-h-[min(100dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(92vh,880px)] sm:rounded-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden"
                    aria-hidden
                />
                <div
                    className="shrink-0 border-b border-white/10 px-4 py-3.5 sm:px-6 sm:py-4"
                    style={{
                        background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 text-white">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/15">
                                <FileText className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <h2 id="leave-modal-title" className="text-lg font-bold">
                                    Apply for leave
                                </h2>
                                <p className="text-xs font-medium text-white/75">
                                    Rules follow company leave policy
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
                >
                    <div className="space-y-4 p-4 sm:p-6">
                        {policies.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                No active leave policies. Contact HR.
                            </p>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="modal-leave-type" className={LABEL}>
                                        Leave type
                                    </label>
                                    <select
                                        id="modal-leave-type"
                                        value={policyId || ""}
                                        onChange={(e) => setPolicyId(Number(e.target.value))}
                                        className={INPUT}
                                    >
                                        {policies.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.code})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedPolicy?.description && (
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            {selectedPolicy.description}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="modal-start-date" className={LABEL}>
                                            From date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                            <input
                                                id="modal-start-date"
                                                type="date"
                                                min={minDate || undefined}
                                                max={maxDate || undefined}
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (endDate && e.target.value > endDate) {
                                                        setEndDate(e.target.value);
                                                    }
                                                }}
                                                className={`${INPUT} pl-10`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="modal-end-date" className={LABEL}>
                                            To date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                            <input
                                                id="modal-end-date"
                                                type="date"
                                                min={startDate || minDate || undefined}
                                                max={maxDate || undefined}
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`${INPUT} pl-10`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {halfDayEnabled && (
                                    <div>
                                        <span className={LABEL}>Duration</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(
                                                [
                                                    { value: "full", label: "Full" },
                                                    { value: "first-half", label: "1st half" },
                                                    { value: "second-half", label: "2nd half" },
                                                ] as const
                                            ).map((opt) => {
                                                const active = dayType === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setDayType(opt.value)}
                                                        className={`rounded-md border py-2.5 text-xs font-bold transition sm:text-sm ${
                                                            active
                                                                ? "border-[#06b6d4] bg-[#06b6d4]/10 text-[#0a2a5e]"
                                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {startDate && endDate && endDate >= startDate && (
                                    <div className="flex items-center gap-3 rounded-md border border-[#06b6d4]/25 bg-[#06b6d4]/8 px-4 py-3">
                                        <CalendarDays className="h-5 w-5 shrink-0 text-[#06b6d4]" />
                                        <div className="min-w-0 text-sm">
                                            <p className="font-bold text-[#0a2a5e]">
                                                {requestedDays} day{requestedDays === 1 ? "" : "s"}{" "}
                                                requested
                                            </p>
                                            <p className="truncate text-gray-600">
                                                {formatLeaveDisplayDate(startDate)}
                                                {startDate !== endDate &&
                                                    ` → ${formatLeaveDisplayDate(endDate)}`}
                                            </p>
                                            {hasQuota && (
                                                <p className="mt-0.5 text-xs font-semibold text-[#06b6d4]">
                                                    {remaining} day{remaining === 1 ? "" : "s"}{" "}
                                                    remaining
                                                </p>
                                            )}
                                            {selectedPolicy?.accrual_cycle === "none" && (
                                                <p className="mt-0.5 text-xs font-semibold text-gray-600">
                                                    Granted as per policy (no fixed quota)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 p-4">
                                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        <Info className="h-3.5 w-3.5" aria-hidden />
                                        Policy conditions
                                    </p>
                                    <ul className="space-y-1.5 text-xs text-gray-700">
                                        {hints.map((h) => (
                                            <li key={h} className="flex gap-2">
                                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#06b6d4]" />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <label htmlFor="modal-reason" className={LABEL}>
                                        Reason
                                    </label>
                                    <textarea
                                        id="modal-reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Why do you need this leave?"
                                        className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="modal-attachment" className={LABEL}>
                                        Attachment{" "}
                                        {selectedPolicy?.document_required ? (
                                            <span className="text-red-600">*</span>
                                        ) : (
                                            <span className="font-normal normal-case text-gray-500">
                                                (optional)
                                            </span>
                                        )}
                                    </label>
                                    <label
                                        htmlFor="modal-attachment"
                                        className="flex min-h-[3rem] cursor-pointer touch-manipulation items-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition active:border-[#06b6d4] active:bg-[#06b6d4]/5 sm:hover:border-[#06b6d4] sm:hover:bg-[#06b6d4]/5"
                                    >
                                        <Paperclip className="h-5 w-5 shrink-0 text-gray-500" />
                                        <span className="truncate text-sm font-medium text-gray-700">
                                            {attachmentName || "Medical certificate or document"}
                                        </span>
                                        <input
                                            id="modal-attachment"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="sr-only"
                                            onChange={(e) =>
                                                setAttachmentName(e.target.files?.[0]?.name ?? "")
                                            }
                                        />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || policies.length === 0}
                            className="inline-flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-[#06b6d4] px-6 text-sm font-bold text-white shadow-sm active:bg-[#05a8b8] disabled:opacity-60 sm:h-11 sm:w-auto sm:rounded-md"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <Send className="h-4 w-4" aria-hidden />
                            )}
                            {isSubmitting ? "Submitting…" : "Submit request"}
                        </button>
                        <div className="grid grid-cols-2 gap-2 sm:contents">
                            <button
                                type="button"
                                onClick={() => resetForm()}
                                disabled={isSubmitting}
                                className="inline-flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 active:bg-gray-50 disabled:opacity-60 sm:w-auto sm:rounded-md"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden />
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex h-11 w-full touch-manipulation items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 active:bg-gray-50 sm:hidden"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}

export default function EmployeeLeaveRequestPage() {
    const today = useMemo(() => getTodayIso(), []);

    const [policies, setPolicies] = useState<LeavePolicy[]>([]);
    const [settings, setSettings] = useState<OrgSettings | null>(null);
    const [joiningDate, setJoiningDate] = useState<string | null>(null);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [pageAlertOpen, setPageAlertOpen] = useState(false);
    const [pageAlertMessages, setPageAlertMessages] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInitialPolicyId, setModalInitialPolicyId] = useState<number | null>(null);
    const [successAlertOpen, setSuccessAlertOpen] = useState(false);
    const [withdrawSuccessOpen, setWithdrawSuccessOpen] = useState(false);
    const [withdrawBusyId, setWithdrawBusyId] = useState<number | null>(null);
    const [withdrawConfirmTarget, setWithdrawConfirmTarget] = useState<LeaveRequestRow | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    /** Opens apply-leave modal; pass policyId from a balance card to pre-select that leave type. */
    const openLeaveApplyModal = useCallback((policyId?: number) => {
        if (policyId != null && Number.isFinite(policyId) && policyId > 0) {
            setModalInitialPolicyId(policyId);
        } else {
            setModalInitialPolicyId(null);
        }
        setModalOpen(true);
    }, []);

    const closeLeaveApplyModal = useCallback(() => {
        setModalOpen(false);
        setModalInitialPolicyId(null);
    }, []);

    const fetchLeaveData = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const resp = await fetch("/api/employee/leave", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to load leave data",
                );
            }
            setPolicies(Array.isArray(data.policies) ? data.policies : []);
            setSettings(data.settings ?? null);
            setJoiningDate(data.joining_date ?? null);
            setBalances(Array.isArray(data.balances) ? data.balances : []);
            setRequests(Array.isArray(data.requests) ? data.requests : []);
            setWorkingDays(Array.isArray(data.working_days) ? data.working_days : [1, 2, 3, 4, 5]);
        } catch (error) {
            console.error("Load leave data failed:", error);
            const msg =
                error instanceof Error ? error.message : "Failed to load leave data";
            setLoadError(msg);
            setPageAlertMessages([msg]);
            setPageAlertOpen(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLeaveData();
    }, [fetchLeaveData]);

    const promptWithdrawLeave = useCallback((row: LeaveRequestRow) => {
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
            setWithdrawSuccessOpen(true);
            void fetchLeaveData();
        } catch (error) {
            console.error("Withdraw leave failed:", error);
            const msg =
                error instanceof Error ? error.message : "Failed to withdraw leave";
            setPageAlertMessages([msg]);
            setPageAlertOpen(true);
        } finally {
            setIsWithdrawing(false);
            setWithdrawBusyId(null);
        }
    }, [withdrawConfirmTarget, isWithdrawing, fetchLeaveData]);

    const balanceCards = useMemo(() => {
        return balances
            .filter((b) => b.accrual_cycle !== "none" || b.total > 0)
            .map((b, idx) => ({
                ...b,
                ...CARD_COLORS[idx % CARD_COLORS.length],
            }));
    }, [balances]);

    const defaultHints = useMemo(() => {
        if (!policies.length || !settings) return [];
        return policyHints(policies[0], settings, joiningDate).slice(0, 4);
    }, [policies, settings, joiningDate]);

    const recentRequests = useMemo(
        () => requests.filter((r) => isLeaveRequestIncomplete(r, today)),
        [requests, today],
    );

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4 pb-8 sm:space-y-6">
            <LeaveAlertPopup
                open={pageAlertOpen}
                variant="error"
                messages={pageAlertMessages}
                onClose={() => {
                    setPageAlertOpen(false);
                    setPageAlertMessages([]);
                }}
            />
            <LeaveAlertPopup
                open={successAlertOpen}
                variant="success"
                title="Request submitted"
                subtitle="Your manager will review it shortly."
                onClose={() => setSuccessAlertOpen(false)}
            />
            <LeaveAlertPopup
                open={withdrawSuccessOpen}
                variant="success"
                title="Leave withdrawn"
                subtitle="Your leave request has been cancelled."
                onClose={() => setWithdrawSuccessOpen(false)}
            />

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
            {settings && (
                <LeaveApplyModal
                    open={modalOpen}
                    onClose={closeLeaveApplyModal}
                    onSuccess={() => {
                        setSuccessAlertOpen(true);
                        void fetchLeaveData();
                    }}
                    today={today}
                    policies={policies}
                    settings={settings}
                    joiningDate={joiningDate}
                    balances={balances}
                    existingRequests={requests}
                    initialPolicyId={modalInitialPolicyId}
                    workingDays={workingDays}
                />
            )}

            {loadError && (
                <button
                    type="button"
                    onClick={() => {
                        setPageAlertMessages([loadError]);
                        setPageAlertOpen(true);
                    }}
                    className="flex w-full items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100/80"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                        {loadError}
                        <span className="mt-0.5 block text-xs font-semibold text-amber-800">
                            Tap to view details
                        </span>
                    </span>
                </button>
            )}

            {isLoading ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
                    <p>Loading leave balances…</p>
                </div>
            ) : (
                <>
                    {balanceCards.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                            {balanceCards.map((b) => {
                                const isUnpaidOrNoQuota = b.paid === false || b.accrual_cycle === "none" || b.total === 0;
                                const displayValue = isUnpaidOrNoQuota && b.total === 0 ? b.used : b.remaining;
                                const displaySubtext = isUnpaidOrNoQuota && b.total === 0 ? "days taken" : "days left";
                                const displayFooter = isUnpaidOrNoQuota && b.total === 0 ? "Unpaid / No Quota Limit" : `${b.used}/${b.total} used`;
                                const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
                                return (
                                    <button
                                        key={b.policy_id}
                                        type="button"
                                        onClick={() => openLeaveApplyModal(b.policy_id)}
                                        className={`min-h-[7.5rem] touch-manipulation rounded-md bg-gradient-to-br ${b.color} p-3.5 text-left text-white shadow-sm transition active:scale-[0.98] sm:p-4 sm:hover:scale-[1.02] sm:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-offset-2`}
                                        aria-label={`Apply for ${b.name}`}
                                    >
                                        <div className="flex items-start justify-between gap-1.5">
                                            <p className="line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-white/85 sm:text-xs">
                                                {b.name}
                                            </p>
                                            <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                                                {b.code}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black tabular-nums sm:text-3xl">
                                            {displayValue}
                                        </p>
                                        <p className="text-[11px] font-medium text-white/80 sm:text-xs">
                                            {displaySubtext}
                                        </p>
                                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20 sm:mt-3">
                                            <div
                                                className="h-full rounded-full bg-white/90"
                                                style={{ width: `${isUnpaidOrNoQuota && b.total === 0 ? 0 : Math.min(100, pct)}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] font-semibold text-white/70">
                                            {displayFooter}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600 sm:px-6">
                            No quota-based leave policies configured. You can still apply if types
                            are listed in the form.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                        <div className="order-1 rounded-md border border-dashed border-[#06b6d4]/40 bg-[#06b6d4]/5 p-4 text-center sm:p-6 lg:order-none lg:col-span-1">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#06b6d4]/15 text-[#06b6d4] sm:h-14 sm:w-14">
                                <Plus className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                            </div>
                            <h3 className="mt-3 text-base font-bold text-[#0a2a5e] sm:mt-4">
                                Need time off?
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                Pick a leave type and dates — rules are checked automatically.
                            </p>
                            <button
                                type="button"
                                onClick={() => openLeaveApplyModal()}
                                disabled={policies.length === 0}
                                className="mt-4 inline-flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-[#0a2a5e] text-sm font-bold text-white active:bg-[#06124f] disabled:opacity-60 sm:h-10 sm:rounded-md md:hidden"
                            >
                                Apply now
                            </button>
                        </div>

                        <div className="order-2 rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:order-none lg:col-span-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[#0a2a5e]">
                                Before you apply
                            </h3>
                            <ul className="mt-3 grid gap-2.5 text-sm leading-relaxed text-gray-700 sm:grid-cols-2">
                                {defaultHints.map((h) => (
                                    <li key={h} className="flex gap-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                                        {h}
                                    </li>
                                ))}
                                {joiningDate && (
                                    <li className="flex gap-2 sm:col-span-2">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                                        Joining date: {formatLeaveDisplayDate(joiningDate)}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <Link
                            href="/employee-dashboard/history"
                            className="inline-flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 text-sm font-bold text-[#0a2a5e] active:bg-[#0a2a5e]/10 sm:h-10 sm:w-auto sm:rounded-md"
                        >
                            <Clock className="h-4 w-4" aria-hidden />
                            View leave history
                        </Link>
                    </div>

                    <LeaveRequestsSection
                        title="Recent requests"
                        subtitle={`${recentRequests.length} current or upcoming request${recentRequests.length === 1 ? "" : "s"}`}
                        rows={recentRequests}
                        emptyMessage={
                            requests.length === 0
                                ? "No leave requests yet."
                                : "No pending or upcoming leave. View leave history for past or rejected requests."
                        }
                        showWithdrawAction
                        showNewRequestButton
                        onNewRequest={() => openLeaveApplyModal()}
                        policiesAvailable={policies.length > 0}
                        withdrawBusyId={withdrawBusyId}
                        onWithdraw={(r) => promptWithdrawLeave(r)}
                    />
                </>
            )}
        </div>
    );
}
