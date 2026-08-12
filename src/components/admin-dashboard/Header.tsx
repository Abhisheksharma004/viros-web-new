"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAdminPageMeta } from "@/lib/adminPageMeta";
import type { AdminNotificationRow } from "@/lib/adminNotifications";

function formatNotificationRelativeTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [adminEmail, setAdminEmail] = useState("");
    const [adminName, setAdminName] = useState("");

    const [notifications, setNotifications] = useState<AdminNotificationRow[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const pageMeta = getAdminPageMeta(pathname);

    const avatarLetter = (adminName?.[0] || adminEmail?.[0] || "A").toUpperCase();

    const loadNotifications = useCallback(async (silent = false) => {
        if (!silent) setNotificationsLoading(true);
        try {
            const resp = await fetch("/api/admin/notifications", { cache: "no-store" });
            if (!resp.ok) return;
            const data = (await resp.json()) as { notifications: AdminNotificationRow[]; unreadCount: number };
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        } catch (err) {
            console.error("Error loading admin notifications:", err);
        } finally {
            if (!silent) setNotificationsLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;

        const fetchCurrentAdmin = async () => {
            try {
                const response = await fetch("/api/auth/me", { method: "GET" });
                if (!response.ok) return;
                const data = await response.json();
                if (active) {
                    setAdminEmail(data.email || "");
                    setAdminName(data.name || "");
                }
            } catch {
                // Keep fallback label when request fails.
            }
        };

        void fetchCurrentAdmin();
        void loadNotifications();

        const timer = setInterval(() => {
            if (active) {
                void loadNotifications(true);
            }
        }, 30_000);

        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [loadNotifications]);

    useEffect(() => {
        if (showNotifications) {
            void loadNotifications(true);
        }
    }, [showNotifications, loadNotifications]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || markingAllRead) return;
        try {
            setMarkingAllRead(true);
            const resp = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark_all_read" }),
            });
            if (resp.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })).slice(0, 10));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Error marking all read:", err);
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleNotificationClick = async (n: AdminNotificationRow) => {
        if (!n.isRead) {
            setNotifications((prev) =>
                prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            void fetch(`/api/admin/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
        }

        setShowNotifications(false);
        if (n.href) {
            router.push(n.href);
        }
    };

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
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:items-center sm:py-5">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="mt-0.5 shrink-0 text-gray-600 hover:text-gray-900 lg:hidden sm:mt-0"
                    aria-label="Open menu"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="min-w-0 flex-1 px-0 sm:px-2 lg:px-4">
                    <h1 className="truncate text-xl font-black text-gray-900 sm:text-2xl">{pageMeta.title}</h1>
                    {pageMeta.subtitle ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{pageMeta.subtitle}</p>
                    ) : null}
                </div>

                {/* Right */}
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                            }}
                            className="relative text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-10 bg-black/20 sm:bg-transparent"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="fixed left-1/2 top-[4.75rem] z-20 w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-none sm:translate-x-0">
                                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Notifications</p>
                                        {unreadCount > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => void handleMarkAllRead()}
                                                disabled={markingAllRead}
                                                className="text-xs text-[#0a2a5e] font-semibold hover:underline disabled:opacity-50"
                                            >
                                                {markingAllRead ? "Updating…" : "Mark all read"}
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {notificationsLoading && notifications.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</p>
                                        ) : notifications.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                                No notifications yet
                                            </p>
                                        ) : (
                                            notifications.map((n) => (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    onClick={() => void handleNotificationClick(n)}
                                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                                                        n.isRead ? "" : "bg-blue-50/50"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                            n.isRead ? "bg-gray-300" : "bg-[#0a2a5e]"
                                                        }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                                            {n.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {formatNotificationRelativeTime(n.createdAt)}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {avatarLetter}
                            </div>
                            <span className="hidden sm:block font-medium max-w-[140px] truncate">
                                {adminName || "Administrator"}
                            </span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                                    <div className="px-4 py-2.5 border-b border-gray-200">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {adminName || "Administrator"}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{adminEmail || "Super Admin"}</p>
                                    </div>
                                    <Link
                                        href="/admin-dashboard/settings"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
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
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Website Dashboard
                                    </Link>
                                    <div className="border-t border-gray-200 mt-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
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
