"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Bell,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Circle,
    ClipboardList,
    IndianRupee,
    MapPin,
    Receipt,
    User,
    Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardHeroSlider from "@/components/employee-dashboard/DashboardHeroSlider";
import type {
    DashboardActivityItem,
    DashboardHeroSlide,
    DashboardTaskItem,
    DashboardUpdateItem,
    EmployeeDashboardPayload,
} from "@/lib/employeeDashboard";
import { getPriorityStyles } from "@/lib/adminTaskUiShared";

type ExpenseSubtext = {
    approved: string;
    reject: string;
    all: string;
};

type StatCard = {
    id: string;
    title: string;
    value: string;
    change: string;
    expenseSubtext?: ExpenseSubtext;
    icon: LucideIcon;
    color: string;
    href: string;
};

type QuickAction = {
    title: string;
    href: string;
    icon: LucideIcon;
    accent: string;
};

const quickActions: QuickAction[] = [
    {
        title: "Attendance",
        href: "/employee-dashboard/attendance",
        icon: CalendarCheck,
        accent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    {
        title: "Apply Leave",
        href: "/employee-dashboard/leave",
        icon: CalendarDays,
        accent: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    {
        title: "My Tasks",
        href: "/employee-dashboard/tasks",
        icon: ClipboardList,
        accent: "bg-amber-50 text-amber-800 ring-amber-200",
    },
    {
        title: "Add Expense",
        href: "/employee-dashboard/add-expense",
        icon: IndianRupee,
        accent: "bg-[#0a2a5e]/10 text-[#0a2a5e] ring-[#0a2a5e]/20",
    },
    {
        title: "AMC Work",
        href: "/employee-dashboard/amc-work",
        icon: Wrench,
        accent: "bg-violet-50 text-violet-700 ring-violet-200",
    },
    {
        title: "My Profile",
        href: "/employee-dashboard/profile",
        icon: User,
        accent: "bg-gray-50 text-gray-800 ring-gray-200",
    },
];

const activityDot: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
};

const updateTagStyles: Record<DashboardUpdateItem["tagStyle"], string> = {
    leave: "bg-blue-50 text-blue-700 ring-blue-200",
    expense: "bg-amber-50 text-amber-800 ring-amber-200",
    task: "bg-gray-100 text-gray-700 ring-gray-200",
};

function SectionHeader({
    title,
    href,
    linkLabel = "View all",
}: {
    title: string;
    href?: string;
    linkLabel?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-gray-900 sm:text-base">{title}</h2>
            {href ? (
                <Link
                    href={href}
                    className="inline-flex min-h-9 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-[#0a2a5e] touch-manipulation active:scale-[0.98] hover:underline"
                >
                    {linkLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            ) : null}
        </div>
    );
}

function TaskRowCard({ task }: { task: DashboardTaskItem }) {
    const priorityClass = getPriorityStyles(task.priorityKey);
    return (
        <Link
            href={task.href}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 touch-manipulation active:scale-[0.99] lg:items-center lg:px-5 lg:py-3.5 lg:hover:bg-gray-50/80"
        >
            <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 lg:mt-0 ${
                    task.done ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"
                }`}
            >
                {task.done ? (
                    <CheckCircle2 className="h-3 w-3 text-white" aria-hidden />
                ) : (
                    <Circle className="h-3 w-3 text-transparent" aria-hidden />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p
                    className={`text-sm font-semibold leading-snug lg:truncate ${
                        task.done ? "text-gray-400 line-through" : "text-gray-900 lg:text-gray-800"
                    }`}
                >
                    {task.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 lg:mt-0.5 lg:text-gray-400">Due: {task.due}</p>
            </div>
            <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 lg:px-2.5 lg:py-1 lg:text-xs lg:font-semibold ${priorityClass}`}
            >
                {task.priority}
            </span>
        </Link>
    );
}

function ActivityItem({ item }: { item: DashboardActivityItem }) {
    const inner = (
        <div className="flex gap-3 sm:items-start">
            <div className="flex flex-col items-center">
                <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${activityDot[item.type] ?? activityDot.info}`}
                />
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-medium leading-snug text-gray-800">{item.action}</p>
                <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
            </div>
        </div>
    );

    if (item.href) {
        return (
            <Link href={item.href} className="block touch-manipulation active:opacity-90">
                {inner}
            </Link>
        );
    }
    return inner;
}

function DashboardSkeleton() {
    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl animate-pulse space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            <div className="h-40 rounded-2xl bg-gray-200 sm:rounded-3xl" />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-gray-100" />
                ))}
            </div>
            <div className="h-48 rounded-2xl bg-gray-100" />
        </div>
    );
}

export default function EmployeeDashboardPage() {
    const [data, setData] = useState<(EmployeeDashboardPayload & { greeting: string }) | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await fetch("/api/employee/dashboard", { cache: "no-store" });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body.message ?? "Failed to load dashboard");
            }
            const json = (await res.json()) as EmployeeDashboardPayload & { greeting: string };
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const stats: StatCard[] = useMemo(() => {
        if (!data) return [];
        return [
            {
                id: "attendance",
                title: "Days Present",
                value: String(data.stats.daysPresent),
                change: "This month",
                icon: CalendarCheck,
                color: "from-[#0d4f3c] to-[#0a7c5c]",
                href: "/employee-dashboard/attendance",
            },
            {
                id: "leave",
                title: "Leave Balance",
                value: String(data.stats.leaveBalance),
                change: "Days left",
                icon: CalendarDays,
                color: "from-teal-500 to-emerald-500",
                href: "/employee-dashboard/leave",
            },
            {
                id: "tasks",
                title: "Pending Tasks",
                value: String(data.stats.pendingTasks),
                change: data.stats.pendingTasks > 0 ? "Open items" : "All caught up",
                icon: ClipboardList,
                color: "from-amber-500 to-orange-500",
                href: "/employee-dashboard/tasks",
            },
            {
                id: "expenses",
                title: "Expenses",
                value: data.stats.expenseTotal,
                change: "",
                expenseSubtext: {
                    approved: data.stats.expenseSubtextApproved,
                    reject: data.stats.expenseSubtextReject,
                    all: data.stats.expenseSubtextAll,
                },
                icon: Receipt,
                color: "from-[#06124f] to-[#0a2a5e]",
                href: "/employee-dashboard/add-expense",
            },
        ];
    }, [data]);

    if (loading) return <DashboardSkeleton />;

    if (error || !data) {
        return (
            <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <p className="text-sm font-semibold text-red-800">{error ?? "Unable to load dashboard"}</p>
                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        void load();
                    }}
                    className="mt-4 rounded-lg bg-[#0a2a5e] px-4 py-2 text-sm font-semibold text-white"
                >
                    Try again
                </button>
            </div>
        );
    }

    const heroSlides: DashboardHeroSlide[] = data.heroSlides;
    const tasks = data.tasks;
    const attendanceBars = data.attendanceBars;
    const updates = data.updates;
    const recentActivity = data.recentActivity;

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            <DashboardHeroSlider slides={heroSlides} />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.id}
                            href={stat.href}
                            className="group flex min-h-[5.5rem] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 touch-manipulation transition active:scale-[0.98] sm:min-h-0 sm:p-4 sm:hover:-translate-y-0.5 sm:hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                                        {stat.title}
                                    </p>
                                    <p className="mt-1 text-xl font-black leading-none text-gray-900 sm:text-2xl">
                                        {stat.value}
                                    </p>
                                    {stat.expenseSubtext ? (
                                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-gray-400 sm:text-xs">
                                            <span>{stat.expenseSubtext.approved}</span>
                                            <span className="text-gray-300"> · </span>
                                            <span className="font-medium text-red-600">
                                                {stat.expenseSubtext.reject}
                                            </span>
                                            <span className="text-gray-300"> · </span>
                                            <span className="font-medium text-[#0a2a5e]">
                                                {stat.expenseSubtext.all}
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="mt-1 truncate text-[10px] text-gray-400 sm:text-xs">
                                            {stat.change}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow sm:h-11 sm:w-11`}
                                >
                                    <Icon className="h-5 w-5" aria-hidden />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
                <SectionHeader title="Quick actions" />
                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="flex min-h-[5.25rem] flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-2.5 touch-manipulation transition active:scale-[0.97] sm:min-h-0 sm:p-3 sm:hover:border-[#0a2a5e]/20 sm:hover:bg-[#0a2a5e]/5"
                            >
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 sm:h-12 sm:w-12 ${action.accent}`}
                                >
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <span className="text-center text-[10px] font-bold leading-tight text-gray-700 sm:text-xs">
                                    {action.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-5">
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
                    <div className="border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
                        <SectionHeader
                            title="My tasks"
                            href="/employee-dashboard/tasks"
                            linkLabel="All tasks"
                        />
                    </div>

                    {tasks.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-500">
                            No tasks assigned yet.{" "}
                            <Link href="/employee-dashboard/tasks" className="font-semibold text-[#0a2a5e]">
                                View tasks
                            </Link>
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2 p-3 lg:hidden">
                                {tasks.map((task) => (
                                    <TaskRowCard key={task.recordId} task={task} />
                                ))}
                            </div>
                            <div className="hidden divide-y divide-gray-50 lg:block">
                                {tasks.map((task) => (
                                    <TaskRowCard key={task.recordId} task={task} />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
                        <SectionHeader
                            title="This month"
                            href="/employee-dashboard/attendance"
                            linkLabel="Attendance"
                        />
                    </div>
                    <div className="space-y-3.5 px-3 py-4 sm:px-5 sm:py-5">
                        {attendanceBars.map((item) => (
                            <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                                        {item.label}
                                    </span>
                                    <span className="text-[11px] font-bold text-gray-500 sm:text-xs">
                                        {item.value} days
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (item.value / item.total) * 100)}%`,
                                            background: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {updates.length > 0 ? (
                <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#0a2a5e]" aria-hidden />
                        <SectionHeader title="Updates" />
                    </div>
                    <div className="mt-3 space-y-2 sm:space-y-3">
                        {updates.map((a) => (
                            <Link
                                key={a.id}
                                href={a.href}
                                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 touch-manipulation active:scale-[0.99] sm:p-3.5"
                            >
                                <span
                                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${updateTagStyles[a.tagStyle]}`}
                                >
                                    {a.tag}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold leading-snug text-gray-900">{a.title}</p>
                                    <p className="mt-1 text-xs text-gray-500">{a.date}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : null}

            {recentActivity.length > 0 ? (
                <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
                    <SectionHeader title="Recent activity" />
                    <div className="mt-3 space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:space-y-3 xl:grid-cols-2">
                        {recentActivity.map((item) => (
                            <ActivityItem key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            ) : null}

            <Link
                href="/employee-dashboard/attendance"
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#0a2a5e]/15 bg-gradient-to-r from-[#0a2a5e]/5 to-[#06b6d4]/10 px-4 py-3.5 touch-manipulation active:scale-[0.99] sm:px-5 sm:py-4"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a2a5e] text-white shadow">
                        <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                            {data.todayCheckedIn ? "View attendance" : "Mark attendance"}
                        </p>
                        <p className="text-xs text-gray-500">{data.punchSubtitle}</p>
                    </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#0a2a5e]" aria-hidden />
            </Link>
        </div>
    );
}
