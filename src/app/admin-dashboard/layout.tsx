"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin-dashboard/Sidebar";
import AdminHeader from "@/components/admin-dashboard/Header";
import { AdminPermissionBypass } from "@/context/ModulePermissionContext";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AdminPermissionBypass>
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminPermissionBypass>
    );
}
