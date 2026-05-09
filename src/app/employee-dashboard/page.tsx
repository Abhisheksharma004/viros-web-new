"use client";

import Link from "next/link";

const stats = [
    {
        title: "Days Present",
        value: "22",
        change: "This month",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        color: "from-[#0d4f3c] to-[#0a7c5c]",
        href: "/employee-dashboard/attendance",
    },
    {
        title: "Leave Balance",
        value: "8",
        change: "Days remaining",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        color: "from-teal-500 to-emerald-500",
        href: "/employee-dashboard/attendance/leave",
    },
    {
        title: "Pending Tasks",
        value: "5",
        change: "Due this week",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        color: "from-amber-500 to-orange-500",
        href: "/employee-dashboard/tasks",
    },
    {
        title: "This Month Salary",
        value: "₹45K",
        change: "Processed",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        color: "from-purple-500 to-purple-600",
        href: "/employee-dashboard/payroll/slip",
    },
];

const quickActions = [
    { title: "My Attendance", href: "/employee-dashboard/attendance", icon: "📅" },
    { title: "Apply Leave", href: "/employee-dashboard/attendance/leave", icon: "🏖️" },
    { title: "My Tasks", href: "/employee-dashboard/tasks", icon: "✅" },
    { title: "Salary Slip", href: "/employee-dashboard/payroll/slip", icon: "💰" },
    { title: "My Profile", href: "/employee-dashboard/profile", icon: "👤" },
    { title: "Announcements", href: "/employee-dashboard/announcements", icon: "📢" },
];

const recentActivity = [
    { action: "Leave request submitted for May 5–6", time: "Today, 9:30 AM", type: "info" },
    { action: "Task completed: Q1 Sales Report", time: "Yesterday", type: "success" },
    { action: "Attendance marked: Present", time: "Yesterday, 9:02 AM", type: "success" },
    { action: "Salary slip for April downloaded", time: "Apr 28", type: "info" },
    { action: "Password changed successfully", time: "Apr 20", type: "warning" },
];

const myTasks = [
    { title: "Submit Q2 sales forecast", due: "Today", priority: "High", done: false },
    { title: "Review onboarding documents", due: "Tomorrow", priority: "Medium", done: false },
    { title: "Update CRM client list", due: "May 3", priority: "Low", done: false },
    { title: "Prepare department meeting notes", due: "May 5", priority: "Medium", done: true },
    { title: "Coordinate with logistics team", due: "May 6", priority: "High", done: false },
];

const announcements = [
    { title: "Office closed on May 1 (Labour Day)", date: "Apr 28, 2026", tag: "Holiday" },
    { title: "Q2 appraisal cycle starts May 15", date: "Apr 25, 2026", tag: "HR" },
    { title: "New employee wellness program launched", date: "Apr 20, 2026", tag: "General" },
];

const priorityColors: Record<string, string> = {
    High: "bg-red-50 text-red-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-green-50 text-green-700",
};

export default function EmployeeDashboardPage() {
    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">My Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's your work summary for today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Present Today
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => (
                    <Link
                        key={stat.title}
                        href={stat.href}
                        className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{stat.title}</p>
                                <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.change}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* My Tasks */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">My Tasks</h2>
                        <Link href="/employee-dashboard/tasks" className="text-xs font-semibold text-emerald-700 hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {myTasks.map((task) => (
                            <div key={task.title} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${task.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                                    {task.done && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Due: {task.due}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColors[task.priority]}`}>
                                    {task.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">This Month</h2>
                        <Link href="/employee-dashboard/attendance" className="text-xs font-semibold text-emerald-700 hover:underline">
                            View →
                        </Link>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        {[
                            { label: "Present", value: 22, total: 26, color: "#0a7c5c" },
                            { label: "Absent", value: 2, total: 26, color: "#ef4444" },
                            { label: "Leave Taken", value: 2, total: 12, color: "#f59e0b" },
                            { label: "Overtime", value: 4, total: 10, color: "#8b5cf6" },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    <span className="text-xs font-bold text-gray-500">{item.value} days</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(item.value / item.total) * 100}%`,
                                            background: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-3 border-2 border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group text-center gap-1.5"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-emerald-700 leading-tight">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900">Announcements</h2>
                        <Link href="/employee-dashboard/announcements" className="text-xs font-semibold text-emerald-700 hover:underline">
                            All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {announcements.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                                    a.tag === "Holiday" ? "bg-red-50 text-red-600" :
                                    a.tag === "HR" ? "bg-blue-50 text-blue-600" :
                                    "bg-gray-100 text-gray-600"
                                }`}>
                                    {a.tag}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{a.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {recentActivity.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                item.type === "success" ? "bg-green-500" :
                                item.type === "warning" ? "bg-amber-500" :
                                "bg-blue-500"
                            }`} />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.action}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Banner */}
            <div
                className="rounded-2xl p-5 text-white shadow"
                style={{ background: "linear-gradient(135deg, #0d4f3c 0%, #0a7c5c 60%, #0d9b6e 100%)" }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold mb-0.5">Your Work Status</h3>
                        <p className="text-white/60 text-sm">Attendance · Tasks · Payroll — All up to date</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {[
                            { label: "Attendance", value: "89%" },
                            { label: "Tasks Done", value: "72%" },
                            { label: "On Time", value: "96%" },
                        ].map((m) => (
                            <div key={m.label} className="text-center">
                                <p className="text-white font-black text-lg">{m.value}</p>
                                <p className="text-white/40 text-xs">{m.label}</p>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-green-300 text-xs font-semibold">Active</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
