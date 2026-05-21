"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Paperclip,
    Plus,
    RotateCcw,
    Send,
    Umbrella,
    X,
} from "lucide-react";

type LeaveType = "casual" | "sick" | "earned" | "comp-off" | "unpaid" | "wfh";
type DayType = "full" | "first-half" | "second-half";
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

type LeaveBalance = {
    type: LeaveType;
    label: string;
    total: number;
    used: number;
    color: string;
    accent: string;
};

type LeaveRequestRow = {
    id: string;
    type: LeaveType;
    from: string;
    to: string;
    days: number;
    dayType: DayType;
    reason: string;
    status: LeaveStatus;
    appliedOn: string;
};

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
    { value: "casual", label: "Casual leave" },
    { value: "sick", label: "Sick leave" },
    { value: "earned", label: "Earned leave" },
    { value: "comp-off", label: "Compensatory off" },
    { value: "wfh", label: "Work from home" },
    { value: "unpaid", label: "Unpaid leave" },
];

const MOCK_BALANCES: LeaveBalance[] = [
    { type: "casual", label: "Casual", total: 12, used: 4, color: "from-[#06b6d4] to-[#0891b2]", accent: "text-[#06b6d4]" },
    { type: "sick", label: "Sick", total: 10, used: 2, color: "from-emerald-500 to-emerald-600", accent: "text-emerald-700" },
    { type: "earned", label: "Earned", total: 15, used: 7, color: "from-[#0a2a5e] to-[#0d3a7a]", accent: "text-[#0a2a5e]" },
    { type: "comp-off", label: "Comp off", total: 3, used: 1, color: "from-amber-500 to-orange-500", accent: "text-amber-700" },
];

const MOCK_REQUESTS: LeaveRequestRow[] = [
    {
        id: "LR-2026-014",
        type: "casual",
        from: "2026-05-24",
        to: "2026-05-25",
        days: 2,
        dayType: "full",
        reason: "Family function out of town",
        status: "pending",
        appliedOn: "2026-05-19",
    },
    {
        id: "LR-2026-011",
        type: "sick",
        from: "2026-05-10",
        to: "2026-05-10",
        days: 1,
        dayType: "full",
        reason: "Fever and rest advised by doctor",
        status: "approved",
        appliedOn: "2026-05-09",
    },
    {
        id: "LR-2026-008",
        type: "earned",
        from: "2026-04-18",
        to: "2026-04-19",
        days: 2,
        dayType: "full",
        reason: "Personal work",
        status: "approved",
        appliedOn: "2026-04-12",
    },
    {
        id: "LR-2026-005",
        type: "wfh",
        from: "2026-04-02",
        to: "2026-04-02",
        days: 1,
        dayType: "full",
        reason: "Home repair — technician visit",
        status: "rejected",
        appliedOn: "2026-04-01",
    },
];

const STATUS_STYLES: Record<LeaveStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-900 ring-amber-500/25" },
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-900 ring-emerald-500/25" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-900 ring-red-500/25" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 ring-gray-400/25" },
};

const INPUT =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700";

function leaveTypeLabel(type: LeaveType) {
    return LEAVE_TYPES.find((t) => t.value === type)?.label ?? type;
}

function dayTypeLabel(dayType: DayType) {
    if (dayType === "first-half") return "First half";
    if (dayType === "second-half") return "Second half";
    return "Full day";
}

function formatDisplayDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function countLeaveDays(from: string, to: string, dayType: DayType) {
    if (!from || !to) return 0;
    const start = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dayType === "full") return diff;
    return diff === 1 ? 0.5 : diff;
}

function LeaveApplyModal({
    open,
    onClose,
    onSuccess,
    today,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    today: string;
}) {
    const [leaveType, setLeaveType] = useState<LeaveType>("casual");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dayType, setDayType] = useState<DayType>("full");
    const [reason, setReason] = useState("");
    const [attachmentName, setAttachmentName] = useState("");
    const [formError, setFormError] = useState("");

    const requestedDays = useMemo(
        () => countLeaveDays(startDate, endDate, dayType),
        [startDate, endDate, dayType],
    );

    const selectedBalance = MOCK_BALANCES.find((b) => b.type === leaveType);
    const remaining = selectedBalance ? selectedBalance.total - selectedBalance.used : 0;

    const resetForm = useCallback(() => {
        setLeaveType("casual");
        setStartDate("");
        setEndDate("");
        setDayType("full");
        setReason("");
        setAttachmentName("");
        setFormError("");
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!startDate || !endDate) {
            setFormError("Please select both start and end dates.");
            return;
        }
        if (endDate < startDate) {
            setFormError("End date cannot be before start date.");
            return;
        }
        if (startDate < today) {
            setFormError("Leave cannot start in the past.");
            return;
        }
        if (!reason.trim()) {
            setFormError("Please enter a reason for your leave.");
            return;
        }
        if (requestedDays <= 0) {
            setFormError("Invalid date range.");
            return;
        }

        resetForm();
        onClose();
        onSuccess();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            onClick={handleClose}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden />

            <div
                className="relative flex max-h-[min(92vh,820px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6"
                    style={{
                        background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 text-white">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                <FileText className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <h2 id="leave-modal-title" className="text-lg font-bold">
                                    Apply for leave
                                </h2>
                                <p className="text-xs font-medium text-white/75">
                                    Submit a new leave request (preview UI)
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
                    <div className="space-y-4 p-5 sm:p-6">
                        {formError && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
                                <p>{formError}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="modal-leave-type" className={LABEL}>
                                Leave type
                            </label>
                            <select
                                id="modal-leave-type"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                                className={INPUT}
                            >
                                {LEAVE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
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
                                        min={today}
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
                                        min={startDate || today}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className={`${INPUT} pl-10`}
                                    />
                                </div>
                            </div>
                        </div>

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
                                            className={`rounded-lg border py-2.5 text-xs font-bold transition sm:text-sm ${
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

                        {startDate && endDate && endDate >= startDate && (
                            <div className="flex items-center gap-3 rounded-xl border border-[#06b6d4]/25 bg-[#06b6d4]/8 px-4 py-3">
                                <CalendarDays className="h-5 w-5 shrink-0 text-[#06b6d4]" />
                                <div className="min-w-0 text-sm">
                                    <p className="font-bold text-[#0a2a5e]">
                                        {requestedDays} day{requestedDays === 1 ? "" : "s"} requested
                                    </p>
                                    <p className="truncate text-gray-600">
                                        {formatDisplayDate(startDate)}
                                        {startDate !== endDate && ` → ${formatDisplayDate(endDate)}`}
                                    </p>
                                    {selectedBalance && (
                                        <p className={`mt-0.5 text-xs font-semibold ${selectedBalance.accent}`}>
                                            {remaining} {leaveTypeLabel(leaveType)} left
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

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
                                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="modal-attachment" className={LABEL}>
                                Attachment{" "}
                                <span className="font-normal normal-case text-gray-500">(optional)</span>
                            </label>
                            <label
                                htmlFor="modal-attachment"
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition hover:border-[#06b6d4] hover:bg-[#06b6d4]/5"
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
                                    onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? "")}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            onClick={() => resetForm()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-bold text-gray-800 hover:bg-gray-50"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden />
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-bold text-gray-800 hover:bg-gray-50 sm:hidden"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#06b6d4] px-6 text-sm font-bold text-white shadow-sm hover:bg-[#05a8b8]"
                        >
                            <Send className="h-4 w-4" aria-hidden />
                            Submit request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function EmployeeLeaveRequestPage() {
    const today = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }, []);

    const [modalOpen, setModalOpen] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-8 sm:space-y-6">
            <LeaveApplyModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => setSubmitSuccess(true)}
                today={today}
            />

            <div className="flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#06b6d4] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#05a8b8]"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                    Apply for leave
                </button>
                <Link
                    href="/employee-dashboard/attendance/history"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 text-sm font-bold text-[#0a2a5e] hover:bg-[#0a2a5e]/10"
                >
                    <Clock className="h-4 w-4" aria-hidden />
                    Leave history
                </Link>
            </div>

            {submitSuccess && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                    <div className="flex-1">
                        <p className="font-bold">Request submitted</p>
                        <p className="mt-0.5">Your manager will review it shortly (demo).</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSubmitSuccess(false)}
                        className="shrink-0 text-emerald-800 hover:text-emerald-950"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {MOCK_BALANCES.map((b) => {
                    const left = b.total - b.used;
                    const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
                    return (
                        <button
                            key={b.type}
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className={`rounded-2xl bg-gradient-to-br ${b.color} p-4 text-left text-white shadow-sm transition hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-offset-2`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                                    {b.label}
                                </p>
                                <Umbrella className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
                            </div>
                            <p className="mt-2 text-3xl font-black tabular-nums">{left}</p>
                            <p className="text-xs font-medium text-white/80">days remaining</p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white/90"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-white/70">
                                {b.used} used · {b.total} total
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div
                    className="rounded-2xl border border-dashed border-[#06b6d4]/40 bg-[#06b6d4]/5 p-6 text-center lg:col-span-1"
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06b6d4]/15 text-[#06b6d4]">
                        <Plus className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#0a2a5e]">Need time off?</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Open the form to pick dates, leave type, and reason.
                    </p>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0a2a5e] text-sm font-bold text-white hover:bg-[#06124f]"
                    >
                        Apply now
                    </button>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#0a2a5e]">
                        Before you apply
                    </h3>
                    <ul className="mt-3 grid gap-2.5 text-sm text-gray-700 sm:grid-cols-2">
                        <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                            Apply 2+ days ahead for planned leave.
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                            Sick leave over 2 days may need a certificate.
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                            Half-day is for a single date only.
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06b6d4]" />
                            Manager approval is required.
                        </li>
                    </ul>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Recent requests</h2>
                        <p className="text-sm text-gray-600">Sample data for layout preview</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-bold text-[#0a2a5e] hover:bg-gray-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New request
                    </button>
                </div>
                <div className="overflow-x-auto">
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_REQUESTS.map((row, idx) => {
                                const status = STATUS_STYLES[row.status];
                                return (
                                    <tr
                                        key={row.id}
                                        className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                                    >
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-gray-900">
                                            {row.id}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-gray-800">
                                            {leaveTypeLabel(row.type)}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-800">
                                            <p className="font-semibold">
                                                {formatDisplayDate(row.from)}
                                                {row.from !== row.to && (
                                                    <> – {formatDisplayDate(row.to)}</>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">{dayTypeLabel(row.dayType)}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold tabular-nums text-gray-900">
                                            {row.days}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${status.className}`}
                                            >
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600">
                                            {formatDisplayDate(row.appliedOn)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
