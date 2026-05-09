"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmployeeHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const router = useRouter();

    const notifications = [
        { text: "Your leave request has been approved", time: "30 min ago", unread: true },
        { text: "New company announcement posted", time: "2 hours ago", unread: true },
        { text: "Salary slip for April is available", time: "Yesterday", unread: false },
        { text: "Team meeting scheduled: Monday 10 AM", time: "2 days ago", unread: false },
    ];

    const unreadCount = notifications.filter((n) => n.unread).length;

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
        } catch {}
        router.push("/admin-login");
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-4">
                {/* Left: Hamburger */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Center: Title */}
                <div className="flex-1 px-4">
                    <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Employee Portal</h1>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3">

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                            className="relative text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Notifications</p>
                                        <span className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline">Mark all read</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((n, i) => (
                                            <div key={i} className={`px-4 py-3 flex items-start gap-3 ${n.unread ? "bg-emerald-50/50" : ""}`}>
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? "bg-emerald-600" : "bg-gray-300"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800">{n.text}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: "linear-gradient(135deg, #0d4f3c, #0a7c5c)" }}
                            >
                                E
                            </div>
                            <span className="hidden sm:block text-sm font-semibold">Employee</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
                                    <div className="px-4 py-2.5 border-b border-gray-100">
                                        <p className="text-sm font-bold text-gray-900">Employee</p>
                                        <p className="text-xs text-gray-400">Staff Member</p>
                                    </div>
                                    <Link
                                        href="/employee-dashboard/profile"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/employee-dashboard/attendance"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Attendance
                                    </Link>
                                    <Link
                                        href="/admin-dashboard"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Admin Panel
                                    </Link>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
