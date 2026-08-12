"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useModulePermission } from "@/context/ModulePermissionContext";
import Link from "next/link";
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    Search,
    Filter,
    Key,
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    X,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertCircle,
    UserCheck,
    UserX,
    Check,
    Loader2,
} from "lucide-react";

import { menuItems } from "@/components/admin-dashboard/Sidebar";

type UserRole = "Super Admin" | "System Admin" | "HR Manager" | "Asset Manager" | "Standard User";
type UserStatus = "Active" | "Suspended" | "Pending Invite";

export interface SidebarModuleItem {
    name: string;
    category: string;
}

// Dynamically generated from Admin Sidebar configuration menuItems
export const SIDEBAR_MODULES: SidebarModuleItem[] = (() => {
    const list: SidebarModuleItem[] = [];
    menuItems.forEach((item) => {
        if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach((sub) => {
                list.push({
                    name: sub.title,
                    category: item.title,
                });
            });
        } else {
            list.push({
                name: item.title,
                category: item.title,
            });
        }
    });
    return list;
})();

interface PermissionScope {
    module: string;
    category: string;
    read: boolean;
    write: boolean;
    delete?: boolean;
    admin: boolean;
}

interface UserAccessItem {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    department: string;
    lastActive: string;
    createdAt: string;
    permissions: PermissionScope[];
}

function createDefaultPermissions(): PermissionScope[] {
    return SIDEBAR_MODULES.map((m) => ({
        module: m.name,
        category: m.category,
        read: false,
        write: false,
        delete: false,
        admin: false,
    }));
}

export default function UserAccessPage() {
    const { write: canWrite, delete: canDelete, admin: isAdmin } = useModulePermission();
    const [users, setUsers] = useState<UserAccessItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState<UserAccessItem | null>(null);
    const [editingUser, setEditingUser] = useState<UserAccessItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form state for adding user via single Employee ID Search
    const [searchEmployeeId, setSearchEmployeeId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchedEmployee, setSearchedEmployee] = useState<{
        employeeId: string;
        fullName: string;
        email: string;
        username: string;
        department: string;
    } | null>(null);
    const [lookupError, setLookupError] = useState("");

    const [newUserPermissions, setNewUserPermissions] = useState<PermissionScope[]>(createDefaultPermissions());

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    // Load explicitly granted users from Database on mount
    const loadGrantedUsers = useCallback(async () => {
        try {
            const resp = await fetch("/api/admin/users", { cache: "no-store" });
            if (resp.ok) {
                const records: UserAccessItem[] = await resp.json();
                setUsers(records || []);
            }
        } catch (error) {
            console.error("Error loading granted users:", error);
        }
    }, []);

    useEffect(() => {
        void loadGrantedUsers();
    }, [loadGrantedUsers]);

    // Real API Employee ID Search & Lookup Handler
    const handleEmployeeLookup = async (empId: string) => {
        const query = empId.trim();
        setSearchEmployeeId(query);
        setLookupError("");

        if (!query) {
            setSearchedEmployee(null);
            return;
        }

        setIsSearching(true);
        try {
            const resp = await fetch(`/api/admin/employees/lookup?employee_id=${encodeURIComponent(query)}`, {
                cache: "no-store",
            });

            if (resp.ok) {
                const data = await resp.json();
                setSearchedEmployee({
                    employeeId: data.employee_id,
                    fullName: data.full_name || `Employee ${data.employee_id}`,
                    email: data.official_email || `${data.employee_id.toLowerCase()}@viros.in`,
                    username: data.official_email ? data.official_email.split("@")[0] : data.employee_id.toLowerCase(),
                    department: data.department || "General",
                });
                setLookupError("");
            } else {
                const matchedUser = users.find(
                    (u) => u.id.toLowerCase() === query.toLowerCase() || u.username.toLowerCase() === query.toLowerCase()
                );

                if (matchedUser) {
                    setSearchedEmployee({
                        employeeId: matchedUser.id,
                        fullName: matchedUser.fullName,
                        email: matchedUser.email,
                        username: matchedUser.username,
                        department: matchedUser.department,
                    });
                } else {
                    setSearchedEmployee(null);
                    setLookupError(`No employee found with ID "${query}" in database.`);
                }
            }
        } catch (err) {
            console.error("Employee lookup error:", err);
            setSearchedEmployee(null);
            setLookupError("Failed to lookup employee details. Check network connection.");
        } finally {
            setIsSearching(false);
        }
    };

    // Filtered users calculation
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === "All" || u.role === roleFilter;
            const matchesStatus = statusFilter === "All" || u.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.status === "Active").length;
        const superAdmins = users.filter((u) => u.role === "Super Admin" || u.role === "System Admin").length;
        const suspended = users.filter((u) => u.status === "Suspended").length;
        return { total, active, superAdmins, suspended };
    }, [users]);

    // Checkbox toggles
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(filteredUsers.map((u) => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Quick Status Toggle Switch
    const handleToggleStatus = async (userId: string) => {
        const target = users.find((u) => u.id === userId);
        if (!target) return;

        const newStatus: UserStatus = target.status === "Active" ? "Suspended" : "Active";
        const updatedRecord = { ...target, status: newStatus };

        try {
            await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedRecord),
            });
            showToast(`Access status for ${target.fullName} changed to ${newStatus}`);
            await loadGrantedUsers();
        } catch (e) {
            console.error("Failed to update status:", e);
        }
    };

    // Delete / Revoke User Access
    const handleDeleteUser = async (userId: string, name: string) => {
        if (confirm(`Are you sure you want to revoke access for ${name}?`)) {
            try {
                await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
                    method: "DELETE",
                });
                showToast(`User access for ${name} has been revoked.`);
                await loadGrantedUsers();
                setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
            } catch (e) {
                console.error("Failed to revoke access:", e);
            }
        }
    };

    // Bulk actions
    const handleBulkSuspend = async () => {
        try {
            await Promise.all(
                selectedUserIds.map((id) => {
                    const u = users.find((item) => item.id === id);
                    if (!u) return Promise.resolve();
                    return fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...u, status: "Suspended" }),
                    });
                })
            );
            showToast(`Suspended ${selectedUserIds.length} selected user(s).`);
            await loadGrantedUsers();
            setSelectedUserIds([]);
        } catch (e) {
            console.error("Bulk suspend error:", e);
        }
    };

    const handleBulkActivate = async () => {
        try {
            await Promise.all(
                selectedUserIds.map((id) => {
                    const u = users.find((item) => item.id === id);
                    if (!u) return Promise.resolve();
                    return fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...u, status: "Active" }),
                    });
                })
            );
            showToast(`Activated access for ${selectedUserIds.length} selected user(s).`);
            await loadGrantedUsers();
            setSelectedUserIds([]);
        } catch (e) {
            console.error("Bulk activate error:", e);
        }
    };

    // Add new user form submit
    const handleAddUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchEmployeeId.trim()) {
            setLookupError("Please enter an Employee ID to search.");
            return;
        }

        const emp = searchedEmployee || {
            employeeId: searchEmployeeId.toUpperCase(),
            fullName: `Employee ${searchEmployeeId.toUpperCase()}`,
            email: `${searchEmployeeId.toLowerCase()}@viros.in`,
            username: searchEmployeeId.toLowerCase(),
            department: "Software Engineering",
        };

        const payload = {
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            email: emp.email,
            username: emp.username,
            role: "Standard User",
            status: "Active",
            department: emp.department,
            permissions: newUserPermissions,
        };

        try {
            const resp = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                throw new Error("Failed to save user access");
            }

            setIsAddModalOpen(false);
            showToast(`User access granted successfully for ${emp.fullName} (${emp.employeeId})!`);
            await loadGrantedUsers();

            // Reset form
            setSearchEmployeeId("");
            setSearchedEmployee(null);
            setLookupError("");
            setNewUserPermissions(createDefaultPermissions());
        } catch (err) {
            console.error("Error submitting user access:", err);
            setLookupError("Failed to save granted access. Please try again.");
        }
    };

    // Save editing user
    const handleSaveEditingUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const resp = await fetch(`/api/admin/users/${encodeURIComponent(editingUser.id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingUser),
            });

            if (!resp.ok) throw new Error("Failed to update user access");

            showToast(`Permissions updated for ${editingUser.fullName}`);
            setEditingUser(null);
            await loadGrantedUsers();
        } catch (err) {
            console.error("Error updating user access:", err);
        }
    };

    // Group permissions by Category for clean display
    const groupedNewUserPermissions = useMemo(() => {
        const map: Record<string, PermissionScope[]> = {};
        for (const p of newUserPermissions) {
            if (!map[p.category]) map[p.category] = [];
            map[p.category].push(p);
        }
        return map;
    }, [newUserPermissions]);

    const groupedEditingUserPermissions = useMemo(() => {
        if (!editingUser) return {};
        const map: Record<string, PermissionScope[]> = {};
        for (const p of editingUser.permissions) {
            if (!map[p.category]) map[p.category] = [];
            map[p.category].push(p);
        }
        return map;
    }, [editingUser]);

    return (
        <div className="space-y-6">
            {/* Top Notification Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-md bg-[#06124f] px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all duration-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-[#0a2a5e]" />
                        User Access Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage system login privileges, role permissions, and module access control.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {(canWrite || isAdmin) && (
                        <button
                            onClick={() => {
                                setSearchEmployeeId("");
                                setSearchedEmployee(null);
                                setLookupError("");
                                setNewUserPermissions(createDefaultPermissions());
                                setIsAddModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <UserPlus className="h-4 w-4" />
                            Grant User Access
                        </button>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="group rounded-md border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total Users
                            </p>
                            <p className="mb-1 text-3xl font-black text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-400">Registered system accounts</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-[#06124f] to-[#0a2a5e] text-white shadow">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Active Access */}
                <div className="group rounded-md border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Active Access
                            </p>
                            <p className="mb-1 text-3xl font-black text-gray-900">{stats.active}</p>
                            <p className="text-xs text-teal-600 font-semibold">
                                {Math.round((stats.active / (stats.total || 1)) * 100)}% accounts active
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-[#00bcd4] text-white shadow">
                            <UserCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Admins & Leadership */}
                <div className="group rounded-md border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                System Admins
                            </p>
                            <p className="mb-1 text-3xl font-black text-gray-900">{stats.superAdmins}</p>
                            <p className="text-xs text-gray-400">Super Admins & System Admins</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Suspended Users */}
                <div className="group rounded-md border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Suspended Users
                            </p>
                            <p className="mb-1 text-3xl font-black text-gray-900">{stats.suspended}</p>
                            <p className="text-xs text-rose-500 font-semibold">Access restricted or revoked</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow">
                            <UserX className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search user name, email, username, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap">
                                <Filter className="h-4 w-4 text-gray-400" />
                                Role:
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-2.5 text-sm rounded-md border border-gray-200 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] font-medium"
                            >
                                <option value="All">All Roles</option>
                                <option value="Super Admin">Super Admin</option>
                                <option value="System Admin">System Admin</option>
                                <option value="HR Manager">HR Manager</option>
                                <option value="Asset Manager">Asset Manager</option>
                                <option value="Standard User">Standard User</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 text-sm rounded-md border border-gray-200 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] font-medium"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Pending Invite">Pending Invite</option>
                            </select>
                        </div>

                        {(searchQuery || roleFilter !== "All" || statusFilter !== "All") && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setRoleFilter("All");
                                    setStatusFilter("All");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-[#0a2a5e] hover:underline"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUserIds.length > 0 && (
                    <div className="flex items-center justify-between rounded-md bg-[#0a2a5e]/5 px-4 py-3 border border-[#0a2a5e]/15">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-[#0a2a5e]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a2a5e] text-xs font-bold text-white">
                                {selectedUserIds.length}
                            </span>
                            <span>Users Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkActivate}
                                className="px-4 py-2 rounded-md bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition"
                            >
                                Activate Selected
                            </button>
                            <button
                                onClick={handleBulkSuspend}
                                className="px-4 py-2 rounded-md bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 transition"
                            >
                                Suspend Selected
                            </button>
                            <button
                                onClick={() => setSelectedUserIds([])}
                                className="text-sm font-semibold text-gray-500 hover:text-gray-700 ml-2"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Access Table Container */}
            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">User Access Directory</h2>
                    <span className="text-xs font-semibold text-gray-500">
                        Showing {filteredUsers.length} records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredUsers.length > 0 &&
                                            selectedUserIds.length === filteredUsers.length
                                        }
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e]"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    User Details
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    System Role
                                </th>

                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Access Status
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Last Activity
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800">No matching users found</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Try clearing filters or search query.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    const activePermissionsCount = user.permissions.filter((p) => p.read || p.write || p.admin).length;
                                    const initials = user.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase();

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`transition-colors hover:bg-gray-50 ${
                                                isSelected ? "bg-[#0a2a5e]/5" : ""
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(user.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e]"
                                                />
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {user.fullName}
                                                </div>
                                                <div className="text-xs font-mono text-gray-400 mt-0.5">
                                                    {user.id}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        user.role === "Super Admin"
                                                            ? "bg-purple-50 text-purple-700"
                                                            : user.role === "System Admin"
                                                            ? "bg-[#0a2a5e]/10 text-[#0a2a5e]"
                                                            : user.role === "HR Manager"
                                                            ? "bg-blue-50 text-blue-700"
                                                            : user.role === "Asset Manager"
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    <Shield className="h-3.5 w-3.5" />
                                                    {user.role}
                                                </span>
                                            </td>



                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            user.status === "Active" ? "bg-green-600" : "bg-gray-300"
                                                        }`}
                                                        title="Click to toggle access state"
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                user.status === "Active" ? "translate-x-4" : "translate-x-0"
                                                            }`}
                                                        />
                                                    </button>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            user.status === "Active"
                                                                ? "bg-green-50 text-green-700"
                                                                : user.status === "Suspended"
                                                                ? "bg-rose-50 text-rose-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        }`}
                                                    >
                                                        {user.status}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    {user.lastActive}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingUser(user)}
                                                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                                                        title="View Access Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {(canWrite || isAdmin) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingUser({ ...user })}
                                                            className="rounded-md p-2 text-[#0a2a5e] hover:bg-[#0a2a5e]/10 transition"
                                                            title="Edit Permissions"
                                                        >
                                                            <Key className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {(canDelete || isAdmin) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                                                            className="rounded-md p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                                            title="Revoke Access"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="text-xs text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> of{" "}
                        <span className="font-bold text-gray-900">{users.length}</span> user accounts
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed shadow-xs"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>
                        <button
                            disabled
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed shadow-xs"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Dashboard Signature Banner */}
            <div
                className="rounded-md p-6 text-white shadow"
                style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 60%, #0d3a7a 100%)" }}
            >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="mb-1 text-base font-bold">User Security & Access Audit</h3>
                        <p className="text-xs text-white/60">System access policies are enforced according to role credentials</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-8">
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{stats.active}</p>
                            <p className="text-xs text-white/40">Active Logins</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{stats.superAdmins}</p>
                            <p className="text-xs text-white/40">System Admins</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">{stats.suspended}</p>
                            <p className="text-xs text-white/40">Locked Accounts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL 1: Grant New User Access - ALL SIDEBAR MODULES */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden">
                    <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden max-h-[min(88vh,720px)] flex flex-col my-auto animate-fadeIn">
                        {/* Header - Fixed shrink-0 */}
                        <div
                            className="flex items-center justify-between px-6 py-4 text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                        >
                            <div className="flex items-center gap-2 font-bold text-base">
                                <UserPlus className="h-5 w-5 text-teal-300" />
                                Grant New User Access
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleAddUserSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col space-y-4">
                            {/* SINGLE EMPLOYEE ID SEARCH FIELD */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Employee ID <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter Employee ID (e.g. EMP-101, USR-1005)..."
                                        value={searchEmployeeId}
                                        onChange={(e) => handleEmployeeLookup(e.target.value)}
                                        className="w-full pl-10 pr-24 py-2.5 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] placeholder:text-gray-400"
                                    />
                                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    {isSearching ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400 font-medium">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#0a2a5e]" />
                                            Searching...
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleEmployeeLookup(searchEmployeeId)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#0a2a5e] text-white text-xs font-semibold rounded hover:bg-[#06124f] transition"
                                        >
                                            Search
                                        </button>
                                    )}
                                </div>

                                {lookupError && (
                                    <p className="mt-1.5 text-xs text-red-500 font-medium">{lookupError}</p>
                                )}
                            </div>

                            {/* EMPLOYEE AUTO PREVIEW CARD */}
                            {searchedEmployee && (
                                <div className="p-4 rounded-md border border-teal-200 bg-teal-50/50 space-y-2 animate-fadeIn shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                                            <Check className="h-4 w-4 text-teal-600" />
                                            Employee Record Found
                                        </span>
                                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                                            {searchedEmployee.employeeId}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-teal-100">
                                        <div>
                                            <span className="text-gray-500 font-medium">Full Name:</span>
                                            <p className="font-bold text-gray-900 text-sm">{searchedEmployee.fullName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium">Department:</span>
                                            <p className="font-semibold text-gray-800">{searchedEmployee.department}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Granular Module Rights Matrix for ALL Admin Sidebar Modules */}
                            <div className="space-y-2.5 border-t border-gray-100 pt-3 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between shrink-0">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Granular Module Rights (Admin Sidebar Modules)
                                    </h4>
                                    <span className="text-xs font-semibold text-gray-400">
                                        {SIDEBAR_MODULES.length} Sidebar Items
                                    </span>
                                </div>

                                <div className="overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100 text-sm flex-1 max-h-[280px]">
                                    {Object.entries(groupedNewUserPermissions).map(([category, items]) => (
                                        <div key={category} className="bg-white">
                                            <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0a2a5e] border-y border-gray-200 sticky top-0 z-10">
                                                {category}
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {items.map((perm) => {
                                                    const realIdx = newUserPermissions.findIndex((p) => p.module === perm.module);
                                                    return (
                                                        <div key={perm.module} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                            <span className="font-semibold text-gray-800 text-sm">{perm.module}</span>
                                                            <div className="flex items-center gap-5 text-sm">
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.read}
                                                                        onChange={(e) => {
                                                                            const updated = [...newUserPermissions];
                                                                            updated[realIdx].read = e.target.checked;
                                                                            setNewUserPermissions(updated);
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e] cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Read</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.write}
                                                                        onChange={(e) => {
                                                                            const updated = [...newUserPermissions];
                                                                            updated[realIdx].write = e.target.checked;
                                                                            setNewUserPermissions(updated);
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e] cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Write</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(perm.delete)}
                                                                        onChange={(e) => {
                                                                            const updated = [...newUserPermissions];
                                                                            updated[realIdx].delete = e.target.checked;
                                                                            setNewUserPermissions(updated);
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Delete</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.admin}
                                                                        onChange={(e) => {
                                                                            const updated = [...newUserPermissions];
                                                                            updated[realIdx].admin = e.target.checked;
                                                                            if (e.target.checked) {
                                                                                updated[realIdx].read = true;
                                                                                updated[realIdx].write = true;
                                                                                updated[realIdx].delete = true;
                                                                            }
                                                                            setNewUserPermissions(updated);
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Admin</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer - Fixed Anchored at bottom */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 mt-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-md bg-[#0a2a5e] text-sm font-semibold text-white shadow-sm hover:bg-[#06124f] transition"
                                >
                                    Grant Access
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Edit Permissions */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden">
                    <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden max-h-[min(88vh,720px)] flex flex-col my-auto animate-fadeIn">
                        <div
                            className="flex items-center justify-between px-6 py-4 text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                        >
                            <div className="flex items-center gap-2 font-bold text-base">
                                <Key className="h-5 w-5 text-teal-300" />
                                Edit Permissions: {editingUser.fullName}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditingUser} className="p-6 overflow-y-auto flex-1 flex flex-col space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-md border border-gray-100 shrink-0">
                                <div
                                    className="h-10 w-10 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0"
                                    style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                                >
                                    {editingUser.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{editingUser.fullName}</div>
                                    <div className="text-xs text-gray-500">{editingUser.email} · ID: {editingUser.id}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 shrink-0">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Role</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => {
                                            const r = e.target.value as UserRole;
                                            setEditingUser((prev) => (prev ? { ...prev, role: r } : null));
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    >
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="System Admin">System Admin</option>
                                        <option value="HR Manager">HR Manager</option>
                                        <option value="Asset Manager">Asset Manager</option>
                                        <option value="Standard User">Standard User</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
                                    <select
                                        value={editingUser.status}
                                        onChange={(e) => {
                                            const s = e.target.value as UserStatus;
                                            setEditingUser((prev) => (prev ? { ...prev, status: s } : null));
                                        }}
                                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Pending Invite">Pending Invite</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2.5 border-t border-gray-100 pt-3 flex-1 flex flex-col min-h-0">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 shrink-0">
                                    Granular Module Rights (Sidebar Modules)
                                </h4>
                                <div className="overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100 text-sm flex-1 max-h-[280px]">
                                    {Object.entries(groupedEditingUserPermissions).map(([category, items]) => (
                                        <div key={category} className="bg-white">
                                            <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0a2a5e] border-y border-gray-200 sticky top-0 z-10">
                                                {category}
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {items.map((perm) => {
                                                    const realIdx = editingUser.permissions.findIndex((p) => p.module === perm.module);
                                                    return (
                                                        <div key={perm.module} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                            <span className="font-semibold text-gray-800 text-sm">{perm.module}</span>
                                                            <div className="flex items-center gap-5 text-sm">
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.read}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingUser.permissions];
                                                                            updated[realIdx].read = e.target.checked;
                                                                            setEditingUser({ ...editingUser, permissions: updated });
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e] cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Read</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.write}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingUser.permissions];
                                                                            updated[realIdx].write = e.target.checked;
                                                                            setEditingUser({ ...editingUser, permissions: updated });
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#0a2a5e] cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Write</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(perm.delete)}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingUser.permissions];
                                                                            updated[realIdx].delete = e.target.checked;
                                                                            setEditingUser({ ...editingUser, permissions: updated });
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Delete</span>
                                                                </label>
                                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.admin}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingUser.permissions];
                                                                            updated[realIdx].admin = e.target.checked;
                                                                            if (e.target.checked) {
                                                                                updated[realIdx].read = true;
                                                                                updated[realIdx].write = true;
                                                                                updated[realIdx].delete = true;
                                                                            }
                                                                            setEditingUser({ ...editingUser, permissions: updated });
                                                                        }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                                    />
                                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">Admin</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 mt-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-md bg-[#0a2a5e] text-sm font-semibold text-white shadow-sm hover:bg-[#06124f] transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: View User Overview */}
            {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden">
                    <div className="relative w-full max-w-xl bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden max-h-[min(88vh,720px)] flex flex-col my-auto animate-fadeIn">
                        <div
                            className="flex items-center justify-between px-6 py-4 text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                        >
                            <div className="flex items-center gap-2 font-bold text-base">
                                <Eye className="h-5 w-5 text-teal-300" />
                                User Access Profile
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingUser(null)}
                                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5 flex flex-col">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4 shrink-0">
                                <div
                                    className="h-12 w-12 rounded-full text-base font-bold text-white flex items-center justify-center shadow-md shrink-0"
                                    style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                                >
                                    {viewingUser.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{viewingUser.fullName}</h3>
                                    <p className="text-xs text-gray-500">{viewingUser.email}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded bg-[#0a2a5e]/10 px-2.5 py-1 text-xs font-bold text-[#0a2a5e]">
                                            {viewingUser.role}
                                        </span>
                                        <span
                                            className={`rounded px-2.5 py-1 text-xs font-semibold ${
                                                viewingUser.status === "Active"
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-rose-50 text-rose-700"
                                            }`}
                                        >
                                            {viewingUser.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs shrink-0">
                                <div className="rounded-md bg-gray-50 p-3">
                                    <span className="text-gray-400 font-medium">User ID</span>
                                    <div className="font-bold font-mono text-gray-900 mt-0.5">{viewingUser.id}</div>
                                </div>
                                <div className="rounded-md bg-gray-50 p-3">
                                    <span className="text-gray-400 font-medium">Department</span>
                                    <div className="font-bold text-gray-900 mt-0.5">{viewingUser.department}</div>
                                </div>
                                <div className="rounded-md bg-gray-50 p-3">
                                    <span className="text-gray-400 font-medium">Registration Date</span>
                                    <div className="font-bold text-gray-900 mt-0.5">{viewingUser.createdAt}</div>
                                </div>
                                <div className="rounded-md bg-gray-50 p-3">
                                    <span className="text-gray-400 font-medium">Last Login Activity</span>
                                    <div className="font-bold text-gray-900 mt-0.5">{viewingUser.lastActive}</div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 shrink-0">
                                    Module Access Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs overflow-y-auto max-h-[220px] flex-1">
                                    {viewingUser.permissions.map((p) => (
                                        <div
                                            key={p.module}
                                            className={`flex items-center justify-between p-2.5 rounded-md border ${
                                                p.read || p.write || p.admin
                                                    ? "border-green-200 bg-green-50/40 text-green-900"
                                                    : "border-gray-100 bg-gray-50 text-gray-400"
                                            }`}
                                        >
                                            <span className="font-semibold">{p.module}</span>
                                            <span className="font-mono text-xs font-bold">
                                                {p.admin ? "ADMIN" : p.write ? "READ/WRITE" : p.read ? "READ ONLY" : "NONE"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end border-t border-gray-100 pt-3 mt-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewingUser(null)}
                                    className="px-4 py-2.5 rounded-md bg-[#0a2a5e] text-sm font-semibold text-white hover:bg-[#06124f] transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
