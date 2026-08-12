"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, Loader2, RotateCcw, Search, Trash2, X } from "lucide-react";
import Toast from "@/components/Toast";

type DeletedEmployeeApiRow = {
    id: number;
    employee_id: string;
    full_name: string;
    designation: string | null;
    department: string | null;
    official_email: string | null;
    employee_status: string;
    created_at: string;
    deleted_at: string | null;
};

type DeletedEmployeeRow = {
    recordId: number;
    employeeId: string;
    name: string;
    role: string;
    department: string;
    email: string;
    status: string;
    createdAt: string;
    deletedAt: string;
};

function mapDeletedEmployeeApiRow(row: DeletedEmployeeApiRow): DeletedEmployeeRow {
    return {
        recordId: row.id,
        employeeId: row.employee_id,
        name: row.full_name,
        role: row.designation ?? "",
        department: row.department ?? "",
        email: row.official_email ?? "",
        status: row.employee_status,
        createdAt: row.created_at,
        deletedAt: row.deleted_at ? new Date(row.deleted_at).toLocaleString() : "—",
    };
}

export default function DeleteEmployeePage() {
    const [employees, setEmployees] = useState<DeletedEmployeeRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionBusy, setActionBusy] = useState<{ recordId: number; kind: "view" | "restore" | "delete" } | null>(null);

    const [viewingEmployee, setViewingEmployee] = useState<Record<string, string> | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [restoreTarget, setRestoreTarget] = useState<DeletedEmployeeRow | null>(null);
    const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<DeletedEmployeeRow | null>(null);
    const [toastState, setToastState] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadDeletedEmployees = async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const response = await fetch("/api/admin/deleted-employees", { cache: "no-store" });
            if (!response.ok) {
                throw new Error("Failed to fetch deleted employees");
            }
            const rows: DeletedEmployeeApiRow[] = await response.json();
            const mapped = Array.isArray(rows) ? rows.map(mapDeletedEmployeeApiRow) : [];
            setEmployees(mapped);
        } catch (error) {
            console.error("Error loading deleted employees", error);
            setLoadError("Unable to load deleted employees.");
            setEmployees([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDeletedEmployees();
    }, []);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees;
        const q = searchQuery.toLowerCase().trim();
        return employees.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.employeeId.toLowerCase().includes(q) ||
                e.department.toLowerCase().includes(q) ||
                e.role.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q)
        );
    }, [employees, searchQuery]);

    const confirmRestoreEmployee = async (employee: DeletedEmployeeRow) => {
        try {
            setActionBusy({ recordId: employee.recordId, kind: "restore" });
            const response = await fetch(`/api/admin/deleted-employees/${employee.recordId}`, {
                method: "POST",
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Failed to restore");
            }
            setEmployees((prev) => prev.filter((e) => e.recordId !== employee.recordId));
            setRestoreTarget(null);
            setToastState({ message: `Employee ${employee.employeeId} restored successfully!`, type: "success" });
        } catch (error) {
            console.error("Restore error:", error);
            const msg = error instanceof Error ? error.message : "Unable to restore employee right now.";
            setToastState({ message: msg, type: "error" });
        } finally {
            setActionBusy(null);
        }
    };

    const confirmPermanentDeleteEmployee = async (employee: DeletedEmployeeRow) => {
        try {
            setActionBusy({ recordId: employee.recordId, kind: "delete" });
            const response = await fetch(`/api/admin/deleted-employees/${employee.recordId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Failed to delete");
            }
            setEmployees((prev) => prev.filter((e) => e.recordId !== employee.recordId));
            setPermanentDeleteTarget(null);
            setToastState({ message: `Employee ${employee.employeeId} permanently deleted.`, type: "success" });
        } catch (error) {
            console.error("Permanent delete error:", error);
            const msg = error instanceof Error ? error.message : "Unable to delete employee permanently.";
            setToastState({ message: msg, type: "error" });
        } finally {
            setActionBusy(null);
        }
    };

    const handleViewEmployeeDetails = async (employee: DeletedEmployeeRow) => {
        try {
            setActionBusy({ recordId: employee.recordId, kind: "view" });
            const response = await fetch(`/api/admin/employees/${employee.recordId}`, { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to fetch details");
            }
            setViewingEmployee(data as Record<string, string>);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Error viewing employee details:", error);
            setToastState({ message: "Could not load employee details.", type: "error" });
        } finally {
            setActionBusy(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Archived Employee Directory</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View archived employees, inspect details, restore them to active roster, or permanently delete.
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search archived employees…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20 transition-colors"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Archived Employees</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">{employees.length}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Resigned Status</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                        {employees.filter((e) => e.status === "Resigned").length}
                    </p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Recoverable Records</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{employees.length}</p>
                </div>
            </div>

            {loadError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {loadError}
                </div>
            )}

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-6">
                    <p className="text-sm font-semibold text-gray-900">Archived Employee Records</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading ? "Loading…" : `Showing ${filteredEmployees.length} archived record(s).`}
                    </p>
                </div>

                <div className="overflow-x-auto p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Employee ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Deleted At
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={6}>
                                        Loading archived employees…
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredEmployees.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={6}>
                                        No archived employees found.
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.recordId} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{employee.employeeId}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{employee.role || "—"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{employee.department || "—"}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    employee.status === "Resigned"
                                                        ? "bg-rose-50 text-rose-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{employee.deletedAt}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleViewEmployeeDetails(employee)}
                                                    disabled={actionBusy !== null}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                                                    title="View details"
                                                >
                                                    {actionBusy?.recordId === employee.recordId &&
                                                    actionBusy.kind === "view" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setRestoreTarget(employee)}
                                                    disabled={actionBusy !== null}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700 shadow-sm transition hover:bg-green-100 disabled:opacity-50"
                                                    title="Recover employee"
                                                    aria-label="Recover employee"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPermanentDeleteTarget(employee)}
                                                    disabled={actionBusy !== null}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                                                    title="Permanent Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {restoreTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-md p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Restore Employee?</h3>
                                <p className="text-xs text-gray-500">ID: {restoreTarget.employeeId}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            Are you sure you want to restore <span className="font-semibold text-gray-900">{restoreTarget.name || restoreTarget.employeeId}</span>?
                            They will be moved back to the active employee list and their access, salary setup, and shift assignments will be reactivated.
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setRestoreTarget(null)}
                                disabled={actionBusy !== null}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmRestoreEmployee(restoreTarget)}
                                disabled={actionBusy !== null}
                                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {actionBusy?.kind === "restore" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RotateCcw className="h-4 w-4" />
                                )}
                                <span>Confirm Restore</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {permanentDeleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-md p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Permanently Delete?</h3>
                                <p className="text-xs text-gray-500">ID: {permanentDeleteTarget.employeeId}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            Are you sure you want to PERMANENTLY delete <span className="font-semibold text-gray-900">{permanentDeleteTarget.name || permanentDeleteTarget.employeeId}</span>?
                            This action <strong className="text-red-600">cannot be undone</strong> and will erase all database records.
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPermanentDeleteTarget(null)}
                                disabled={actionBusy !== null}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmPermanentDeleteEmployee(permanentDeleteTarget)}
                                disabled={actionBusy !== null}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {actionBusy?.kind === "delete" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                <span>Delete Permanently</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Read-only Employee Detail Modal */}
            {isViewModalOpen && viewingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        onClick={() => setIsViewModalOpen(false)}
                    />
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {viewingEmployee.fullName || viewingEmployee.employeeId}
                                </h2>
                                <p className="text-xs text-gray-500">ID: {viewingEmployee.employeeId}</p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {Object.entries(viewingEmployee).map(([key, val]) => (
                                <div key={key} className="rounded-md border border-gray-100 p-3 bg-gray-50/50">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {key.replace(/([A-Z])/g, " $1")}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-800">{val || "—"}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                />
            )}
        </div>
    );
}
