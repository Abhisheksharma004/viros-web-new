"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

import WorkRecordsReportPage from "@/components/admin-dashboard/WorkRecordsReportPage";
import AdminAttendancePage from "@/app/admin-dashboard/attendance/page";
import EmployeesPage from "@/app/admin-dashboard/employees/page";
import UserAccessPage from "@/app/admin-dashboard/users/page";
import EmployeeAccessPage from "@/app/admin-dashboard/employee-access/page";
import LeavePolicyPage from "@/app/admin-dashboard/leave-policy/page";
import CorporateCalendarPage from "@/app/admin-dashboard/corporate-calendar/page";
import LeaveRequestPage from "@/app/admin-dashboard/leave-request/page";
import SalaryPage from "@/app/admin-dashboard/salary/page";
import AdvancePaymentPage from "@/app/admin-dashboard/advance-payment/page";
import PayrollPage from "@/app/admin-dashboard/payroll/page";
import ExpenseManagementPage from "@/app/admin-dashboard/expense-management/page";
import ShiftPage from "@/app/admin-dashboard/shift/page";
import WorkEntriesPage from "@/app/admin-dashboard/work-entries/page";
import TasksPage from "@/app/admin-dashboard/tasks/page";
import DepartmentPage from "@/app/admin-dashboard/department/page";
import RolesPage from "@/app/admin-dashboard/roles/page";
import ActivityPage from "@/app/admin-dashboard/activity/page";
import DeleteEmployeePage from "@/app/admin-dashboard/delete-employee/page";
import ProposalPage from "@/app/admin-dashboard/proposal/page";
import LetterPage from "@/app/admin-dashboard/letter/page";
import OfferLetterPage from "@/app/admin-dashboard/offer-letter/page";
import ProductsPage from "@/app/admin-dashboard/products/page";
import WarrantyPage from "@/app/admin-dashboard/warranty/page";

const SLUG_TITLE_MAP: Record<string, { title: string; category: string }> = {
    "amc-report": { title: "AMC Report", category: "Asset Management" },
    "without-amc-report": { title: "Without AMC Report", category: "Asset Management" },
    "add-company": { title: "Add Company", category: "Asset Management" },
    "add-asset": { title: "Add Asset", category: "Asset Management" },
    "users": { title: "User Access", category: "User Access" },
    "employees": { title: "All Employees", category: "HRMS" },
    "employee-access": { title: "Employee Access", category: "HRMS" },
    "attendance": { title: "Attendance", category: "HRMS" },
    "leave-policy": { title: "Leave Policy", category: "HRMS" },
    "corporate-calendar": { title: "Corporate Calendar", category: "HRMS" },
    "leave-request": { title: "Leave Request", category: "HRMS" },
    "salary": { title: "Salary Setup", category: "Payroll" },
    "advance-payment": { title: "Advance Payment", category: "Payroll" },
    "payroll": { title: "Payroll", category: "Payroll" },
    "expense-management": { title: "Expense Management", category: "Finance" },
    "shift": { title: "Emp. Shift", category: "Operations" },
    "work-entries": { title: "Emp. Work Report", category: "Operations" },
    "tasks": { title: "Task Management", category: "Task Management" },
    "department": { title: "Department", category: "Settings" },
    "roles": { title: "Roles", category: "Settings" },
    "activity": { title: "Activity Log", category: "Settings" },
    "delete-employee": { title: "Archived Employee", category: "HRMS" },
    "proposal": { title: "Proposal", category: "Documents" },
    "letter": { title: "Letter", category: "Documents" },
    "offer-letter": { title: "Offer Letter", category: "Documents" },
    "products": { title: "Products", category: "Inventory" },
    "warranty": { title: "Warranty", category: "Inventory" },
};

export default function GrantedModulePage({
    params: paramsPromise,
}: {
    params: Promise<{ slug: string }>;
}) {
    const params = use(paramsPromise);
    const slug = params.slug;
    const moduleConfig = SLUG_TITLE_MAP[slug] || { title: slug.replace(/-/g, " "), category: "General Access" };

    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        async function checkModuleAccess() {
            setIsLoading(true);
            try {
                const resp = await fetch("/api/employee/permissions", { cache: "no-store" });
                if (resp.ok) {
                    const data = await resp.json();
                    if (Array.isArray(data.permissions)) {
                        const perm = data.permissions.find(
                            (p: { module: string }) => p.module.toLowerCase() === moduleConfig.title.toLowerCase()
                        );
                        if (perm && (perm.read || perm.write || perm.admin)) {
                            setHasAccess(true);
                        } else {
                            setHasAccess(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Error verifying module access:", err);
                setHasAccess(false);
            } finally {
                setIsLoading(false);
            }
        }
        void checkModuleAccess();
    }, [slug, moduleConfig.title]);

    if (isLoading) {
        return (
            <div className="flex h-96 flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#06124f]" />
                <p className="text-sm font-semibold text-gray-600">Verifying access permissions...</p>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="mx-auto max-w-2xl py-12 px-4">
                <div className="rounded-xl border border-rose-100 bg-white p-8 shadow-xl text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        You do not have active access rights to view the <span className="font-semibold text-gray-900">&quot;{moduleConfig.title}&quot;</span> module.
                        Please contact your System Administrator to request module privileges.
                    </p>
                    <div className="inline-flex items-center justify-center">
                        <Link
                            href="/employee-dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#06124f] text-white text-sm font-semibold hover:bg-[#0a2a5e] transition-colors shadow"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Employee Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Render granted Admin Module Page components directly inside Employee Portal layout
    switch (slug) {
        case "attendance":
            return <AdminAttendancePage />;
        case "amc-report":
            return <WorkRecordsReportPage variant="amc" />;
        case "without-amc-report":
            return <WorkRecordsReportPage variant="without_amc" />;
        case "employees":
            return <EmployeesPage />;
        case "users":
            return <UserAccessPage />;
        case "employee-access":
            return <EmployeeAccessPage />;
        case "leave-policy":
            return <LeavePolicyPage />;
        case "corporate-calendar":
            return <CorporateCalendarPage />;
        case "leave-request":
            return <LeaveRequestPage />;
        case "salary":
            return <SalaryPage />;
        case "advance-payment":
            return <AdvancePaymentPage />;
        case "payroll":
            return <PayrollPage />;
        case "expense-management":
            return <ExpenseManagementPage />;
        case "shift":
            return <ShiftPage />;
        case "work-entries":
            return <WorkEntriesPage />;
        case "tasks":
            return <TasksPage />;
        case "department":
            return <DepartmentPage />;
        case "roles":
            return <RolesPage />;
        case "activity":
            return <ActivityPage />;
        case "delete-employee":
            return <DeleteEmployeePage />;
        case "proposal":
            return <ProposalPage />;
        case "letter":
            return <LetterPage />;
        case "offer-letter":
            return <OfferLetterPage />;
        case "products":
            return <ProductsPage />;
        case "warranty":
            return <WarrantyPage />;
        default:
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded bg-teal-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                                    {moduleConfig.category}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Granted Access
                                </span>
                            </div>
                            <h1 className="mt-1 text-2xl font-bold text-gray-900">{moduleConfig.title}</h1>
                        </div>
                        <Link
                            href="/employee-dashboard"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Dashboard
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-gray-600 text-sm">
                            Viewing <strong className="text-gray-900">{moduleConfig.title}</strong> module inside Employee Portal.
                        </p>
                    </div>
                </div>
            );
    }
}
