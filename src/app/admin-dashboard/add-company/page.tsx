"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";

type CompanyStatus = "Active" | "Inactive";

type Company = {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: CompanyStatus;
};

type CompanyModalMode = "add" | "edit" | "view" | null;

type CompanyApiRow = {
    id: number | string | null | undefined;
    company_name?: string | null;
    contact_person?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
};

function normalizeStatus(raw: string | undefined | null): CompanyStatus {
    return raw === "Inactive" ? "Inactive" : "Active";
}

function mapApiRowToCompany(row: CompanyApiRow): Company {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    return {
        id: Number.isFinite(id) ? id : 0,
        name: typeof row.company_name === "string" ? row.company_name : "",
        contactPerson: typeof row.contact_person === "string" ? row.contact_person : "",
        email: typeof row.email === "string" ? row.email : "",
        phone: typeof row.phone === "string" ? row.phone : "",
        status: normalizeStatus(row.status ?? undefined),
    };
}

function CompanyStatusViewBadge({ status }: { status: CompanyStatus }) {
    const isActive = status === "Active";
    const tone = isActive
        ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
        : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {isActive ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {status}
        </span>
    );
}

export default function AddCompanyPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [modalMode, setModalMode] = useState<CompanyModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<Company | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formValues, setFormValues] = useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        status: "Active" as CompanyStatus,
    });

    const companyStats = useMemo(() => {
        const total = companies.length;
        const active = companies.filter((c) => c.status === "Active").length;
        const inactive = companies.filter((c) => c.status === "Inactive").length;
        const withEmail = companies.filter((c) => c.email.trim().length > 0).length;
        return [
            { label: "Total Companies", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Active", value: String(active), tone: "text-[#06b6d4]" },
            { label: "Inactive", value: String(inactive), tone: "text-gray-700" },
            { label: "With email", value: String(withEmail), tone: "text-green-600" },
        ];
    }, [companies]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadError("");
                const res = await fetch("/api/admin/amc/companies", { cache: "no-store" });
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    const msg = typeof data?.message === "string" ? data.message : "Failed to load companies";
                    throw new Error(msg);
                }

                const rows = Array.isArray(data) ? (data as CompanyApiRow[]) : [];
                setCompanies(rows.map(mapApiRowToCompany));
            } catch (err) {
                console.error("Error loading companies:", err);
                const message = err instanceof Error ? err.message : "Failed to load companies";
                setLoadError(message);
                setCompanies([]);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormValues({
            name: "",
            contactPerson: "",
            email: "",
            phone: "",
            status: "Active",
        });
        setEditingId(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setViewDetail(null);
        resetForm();
    };

    const openAddModal = () => {
        resetForm();
        setModalMode("add");
    };

    const openViewCompany = (c: Company) => {
        setViewDetail(c);
        setModalMode("view");
    };

    const openEditCompany = (c: Company) => {
        setFormValues({
            name: c.name,
            contactPerson: c.contactPerson,
            email: c.email,
            phone: c.phone,
            status: c.status,
        });
        setEditingId(c.id);
        setModalMode("edit");
    };

    const handleDeleteCompany = async (c: Company) => {
        const ok = window.confirm(`Delete company “${c.name}”? This cannot be undone.`);
        if (!ok) return;

        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/admin/amc/companies/${c.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setCompanies((prev) => prev.filter((x) => x.id !== c.id));
            if (viewDetail?.id === c.id) closeModal();
        } catch (err) {
            console.error("Error deleting company:", err);
            alert("Unable to delete this company. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const name = formValues.name.trim();
        if (!name) {
            return;
        }

        const body = {
            company_name: name,
            contact_person: formValues.contactPerson.trim() || undefined,
            email: formValues.email.trim() || undefined,
            phone: formValues.phone.trim() || undefined,
            status: formValues.status,
        };

        setIsSubmitting(true);
        try {
            const isEdit = editingId !== null;
            const res = await fetch(
                isEdit ? `/api/admin/amc/companies/${editingId}` : "/api/admin/amc/companies",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }

            const saved = mapApiRowToCompany(data as CompanyApiRow);
            if (isEdit) {
                setCompanies((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
            } else {
                setCompanies((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (err) {
            console.error("Error saving company:", err);
            alert(err instanceof Error ? err.message : "Unable to save company. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: CompanyStatus) =>
        status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700";

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Register and manage vendor or customer companies for asset management.
                    </p>
                    {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
                </div>
                <button
                    type="button"
                    onClick={openAddModal}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Company
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {companyStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Company Directory</h2>
                    <div className="text-xs text-gray-500">Showing {companies.length} companies</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Contact person
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Status
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
                                        Loading companies...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && companies.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                                        {loadError || "No companies yet. Add a company to get started."}
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                companies.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {c.contactPerson.trim() ? c.contactPerson : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {c.phone.trim() ? c.phone : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-[240px] sm:max-w-xs">
                                            {c.email.trim() ? (
                                                <span className="break-all text-gray-900">{c.email}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(c.status)}`}
                                            >
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewCompany(c)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View company"
                                                    aria-label="View company"
                                                >
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditCompany(c)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit company"
                                                    aria-label="Edit company"
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteCompany(c)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete company"
                                                    aria-label="Delete company"
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMode === "view" && viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden onClick={closeModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="company-view-title"
                        className="relative flex max-h-[min(90vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="company-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Company details
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Company name</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <CompanyStatusViewBadge status={viewDetail.status} />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Contact person</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.contactPerson.trim() || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Phone</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.phone.trim() || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Email</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.email.trim() || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(modalMode === "add" || modalMode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeModal();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-company-title"
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] flex items-start justify-between gap-4 shrink-0">
                            <div className="min-w-0">
                                <h3 id="add-company-title" className="text-lg font-bold text-white">
                                    {modalMode === "edit" ? "Edit company" : "Add Company"}
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">
                                    {modalMode === "edit"
                                        ? "Update company details and save changes."
                                        : "Register a new company for assets and AMC."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeModal();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveCompany} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <div>
                                <label htmlFor="co-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Company name
                                </label>
                                <input
                                    id="co-name"
                                    name="name"
                                    value={formValues.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="e.g. Acme Industries Pvt Ltd"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="co-contact" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Contact person
                                    </label>
                                    <input
                                        id="co-contact"
                                        name="contactPerson"
                                        value={formValues.contactPerson}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="Full name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="co-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Phone
                                    </label>
                                    <input
                                        id="co-phone"
                                        name="phone"
                                        type="tel"
                                        value={formValues.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="co-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="co-email"
                                    name="email"
                                    type="email"
                                    value={formValues.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>

                            <div>
                                <label htmlFor="co-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <select
                                    id="co-status"
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 -mx-6 px-6 -mb-2 pb-0 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) closeModal();
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                            Saving...
                                        </>
                                    ) : modalMode === "edit" ? (
                                        "Save changes"
                                    ) : (
                                        "Create company"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
