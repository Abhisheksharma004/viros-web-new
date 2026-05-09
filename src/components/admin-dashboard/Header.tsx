"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [adminEmail, setAdminEmail] = useState("");
    const router = useRouter();

    const notifications = [
        { text: "New employee added: Rahul Sharma", time: "10 min ago", unread: true },
        { text: "Birthday reminder: Priya tomorrow", time: "1 hour ago", unread: true },
        { text: "User role updated: Editor → Admin", time: "3 hours ago", unread: false },
        { text: "Monthly report generated", time: "Yesterday", unread: false },
    ];

    const unreadCount = notifications.filter((n) => n.unread).length;
    const avatarLetter = (adminEmail?.[0] || "A").toUpperCase();

    useEffect(() => {
        let active = true;

        const fetchCurrentAdmin = async () => {
            try {
                const response = await fetch("/api/auth/me", { method: "GET" });
                if (!response.ok) {
                    return;
                }
                const data = await response.json();
                if (active) {
                    setAdminEmail(data.email || "");
                }
            } catch {
                // Keep fallback label when request fails.
            }
        };

        fetchCurrentAdmin();

        return () => {
            active = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/logout", { method: "POST" });
            if (!response.ok) {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setShowProfileMenu(false);
            setShowNotifications(false);
            router.replace("/admin-login");
            router.refresh();
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-5">
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
                    <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Admin Control Panel</h1>
                </div>

                {/* Right */}
                <div className="flex items-center space-x-4">

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                            className="relative text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Notifications</p>
                                        <span className="text-xs text-[#0a2a5e] font-semibold cursor-pointer hover:underline">Mark all read</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((n, i) => (
                                            <div key={i} className={`px-4 py-3 flex items-start gap-3 ${n.unread ? "bg-blue-50/50" : ""}`}>
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? "bg-[#0a2a5e]" : "bg-gray-300"}`} />
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
                            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                        >
                            <div className="w-8 h-8 bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {avatarLetter}
                            </div>
                            <span className="hidden sm:block font-medium">Administrator</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <div className="px-4 py-2.5 border-b border-gray-200">
                                        <p className="text-sm font-bold text-gray-900">Administrator</p>
                                        <p className="text-xs text-gray-400 truncate">{adminEmail || "Super Admin"}</p>
                                    </div>
                                    <Link
                                        href="/admin-dashboard/settings"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Website Dashboard
                                    </Link>
                                    <div className="border-t border-gray-200 mt-1 pt-1">
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
