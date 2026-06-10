"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    Loader2,
    RefreshCw,
    Search,
    X,
} from "lucide-react";
import type { AdminWorkEntrySummary, EmployeeWorkEntryRow, WorkStatus } from "@/lib/employeeWorkShared";

type EmployeeOption = {
    employee_id: string;
    full_name: string;
    department: string | null;
};

type WorkEntriesPayload = {
    entries?: EmployeeWorkEntryRow[];
    summary?: AdminWorkEntrySummary;
    message?: string;
};

const TH =
    "whitespace-nowrap px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#0a2a5e] bg-[#0a2a5e]/10 border-b border-[#0a2a5e]/15";
const TH_CENTER = `${TH} text-center`;
const TD = "px-4 py-4 align-top text-sm text-gray-800";
const TD_MUTED = "text-gray-500";

function formatDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function WorkEntryViewModal({
    entry,
    onClose,
}: {
    entry: EmployeeWorkEntryRow;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
            <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="work-entry-view-title"
                className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h3 id="work-entry-view-title" className="text-lg font-bold text-white">
                            Work entry details
                        </h3>
                        <p className="mt-0.5 text-xs text-cyan-100/90">
                            {formatDisplayDate(entry.work_date)} · #{entry.id}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Employee</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                {entry.employee_name || "—"}
                            </p>
                            <p className="text-xs text-gray-500">{entry.employee_id}</p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</p>
                            <p className="mt-1">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(entry.status)}`}
                                >
                                    {entry.status}
                                </span>
                            </p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Date</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDisplayDate(entry.work_date)}
                            </p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Duration</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{entry.duration || "—"}</p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Task</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{entry.task}</p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Activity</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">
                                {entry.activity}
                            </p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Remark</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">
                                {entry.remark || "—"}
                            </p>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 sm:col-span-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Submitted</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDateTime(entry.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[#0a2a5e] px-4 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

function formatDisplayDate(iso: string) {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadgeClass(status: WorkStatus): string {
    switch (status) {
        case "Completed":
            return "bg-emerald-100 text-emerald-900 ring-emerald-600/20";
        case "In Progress":
            return "bg-blue-100 text-blue-900 ring-blue-600/20";
        case "Pending":
            return "bg-amber-100 text-amber-900 ring-amber-600/20";
        case "On Hold":
            return "bg-gray-100 text-gray-700 ring-gray-300";
        default:
            return "bg-gray-100 text-gray-700 ring-gray-300";
    }
}

const EMPTY_SUMMARY: AdminWorkEntrySummary = {
    total: 0,
    inProgress: 0,
    completed: 0,
    employeeCount: 0,
};

function AdminWorkEntriesPageInner() {
    const searchParams = useSearchParams();
    const [month, setMonth] = useState(() => {
        const fromUrl = searchParams.get("month");
        return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl) ? fromUrl : currentMonth();
    });
    const [employeeFilter, setEmployeeFilter] = useState(() => searchParams.get("employeeId")?.trim() ?? "");
    const [query, setQuery] = useState("");
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [entries, setEntries] = useState<EmployeeWorkEntryRow[]>([]);
    const [summary, setSummary] = useState<AdminWorkEntrySummary>(EMPTY_SUMMARY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewEntry, setViewEntry] = useState<EmployeeWorkEntryRow | null>(null);

    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);

    useEffect(() => {
        void (async () => {
            try {
                const resp = await fetch("/api/admin/employees", { cache: "no-store" });
                const data = (await resp.json().catch(() => [])) as EmployeeOption[];
                if (resp.ok && Array.isArray(data)) {
                    setEmployees(data);
                }
            } catch {
                // Employee filter still works without dropdown options.
            }
        })();
    }, []);

    const loadEntries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("month", month);
            params.set("limit", "500");
            if (employeeFilter.trim()) params.set("employeeId", employeeFilter.trim());
            if (query.trim()) params.set("q", query.trim());

            const resp = await fetch(`/api/admin/work-entries?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as WorkEntriesPayload;
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load work entries");
            }
            setEntries(Array.isArray(data.entries) ? data.entries : []);
            setSummary(data.summary ?? EMPTY_SUMMARY);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load work entries");
            setEntries([]);
            setSummary(EMPTY_SUMMARY);
        } finally {
            setLoading(false);
        }
    }, [month, employeeFilter, query]);

    useEffect(() => {
        void loadEntries();
    }, [loadEntries]);

    const stats = [
        { label: "Total entries", value: summary.total, tone: "text-[#0a2a5e]", ring: "ring-[#0a2a5e]/15" },
        { label: "Employees", value: summary.employeeCount, tone: "text-indigo-700", ring: "ring-indigo-200" },
        { label: "In progress", value: summary.inProgress, tone: "text-blue-700", ring: "ring-blue-200" },
        { label: "Completed", value: summary.completed, tone: "text-emerald-700", ring: "ring-emerald-200" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className={`rounded-md border bg-white p-4 shadow-sm ring-1 ${item.ring}`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className={`mt-2 text-2xl font-black tabular-nums ${item.tone}`}>
                            {loading ? "—" : item.value}
                        </p>
                    </div>
                ))}
            </div>

            {error ? (
                <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => void loadEntries()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-4 py-2 text-xs font-semibold text-red-800"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                    </button>
                </div>
            ) : null}

            <section className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div
                    className="border-b border-white/10 px-4 py-5 sm:px-6"
                    style={{
                        background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-white" aria-hidden />
                        <div>
                            <h2 className="text-lg font-bold text-white">Employee work entries</h2>
                            <p className="text-sm text-white/70">Daily work logs submitted by employees</p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 p-1 sm:col-span-2 lg:col-span-1">
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-white">
                                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="truncate">{monthLabel}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="h-10 min-w-0 rounded-md border border-white/25 bg-white/95 px-3 text-sm font-medium text-gray-900"
                            aria-label="Filter by employee"
                        >
                            <option value="">All employees</option>
                            {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.full_name} ({emp.employee_id})
                                </option>
                            ))}
                        </select>

                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search task, activity…"
                                className="h-10 w-full rounded-md border border-white/25 bg-white/95 pl-9 pr-3 text-sm font-medium text-gray-900"
                            />
                        </div>
                    </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[960px] text-left">
                        <thead>
                            <tr>
                                <th className={TH}>Date</th>
                                <th className={TH}>Employee</th>
                                <th className={TH}>Task</th>
                                <th className={TH}>Activity</th>
                                <th className={TH}>Duration</th>
                                <th className={TH}>Status</th>
                                <th className={TH}>Remark</th>
                                <th className={TH_CENTER}>Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0a2a5e]" />
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                        No work entries for {monthLabel}
                                        {employeeFilter ? " for this employee" : ""}.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((row, idx) => (
                                    <tr
                                        key={row.id}
                                        className={idx % 2 === 1 ? "bg-gray-50/70" : "bg-white"}
                                    >
                                        <td className={`${TD} whitespace-nowrap font-medium`}>
                                            {formatDisplayDate(row.work_date)}
                                        </td>
                                        <td className={TD}>
                                            <Link
                                                href={`/admin-dashboard/attendance?tab=employee&employeeId=${encodeURIComponent(row.employee_id)}&month=${month}`}
                                                className="font-semibold text-[#0a2a5e] hover:underline"
                                            >
                                                {row.employee_name || row.employee_id}
                                            </Link>
                                            <p className="text-xs text-gray-500">{row.employee_id}</p>
                                        </td>
                                        <td className={`${TD} font-semibold text-gray-900`}>{row.task}</td>
                                        <td className={`${TD} max-w-xs`}>
                                            <p className="line-clamp-2">{row.activity}</p>
                                        </td>
                                        <td className={`${TD} whitespace-nowrap`}>{row.duration || "—"}</td>
                                        <td className={TD}>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className={`${TD} max-w-[160px] truncate`}>{row.remark || "—"}</td>
                                        <td className={`${TD} text-center`}>
                                            <button
                                                type="button"
                                                onClick={() => setViewEntry(row)}
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
                                                title="View"
                                                aria-label="View work entry"
                                            >
                                                <Eye className="h-4 w-4" aria-hidden />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="divide-y divide-gray-100 md:hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-[#0a2a5e]" />
                        </div>
                    ) : entries.length === 0 ? (
                        <p className="px-4 py-12 text-center text-sm text-gray-500">
                            No work entries for {monthLabel}.
                        </p>
                    ) : (
                        entries.map((row) => (
                            <article key={row.id} className="space-y-2 px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-[#0a2a5e]">
                                            {formatDisplayDate(row.work_date)}
                                        </p>
                                        <Link
                                            href={`/admin-dashboard/attendance?tab=employee&employeeId=${encodeURIComponent(row.employee_id)}&month=${month}`}
                                            className="text-sm font-bold text-gray-900 hover:underline"
                                        >
                                            {row.employee_name || row.employee_id}
                                        </Link>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}
                                    >
                                        {row.status}
                                    </span>
                                </div>
                                <p className="font-semibold text-gray-900">{row.task}</p>
                                <p className="text-sm text-gray-700">{row.activity}</p>
                                <p className="text-xs text-gray-500">
                                    {row.duration || "—"}
                                    {row.remark ? ` · ${row.remark}` : ""}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setViewEntry(row)}
                                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-[#0a2a5e]/15 px-3 text-xs font-semibold text-[#0a2a5e]"
                                >
                                    <Eye className="h-4 w-4" aria-hidden />
                                    View
                                </button>
                            </article>
                        ))
                    )}
                </div>

                <p className="border-t border-gray-100 bg-[#f8fafc] px-4 py-3 text-xs text-gray-600 sm:px-6">
                    {entries.length} entr{entries.length === 1 ? "y" : "ies"} for {monthLabel}
                </p>
            </section>

            {viewEntry ? (
                <WorkEntryViewModal entry={viewEntry} onClose={() => setViewEntry(null)} />
            ) : null}
        </div>
    );
}

export default function AdminWorkEntriesPage() {
    return (
        <Suspense fallback={null}>
            <AdminWorkEntriesPageInner />
        </Suspense>
    );
}
