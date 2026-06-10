"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { downloadOfferLetterPdf } from "@/lib/offerLetterPdfExport";
import { OFFER_LETTER_STATUSES, type OfferLetterStatus } from "@/lib/offerLetterConstants";
import {
    OFFER_LETTER_INPUT_CLASS,
    formatOfferLetterDate,
    mapApiRow,
    offerLetterStatusStyles,
    type OfferLetter,
    type OfferLetterApiRow,
} from "@/lib/offerLetterUi";

function OfferLetterStatusBadge({ status }: { status: OfferLetterStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${offerLetterStatusStyles(status)}`}
        >
            {status}
        </span>
    );
}

export default function OfferLetterPage() {
    const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const fetchOfferLetters = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const params = new URLSearchParams();
            if (search.trim()) params.set("q", search.trim());
            if (statusFilter) params.set("status", statusFilter);

            const resp = await fetch(`/api/admin/offer-letters?${params}`, { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load offer letters");
            }
            const rows = Array.isArray(data.offer_letters) ? (data.offer_letters as OfferLetterApiRow[]) : [];
            setOfferLetters(rows.map(mapApiRow));
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load offer letters");
            setOfferLetters([]);
        } finally {
            setIsLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        void fetchOfferLetters();
    }, [fetchOfferLetters]);

    const stats = useMemo(() => {
        const total = offerLetters.length;
        const draft = offerLetters.filter((o) => o.status === "Draft").length;
        const sent = offerLetters.filter((o) => o.status === "Sent").length;
        const approved = offerLetters.filter((o) => o.status === "Approved").length;
        return [
            { label: "Total offers", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Draft", value: String(draft), tone: "text-gray-700" },
            { label: "Sent", value: String(sent), tone: "text-[#06b6d4]" },
            { label: "Approved", value: String(approved), tone: "text-green-700" },
        ];
    }, [offerLetters]);

    const handleDownload = async (o: OfferLetter) => {
        setDownloadingId(o.id);
        try {
            const resp = await fetch(`/api/admin/offer-letters/${o.id}`, { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load offer letter");
            }
            const full = mapApiRow((data.offer_letter ?? data) as OfferLetterApiRow);
            await downloadOfferLetterPdf(full);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to download PDF.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (o: OfferLetter) => {
        const ok = window.confirm(`Delete offer letter "${o.offerNumber}"? This cannot be undone.`);
        if (!ok) return;

        try {
            setDeletingId(o.id);
            const resp = await fetch(`/api/admin/offer-letters/${o.id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setOfferLetters((prev) => prev.filter((x) => x.id !== o.id));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to delete offer letter.");
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
                            placeholder="Search candidate, subject, ID…"
                            className={`${OFFER_LETTER_INPUT_CLASS} pl-9`}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
                    >
                        <option value="">All statuses</option>
                        {OFFER_LETTER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <Link
                    href="/admin-dashboard/offer-letter/new"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                    New offer letter
                </Link>
            </div>

            {loadError ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.label} className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className={`mt-2 text-2xl font-black tabular-nums ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-bold text-gray-900">Offer letters</h2>
                    <p className="mt-1 text-sm text-gray-500">Create and track employment offer letters for candidates.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Offer ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Candidate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Designation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Offer date
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
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    </td>
                                </tr>
                            ) : offerLetters.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No offer letters yet.{" "}
                                        <Link
                                            href="/admin-dashboard/offer-letter/new"
                                            className="font-semibold text-[#06b6d4] hover:underline"
                                        >
                                            Create your first offer letter
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                offerLetters.map((o, idx) => (
                                    <tr key={o.id} className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#0a2a5e]">
                                            <Link
                                                href={`/admin-dashboard/offer-letter/${o.id}`}
                                                className="hover:text-[#06b6d4] hover:underline"
                                            >
                                                {o.offerNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{o.candidateName}</p>
                                            {o.department ? (
                                                <p className="text-xs text-gray-500">{o.department}</p>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{o.designation || "—"}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                            {formatOfferLetterDate(o.offerDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <OfferLetterStatusBadge status={o.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDownload(o)}
                                                    disabled={downloadingId === o.id}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#06b6d4]/30 bg-[#06b6d4]/5 text-[#0a2a5e] hover:bg-[#06b6d4]/10 disabled:opacity-60"
                                                    title="Download PDF"
                                                >
                                                    {downloadingId === o.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/admin-dashboard/offer-letter/${o.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin-dashboard/offer-letter/${o.id}/edit`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-[#0a2a5e] hover:bg-slate-50"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDelete(o)}
                                                    disabled={deletingId === o.id}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                                    title="Delete"
                                                >
                                                    {deletingId === o.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </button>
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
