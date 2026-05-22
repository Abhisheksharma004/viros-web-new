"use client";

import { useState } from "react";
import EmployeeSidebar from "@/components/employee-dashboard/Sidebar";
import EmployeeHeader from "@/components/employee-dashboard/Header";
import EmployeeBottomNav from "@/components/employee-dashboard/BottomNav";

export default function EmployeeDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <EmployeeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <EmployeeHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-3 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-8">
                    {children}
                </main>
                <EmployeeBottomNav onMenuClick={() => setSidebarOpen(true)} />
            </div>
        </div>
    );
}
