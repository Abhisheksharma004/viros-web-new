"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";

type EmployeeAccessStatus = "Active" | "On Leave" | "Probation" | "Inactive" | "Resigned";
type PortalStatus = "Active" | "Disabled" | "Inactive";

type EmployeeAccess = {
    id: number;
    employeeId: string;
    fullName: string;
    role: string;
    department: string;
    email: string;
    employeeStatus: EmployeeAccessStatus | string;
    portalStatus: PortalStatus | string;
    createdAt: string;
};

type EmployeeAccessApiRow = Partial<{
    id: number;
    employee_id: string;
    full_name: string;
    designation: string | null;
    department: string | null;
    official_email: string | null;
    employee_status: string | null;
    portal_status: string | null;
    created_at: string | null;
}>;

type RowActionBusy = { id: number; kind: "view" | "edit" | "delete" } | null;
type AccessModalMode = "add" | "edit" | "view" | null;

type EmployeeLookupRow = {
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    official_email: string;
    employee_status?: string;
};

function mapApiRowToEmployeeAccess(row: EmployeeAccessApiRow): EmployeeAccess {
    const id = typeof row.id === "number" ? row.id : 0;
    const employeeId = typeof row.employee_id === "string" ? row.employee_id : "";
    const fullName = typeof row.full_name === "string" ? row.full_name : "";
    const role = typeof row.designation === "string" ? row.designation : "";
    const department = typeof row.department === "string" ? row.department : "";
    const email = typeof row.official_email === "string" ? row.official_email : "";
    const employeeStatus = typeof row.employee_status === "string" ? row.employee_status : "Inactive";
    const portalStatus = typeof row.portal_status === "string" ? row.portal_status : "Inactive";
    const createdAt = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();

    return {
        id,
        employeeId,
        fullName,
        role,
        department,
        email,
        employeeStatus,
        portalStatus,
        createdAt,
    };
}

function EmployeeStatusBadge({ status }: { status: EmployeeAccess["employeeStatus"] }) {
    const s = (status ?? "").toString().trim();
    const tone =
        s === "Active"
            ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
            : s === "On Leave"
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15"
              : s === "Probation"
                ? "bg-blue-50 text-blue-800 ring-1 ring-blue-600/15"
                : s === "Inactive" || s === "Resigned"
                  ? "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                  : "bg-blue-50 text-blue-800 ring-1 ring-blue-600/15";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {s === "Active" ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {s || "—"}
        </span>
    );
}

function PortalStatusBadge({ status }: { status: EmployeeAccess["portalStatus"] }) {
    const s = (status ?? "").toString().trim();
    const tone =
        s === "Active"
            ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
            : s === "Disabled"
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15"
              : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {s === "Active" ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {s || "—"}
        </span>
    );
}

export default function EmployeeAccessPage() {
    const [accessRecords, setAccessRecords] = useState<EmployeeAccess[]>([]);
    const [accessModalMode, setAccessModalMode] = useState<AccessModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<EmployeeAccess | null>(null);
    const [actionBusy, setActionBusy] = useState<RowActionBusy>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isLookingUpEmployee, setIsLookingUpEmployee] = useState(false);
    const [employeeLookupHint, setEmployeeLookupHint] = useState("");
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [formValues, setFormValues] = useState({
        employeeId: "",
        fullName: "",
        department: "",
        role: "",
        email: "",
        password: "",
        portalStatus: "Active" as PortalStatus | string,
    });

    const accessStats = useMemo(() => {
        const total = accessRecords.length;
        const activeCount = accessRecords.filter((r) => r.portalStatus === "Active").length;
        const inactiveCount = accessRecords.filter((r) => r.portalStatus === "Inactive" || r.portalStatus === "Disabled").length;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = accessRecords.filter((r) => {
            const d = new Date(r.createdAt);
            return !Number.isNaN(d.getTime()) && d >= startOfMonth;
        }).length;

        return [
            { label: "Total Access", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Active", value: String(activeCount), tone: "text-green-600" },
            { label: "Inactive", value: String(inactiveCount), tone: "text-gray-600" },
            { label: "New This Month", value: String(newThisMonth), tone: "text-[#06b6d4]" },
        ];
    }, [accessRecords]);

    useEffect(() => {
        let active = true;

        const loadAll = async () => {
            setIsLoading(true);
            setLoadError("");

            try {
                const accessResp = await fetch("/api/admin/employee-access", { cache: "no-store" }).catch(() => null);

                if (!accessResp?.ok) {
                    const errBody = await accessResp?.json().catch(() => ({}));
                    const msg =
                        typeof errBody?.message === "string"
                            ? errBody.message
                            : "Failed to load employee access";
                    throw new Error(msg);
                }

                const rows: EmployeeAccessApiRow[] = await accessResp.json();
                const mapped = Array.isArray(rows) ? rows.map(mapApiRowToEmployeeAccess).filter((r) => r.id) : [];
                if (active) setAccessRecords(mapped);
            } catch (error) {
                console.error("Error loading employee-access:", error);
                if (active) {
                    const message = error instanceof Error ? error.message : "Failed to load employee access";
                    setLoadError(message);
                    setAccessRecords([]);
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadAll();
        return () => {
            active = false;
        };
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        if (lookupTimerRef.current) {
            clearTimeout(lookupTimerRef.current);
            lookupTimerRef.current = null;
        }
        setFormValues({
            employeeId: "",
            fullName: "",
            department: "",
            role: "",
            email: "",
            password: "",
            portalStatus: "Active",
        });
        setEditingId(null);
        setIsLookingUpEmployee(false);
        setEmployeeLookupHint("");
        setShowEmployeeDetails(false);
    };

    const lookupEmployeeById = useCallback(async (employeeId: string) => {
        const trimmed = employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            return;
        }

        try {
            setIsLookingUpEmployee(true);
            setEmployeeLookupHint("");

            const resp = await fetch(
                `/api/admin/employees/lookup?employee_id=${encodeURIComponent(trimmed)}`,
                { cache: "no-store" },
            );

            if (!resp.ok) {
                if (resp.status === 404) {
                    setShowEmployeeDetails(false);
                    setEmployeeLookupHint("No employee found with this ID.");
                    setFormValues((prev) => ({
                        ...prev,
                        fullName: "",
                        department: "",
                        role: "",
                        email: "",
                    }));
                    return;
                }
                const data = await resp.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Lookup failed");
            }

            const data: EmployeeLookupRow = await resp.json();
            setShowEmployeeDetails(true);
            setEmployeeLookupHint("Employee details loaded.");
            setFormValues((prev) => ({
                ...prev,
                fullName: data.full_name ?? "",
                department: data.department ?? "",
                role: data.designation ?? "",
                email: data.official_email ?? "",
            }));
        } catch (error) {
            console.error("Employee lookup failed:", error);
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("Could not load employee details. Try again.");
        } finally {
            setIsLookingUpEmployee(false);
        }
    }, []);

    useEffect(() => {
        if (accessModalMode !== "add") return;

        const trimmed = formValues.employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            return;
        }

        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = setTimeout(() => {
            void lookupEmployeeById(trimmed);
        }, 500);

        return () => {
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
    }, [formValues.employeeId, accessModalMode, lookupEmployeeById]);

    const closeAccessModal = () => {
        setAccessModalMode(null);
        setViewDetail(null);
        resetForm();
    };

    const openAddModal = () => {
        resetForm();
        setAccessModalMode("add");
    };

    const openViewOrEdit = async (record: EmployeeAccess, kind: "view" | "edit") => {
        setActionBusy({ id: record.id, kind: kind === "view" ? "view" : "edit" });

        try {
            let detail: EmployeeAccess = { ...record };

            const resp = await fetch(`/api/admin/employee-access/${record.id}`, { cache: "no-store" }).catch(
                () => null,
            );
            if (resp?.ok) {
                const data: EmployeeAccessApiRow = await resp.json();
                detail = mapApiRowToEmployeeAccess(data);
            }

            if (kind === "view") {
                setViewDetail(detail);
                setAccessModalMode("view");
            } else {
                setFormValues({
                    employeeId: detail.employeeId,
                    fullName: detail.fullName,
                    department: detail.department,
                    role: detail.role,
                    email: detail.email,
                    password: "",
                    portalStatus: detail.portalStatus,
                });
                setShowEmployeeDetails(true);
                setEmployeeLookupHint("");
                setEditingId(detail.id);
                setAccessModalMode("edit");
            }
        } catch (error) {
            console.error("Error loading employee-access detail:", error);
            alert(kind === "view" ? "Could not load access details." : "Could not load access for editing.");
        } finally {
            setActionBusy(null);
        }
    };

    const handleDelete = async (record: EmployeeAccess) => {
        const ok = window.confirm(`Delete access for "${record.fullName}"? This cannot be undone.`);
        if (!ok) return;

        try {
            setActionBusy({ id: record.id, kind: "delete" });
            const resp = await fetch(`/api/admin/employee-access/${record.id}`, { method: "DELETE" });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setAccessRecords((prev) => prev.filter((x) => x.id !== record.id));
        } catch (error) {
            console.error("Error deleting employee-access:", error);
            alert("Unable to delete this access record. Please try again.");
        } finally {
            setActionBusy(null);
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isEdit = editingId !== null;
        if (!isEdit && !formValues.password.trim()) {
            alert("Password is required.");
            return;
        }

        const payload: Record<string, string> = {
            employee_id: formValues.employeeId.trim(),
            full_name: formValues.fullName.trim(),
            department: formValues.department,
            designation: formValues.role,
            official_email: formValues.email.trim(),
            portal_status: formValues.portalStatus,
        };

        if (formValues.password.trim()) {
            payload.password = formValues.password;
        }

        try {
            setIsSubmitting(true);

            const resp = await fetch(
                isEdit ? `/api/admin/employee-access/${editingId}` : "/api/admin/employee-access",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Failed to save employee access");
            }

            const saved: EmployeeAccessApiRow = await resp.json();
            const mapped = mapApiRowToEmployeeAccess(saved);

            if (isEdit) {
                setAccessRecords((prev) => prev.map((x) => (x.id === mapped.id ? mapped : x)));
            } else {
                setAccessRecords((prev) => [mapped, ...prev]);
            }

            closeAccessModal();
        } catch (error) {
            console.error("Error saving employee-access:", error);
            alert(error instanceof Error ? error.message : "Unable to save employee access right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Employee Access</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Assign login access to employees with role, department, and credentials.
                    </p>
                    {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Access
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {accessStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Employee Access Directory</h2>
                    <div className="text-xs text-gray-500">Showing {accessRecords.length} records</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Employee Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Portal Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                                        Loading employee access…
                                    </td>
                                </tr>
                            )}

                            {!isLoading && accessRecords.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                                        {loadError || "No employee access records yet. Add access to get started."}
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                accessRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="min-w-[180px]">
                                                <p className="text-sm font-semibold text-gray-900 break-words">{record.fullName}</p>
                                                <p className="text-xs text-gray-500 break-words">{record.employeeId}</p>
                                                <p className="text-xs text-gray-500 break-words">{record.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{record.department}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{record.role}</td>
                                        <td className="px-6 py-4">
                                            <EmployeeStatusBadge status={record.employeeStatus} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <PortalStatusBadge status={record.portalStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => void openViewOrEdit(record, "view")}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View access"
                                                    aria-label="View access"
                                                >
                                                    {actionBusy?.id === record.id && actionBusy.kind === "view" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => void openViewOrEdit(record, "edit")}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit access"
                                                    aria-label="Edit access"
                                                >
                                                    {actionBusy?.id === record.id && actionBusy.kind === "edit" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Pencil className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => void handleDelete(record)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete access"
                                                    aria-label="Delete access"
                                                >
                                                    {actionBusy?.id === record.id && actionBusy.kind === "delete" ? (
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

            {accessModalMode === "view" && viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeAccessModal}
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-access-view-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="employee-access-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Employee access details
                            </h3>
                            <button
                                type="button"
                                onClick={closeAccessModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Employee ID</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.employeeId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Email</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.email}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Employee</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Department</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.department}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Role</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.role}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Employee status</p>
                                    <div className="mt-1">
                                        <EmployeeStatusBadge status={viewDetail.employeeStatus} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Portal status</p>
                                    <div className="mt-1">
                                        <PortalStatusBadge status={viewDetail.portalStatus} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeAccessModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(accessModalMode === "add" || accessModalMode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeAccessModal();
                        }}
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-access-form-title"
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] flex items-start justify-between gap-4 shrink-0">
                            <div className="min-w-0">
                                <h3 id="employee-access-form-title" className="text-lg font-bold text-white">
                                    {accessModalMode === "edit" ? "Edit access" : "Add Employee Access"}
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">
                                    {accessModalMode === "edit"
                                        ? "Update employee details and credentials."
                                        : "Register an employee with login credentials, role and status."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeAccessModal();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <div>
                                <label htmlFor="ea-employee-id" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Employee ID
                                </label>
                                <div className="relative">
                                    <input
                                        id="ea-employee-id"
                                        name="employeeId"
                                        value={formValues.employeeId}
                                        onChange={handleInputChange}
                                        onBlur={() => {
                                            if (accessModalMode === "add" && formValues.employeeId.trim()) {
                                                void lookupEmployeeById(formValues.employeeId);
                                            }
                                        }}
                                        required
                                        disabled={accessModalMode === "edit" || isLookingUpEmployee}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] disabled:cursor-not-allowed disabled:bg-gray-50 pr-10"
                                        placeholder="e.g. EMP-014"
                                    />
                                    {isLookingUpEmployee && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" aria-hidden />
                                    )}
                                </div>
                                {accessModalMode === "add" && employeeLookupHint && (
                                    <p
                                        className={`mt-1.5 text-xs ${
                                            employeeLookupHint.includes("loaded")
                                                ? "text-green-600"
                                                : "text-amber-600"
                                        }`}
                                    >
                                        {employeeLookupHint}
                                    </p>
                                )}
                            </div>

                            {(accessModalMode === "edit" || showEmployeeDetails) && (
                                <>
                                    <div>
                                        <label htmlFor="ea-full-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Full name
                                </label>
                                <input
                                    id="ea-full-name"
                                    name="fullName"
                                    value={formValues.fullName}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={accessModalMode === "add"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] read-only:bg-gray-50 read-only:cursor-default"
                                    placeholder="e.g. Priya Patel"
                                />
                            </div>

                            <div>
                                <label htmlFor="ea-department" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Department
                                </label>
                                <input
                                    id="ea-department"
                                    name="department"
                                    value={formValues.department}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={accessModalMode === "add"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] read-only:bg-gray-50 read-only:cursor-default"
                                    placeholder="Department"
                                />
                            </div>

                            <div>
                                <label htmlFor="ea-role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Role
                                </label>
                                <input
                                    id="ea-role"
                                    name="role"
                                    value={formValues.role}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={accessModalMode === "add"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] read-only:bg-gray-50 read-only:cursor-default"
                                    placeholder="Role"
                                />
                            </div>

                            <div>
                                <label htmlFor="ea-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Official email
                                </label>
                                <input
                                    id="ea-email"
                                    name="email"
                                    type="email"
                                    value={formValues.email}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={accessModalMode === "add"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] read-only:bg-gray-50 read-only:cursor-default"
                                    placeholder="e.g. employee@viros.com"
                                />
                            </div>
                                </>
                            )}

                            <div>
                                <label htmlFor="ea-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Password
                                    {accessModalMode === "edit" && (
                                        <span className="ml-1 font-normal text-gray-400">(leave blank to keep current)</span>
                                    )}
                                </label>
                                <input
                                    id="ea-password"
                                    name="password"
                                    type="password"
                                    value={formValues.password}
                                    onChange={handleInputChange}
                                    required={accessModalMode === "add"}
                                    autoComplete={accessModalMode === "add" ? "new-password" : "off"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder={accessModalMode === "edit" ? "Enter new password to change" : "Create a secure password"}
                                />
                            </div>

                            <div>
                                <label htmlFor="ea-portal-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Portal status
                                </label>
                                <select
                                    id="ea-portal-status"
                                    name="portalStatus"
                                    value={formValues.portalStatus}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Disabled">Disabled</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 -mx-6 px-6 -mb-2 pb-0 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) closeAccessModal();
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? "Saving..."
                                        : accessModalMode === "edit"
                                          ? "Save changes"
                                          : "Create access"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
