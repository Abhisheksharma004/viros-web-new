"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { menuItems as adminMenuItems } from "@/components/admin-dashboard/Sidebar";

/** Longest matching sub-route wins so nested paths highlight one item only. */
function pickActiveSubHref(pathname: string | null, subs: { href: string }[]): string | null {
    if (!pathname) return null;
    const candidates = subs.filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => (a.href.length >= b.href.length ? a : b)).href;
}

/** Set true when employee payroll routes are ready. */
const SHOW_PAYROLL_NAV = false;

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
                href: "/employee-dashboard/leave",
            },
            {
                title: "Leave History",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/history",
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
                title: "My Task",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                ),
                href: "/employee-dashboard/tasks",
            },
            {
                title: "Task History",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/task-history",
            },
        ],
    },
    {
        title: "Expense",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        subItems: [
            {
                title: "Monthly Expenses",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                href: "/employee-dashboard/add-expense",
            },
            {
                title: "Approved Expense",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/approved-expense",
            },
            {
                title: "Monthly History",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                href: "/employee-dashboard/monthly-history",
            },
            {
                title: "Reject Expense",
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                href: "/employee-dashboard/reject-expense",
            },
        ],
    },
    {
        title: "My Work",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        href: "/employee-dashboard/my-work",
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
        title: "Colleague Connect",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        href: "/employee-dashboard/colleague-connect",
    },
].filter((item) => SHOW_PAYROLL_NAV || item.title !== "Payroll");

const MODULE_ROUTE_MAP: Record<string, string> = {
    "Dashboard": "/employee-dashboard",
    "Add Company": "/employee-dashboard/granted/add-company",
    "Add Asset": "/employee-dashboard/granted/add-asset",
    "AMC Report": "/employee-dashboard/granted/amc-report",
    "Without AMC Report": "/employee-dashboard/granted/without-amc-report",
    "User Access": "/employee-dashboard/granted/users",
    "All Employees": "/employee-dashboard/granted/employees",
    "Employee Access": "/employee-dashboard/granted/employee-access",
    "Attendance": "/employee-dashboard/granted/attendance",
    "Leave Policy": "/employee-dashboard/granted/leave-policy",
    "Corporate Calendar": "/employee-dashboard/granted/corporate-calendar",
    "Leave Request": "/employee-dashboard/granted/leave-request",
    "Salary Setup": "/employee-dashboard/granted/salary",
    "Advance Payment": "/employee-dashboard/granted/advance-payment",
    "Advance Paymet": "/employee-dashboard/granted/advance-payment",
    "Payroll": "/employee-dashboard/granted/payroll",
    "Expense Management": "/employee-dashboard/granted/expense-management",
    "Emp. Shift": "/employee-dashboard/granted/shift",
    "Emp. Work Report": "/employee-dashboard/granted/work-entries",
    "Task Management": "/employee-dashboard/granted/tasks",
    "Department": "/employee-dashboard/granted/department",
    "Roles": "/employee-dashboard/granted/roles",
    "Activity Log": "/employee-dashboard/granted/activity",
    "Archived Employee": "/employee-dashboard/granted/delete-employee",
    "Proposal": "/employee-dashboard/granted/proposal",
    "Letter": "/employee-dashboard/granted/letter",
    "Offer Letter": "/employee-dashboard/granted/offer-letter",
    "Products": "/employee-dashboard/granted/products",
    "Warranty": "/employee-dashboard/granted/warranty",
    "Website Dashboard": "/employee-dashboard/granted/website-dashboard",
    "Job Post": "/employee-dashboard/granted/job-post",
    "Applications": "/employee-dashboard/granted/applications",
};

export default function EmployeeSidebar({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<string[]>([]);
    const [grantedModules, setGrantedModules] = useState<Array<{ name: string; href: string; category: string }>>([]);

    // Dynamic granted admin modules (both expandable categories & single top-level items)
    const dynamicGrantedItems = useMemo(() => {
        if (!grantedModules || grantedModules.length === 0) return [];
        const grantedSet = new Set(grantedModules.map((m) => m.name.toLowerCase()));

        const items: Array<
            | {
                  type: "category";
                  title: string;
                  icon: React.ReactNode;
                  subItems: Array<{
                      title: string;
                      icon: React.ReactNode;
                      href: string;
                  }>;
              }
            | {
                  type: "single";
                  title: string;
                  icon: React.ReactNode;
                  href: string;
              }
        > = [];

        for (const item of adminMenuItems) {
            if (item.title === "Dashboard") continue;

            if (item.subItems && item.subItems.length > 0) {
                const validSubs = item.subItems
                    .filter((sub) => grantedSet.has(sub.title.toLowerCase()))
                    .map((sub) => {
                        const slug = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        const targetHref = MODULE_ROUTE_MAP[sub.title] || (slug ? `/employee-dashboard/granted/${slug}` : "/employee-dashboard/granted");
                        return {
                            title: sub.title,
                            icon: sub.icon,
                            href: targetHref,
                        };
                    });

                if (validSubs.length > 0) {
                    items.push({
                        type: "category",
                        title: item.title,
                        icon: item.icon,
                        subItems: validSubs,
                    });
                }
            } else {
                if (grantedSet.has(item.title.toLowerCase())) {
                    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    const targetHref = MODULE_ROUTE_MAP[item.title] || (slug ? `/employee-dashboard/granted/${slug}` : "/employee-dashboard/granted");
                    items.push({
                        type: "single",
                        title: item.title,
                        icon: item.icon,
                        href: targetHref,
                    });
                }
            }
        }

        return items;
    }, [grantedModules]);

    useEffect(() => {
        for (const item of menuItems) {
            if ("subItems" in item && item.subItems && pickActiveSubHref(pathname, item.subItems)) {
                setOpenSections([item.title]);
                return;
            }
        }
        for (const cat of dynamicGrantedItems) {
            if (cat.type === "category" && pickActiveSubHref(pathname, cat.subItems)) {
                setOpenSections([cat.title]);
                return;
            }
        }
        setOpenSections([]);
    }, [pathname, dynamicGrantedItems]);

    useEffect(() => {
        async function loadPermissions() {
            try {
                const resp = await fetch("/api/employee/permissions", { cache: "no-store" });
                if (resp.ok) {
                    const data = await resp.json();
                    if (Array.isArray(data.permissions)) {
                        const activeMods = data.permissions
                            .filter((p: { read?: boolean; write?: boolean; admin?: boolean }) => p.read || p.write || p.admin)
                            .map((p: { module: string; category: string }) => {
                                const slug = p.module.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                return {
                                    name: p.module,
                                    category: p.category,
                                    href: MODULE_ROUTE_MAP[p.module] || (slug ? `/employee-dashboard/granted/${slug}` : "/employee-dashboard/granted"),
                                };
                            });
                        setGrantedModules(activeMods);
                    }
                }
            } catch (e) {
                console.error("Error loading granted permissions for employee sidebar:", e);
            }
        }
        void loadPermissions();
    }, []);

    const toggleSection = (title: string) => {
        setOpenSections((prev) => (prev.includes(title) ? [] : [title]));
    };

    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === "/employee-dashboard") {
            return pathname === "/employee-dashboard";
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

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

                <nav className="admin-sidebar-scroll h-[calc(100vh-80px)] space-y-1 overflow-y-auto p-4 pr-2">
                    {menuItems.map((item) => {
                        if (!item.subItems) {
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 rounded-md
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
                                        w-full flex items-center justify-between px-4 py-3 rounded-md
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
                                                    flex items-center space-x-3 px-4 py-2 rounded-md
                                                    transition-colors duration-200
                                                    ${subIsActive
                                                        ? "bg-[#06b6d4] text-white shadow-lg"
                                                        : "text-[#ffffff]/60 hover:bg-white/10 hover:text-white"}
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

                    {/* DYNAMIC GRANTED ADMIN MODULES */}
                    {dynamicGrantedItems.map((item) => {
                        if (item.type === "single") {
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 rounded-md
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
                                        w-full flex items-center justify-between px-4 py-3 rounded-md
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
                                                            flex items-center space-x-3 px-4 py-2 rounded-md
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
