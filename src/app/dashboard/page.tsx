"use client";

import Link from "next/link";

const stats = [
    {
        title: "Total Services",
        value: "5",
        change: "+2 this month",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: "from-blue-500 to-blue-600",
        href: "/dashboard/services"
    },
    {
        title: "Total Products",
        value: "24",
        change: "+5 this week",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        color: "from-green-500 to-green-600",
        href: "/dashboard/products"
    },
    {
        title: "Testimonials",
        value: "18",
        change: "+3 pending",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ),
        color: "from-purple-500 to-purple-600",
        href: "/dashboard/testimonials"
    },
    {
        title: "Clients & Partners",
        value: "32",
        change: "All active",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        color: "from-orange-500 to-orange-600",
        href: "/dashboard/clients"
    }
];

const quickActions = [
    { title: "Add New Service", href: "/dashboard/services", icon: "+" },
    { title: "Add Product", href: "/dashboard/products", icon: "+" },
    { title: "Manage Hero", href: "/dashboard/hero", icon: "🖼️" },
    { title: "Site Settings", href: "/dashboard/settings", icon: "⚙️" }
];

const recentActivity = [
    { action: "New testimonial added", time: "2 hours ago", type: "success" },
    { action: "Service updated: Hardware Solutions", time: "5 hours ago", type: "info" },
    { action: "New client logo uploaded", time: "1 day ago", type: "success" },
    { action: "Product deleted: Old Scanner Model", time: "2 days ago", type: "warning" }
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your website.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Link
                        key={index}
                        href={stat.href}
                        className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.change}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-[#06b6d4] hover:bg-[#06b6d4]/5 transition-all duration-200 group"
                            >
                                <span className="text-3xl mb-2">{action.icon}</span>
                                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-[#06b6d4]">
                                    {action.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activity.type === 'success' ? 'bg-green-500' :
                                        activity.type === 'warning' ? 'bg-orange-500' :
                                            'bg-blue-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-1">System Status</h3>
                        <p className="text-white/80 text-sm">All systems operational</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
