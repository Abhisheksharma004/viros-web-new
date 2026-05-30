"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, RefreshCw, Search, Users, UserX } from "lucide-react";
import type { NewsletterStatus } from "@/lib/newsletterSubscriptions";

type StatusFilter = NewsletterStatus | "all";

type SubscriptionRow = {
    id: number;
    email: string;
    status: NewsletterStatus;
    subscribed_at: string;
    unsubscribed_at: string | null;
    ip_address: string | null;
    user_agent: string | null;
};

type NewsletterStats = {
    total: number;
    active: number;
    unsubscribed: number;
};

function formatDateTime(iso: string | null) {
    if (!iso) return "—";
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

function statusBadge(status: NewsletterStatus) {
    if (status === "active") {
        return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15";
    }
    return "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50";
}

function statusLabel(status: NewsletterStatus) {
    return status === "active" ? "Active" : "Unsubscribed";
}

export default function AdminNewsletterPage() {
    const [status, setStatus] = useState<StatusFilter>("all");
    const [query, setQuery] = useState("");
    const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
    const [stats, setStats] = useState<NewsletterStats>({ total: 0, active: 0, unsubscribed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("status", status);
            if (query.trim()) params.set("q", query.trim());
            params.set("limit", "500");

            const resp = await fetch(`/api/admin/newsletter?${params.toString()}`, { cache: "no-store" });
            const data = (await resp.json().catch(() => ({}))) as {
                subscriptions?: SubscriptionRow[];
                stats?: NewsletterStats;
                message?: string;
            };

            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load subscriptions");
            }

            setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : []);
            setStats(
                data.stats ?? {
                    total: 0,
                    active: 0,
                    unsubscribed: 0,
                },
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load subscriptions");
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    }, [status, query]);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredCount = subscriptions.length;

    const statCards = useMemo(
        () => [
            {
                label: "Total subscribers",
                value: stats.total,
                icon: Mail,
                className: "border-gray-100 bg-white text-[#0a2a5e]",
            },
            {
                label: "Active",
                value: stats.active,
                icon: Users,
                className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            },
            {
                label: "Unsubscribed",
                value: stats.unsubscribed,
                icon: UserX,
                className: "border-gray-200 bg-gray-50 text-gray-800",
            },
        ],
        [stats],
    );

    return (
        <div className="space-y-5">
            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="min-w-0 break-words">{error}</span>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-2 text-xs font-semibold text-red-800"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className={`rounded-md border p-4 shadow-sm ${card.className}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">{card.value}</p>
                                </div>
                                <Icon className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
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
                                <option value="active">Active</option>
                                <option value="unsubscribed">Unsubscribed</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                                Search email
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by email…"
                                    className="h-11 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void load()}
                        disabled={loading}
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

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">Subscriptions</h2>
                    <p className="shrink-0 text-xs text-gray-500">{filteredCount} records</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Loading subscriptions…
                    </div>
                ) : subscriptions.length === 0 ? (
                    <p className="px-4 py-14 text-center text-sm text-gray-500">No newsletter subscriptions found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Subscribed</th>
                                    <th className="px-6 py-3">Unsubscribed</th>
                                    <th className="px-6 py-3">IP address</th>
                                    <th className="px-6 py-3">User agent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {subscriptions.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="whitespace-nowrap px-6 py-4 text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.email}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}
                                            >
                                                {statusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                                            {formatDateTime(row.subscribed_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                                            {formatDateTime(row.unsubscribed_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-600">
                                            {row.ip_address || "—"}
                                        </td>
                                        <td className="max-w-[280px] truncate px-6 py-4 text-xs text-gray-500" title={row.user_agent ?? undefined}>
                                            {row.user_agent || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
