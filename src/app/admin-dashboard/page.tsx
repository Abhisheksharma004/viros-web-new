"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import BirthdayWishCard from "@/components/employee-dashboard/BirthdayWishCard";
import type { AdminDashboardOverview } from "@/lib/adminDashboard";

const statIcons = {
    portal: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    employees: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    departments: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    birthdays: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v12" />
        </svg>
    ),
};

const quickActions = [
    { title: "Add Employee", href: "/admin-dashboard/employees", icon: "👤" },
    { title: "Employee Access", href: "/admin-dashboard/employee-access", icon: "🔑" },
    { title: "Employee Shift", href: "/admin-dashboard/shift", icon: "⏰" },
    { title: "Leave Requests", href: "/admin-dashboard/leave-request", icon: "📅" },
    { title: "Expenses", href: "/admin-dashboard/expense-management", icon: "💰" },
    { title: "AMC Report", href: "/admin-dashboard/amc-report", icon: "📊" },
    { title: "Website Dashboard", href: "/dashboard", icon: "🌐" },
];

const activityDot: Record<string, string> = {
    success: "bg-green-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
};

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const resp = await fetch("/api/admin/dashboard", { cache: "no-store" });
            const json = (await resp.json().catch(() => ({}))) as AdminDashboardOverview & { message?: string };
            if (!resp.ok) {
                throw new Error(typeof json.message === "string" ? json.message : "Failed to load dashboard");
            }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const stats = useMemo(() => {
        if (!data) return [];
        const s = data.stats;
        return [
            {
                title: "Portal Access",
                value: String(s.portalAccessCount),
                change: "Active employee logins",
                color: "from-[#06124f] to-[#0a2a5e]",
                href: "/admin-dashboard/employee-access",
                icon: statIcons.portal,
            },
            {
                title: "Total Employees",
                value: String(s.employeeCount),
                change: `${s.activeEmployeeCount} active staff`,
                color: "from-teal-500 to-[#00bcd4]",
                href: "/admin-dashboard/employees",
                icon: statIcons.employees,
            },
            {
                title: "Departments",
                value: String(s.departmentCount),
                change: "Registered departments",
                color: "from-purple-500 to-purple-600",
                href: "/admin-dashboard/department",
                icon: statIcons.departments,
            },
            {
                title: "Birthdays",
                value: String(s.birthdaysThisMonth),
                change: "Today & coming soon",
                color: "from-pink-500 to-rose-500",
                href: "/admin-dashboard/employees",
                icon: statIcons.birthdays,
            },
        ];
    }, [data]);

    const maxDeptCount = useMemo(() => {
        if (!data?.departments.length) return 1;
        return Math.max(1, ...data.departments.map((d) => d.count));
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Loading dashboard…
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-red-800">{error || "Unable to load dashboard"}</p>
                <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#0a2a5e] px-4 py-2 text-sm font-semibold text-white"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Refresh
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    Live data
                </span>
            </div>

            {data.birthdayCards.length > 0 ? (
                <div
                    className={`grid gap-4 ${
                        data.birthdayCards.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                    }`}
                >
                    {data.birthdayCards.map((card) => (
                        <BirthdayWishCard
                            key={card.id}
                            id={card.id}
                            variant={card.variant}
                            eyebrow={card.eyebrow}
                            title={card.title}
                            subtitle={card.subtitle}
                            badgeText={card.badgeText}
                            hint={card.hint}
                            initials={card.initials}
                            className="min-h-[10.25rem] rounded-md sm:min-h-[11rem] sm:rounded-md"
                        />
                    ))}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.title}
                        href={stat.href}
                        className="group rounded-md border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {stat.title}
                                </p>
                                <p className="mb-1 text-3xl font-black text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.change}</p>
                            </div>
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br ${stat.color} text-white shadow`}
                            >
                                {stat.icon}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h2 className="text-base font-bold text-gray-900">Recent Employees</h2>
                        <Link
                            href="/admin-dashboard/employees"
                            className="text-xs font-semibold text-[#0a2a5e] hover:underline"
                        >
                            View all →
                        </Link>
                    </div>
                    {data.recentEmployees.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-gray-500">No employees yet.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {data.recentEmployees.map((emp) => (
                                <Link
                                    key={emp.employeeId}
                                    href={emp.href}
                                    className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50"
                                >
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                        style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                                    >
                                        {emp.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900">{emp.fullName}</p>
                                        <p className="truncate text-xs text-gray-400">
                                            {emp.designation} · {emp.department}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            emp.status.toLowerCase() === "active"
                                                ? "bg-green-50 text-green-700"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {emp.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h2 className="text-base font-bold text-gray-900">Departments</h2>
                        <Link
                            href="/admin-dashboard/department"
                            className="text-xs font-semibold text-[#0a2a5e] hover:underline"
                        >
                            Manage →
                        </Link>
                    </div>
                    {data.departments.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-gray-500">No department data yet.</p>
                    ) : (
                        <div className="space-y-3 px-6 py-4">
                            {data.departments.map((dept) => (
                                <div key={dept.name}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                                        <span className="text-xs font-bold text-gray-500">{dept.count}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(dept.count / maxDeptCount) * 100}%`,
                                                background: dept.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-md border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-bold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="group flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-gray-100 p-3 text-center transition-all duration-200 hover:border-[#0a2a5e]/30 hover:bg-[#0a2a5e]/5"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs font-semibold leading-tight text-gray-600 group-hover:text-[#0a2a5e]">
                                    {action.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-bold text-gray-900">Recent Activity</h2>
                    {data.recentActivity.length === 0 ? (
                        <p className="text-sm text-gray-500">No recent activity.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentActivity.map((item, i) => {
                                const inner = (
                                    <>
                                        <div
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDot[item.type] ?? activityDot.info}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800">{item.action}</p>
                                            <p className="mt-0.5 text-xs text-gray-400">{item.timeLabel}</p>
                                        </div>
                                    </>
                                );

                                return item.href ? (
                                    <Link
                                        key={`${item.time}-${i}`}
                                        href={item.href}
                                        className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0 hover:opacity-80"
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div
                                        key={`${item.time}-${i}`}
                                        className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                                    >
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div
                className="rounded-md p-5 text-white shadow"
                style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 60%, #0d3a7a 100%)" }}
            >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="mb-0.5 text-base font-bold">HRMS snapshot</h3>
                        <p className="text-sm text-white/60">Live counts from your database</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <Link href="/admin-dashboard/leave-request" className="text-center hover:opacity-90">
                            <p className="text-lg font-black text-white">{data.stats.pendingLeaveCount}</p>
                            <p className="text-xs text-white/40">Pending leave</p>
                        </Link>
                        <Link href="/admin-dashboard/expense-management" className="text-center hover:opacity-90">
                            <p className="text-lg font-black text-white">{data.stats.pendingExpenseCount}</p>
                            <p className="text-xs text-white/40">Pending expense batches</p>
                        </Link>
                        <Link href="/admin-dashboard/reports/newsletter" className="text-center hover:opacity-90">
                            <p className="text-lg font-black text-white">{data.stats.newsletterSubscribers}</p>
                            <p className="text-xs text-white/40">Newsletter subs</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
