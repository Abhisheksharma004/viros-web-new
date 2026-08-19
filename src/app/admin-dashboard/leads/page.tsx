"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Users,
    Mail,
    Phone,
    Building2,
    Calendar,
    Search,
    RefreshCw,
    Download,
    Eye,
    Trash2,
    Check,
    Clock,
    X,
    MessageSquare,
    Package,
    Loader2,
    AlertCircle,
} from "lucide-react";
import Toast from "@/components/Toast";
import { useModulePermission } from "@/context/ModulePermissionContext";

type LeadItem = {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string | null;
    subject: string;
    product: string | null;
    category: string | null;
    message: string;
    source: string;
    status: "new" | "contacted" | "in_progress" | "closed";
    created_at: string;
    updated_at: string;
};

type StatsType = {
    total: number;
    popup_leads: number;
    product_inquiries: number;
    contact_page: number;
    new_leads: number;
};

const SOURCE_TABS = [
    { id: "all", label: "All Leads" },
    { id: "website_popup", label: "Popup Leads" },
    { id: "product_inquiry_popup", label: "Product Inquiries" },
    { id: "contact_page", label: "Contact Page" },
];

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "in_progress", label: "In Progress" },
    { value: "closed", label: "Closed" },
];

export default function LeadsPage() {
    const { write: canWrite, delete: canDelete, admin: isAdmin } = useModulePermission();
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [stats, setStats] = useState<StatsType>({
        total: 0,
        popup_leads: 0,
        product_inquiries: 0,
        contact_page: 0,
        new_leads: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [viewingLead, setViewingLead] = useState<LeadItem | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionBusyId, setActionBusyId] = useState<number | null>(null);

    // Toast state
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [showToast, setShowToast] = useState(false);

    const triggerToast = (msg: string, type: "success" | "error" = "success") => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
    };

    const fetchLeads = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.set("q", searchQuery.trim());
            if (selectedSource !== "all") params.set("source", selectedSource);
            if (selectedStatus !== "all") params.set("status", selectedStatus);

            const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: "no-store" });
            const data = await res.json();

            if (res.ok) {
                setLeads(data.leads || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            } else {
                triggerToast(data.error || "Failed to load leads", "error");
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            triggerToast("Error loading leads from database", "error");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedSource, selectedStatus]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            setActionBusyId(id);
            const res = await fetch("/api/admin/leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            const data = await res.json();
            if (res.ok) {
                triggerToast("Lead status updated successfully!");
                setLeads((prev) =>
                    prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus as any } : lead))
                );
                if (viewingLead && viewingLead.id === id) {
                    setViewingLead((prev) => (prev ? { ...prev, status: newStatus as any } : null));
                }
            } else {
                triggerToast(data.error || "Failed to update status", "error");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            triggerToast("Failed to update status", "error");
        } finally {
            setActionBusyId(null);
        }
    };

    const handleDeleteLead = async (id: number) => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/leads?id=${id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (res.ok) {
                triggerToast("Lead deleted successfully");
                setDeleteConfirmId(null);
                if (viewingLead && viewingLead.id === id) {
                    setViewingLead(null);
                }
                fetchLeads();
            } else {
                triggerToast(data.error || "Failed to delete lead", "error");
            }
        } catch (error) {
            console.error("Error deleting lead:", error);
            triggerToast("Failed to delete lead", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const exportToCSV = () => {
        if (leads.length === 0) {
            triggerToast("No leads available to export", "error");
            return;
        }

        const headers = ["ID", "Date", "Name", "Company", "Email", "Phone", "Subject", "Product", "Category", "Source", "Status", "Message"];
        const rows = leads.map((l) => [
            l.id,
            `"${new Date(l.created_at).toLocaleString()}"`,
            `"${(l.name || "").replace(/"/g, '""')}"`,
            `"${(l.company || "").replace(/"/g, '""')}"`,
            `"${(l.email || "").replace(/"/g, '""')}"`,
            `"${(l.phone || "").replace(/"/g, '""')}"`,
            `"${(l.subject || "").replace(/"/g, '""')}"`,
            `"${(l.product || "").replace(/"/g, '""')}"`,
            `"${(l.category || "").replace(/"/g, '""')}"`,
            `"${(l.source || "").replace(/"/g, '""')}"`,
            `"${(l.status || "").replace(/"/g, '""')}"`,
            `"${(l.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `viros_leads_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast("Leads exported to CSV successfully!");
    };

    const leadStatCards = useMemo(() => {
        return [
            { label: "Total Leads", value: String(stats.total), tone: "text-[#0a2a5e]" },
            { label: "New Leads", value: String(stats.new_leads), tone: "text-amber-600" },
            { label: "Popup Leads", value: String(stats.popup_leads), tone: "text-purple-600" },
            { label: "Product Inquiries", value: String(stats.product_inquiries), tone: "text-[#06b6d4]" },
            { label: "Contact Page", value: String(stats.contact_page), tone: "text-emerald-600" },
        ];
    }, [stats]);

    const getSourceStyles = (source: string) => {
        switch (source) {
            case "website_popup":
                return "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20";
            case "product_inquiry_popup":
                return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
            case "contact_page":
                return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
            default:
                return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "website_popup":
                return "Popup Lead";
            case "product_inquiry_popup":
                return "Product Inquiry";
            case "contact_page":
                return "Contact Page";
            default:
                return source || "Website";
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "new":
                return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20";
            case "contacted":
                return "bg-sky-50 text-sky-800 ring-1 ring-sky-600/20";
            case "in_progress":
                return "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600/20";
            case "closed":
                return "bg-green-50 text-green-800 ring-1 ring-green-600/20";
            default:
                return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
        }
    };

    return (
        <div className="space-y-6 relative">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}

            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#06b6d4]" />
                        Leads & Inquiries
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Track and manage incoming leads from website popups, contact forms, and product inquiries.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => fetchLeads()}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {leadStatCards.map((item) => (
                    <div key={item.label} className="bg-white rounded-md border border-gray-100 shadow-xs p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-md border border-gray-100 shadow-xs overflow-hidden">
                {/* Header & Filter Toolbar */}
                <div className="p-4 sm:px-6 sm:py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Source Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                        {SOURCE_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedSource(tab.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    selectedSource === tab.id
                                        ? "bg-[#06124f] text-white shadow-xs"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search & Status Filter */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <div className="relative min-w-[220px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#06124f] focus:bg-white transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 focus:outline-none focus:border-[#06124f] cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Lead Information
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Source / Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Message
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="inline-flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-[#06124f]" />
                                            Loading leads...
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No leads found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Lead Name & Company */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                                                {lead.company ? (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                                        <Building2 className="w-3 h-3 text-gray-400" />
                                                        {lead.company}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No company</p>
                                                )}
                                                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(lead.created_at).toLocaleString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="text-xs font-semibold text-[#0a2a5e] hover:text-[#06b6d4] flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{lead.email}</span>
                                                </a>
                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors font-mono"
                                                >
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    {lead.phone}
                                                </a>
                                            </div>
                                        </td>

                                        {/* Source & Product */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getSourceStyles(
                                                        lead.source
                                                    )}`}
                                                >
                                                    {getSourceLabel(lead.source)}
                                                </span>
                                                {lead.product && (
                                                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                                        <Package className="w-3.5 h-3.5 text-[#06b6d4]" />
                                                        <span className="truncate max-w-[160px]">{lead.product}</span>
                                                    </div>
                                                )}
                                                {lead.category && (
                                                    <p className="text-[11px] text-gray-500">
                                                        Cat: <span className="font-medium text-gray-700">{lead.category}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Message */}
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed" title={lead.message}>
                                                {lead.message}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${getStatusStyles(
                                                        lead.status
                                                    )}`}
                                                >
                                                    {lead.status === "new" ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                            New
                                                        </span>
                                                    ) : (
                                                        lead.status.replace("_", " ")
                                                    )}
                                                </span>
                                                {(canWrite || isAdmin) && (
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                        disabled={actionBusyId === lead.id}
                                                        className="text-[11px] font-medium bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 text-gray-600 focus:outline-none focus:border-[#06124f] cursor-pointer"
                                                    >
                                                        <option value="new">Mark: New</option>
                                                        <option value="contacted">Mark: Contacted</option>
                                                        <option value="in_progress">Mark: In Progress</option>
                                                        <option value="closed">Mark: Closed</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingLead(lead)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-xs transition hover:bg-gray-50 cursor-pointer"
                                                    title="View Lead Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {(canDelete || isAdmin) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirmId(lead.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 shadow-xs transition hover:bg-red-100 cursor-pointer"
                                                        title="Delete Lead"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Lead Details Modal */}
            {viewingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#06124f] to-[#0a2a5e] text-white">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>{viewingLead.name}</span>
                                    <span className="text-xs font-normal text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                                        ID #{viewingLead.id}
                                    </span>
                                </h3>
                                <p className="text-xs text-white/70 mt-0.5">{getSourceLabel(viewingLead.source)}</p>
                            </div>
                            <button
                                onClick={() => setViewingLead(null)}
                                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Contact Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Email Address</span>
                                    <a
                                        href={`mailto:${viewingLead.email}`}
                                        className="text-sm font-bold text-[#06124f] hover:text-[#06b6d4] flex items-center gap-1.5 mt-1"
                                    >
                                        <Mail className="w-4 h-4 text-[#06b6d4]" />
                                        {viewingLead.email}
                                    </a>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Phone Number</span>
                                    <a
                                        href={`tel:${viewingLead.phone}`}
                                        className="text-sm font-bold text-gray-900 hover:text-[#06124f] flex items-center gap-1.5 mt-1 font-mono"
                                    >
                                        <Phone className="w-4 h-4 text-[#06b6d4]" />
                                        {viewingLead.phone}
                                    </a>
                                </div>
                                {viewingLead.company && (
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Company</span>
                                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-1">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            {viewingLead.company}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Submitted Date</span>
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-1">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(viewingLead.created_at).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Product Info if applicable */}
                            {viewingLead.product && (
                                <div className="p-4 bg-blue-50/60 rounded-md border border-blue-100 space-y-1">
                                    <span className="text-xs font-bold text-blue-700 uppercase">Product Information</span>
                                    <p className="text-sm font-bold text-[#06124f] flex items-center gap-2">
                                        <Package className="w-4 h-4 text-[#06b6d4]" />
                                        {viewingLead.product}
                                    </p>
                                    {viewingLead.category && (
                                        <p className="text-xs text-gray-600">Category: <span className="font-semibold text-gray-900">{viewingLead.category}</span></p>
                                    )}
                                </div>
                            )}

                            {/* Subject */}
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Subject</span>
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm font-semibold text-gray-800">
                                    {viewingLead.subject || "General Inquiry"}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Message</span>
                                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {viewingLead.message}
                                </div>
                            </div>

                            {/* Status Control */}
                            {(canWrite || isAdmin) && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                                    <div>
                                        <span className="text-xs font-bold text-gray-700 block">Lead Status</span>
                                        <span className="text-xs text-gray-500">Update follow-up progress</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.filter((s) => s.value !== "all").map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleStatusChange(viewingLead.id, opt.value)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                                    viewingLead.status === opt.value
                                                        ? "bg-[#06124f] text-white shadow-xs"
                                                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <a
                                href={`mailto:${viewingLead.email}?subject=Re: ${encodeURIComponent(viewingLead.subject || "Inquiry from VIROS")}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity shadow-xs"
                            >
                                <Mail className="w-4 h-4" />
                                Reply via Email
                            </a>
                            <button
                                type="button"
                                onClick={() => setViewingLead(null)}
                                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-md transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 overflow-hidden my-8 p-6 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2.5 bg-red-50 rounded-full">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Delete Lead?</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Are you sure you want to permanently delete this lead from the database? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-md transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteLead(deleteConfirmId)}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-md transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Permanently"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
