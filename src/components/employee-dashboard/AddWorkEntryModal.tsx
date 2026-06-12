"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import type { EmployeeWorkEntryRow } from "@/lib/employeeWorkShared";
import { inputClass, labelClass, selectClass } from "@/lib/adminTaskUiShared";
import {
    WORK_DURATION_OPTIONS as WORK_DURATION_VALUES,
    WORK_STATUSES,
    type WorkStatus,
} from "@/lib/employeeWorkShared";

export { WORK_STATUSES, type WorkStatus };

export const WORK_DURATION_OPTIONS = WORK_DURATION_VALUES.map((value) => ({
    value,
    label: value === "30 minutes" ? "30 minutes (half hour)" : value,
}));

export type WorkFormValues = {
    workDate: string;
    task: string;
    activity: string;
    duration: string;
    status: WorkStatus;
    remark: string;
};

export function workEntryToForm(entry: EmployeeWorkEntryRow): WorkFormValues {
    return {
        workDate: entry.work_date,
        task: entry.task,
        activity: entry.activity,
        duration: entry.duration ?? "",
        status: entry.status,
        remark: entry.remark ?? "",
    };
}

export function emptyWorkForm(todayIso: string): WorkFormValues {
    return {
        workDate: todayIso,
        task: "",
        activity: "",
        duration: "",
        status: "In Progress",
        remark: "",
    };
}

const textareaClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 min-h-[88px] resize-y";

function todayDateOnly() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthDateBounds(month: string) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    return { min: start, max: end };
}

/** Past/today only — future dates cannot be selected. */
function resolveWorkDateBounds(month?: string) {
    const today = todayDateOnly();
    if (!month) {
        return { min: undefined as string | undefined, max: today };
    }
    const monthBounds = getMonthDateBounds(month);
    return {
        min: monthBounds.min,
        max: monthBounds.max <= today ? monthBounds.max : today,
    };
}

function defaultDateForMonth(month: string) {
    const bounds = resolveWorkDateBounds(month);
    const today = todayDateOnly();
    if (today >= bounds.min! && today <= bounds.max) return today;
    return bounds.max;
}

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (form: WorkFormValues) => void | Promise<void>;
    /** Restrict work date to this calendar month (YYYY-MM). */
    month?: string;
    /** When set, modal opens in edit mode with fields pre-filled. */
    editingEntry?: EmployeeWorkEntryRow | null;
};

export default function AddWorkEntryModal({
    open,
    onClose,
    onSubmit,
    month,
    editingEntry = null,
}: Props) {
    const isEdit = Boolean(editingEntry);
    const activeMonth = isEdit ? editingEntry!.work_date.slice(0, 7) : month;
    const dateBounds = resolveWorkDateBounds(activeMonth);
    const [form, setForm] = useState<WorkFormValues>(() => emptyWorkForm(todayDateOnly()));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (editingEntry) {
                setForm(workEntryToForm(editingEntry));
            } else {
                setForm(emptyWorkForm(month ? defaultDateForMonth(month) : todayDateOnly()));
            }
            setIsSubmitting(false);
        }
    }, [open, month, editingEntry]);

    if (!open) return null;

    const setField = <K extends keyof WorkFormValues>(key: K, value: WorkFormValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.task.trim() || !form.activity.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                ...form,
                task: form.task.trim(),
                activity: form.activity.trim(),
                duration: form.duration.trim(),
                remark: form.remark.trim(),
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
            <div
                className="absolute inset-0 bg-black/40"
                aria-hidden
                onClick={() => {
                    if (!isSubmitting) onClose();
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="work-entry-modal-title"
                className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                    <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                </div>

                <div
                    className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6"
                    style={{
                        background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <div className="min-w-0">
                        <h3
                            id="work-entry-modal-title"
                            className="flex items-center gap-2 text-lg font-bold text-white"
                        >
                            {isEdit ? (
                                <Pencil className="h-5 w-5 shrink-0" aria-hidden />
                            ) : (
                                <Plus className="h-5 w-5 shrink-0" aria-hidden />
                            )}
                            {isEdit ? "Update work entry" : "Add work entry"}
                        </h3>
                        <p className="mt-0.5 text-xs text-cyan-100/90">
                            {isEdit ? "Edit your logged work details" : "Record what you worked on"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.workDate}
                                    onChange={(e) => setField("workDate", e.target.value)}
                                    className={inputClass}
                                    min={dateBounds?.min}
                                    max={dateBounds?.max}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Task <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.task}
                                    onChange={(e) => setField("task", e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. Client visit"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Duration</label>
                                <select
                                    value={form.duration}
                                    onChange={(e) => setField("duration", e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Select hours</option>
                                    {WORK_DURATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setField("status", e.target.value as WorkStatus)}
                                    className={selectClass}
                                >
                                    {WORK_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Activity <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.activity}
                                onChange={(e) => setField("activity", e.target.value)}
                                className={textareaClass}
                                placeholder="Describe what you did..."
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Remark</label>
                            <input
                                type="text"
                                value={form.remark}
                                onChange={(e) => setField("remark", e.target.value)}
                                className={inputClass}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isEdit ? (
                                <Pencil className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {isEdit ? "Save changes" : "Add entry"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
