"use client";

import Link from "next/link";

const stats = [
    {
        title: "Total Users",
        value: "12",
        change: "Admins & Editors",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        color: "from-[#06124f] to-[#0a2a5e]",
        href: "/admin-dashboard/users",
    },
    {
        title: "Total Employees",
        value: "48",
        change: "Active staff members",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: "from-teal-500 to-[#00bcd4]",
        href: "/admin-dashboard/employees",
    },
    {
        title: "Departments",
        value: "6",
        change: "Active departments",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        color: "from-purple-500 to-purple-600",
        href: "/admin-dashboard/employees/departments",
    },
    {
        title: "Upcoming Birthdays",
        value: "3",
        change: "This month",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6l3-3 3 3M12 3v12" />
            </svg>
        ),
        color: "from-pink-500 to-rose-500",
        href: "/admin-dashboard/employees/birthdays",
    },
];

const quickActions = [
    { title: "Add Employee", href: "/admin-dashboard/employees/add", icon: "👤" },
    { title: "Add User", href: "/admin-dashboard/users/add", icon: "➕" },
    { title: "View Reports", href: "/admin-dashboard/reports/sales", icon: "📊" },
    { title: "Settings", href: "/admin-dashboard/settings", icon: "⚙️" },
    { title: "Website Dashboard", href: "/dashboard", icon: "🌐" },
    { title: "Security", href: "/admin-dashboard/settings/security", icon: "🔒" },
];

const recentActivity = [
    { action: "New employee added: Rahul Sharma", time: "10 minutes ago", type: "success" },
    { action: "User role updated: Priya → Admin", time: "1 hour ago", type: "info" },
    { action: "Department created: R&D", time: "3 hours ago", type: "success" },
    { action: "Password reset: employee@viros.com", time: "Yesterday", type: "warning" },
    { action: "Monthly report generated", time: "2 days ago", type: "info" },
];

const employees = [
    { name: "Rahul Sharma", role: "Sales Manager", dept: "Sales", status: "Active", avatar: "RS" },
    { name: "Priya Patel", role: "HR Executive", dept: "HR", status: "Active", avatar: "PP" },
    { name: "Amit Kumar", role: "Tech Lead", dept: "IT", status: "Active", avatar: "AK" },
    { name: "Sneha Joshi", role: "Designer", dept: "Marketing", status: "On Leave", avatar: "SJ" },
    { name: "Vikram Singh", role: "Finance Analyst", dept: "Finance", status: "Active", avatar: "VS" },
];

const departmentData = [
    { name: "Sales", count: 12, color: "#0a2a5e" },
    { name: "IT", count: 10, color: "#00bcd4" },
    { name: "HR", count: 6, color: "#8b5cf6" },
    { name: "Marketing", count: 8, color: "#f59e0b" },
    { name: "Finance", count: 7, color: "#10b981" },
    { name: "Operations", count: 5, color: "#ef4444" },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Admin Overview</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Welcome back, Administrator. Here's your system summary.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        All Systems Online
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

                {/* Recent Employees */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">Recent Employees</h2>
                        <Link href="/admin-dashboard/employees" className="text-xs font-semibold text-[#0a2a5e] hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {employees.map((emp) => (
                            <div key={emp.name} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                                >
                                    {emp.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{emp.role} · {emp.dept}</p>
                                </div>
                                <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        emp.status === "Active"
                                            ? "bg-green-50 text-green-700"
                                            : "bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    {emp.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">Departments</h2>
                        <Link href="/admin-dashboard/employees/departments" className="text-xs font-semibold text-[#0a2a5e] hover:underline">
                            Manage →
                        </Link>
                    </div>
                    <div className="px-6 py-4 space-y-3">
                        {departmentData.map((dept) => (
                            <div key={dept.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                                    <span className="text-xs font-bold text-gray-500">{dept.count}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(dept.count / 12) * 100}%`,
                                            background: dept.color,
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
                                className="flex flex-col items-center justify-center p-3 border-2 border-gray-100 rounded-xl hover:border-[#0a2a5e]/30 hover:bg-[#0a2a5e]/5 transition-all duration-200 group text-center gap-1.5"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#0a2a5e] leading-tight">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div
                                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                        item.type === "success"
                                            ? "bg-green-500"
                                            : item.type === "warning"
                                            ? "bg-amber-500"
                                            : "bg-blue-500"
                                    }`}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* System Status Banner */}
            <div
                className="rounded-2xl p-5 text-white shadow"
                style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 60%, #0d3a7a 100%)" }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold mb-0.5">System Health</h3>
                        <p className="text-white/60 text-sm">Database · API · Email — All operational</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {[
                            { label: "Uptime", value: "99.9%" },
                            { label: "Response", value: "42ms" },
                            { label: "Users Online", value: "3" },
                        ].map((m) => (
                            <div key={m.label} className="text-center">
                                <p className="text-white font-black text-lg">{m.value}</p>
                                <p className="text-white/40 text-xs">{m.label}</p>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-green-300 text-xs font-semibold">Online</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
