"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";

type RoleStatus = "Active" | "Growing" | "On Hold" | "Planned" | "Inactive";

type Role = {
    id: number;
    department: string;
    name: string;
    status: RoleStatus;
};

type RoleDetail = Role & { notes: string };

type RoleModalMode = "add" | "edit" | "view" | null;

type RowActionBusy = { id: number; kind: "view" | "edit" | "delete" } | null;

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

function mapApiRowToRole(row: RoleApiRow): Role {
    return {
        id: row.id,
        department: row.department || "General",
        name: row.name,
        status: row.status,
    };
}

function RoleStatusViewBadge({ status }: { status: RoleStatus }) {
    const isActive = status === "Active";
    const isGrowing = status === "Growing";
    const isOnHold = status === "On Hold";
    const isPlanned = status === "Planned";
    const tone = isActive
        ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
        : isGrowing
          ? "bg-blue-50 text-blue-800 ring-1 ring-blue-600/15"
          : isOnHold
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15"
            : isPlanned
              ? "bg-purple-50 text-purple-800 ring-1 ring-purple-600/15"
              : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {isActive ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {status}
        </span>
    );
}

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [roleModalMode, setRoleModalMode] = useState<RoleModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<RoleDetail | null>(null);
    const [actionBusy, setActionBusy] = useState<RowActionBusy>(null);
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
                setRoles(rows.map(mapApiRowToRole));

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
                        })),
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
                    })),
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
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
        setEditingId(null);
    };

    const closeRoleModal = () => {
        setRoleModalMode(null);
        setViewDetail(null);
        resetForm();
    };

    const openAddModal = () => {
        resetForm();
        setRoleModalMode("add");
    };

    const loadRoleDetail = async (id: number, kind: "view" | "edit") => {
        try {
            setActionBusy({ id, kind });
            const response = await fetch(`/api/admin/roles/${id}`, { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load");
            }
            const row = data as RoleApiRow & { notes?: string | null };
            const detail: RoleDetail = {
                ...mapApiRowToRole(row),
                notes: typeof row.notes === "string" ? row.notes : "",
            };
            if (kind === "view") {
                setViewDetail(detail);
                setRoleModalMode("view");
            } else {
                setFormValues({
                    department: detail.department,
                    name: detail.name,
                    status: detail.status,
                    description: detail.notes,
                });
                setEditingId(id);
                setRoleModalMode("edit");
            }
        } catch (error) {
            console.error("Error loading role:", error);
            alert(kind === "view" ? "Could not load role details." : "Could not load role for editing.");
        } finally {
            setActionBusy(null);
        }
    };

    const openViewRole = (r: Role) => {
        void loadRoleDetail(r.id, "view");
    };

    const openEditRole = (r: Role) => {
        void loadRoleDetail(r.id, "edit");
    };

    const handleDeleteRole = async (r: Role) => {
        const ok = window.confirm(`Delete role "${r.name}" (${r.department})? This cannot be undone.`);
        if (!ok) return;

        try {
            setActionBusy({ id: r.id, kind: "delete" });
            const response = await fetch(`/api/admin/roles/${r.id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setRoles((prev) => prev.filter((x) => x.id !== r.id));
        } catch (error) {
            console.error("Error deleting role:", error);
            alert("Unable to delete this role. Please try again.");
        } finally {
            setActionBusy(null);
        }
    };

    const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const payload = {
            department: formValues.department.trim(),
            name: formValues.name.trim(),
            status: formValues.status,
            notes: formValues.description.trim(),
        };

        try {
            setIsSubmitting(true);
            const isEdit = editingId !== null;
            const response = await fetch(isEdit ? `/api/admin/roles/${editingId}` : "/api/admin/roles", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to save role");
            }

            const saved: RoleApiRow = await response.json();
            const mapped = mapApiRowToRole(saved);
            if (isEdit) {
                setRoles((prev) => prev.map((x) => (x.id === mapped.id ? mapped : x)));
            } else {
                setRoles((prev) => [...prev, mapped]);
            }
            closeRoleModal();
        } catch (error) {
            console.error("Error saving role:", error);
            alert("Unable to save role right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: RoleStatus) => {
        if (status === "Active") return "bg-green-50 text-green-700";
        if (status === "Growing") return "bg-blue-50 text-blue-700";
        if (status === "On Hold") return "bg-amber-50 text-amber-700";
        if (status === "Planned") return "bg-purple-50 text-purple-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Role directory</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage designations by department, status, and notes—aligned with your HRMS structure.
                    </p>
                    {loadError && <p className="mt-2 text-xs text-amber-600">{loadError}</p>}
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Add Role
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {roleStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-6">
                    <p className="text-sm font-semibold text-gray-900">Role roster</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading ? "Loading…" : `Showing ${roles.length} role(s).`}
                    </p>
                </div>

                <div className="overflow-x-auto p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                                        Loading roles…
                                    </td>
                                </tr>
                            )}
                            {!isLoading && roles.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                                        No roles yet. Add one with the button above.
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                roles.map((role) => (
                                    <tr key={role.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">{role.department}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{role.name}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(role.status)}`}
                                            >
                                                {role.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewRole(role)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View role"
                                                    aria-label="View role"
                                                >
                                                    {actionBusy?.id === role.id && actionBusy.kind === "view" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditRole(role)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit role"
                                                    aria-label="Edit role"
                                                >
                                                    {actionBusy?.id === role.id && actionBusy.kind === "edit" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Pencil className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteRole(role)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete role"
                                                    aria-label="Delete role"
                                                >
                                                    {actionBusy?.id === role.id && actionBusy.kind === "delete" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {roleModalMode === "view" && viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden onClick={closeRoleModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="role-view-title"
                        className="relative flex max-h-[min(90vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="role-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Role details
                            </h3>
                            <button
                                type="button"
                                onClick={closeRoleModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Department</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.department}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <RoleStatusViewBadge status={viewDetail.status} />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Role name</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Notes</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-gray-900">
                                        {viewDetail.notes.trim() || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeRoleModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(roleModalMode === "add" || roleModalMode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeRoleModal();
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
                                    {roleModalMode === "edit" ? "Edit role" : "Add Role"}
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">
                                    {roleModalMode === "edit"
                                        ? "Update role details and save changes."
                                        : "First select department, then enter role name and status."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeRoleModal();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveRole} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
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
                                        if (!isSubmitting) closeRoleModal();
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
                                    {isSubmitting
                                        ? "Saving..."
                                        : roleModalMode === "edit"
                                          ? "Save changes"
                                          : "Create role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
