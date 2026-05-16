"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Longest matching sub-route wins so nested paths highlight one item only. */
function pickActiveSubHref(pathname: string | null, subs: { href: string }[]): string | null {
    if (!pathname) return null;
    const candidates = subs.filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => (a.href.length >= b.href.length ? a : b)).href;
}

const menuItems = [
    {
        title: "Dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        href: "/employee-dashboard",
    },
    {
        title: "My Profile",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        subItems: [
            {
                title: "Personal Info",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                    </svg>
                ),
                href: "/employee-dashboard/profile",
            },
            {
                title: "Change Password",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                ),
                href: "/employee-dashboard/change-password",
            },
        ],
    },
    {
        title: "Attendance",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        subItems: [
            {
                title: "My Attendance",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                href: "/employee-dashboard/attendance",
            },
            {
                title: "Leave Request",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                href: "/employee-dashboard/attendance/leave",
            },
            {
                title: "Leave History",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/attendance/history",
            },
        ],
    },
    {
        title: "Payroll",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        subItems: [
            {
                title: "Salary Slip",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                ),
                href: "/employee-dashboard/payroll/slip",
            },
            {
                title: "Payment History",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                ),
                href: "/employee-dashboard/payroll/history",
            },
        ],
    },
    {
        title: "Tasks",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        subItems: [
            {
                title: "My Tasks",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                href: "/employee-dashboard/tasks",
            },
            {
                title: "Team Tasks",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/tasks/team",
            },
        ],
    },
    {
        title: "AMC Work",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        href: "/employee-dashboard/amc-work",
    },
    {
        title: "Without AMC Work",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        href: "/employee-dashboard/without-amc-work",
    },
    {
        title: "Announcements",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ),
        href: "/employee-dashboard/announcements",
    },
];

export default function EmployeeSidebar({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<string[]>([]);

    useEffect(() => {
        for (const item of menuItems) {
            if ("subItems" in item && item.subItems && pickActiveSubHref(pathname, item.subItems)) {
                setOpenSections([item.title]);
                return;
            }
        }
        setOpenSections([]);
    }, [pathname]);

    const toggleSection = (title: string) => {
        setOpenSections((prev) => (prev.includes(title) ? [] : [title]));
    };

    const isActive = (href: string) => pathname === href;
    const isSectionActive = (subItems: { href: string }[]) => pickActiveSubHref(pathname, subItems) !== null;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
                </div>
            )}

            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen w-64 bg-[#06124f] text-white
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:z-auto
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <Link href="/employee-dashboard" className="flex items-center space-x-3">
                        <Image
                            src="/logo.png"
                            alt="VIROS Logo"
                            width={40}
                            height={40}
                            className="object-contain bg-white p-1 rounded-md"
                        />
                        <span className="font-bold text-lg">Viros Employee</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
                    {menuItems.map((item) => {
                        if (!item.subItems) {
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 rounded-lg
                                        transition-all duration-200
                                        ${isActive(item.href)
                                            ? "bg-[#06b6d4] text-white shadow-lg"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"}
                                    `}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            );
                        }

                        const sectionOpen = openSections.includes(item.title);
                        const sectionActive = isSectionActive(item.subItems);

                        return (
                            <div key={item.title}>
                                <button
                                    onClick={() => toggleSection(item.title)}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-3 rounded-lg
                                        transition-all duration-200
                                        ${sectionActive
                                            ? "bg-[#06b6d4] text-white shadow-lg"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"}
                                    `}
                                >
                                    <div className="flex items-center space-x-3">
                                        {item.icon}
                                        <span className="font-medium">{item.title}</span>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${sectionOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                                        sectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                    }`}
                                >
                                    <div className="min-h-0 overflow-hidden">
                                        <div className="ml-4 mt-1 space-y-1 pb-0.5">
                                        {item.subItems.map((sub) => {
                                            const activeHref = pickActiveSubHref(pathname, item.subItems);
                                            const subIsActive = activeHref === sub.href;
                                            return (
                                            <Link
                                                key={sub.title}
                                                href={sub.href}
                                                onClick={onClose}
                                                className={`
                                                    flex items-center space-x-3 px-4 py-2 rounded-lg
                                                    transition-colors duration-200
                                                    ${subIsActive
                                                        ? "bg-[#06b6d4] text-white shadow-lg"
                                                        : "text-white/60 hover:bg-white/10 hover:text-white"}
                                                `}
                                            >
                                                {sub.icon}
                                                <span className="text-sm">{sub.title}</span>
                                            </Link>
                                            );
                                        })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
