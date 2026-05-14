"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";

type DepartmentStatus = "Active" | "Growing" | "On Hold" | "Planned" | "Inactive";

type Department = {
    id: number;
    name: string;
    head: string;
    employees: number;
    status: DepartmentStatus;
    budgetAmount: number;
};

type DepartmentDetail = Department & { notes: string };

type DeptModalMode = "add" | "edit" | "view" | null;

type RowActionBusy = { id: number; kind: "view" | "edit" | "delete" } | null;

const initialDepartments: Department[] = [
    { id: 1, name: "Sales", head: "Rahul Sharma", employees: 12, status: "Active", budgetAmount: 0 },
    { id: 2, name: "IT", head: "Amit Kumar", employees: 10, status: "Active", budgetAmount: 0 },
    { id: 3, name: "HR", head: "Priya Patel", employees: 6, status: "Active", budgetAmount: 0 },
    { id: 4, name: "Marketing", head: "Sneha Joshi", employees: 8, status: "Active", budgetAmount: 0 },
    { id: 5, name: "Finance", head: "Vikram Singh", employees: 7, status: "Active", budgetAmount: 0 },
    { id: 6, name: "Operations", head: "Neha Verma", employees: 5, status: "Growing", budgetAmount: 0 },
];

type DepartmentApiRow = {
    id: number;
    name: string;
    head: string;
    employees: number;
    status: DepartmentStatus;
    budget_amount: number;
};

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatBudgetShort(total: number) {
    if (total >= 100_000) {
        const lakhs = total / 100_000;
        const rounded = Math.round(lakhs * 100) / 100;
        return `₹${rounded}L`;
    }
    return formatINR(total);
}

function mapApiRowToDepartment(row: DepartmentApiRow): Department {
    return {
        id: row.id,
        name: row.name,
        head: row.head,
        employees: Number(row.employees) || 0,
        status: row.status,
        budgetAmount: Number(row.budget_amount) || 0,
    };
}

function DepartmentStatusViewBadge({ status }: { status: DepartmentStatus }) {
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

export default function DepartmentPage() {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [deptModalMode, setDeptModalMode] = useState<DeptModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<DepartmentDetail | null>(null);
    const [actionBusy, setActionBusy] = useState<RowActionBusy>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formValues, setFormValues] = useState({
        name: "",
        head: "",
        employees: "",
        status: "Active" as DepartmentStatus,
        description: "",
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoadError("");
                const response = await fetch("/api/admin/departments", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Failed to fetch department data");
                }

                const rows: DepartmentApiRow[] = await response.json();
                const mapped = rows.map(mapApiRowToDepartment);
                setDepartments(mapped);
            } catch (error) {
                console.error("Error loading departments:", error);
                setLoadError("Unable to load departments from database. Showing sample data.");
                setDepartments(initialDepartments);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    const departmentStats = useMemo(() => {
        const total = departments.length;
        const totalMembers = departments.reduce((sum, d) => sum + d.employees, 0);
        const avg = total ? Math.round(totalMembers / total) : 0;
        const budgetTotal = departments.reduce((sum, d) => sum + d.budgetAmount, 0);
        return [
            { label: "Total Departments", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Total Team Members", value: String(totalMembers), tone: "text-[#06b6d4]" },
            { label: "Avg Team Size", value: String(avg), tone: "text-purple-600" },
            { label: "Monthly Budget", value: formatBudgetShort(budgetTotal), tone: "text-green-600" },
        ];
    }, [departments]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormValues({
            name: "",
            head: "",
            employees: "",
            status: "Active",
            description: "",
        });
        setEditingId(null);
    };

    const closeDeptModal = () => {
        setDeptModalMode(null);
        setViewDetail(null);
        resetForm();
    };

    const openAddModal = () => {
        resetForm();
        setDeptModalMode("add");
    };

    const loadDepartmentDetail = async (id: number, kind: "view" | "edit") => {
        try {
            setActionBusy({ id, kind });
            const response = await fetch(`/api/admin/departments/${id}`, { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load");
            }
            const row = data as DepartmentApiRow & { notes?: string | null };
            const detail: DepartmentDetail = {
                ...mapApiRowToDepartment(row),
                notes: typeof row.notes === "string" ? row.notes : "",
            };
            if (kind === "view") {
                setViewDetail(detail);
                setDeptModalMode("view");
            } else {
                setFormValues({
                    name: detail.name,
                    head: detail.head,
                    employees: String(detail.employees),
                    status: detail.status,
                    description: detail.notes,
                });
                setEditingId(id);
                setDeptModalMode("edit");
            }
        } catch (error) {
            console.error("Error loading department:", error);
            alert(kind === "view" ? "Could not load department details." : "Could not load department for editing.");
        } finally {
            setActionBusy(null);
        }
    };

    const openViewDepartment = (d: Department) => {
        void loadDepartmentDetail(d.id, "view");
    };

    const openEditDepartment = (d: Department) => {
        void loadDepartmentDetail(d.id, "edit");
    };

    const handleDeleteDepartment = async (d: Department) => {
        const ok = window.confirm(`Delete department “${d.name}”? This cannot be undone.`);
        if (!ok) return;

        try {
            setActionBusy({ id: d.id, kind: "delete" });
            const response = await fetch(`/api/admin/departments/${d.id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setDepartments((prev) => prev.filter((x) => x.id !== d.id));
        } catch (error) {
            console.error("Error deleting department:", error);
            alert("Unable to delete this department. Please try again.");
        } finally {
            setActionBusy(null);
        }
    };

    const handleSaveDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const employees = Math.max(0, parseInt(formValues.employees, 10) || 0);
        const payload = {
            name: formValues.name.trim(),
            head: formValues.head.trim(),
            employees,
            status: formValues.status,
            notes: formValues.description.trim(),
        };

        try {
            setIsSubmitting(true);
            const isEdit = editingId !== null;
            const response = await fetch(
                isEdit ? `/api/admin/departments/${editingId}` : "/api/admin/departments",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to save department");
            }

            const saved: DepartmentApiRow = await response.json();
            const mapped = mapApiRowToDepartment(saved);
            if (isEdit) {
                setDepartments((prev) => prev.map((x) => (x.id === mapped.id ? mapped : x)));
            } else {
                setDepartments((prev) => [...prev, mapped]);
            }
            closeDeptModal();
        } catch (error) {
            console.error("Error saving department:", error);
            alert("Unable to save department right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: DepartmentStatus) => {
        if (status === "Active") return "bg-green-50 text-green-700";
        if (status === "Growing") return "bg-blue-50 text-blue-700";
        if (status === "On Hold") return "bg-amber-50 text-amber-700";
        if (status === "Planned") return "bg-purple-50 text-purple-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Departments</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of all departments, team heads and allocation.</p>
                    {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
                </div>
                <button
                    type="button"
                    onClick={openAddModal}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Department
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {departmentStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Department Directory</h2>
                    <div className="text-xs text-gray-500">Showing {departments.length} departments</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department Head</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employees</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={5}>
                                        Loading departments...
                                    </td>
                                </tr>
                            )}
                            {departments.map((department) => (
                                <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{department.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{department.head}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{department.employees}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(department.status)}`}
                                        >
                                            {department.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openViewDepartment(department)}
                                                disabled={actionBusy !== null || isSubmitting}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="View department"
                                                aria-label="View department"
                                            >
                                                {actionBusy?.id === department.id && actionBusy.kind === "view" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                ) : (
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditDepartment(department)}
                                                disabled={actionBusy !== null || isSubmitting}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Edit department"
                                                aria-label="Edit department"
                                            >
                                                {actionBusy?.id === department.id && actionBusy.kind === "edit" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                ) : (
                                                    <Pencil className="h-4 w-4" aria-hidden />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteDepartment(department)}
                                                disabled={actionBusy !== null || isSubmitting}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Delete department"
                                                aria-label="Delete department"
                                            >
                                                {actionBusy?.id === department.id && actionBusy.kind === "delete" ? (
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

            {deptModalMode === "view" && viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden onClick={closeDeptModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dept-view-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="dept-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Department details
                            </h3>
                            <button
                                type="button"
                                onClick={closeDeptModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Department name</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <DepartmentStatusViewBadge status={viewDetail.status} />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Department head</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.head}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Team size</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewDetail.employees}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Budget</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatINR(viewDetail.budgetAmount)}
                                    </p>
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
                                onClick={closeDeptModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(deptModalMode === "add" || deptModalMode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeDeptModal();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-dept-title"
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] flex items-start justify-between gap-4 shrink-0">
                            <div className="min-w-0">
                                <h3 id="add-dept-title" className="text-lg font-bold text-white">
                                    {deptModalMode === "edit" ? "Edit department" : "Add Department"}
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">
                                    {deptModalMode === "edit"
                                        ? "Update department details and save changes."
                                        : "Register a new department and department head."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeDeptModal();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveDepartment} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <div>
                                <label htmlFor="dept-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department name
                                </label>
                                <input
                                    id="dept-name"
                                    name="name"
                                    value={formValues.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="e.g. Product Engineering"
                                />
                            </div>

                            <div>
                                <label htmlFor="dept-head" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department head
                                </label>
                                <input
                                    id="dept-head"
                                    name="head"
                                    value={formValues.head}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="Full name of the lead"
                                />
                            </div>

                            <div>
                                <label htmlFor="dept-employees" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Team size
                                </label>
                                <input
                                    id="dept-employees"
                                    name="employees"
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={formValues.employees}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label htmlFor="dept-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <select
                                    id="dept-status"
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
                                <label htmlFor="dept-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Notes <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    id="dept-description"
                                    name="description"
                                    rows={3}
                                    value={formValues.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] resize-none"
                                    placeholder="Mission, focus areas, or onboarding context…"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 -mx-6 px-6 -mb-2 pb-0 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) closeDeptModal();
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
                                        : deptModalMode === "edit"
                                          ? "Save changes"
                                          : "Create department"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
