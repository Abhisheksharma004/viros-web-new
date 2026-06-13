"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const PAGE_HEADERS: Record<string, { title: string; subtitle?: string }> = {
    "/employee-dashboard": {
        title: "Dashboard",
        subtitle: "Your work summary",
    },
    "/employee-dashboard/profile": {
        title: "My Profile",
        subtitle: "Your personal and work information on file",
    },
    "/employee-dashboard/change-password": {
        title: "Change password",
        subtitle: "Update your portal login password",
    },
    "/employee-dashboard/attendance": {
        title: "My Attendance",
        subtitle: "Check in, view calendar, and track your monthly record",
    },
    "/employee-dashboard/leave": {
        title: "Leave request",
        subtitle: "Apply for leave and view your balance",
    },
    "/employee-dashboard/history": {
        title: "Leave history",
        subtitle: "Past, rejected, and withdrawn leave requests",
    },
    "/employee-dashboard/tasks": {
        title: "My Tasks",
    },
    "/employee-dashboard/my-work": {
        title: "My Work",
        subtitle: "Your assigned work and activity",
    },
    "/employee-dashboard/task-history": {
        title: "Task History",
        subtitle: "Completed tasks assigned to you",
    },
    "/employee-dashboard/add-expense": {
        title: "Monthly Expenses",
        subtitle: "Add expenses for the month and submit in one batch for approval",
    },
    "/employee-dashboard/approved-expense": {
        title: "Approved Expense",
        subtitle: "Claimed and approved amounts for admin-approved expenses",
    },
    "/employee-dashboard/expense-history": {
        title: "Approved Expense",
        subtitle: "Claimed and approved amounts for admin-approved expenses",
    },
    "/employee-dashboard/monthly-history": {
        title: "Monthly History",
        subtitle: "Month-wise total, approved and rejected expenses",
    },
    "/employee-dashboard/reject-expense": {
        title: "Reject Expense",
        subtitle: "Expenses that were rejected for this month",
    },
};

function getPageHeader(pathname: string) {
    if (PAGE_HEADERS[pathname]) return PAGE_HEADERS[pathname];

    const match = Object.entries(PAGE_HEADERS)
        .filter(([path]) => path !== "/employee-dashboard")
        .sort((a, b) => b[0].length - a[0].length)
        .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));

    return match?.[1] ?? PAGE_HEADERS["/employee-dashboard"];
}

type EmployeeSession = {
    name: string;
    employeeId: string;
    email: string;
};

type EmployeeNotification = {
    id: number;
    type: string;
    title: string;
    message: string;
    href: string | null;
    isRead: boolean;
    createdAt: string;
};

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

function displayName(session: EmployeeSession | null): string {
    if (!session) return "Employee";
    const name = session.name.trim();
    if (name) return name;
    if (session.employeeId.trim()) return session.employeeId;
    return "Employee";
}

function avatarInitial(session: EmployeeSession | null): string {
    const label = displayName(session);
    return label.charAt(0).toUpperCase() || "E";
}

export default function EmployeeHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [employee, setEmployee] = useState<EmployeeSession | null>(null);
    const [notifications, setNotifications] = useState<EmployeeNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const pageHeader = useMemo(() => getPageHeader(pathname), [pathname]);

    useEffect(() => {
        let active = true;

        const loadEmployee = async () => {
            try {
                const response = await fetch("/api/employee-auth/me", { cache: "no-store" });
                if (!active) return;

                if (response.status === 403) {
                    const data = await response.json().catch(() => ({}));
                    if (data.portalBlocked) {
                        await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
                        router.replace("/admin-login");
                        router.refresh();
                    }
                    return;
                }

                if (!response.ok) return;

                const data = await response.json();
                setEmployee({
                    name: typeof data.name === "string" ? data.name : "",
                    employeeId: typeof data.employeeId === "string" ? data.employeeId : "",
                    email: typeof data.email === "string" ? data.email : "",
                });
            } catch {
                // Keep fallback label if session fetch fails.
            }
        };

        void loadEmployee();
        return () => {
            active = false;
        };
    }, [router]);

    const loadNotifications = async () => {
        try {
            setNotificationsLoading(true);
            const response = await fetch("/api/employee/notifications", { cache: "no-store" });
            if (!response.ok) return;
            const data = await response.json();
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        } catch {
            // Keep previous notifications on transient failures.
        } finally {
            setNotificationsLoading(false);
        }
    };

    useEffect(() => {
        void loadNotifications();
        const interval = window.setInterval(() => {
            void loadNotifications();
        }, 60_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (showNotifications) {
            void loadNotifications();
        }
    }, [showNotifications]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || markingAllRead) return;
        try {
            setMarkingAllRead(true);
            const response = await fetch("/api/employee/notifications", { method: "PATCH" });
            if (!response.ok) return;
            const data = await response.json();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        } catch {
            // Ignore — user can retry.
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleNotificationClick = async (notification: EmployeeNotification) => {
        if (!notification.isRead) {
            try {
                const response = await fetch(`/api/employee/notifications/${notification.id}`, {
                    method: "PATCH",
                });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
                    );
                    setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
                }
            } catch {
                // Still navigate even if mark-read fails.
            }
        }

        setShowNotifications(false);
        if (notification.href) {
            router.push(notification.href);
        }
    };

    const employeeName = useMemo(() => displayName(employee), [employee]);
    const initial = useMemo(() => avatarInitial(employee), [employee]);

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
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-5">
                {/* Left: Hamburger */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Center: Page title */}
                <div className="flex-1 min-w-0 px-2 sm:px-4">
                    <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{pageHeader.title}</h1>
                    {pathname === "/employee-dashboard/tasks" ? (
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 sm:line-clamp-1 sm:text-sm sm:truncate">
                            Tasks assigned to you
                            {employee && employeeName !== "Employee" ? (
                                <>
                                    {" "}
                                    —{" "}
                                    <span className="font-semibold text-[#0a2a5e]">{employeeName}</span>
                                </>
                            ) : null}
                        </p>
                    ) : pageHeader.subtitle ? (
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2 sm:line-clamp-1 sm:truncate">
                            {pageHeader.subtitle}
                        </p>
                    ) : null}
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
                                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${n.isRead ? "" : "bg-blue-50/50"}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? "bg-gray-300" : "bg-[#0a2a5e]"}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
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
                            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {initial}
                            </div>
                            <span className="hidden sm:block font-medium max-w-[140px] truncate">{employeeName}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                                    <div className="px-4 py-2.5 border-b border-gray-200">
                                        <p className="text-sm font-bold text-gray-900 truncate">{employeeName}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {employee?.employeeId || "Staff Member"}
                                        </p>
                                    </div>
                                    <Link
                                        href="/employee-dashboard/profile"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/employee-dashboard/attendance"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Attendance
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
