"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Activity,
    ArrowUpRight,
    Briefcase,
    Calendar,
    Clock,
    DollarSign,
    Filter,
    Mail,
    RefreshCw,
    Search,
    UserCheck,
    Users,
} from "lucide-react";
import Toast from "@/components/Toast";

type ActivityLogItem = {
    id: string;
    title: string;
    description: string;
    category: "Employees" | "Leave" | "Expenses" | "Work Entries" | "Newsletter";
    type: "success" | "warning" | "info";
    timestamp: string;
    dateLabel: string;
    timeLabel: string;
    actor: string;
    href?: string;
};

type ActivityStats = {
    total: number;
    employees: number;
    leaveAndExpenses: number;
    workEntries: number;
};

const CATEGORIES = ["All", "Employees", "Leave", "Expenses", "Work Entries", "Newsletter"] as const;

export default function ActivityLogPage() {
    const [activities, setActivities] = useState<ActivityLogItem[]>([]);
    const [stats, setStats] = useState<ActivityStats>({ total: 0, employees: 0, leaveAndExpenses: 0, workEntries: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [toastState, setToastState] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const fetchActivityLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.set("q", searchQuery.trim());
            if (selectedCategory !== "All") params.set("category", selectedCategory);

            const response = await fetch(`/api/admin/activity-log?${params.toString()}`, { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load activity logs");
            }
            setActivities(Array.isArray(data.activities) ? data.activities : []);
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error loading activity logs:", error);
            const msg = error instanceof Error ? error.message : "Unable to load activity logs right now.";
            setToastState({ message: msg, type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedCategory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchActivityLogs();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchActivityLogs]);

    const getCategoryBadgeClass = (category: string) => {
        switch (category) {
            case "Employees":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "Leave":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "Expenses":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "Work Entries":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Newsletter":
                return "bg-cyan-50 text-cyan-700 border-cyan-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Employees":
                return <Users className="h-4 w-4 text-blue-600" />;
            case "Leave":
                return <Calendar className="h-4 w-4 text-amber-600" />;
            case "Expenses":
                return <DollarSign className="h-4 w-4 text-purple-600" />;
            case "Work Entries":
                return <Briefcase className="h-4 w-4 text-emerald-600" />;
            case "Newsletter":
                return <Mail className="h-4 w-4 text-cyan-600" />;
            default:
                return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <Activity className="h-7 w-7 text-[#0a2a5e]" />
                        Activity Log Directory
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Real-time audit log of admin updates, employee additions, leave requests, expenses, and system activities.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search activity logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchActivityLogs()}
                        disabled={isLoading}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        title="Refresh activities"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#0a2a5e]" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Activities</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                            <Activity className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>

                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Employee Events</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-emerald-600">{stats.employees}</p>
                </div>

                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Leave & Expenses</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-purple-600">{stats.leaveAndExpenses}</p>
                </div>

                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Work Logs</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
                            <Briefcase className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-cyan-600">{stats.workEntries}</p>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filter By:</span>
                </div>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedCategory === cat
                                ? "bg-[#0a2a5e] text-white shadow-xs"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Activity Table */}
            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Activity Records</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {isLoading ? "Loading activity logs..." : `Showing ${activities.length} activity item(s).`}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Activity Title & Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={5}>
                                        <div className="inline-flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin text-[#0a2a5e]" />
                                            <span>Loading activity logs…</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && activities.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={5}>
                                        No activity logs found.
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                activities.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                                                    item.category
                                                )}`}
                                            >
                                                {getCategoryIcon(item.category)}
                                                <span>{item.category}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {item.actor || "System"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span>{item.timeLabel}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{item.dateLabel}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.href ? (
                                                <Link
                                                    href={item.href}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-xs transition hover:bg-[#0a2a5e] hover:text-white hover:border-[#0a2a5e]"
                                                    title="View related page"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast Notification */}
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                />
            )}
        </div>
    );
}
