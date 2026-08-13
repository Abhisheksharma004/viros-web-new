"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { downloadProposalPdf } from "@/lib/proposalPdfExport";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/lib/proposalConstants";
import { useModulePermission } from "@/context/ModulePermissionContext";
import {
    PROPOSAL_INPUT_CLASS,
    formatInr,
    formatProposalDate,
    mapApiRow,
    proposalStatusStyles,
    type Proposal,
    type ProposalApiRow,
} from "@/lib/proposalUi";

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${proposalStatusStyles(status)}`}>
            {status}
        </span>
    );
}

export default function ProposalPage() {
    const { write: canWrite, delete: canDelete, admin: isAdmin } = useModulePermission();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const fetchProposals = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const params = new URLSearchParams();
            if (search.trim()) params.set("q", search.trim());
            if (statusFilter) params.set("status", statusFilter);

            const resp = await fetch(`/api/admin/proposals?${params}`, { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load proposals");
            }
            const rows = Array.isArray(data.proposals) ? (data.proposals as ProposalApiRow[]) : [];
            setProposals(rows.map(mapApiRow));
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load proposals");
            setProposals([]);
        } finally {
            setIsLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        void fetchProposals();
    }, [fetchProposals]);

    const stats = useMemo(() => {
        const total = proposals.length;
        const draft = proposals.filter((p) => p.status === "Draft").length;
        const sent = proposals.filter((p) => p.status === "Sent").length;
        const approvedValue = proposals
            .filter((p) => p.status === "Approved")
            .reduce((s, p) => s + p.proposedAmount, 0);
        const totalValue = proposals.reduce((sum, p) => sum + p.proposedAmount, 0);
        return [
            { label: "Total proposals", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Draft", value: String(draft), tone: "text-gray-700" },
            { label: "Sent", value: String(sent), tone: "text-[#06b6d4]" },
            { label: "Approved value", value: formatInr(approvedValue), tone: "text-green-700" },
            { label: "Pipeline value", value: formatInr(totalValue), tone: "text-[#06124f]" },
        ];
    }, [proposals]);

    const handleDownload = async (p: Proposal) => {
        setDownloadingId(p.id);
        try {
            const resp = await fetch(`/api/admin/proposals/${p.id}`, { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load proposal");
            }
            const full = mapApiRow((data.proposal ?? data) as ProposalApiRow);
            await downloadProposalPdf(full);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to download PDF.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (p: Proposal) => {
        const ok = window.confirm(`Delete proposal “${p.proposalNumber}”? This cannot be undone.`);
        if (!ok) return;

        try {
            setDeletingId(p.id);
            const resp = await fetch(`/api/admin/proposals/${p.id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setProposals((prev) => prev.filter((x) => x.id !== p.id));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to delete proposal.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search client, project, ID…"
                            className={`${PROPOSAL_INPUT_CLASS} pl-9`}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
                    >
                        <option value="">All statuses</option>
                        {PROPOSAL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                {(canWrite || isAdmin) && (
                    <Link
                        href="/admin-dashboard/proposal/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" aria-hidden />
                        New proposal
                    </Link>
                )}
            </div>

            {loadError ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {stats.map((item) => (
                    <div key={item.label} className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className={`mt-2 text-2xl font-black tabular-nums ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-bold text-gray-900">Project proposals</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Create and track commercial proposals for clients.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Proposal ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Valid until
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    </td>
                                </tr>
                            ) : proposals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No proposals yet.{" "}
                                        <Link href="/admin-dashboard/proposal/new" className="font-semibold text-[#06b6d4] hover:underline">
                                            Create your first proposal
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                proposals.map((p, idx) => (
                                    <tr key={p.id} className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#0a2a5e]">
                                            <Link
                                                href={`/admin-dashboard/proposal/${p.id}`}
                                                className="hover:text-[#06b6d4] hover:underline"
                                            >
                                                {p.proposalNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{p.clientName}</p>
                                            {p.clientContact ? (
                                                <p className="text-xs text-gray-500">{p.clientContact}</p>
                                            ) : null}
                                        </td>
                                        <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                            <span className="line-clamp-2">{p.projectTitle}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                                            {formatInr(p.proposedAmount)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                            {formatProposalDate(p.validUntil)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ProposalStatusBadge status={p.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDownload(p)}
                                                    disabled={downloadingId === p.id}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#06b6d4]/30 bg-[#06b6d4]/5 text-[#0a2a5e] hover:bg-[#06b6d4]/10 disabled:opacity-60"
                                                    title="Download PDF"
                                                >
                                                    {downloadingId === p.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/admin-dashboard/proposal/${p.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {(canWrite || isAdmin) && (
                                                    <Link
                                                        href={`/admin-dashboard/proposal/${p.id}/edit`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-[#0a2a5e] hover:bg-slate-50"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {(canDelete || isAdmin) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(p)}
                                                        disabled={deletingId === p.id}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                                        title="Delete"
                                                    >
                                                        {deletingId === p.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
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
        </div>
    );
}
