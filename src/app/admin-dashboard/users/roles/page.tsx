"use client";

import { useEffect, useMemo, useState } from "react";

type RoleStatus = "Active" | "Growing" | "On Hold" | "Planned" | "Inactive";

type Role = {
    id: number;
    department: string;
    name: string;
    status: RoleStatus;
};

type RoleApiRow = {
    id: number;
    department: string;
    name: string;
    status: RoleStatus;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type DepartmentApiRow = {
    id: number;
    name: string;
};

const initialRoles: Role[] = [
    { id: 1, department: "Sales", name: "Sales Manager", status: "Active" },
    { id: 2, department: "HR", name: "HR Executive", status: "Active" },
    { id: 3, department: "IT", name: "Tech Lead", status: "Growing" },
];

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formValues, setFormValues] = useState({
        department: "",
        name: "",
        status: "Active" as RoleStatus,
        description: "",
    });

    useEffect(() => {
        const fetchRolesAndDepartments = async () => {
            try {
                setLoadError("");
                const [rolesResponse, departmentsResponse] = await Promise.all([
                    fetch("/api/admin/roles", { cache: "no-store" }),
                    fetch("/api/admin/departments", { cache: "no-store" }),
                ]);

                if (!rolesResponse.ok) {
                    throw new Error("Failed to fetch roles");
                }

                const rows: RoleApiRow[] = await rolesResponse.json();
                setRoles(
                    rows.map((row) => ({
                        id: row.id,
                        department: row.department || "General",
                        name: row.name,
                        status: row.status,
                    }))
                );

                if (departmentsResponse.ok) {
                    const departmentRows: DepartmentApiRow[] = await departmentsResponse.json();
                    const options = departmentRows.map((department) => ({
                        id: department.id,
                        name: department.name,
                    }));
                    setDepartments(options);
                } else {
                    const fallbackNames = Array.from(new Set(rows.map((role) => role.department).filter(Boolean)));
                    setDepartments(
                        fallbackNames.map((name, index) => ({
                            id: index + 1,
                            name,
                        }))
                    );
                }
            } catch (error) {
                console.error("Error loading roles:", error);
                setLoadError("Unable to load roles from database. Showing sample data.");
                setRoles(initialRoles);
                const fallbackNames = Array.from(new Set(initialRoles.map((role) => role.department)));
                setDepartments(
                    fallbackNames.map((name, index) => ({
                        id: index + 1,
                        name,
                    }))
                );
            } finally {
                setIsLoading(false);
                setIsDepartmentsLoading(false);
            }
        };

        fetchRolesAndDepartments();
    }, []);

    const roleStats = useMemo(() => {
        const total = roles.length;
        const activeCount = roles.filter((role) => role.status === "Active").length;
        const holdCount = roles.filter((role) => role.status === "On Hold").length;
        const plannedCount = roles.filter((role) => role.status === "Planned").length;

        return [
            { label: "Total Roles", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Active Roles", value: String(activeCount), tone: "text-green-600" },
            { label: "On Hold Roles", value: String(holdCount), tone: "text-amber-600" },
            { label: "Planned Roles", value: String(plannedCount), tone: "text-purple-600" },
        ];
    }, [roles]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormValues({
            department: "",
            name: "",
            status: "Active",
            description: "",
        });
    };

    const getStatusStyles = (status: RoleStatus) => {
        if (status === "Active") return "bg-green-50 text-green-700";
        if (status === "Growing") return "bg-blue-50 text-blue-700";
        if (status === "On Hold") return "bg-amber-50 text-amber-700";
        if (status === "Planned") return "bg-purple-50 text-purple-700";
        return "bg-gray-100 text-gray-700";
    };

    const handleAddRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const payload = {
            department: formValues.department.trim(),
            name: formValues.name.trim(),
            status: formValues.status,
            notes: formValues.description.trim(),
        };

        try {
            setIsSubmitting(true);
            const response = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to save role");
            }

            const created: RoleApiRow = await response.json();
            setRoles((prev) => [
                ...prev,
                {
                    id: created.id,
                    department: created.department || "General",
                    name: created.name,
                    status: created.status,
                },
            ]);
            setIsAddModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error creating role:", error);
            alert("Unable to save role right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Roles</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage roles by department and track role status.</p>
                    {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
                </div>
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Role
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {roleStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Roles Directory</h2>
                    <div className="text-xs text-gray-500">Showing {roles.length} roles</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={3}>
                                        Loading roles...
                                    </td>
                                </tr>
                            )}
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-700">{role.department}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{role.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(role.status)}`}>
                                            {role.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            setIsAddModalOpen(false);
                            resetForm();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-role-title"
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] flex items-start justify-between gap-4 shrink-0">
                            <div className="min-w-0">
                                <h3 id="add-role-title" className="text-lg font-bold text-white">
                                    Add Role
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">First select department, then enter role name and status.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    resetForm();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddRole} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <div>
                                <label htmlFor="role-department" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department
                                </label>
                                <select
                                    id="role-department"
                                    name="department"
                                    value={formValues.department}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isDepartmentsLoading || isSubmitting}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="">
                                        {isDepartmentsLoading ? "Loading departments..." : "Select department"}
                                    </option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.name}>
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="role-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Role name
                                </label>
                                <input
                                    id="role-name"
                                    name="name"
                                    value={formValues.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="e.g. Account Manager"
                                />
                            </div>

                            <div>
                                <label htmlFor="role-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <select
                                    id="role-status"
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Growing">Growing</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Planned">Planned</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="role-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Notes <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    id="role-description"
                                    name="description"
                                    rows={3}
                                    value={formValues.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] resize-none"
                                    placeholder="Role scope, permissions, and special instructions…"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 -mx-6 px-6 -mb-2 pb-0 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        resetForm();
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    {isSubmitting ? "Saving..." : "Create role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
