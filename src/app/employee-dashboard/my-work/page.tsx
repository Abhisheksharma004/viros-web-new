"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import AddWorkEntryModal, { type WorkFormValues } from "@/components/employee-dashboard/AddWorkEntryModal";
import { expensePrimaryButtonClass } from "@/lib/employeeExpenseUi";
import type { EmployeeWorkEntryRow, WorkEntrySummary, WorkStatus } from "@/lib/employeeWorkShared";

type WorkEntriesPayload = {
    entries?: EmployeeWorkEntryRow[];
    summary?: WorkEntrySummary;
    totalCount?: number;
    message?: string;
};

function getTodayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatMonthShort(month: string) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function statusBadgeClass(status: WorkStatus): string {
    switch (status) {
        case "Completed":
            return "bg-emerald-50 text-emerald-800 ring-emerald-600/15";
        case "In Progress":
            return "bg-blue-50 text-blue-800 ring-blue-600/15";
        case "Pending":
            return "bg-amber-50 text-amber-800 ring-amber-600/15";
        case "On Hold":
            return "bg-gray-100 text-gray-700 ring-gray-200";
        default:
            return "bg-gray-100 text-gray-700 ring-gray-200";
    }
}

function formatDisplayDate(iso: string): string {
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const EMPTY_SUMMARY: WorkEntrySummary = { total: 0, inProgress: 0, completed: 0 };

export default function MyWorkPage() {
    const [month, setMonth] = useState(() => getTodayIso().slice(0, 7));
    const [entries, setEntries] = useState<EmployeeWorkEntryRow[]>([]);
    const [summary, setSummary] = useState<WorkEntrySummary>(EMPTY_SUMMARY);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<EmployeeWorkEntryRow | null>(null);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const monthShortLabel = useMemo(() => formatMonthShort(month), [month]);

    const loadEntries = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const response = await fetch(
                `/api/employee/work-entries?month=${encodeURIComponent(month)}&limit=200`,
                { cache: "no-store" },
            );
            const data = (await response.json().catch(() => ({}))) as WorkEntriesPayload;

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load work entries");
            }

            setEntries(Array.isArray(data.entries) ? data.entries : []);
            setSummary(data.summary ?? EMPTY_SUMMARY);
            setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load work entries");
            setEntries([]);
            setSummary(EMPTY_SUMMARY);
        } finally {
            setIsLoading(false);
        }
    }, [month]);

    useEffect(() => {
        void loadEntries();
    }, [loadEntries]);

    const stats = [
        {
            label: "Total entries",
            value: String(summary.total),
            tone: "text-[#0a2a5e]",
            ring: "ring-[#0a2a5e]/15",
        },
        {
            label: "In progress",
            value: String(summary.inProgress),
            tone: "text-blue-600",
            ring: "ring-blue-200",
        },
        {
            label: "Completed",
            value: String(summary.completed),
            tone: "text-emerald-600",
            ring: "ring-emerald-200",
        },
    ];

    const handleAddEntry = async (form: WorkFormValues) => {
        const response = await fetch("/api/employee/work-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                work_date: form.workDate,
                task: form.task,
                activity: form.activity,
                duration: form.duration,
                status: form.status,
                remark: form.remark,
            }),
        });

        const data = (await response.json().catch(() => ({}))) as WorkEntriesPayload & {
            entry?: EmployeeWorkEntryRow;
        };

        if (!response.ok) {
            throw new Error(typeof data.message === "string" ? data.message : "Failed to save work entry");
        }

        const entryMonthValue = form.workDate.slice(0, 7);
        if (entryMonthValue !== month) {
            setMonth(entryMonthValue);
        } else {
            await loadEntries();
        }
    };

    const handleUpdateEntry = async (form: WorkFormValues) => {
        if (!editingEntry) return;

        const response = await fetch(`/api/employee/work-entries/${editingEntry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                work_date: form.workDate,
                task: form.task,
                activity: form.activity,
                duration: form.duration,
                status: form.status,
                remark: form.remark,
            }),
        });

        const data = (await response.json().catch(() => ({}))) as WorkEntriesPayload & {
            entry?: EmployeeWorkEntryRow;
        };

        if (!response.ok) {
            throw new Error(typeof data.message === "string" ? data.message : "Failed to update work entry");
        }

        const entryMonthValue = form.workDate.slice(0, 7);
        if (entryMonthValue !== month) {
            setMonth(entryMonthValue);
        } else {
            if (data.summary) {
                setSummary(data.summary);
            }
            await loadEntries();
        }
    };

    const handleFormSubmit = async (form: WorkFormValues) => {
        if (editingEntry) {
            await handleUpdateEntry(form);
        } else {
            await handleAddEntry(form);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Remove this work entry?")) return;

        const response = await fetch(`/api/employee/work-entries/${id}`, { method: "DELETE" });
        const data = (await response.json().catch(() => ({}))) as WorkEntriesPayload;

        if (!response.ok) {
            window.alert(typeof data.message === "string" ? data.message : "Failed to delete work entry");
            return;
        }

        if (data.summary) {
            setSummary(data.summary);
        }
        await loadEntries();
    };

    const openAddModal = () => {
        setEditingEntry(null);
        setModalOpen(true);
    };

    const openEditModal = (row: EmployeeWorkEntryRow) => {
        setEditingEntry(row);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingEntry(null);
    };

    const hasAnyEntries = totalCount > 0;
    const hasMonthEntries = entries.length > 0;

    return (
        <>
            <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
                {loadError ? (
                    <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <span>{loadError}</span>
                        <button
                            type="button"
                            onClick={() => void loadEntries()}
                            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 touch-manipulation active:scale-[0.98]"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                            Retry
                        </button>
                    </div>
                ) : null}

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className={`min-w-0 rounded-md border bg-white p-2 shadow-sm ring-1 sm:p-4 ${item.ring}`}
                        >
                            <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-xs">
                                {item.label}
                            </p>
                            <p
                                className={`mt-1 text-xl font-black leading-none tabular-nums sm:mt-2 sm:text-3xl ${item.tone}`}
                            >
                                {isLoading ? "—" : item.value}
                            </p>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-3 py-3 sm:px-6 sm:py-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <ClipboardList
                                        className="h-5 w-5 shrink-0 text-[#0a2a5e]"
                                        aria-hidden
                                    />
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                                            Work log
                                        </h2>
                                        <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                                            Track daily tasks, activities, and progress
                                        </p>
                                    </div>
                                </div>
                                <p className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                    {entries.length}
                                    {hasAnyEntries ? `/${totalCount}` : ""}
                                </p>
                            </div>

                            <div className="flex w-full items-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setMonth((m) => shiftMonth(m, -1))}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1 text-xs font-semibold text-gray-800 sm:text-sm">
                                    <Calendar className="h-4 w-4 shrink-0 text-[#0a2a5e]" aria-hidden />
                                    <span className="truncate sm:hidden">{monthShortLabel}</span>
                                    <span className="hidden truncate sm:inline">{monthLabel}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setMonth((m) => shiftMonth(m, 1))}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 touch-manipulation transition active:scale-95 hover:bg-white"
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={openAddModal}
                                className={`${expensePrimaryButtonClass} !rounded-md !hidden sm:!inline-flex`}
                            >
                                <Plus className="h-4 w-4" aria-hidden />
                                Add work entry
                            </button>
                        </div>
                    </div>

                    <div className="px-3 py-3 sm:p-6">
                        {isLoading ? (
                            <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0a2a5e]" aria-hidden />
                                Loading work entries…
                            </div>
                        ) : !hasAnyEntries ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                                <ClipboardList className="h-10 w-10 text-gray-300" aria-hidden />
                                <p className="text-sm font-medium text-gray-600">No work entries yet.</p>
                                <p className="max-w-sm text-xs text-gray-500">
                                    Log what you worked on each day — task, activity, duration, and status.
                                </p>
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 py-2.5 text-sm font-semibold text-[#0a2a5e] touch-manipulation active:scale-[0.98] hover:bg-[#0a2a5e]/10"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add your first entry
                                </button>
                            </div>
                        ) : !hasMonthEntries ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-2 py-12 text-center">
                                <ClipboardList className="h-10 w-10 text-gray-300" aria-hidden />
                                <p className="text-sm font-medium text-gray-600">
                                    No work entries for {monthLabel}
                                </p>
                                <p className="max-w-sm text-xs text-gray-500">
                                    Use the arrows to browse other months, or add an entry for this month.
                                </p>
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 py-2.5 text-sm font-semibold text-[#0a2a5e] touch-manipulation active:scale-[0.98] hover:bg-[#0a2a5e]/10"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add entry for {monthShortLabel}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 md:hidden">
                                    {entries.map((row) => (
                                        <article
                                            key={row.id}
                                            className="flex flex-col rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm"
                                        >
                                            <div className="flex flex-col gap-3 p-4 pb-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#0a2a5e]">
                                                            {formatDisplayDate(row.work_date)}
                                                        </p>
                                                        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-gray-900">
                                                            {row.task}
                                                        </h3>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-3 text-sm text-gray-700">{row.activity}</p>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 pb-4 pt-3">
                                                <div className="min-w-0 text-sm">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                        Duration
                                                    </p>
                                                    <p className="font-medium text-gray-800">
                                                        {row.duration || "—"}
                                                    </p>
                                                    {row.remark ? (
                                                        <p className="mt-1 truncate text-xs text-gray-500">
                                                            {row.remark}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(row)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0a2a5e]/20 text-[#0a2a5e] touch-manipulation active:scale-95"
                                                        aria-label="Edit entry"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(row.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 touch-manipulation active:scale-95"
                                                        aria-label="Remove entry"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="-mx-1 hidden overflow-x-auto md:block">
                                    <table className="min-w-full">
                                        <thead className="border-b border-[#0a2a5e]/10 bg-[#0a2a5e]/5">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Task
                                                </th>
                                                <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Activity
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Duration
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Status
                                                </th>
                                                <th className="min-w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Remark
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {entries.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors hover:bg-[#06b6d4]/5"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 lg:px-6">
                                                        {formatDisplayDate(row.work_date)}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 lg:px-6">
                                                        {row.task}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-700 lg:px-6">
                                                        {row.activity}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 lg:px-6">
                                                        {row.duration || "—"}
                                                    </td>
                                                    <td className="px-4 py-4 lg:px-6">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                                                        >
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600 lg:px-6">
                                                        {row.remark || "—"}
                                                    </td>
                                                    <td className="px-4 py-4 text-right lg:px-6">
                                                        <div className="inline-flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(row)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 text-[#0a2a5e] transition hover:bg-[#0a2a5e]/10"
                                                                title="Edit"
                                                                aria-label="Edit entry"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDelete(row.id)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                                                                title="Remove"
                                                                aria-label="Remove entry"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            <button
                type="button"
                onClick={openAddModal}
                className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#06124f] to-[#0a2a5e] text-white shadow-lg touch-manipulation transition active:scale-95 sm:hidden"
                aria-label="Add work entry"
            >
                <Plus className="h-6 w-6" aria-hidden />
            </button>

            <AddWorkEntryModal
                open={modalOpen}
                onClose={closeModal}
                onSubmit={handleFormSubmit}
                month={month}
                editingEntry={editingEntry}
            />
        </>
    );
}
