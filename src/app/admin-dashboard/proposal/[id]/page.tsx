"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Pencil, Trash2 } from "lucide-react";
import { downloadProposalPdf } from "@/lib/proposalPdfExport";
import ProposalContentView from "@/components/admin-dashboard/ProposalContentView";
import { type ProposalStatus } from "@/lib/proposalConstants";
import {
    formatInr,
    formatProposalDate,
    mapApiRow,
    proposalStatusStyles,
    type Proposal,
    type ProposalApiRow,
} from "@/lib/proposalUi";

function StatusBadge({ status }: { status: ProposalStatus }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${proposalStatusStyles(status)}`}>
            {status}
        </span>
    );
}

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!Number.isFinite(id) || id < 1) {
            setError("Invalid proposal id");
            setIsLoading(false);
            return;
        }

        const load = async () => {
            try {
                const resp = await fetch(`/api/admin/proposals/${id}`, { cache: "no-store" });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(typeof data.message === "string" ? data.message : "Failed to load proposal");
                }
                setProposal(mapApiRow((data.proposal ?? data) as ProposalApiRow));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load proposal");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [id]);

    const handleDownloadPdf = async () => {
        if (!proposal) return;
        setIsDownloading(true);
        try {
            await downloadProposalPdf(proposal);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Unable to download PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!proposal) return;
        const ok = window.confirm(`Delete proposal “${proposal.proposalNumber}”? This cannot be undone.`);
        if (!ok) return;

        setIsDeleting(true);
        try {
            const resp = await fetch(`/api/admin/proposals/${id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            router.push("/admin-dashboard/proposal");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Unable to delete proposal.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#0a2a5e]" />
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="space-y-4">
                <Link href="/admin-dashboard/proposal" className="text-sm font-semibold text-[#0a2a5e]">
                    ← Back to proposals
                </Link>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error || "Proposal not found."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/admin-dashboard/proposal"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a2a5e] hover:text-[#06b6d4]"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back to proposals
                </Link>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void handleDownloadPdf()}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download PDF
                    </button>
                    <Link
                        href={`/admin-dashboard/proposal/${id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#0a2a5e] hover:bg-gray-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gradient-to-r from-[#06124f]/5 to-[#06b6d4]/10 px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#06b6d4]">Proposal</p>
                            <h1 className="mt-1 text-2xl font-black text-[#06124f]">{proposal.proposalNumber}</h1>
                            <p className="mt-2 text-lg font-semibold text-gray-900">{proposal.projectTitle}</p>
                        </div>
                        <StatusBadge status={proposal.status} />
                    </div>
                </div>

                <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 sm:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">{proposal.clientName}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proposed amount</p>
                        <p className="mt-1 text-sm font-bold text-[#06124f]">{formatInr(proposal.proposedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact person</p>
                        <p className="mt-1 text-sm text-gray-900">{proposal.clientContact || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Valid until</p>
                        <p className="mt-1 text-sm text-gray-900">{formatProposalDate(proposal.validUntil)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                        <p className="mt-1 text-sm text-gray-900">{proposal.clientPhone || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                        <p className="mt-1 text-sm text-gray-900">{proposal.clientEmail || "—"}</p>
                    </div>
                    {proposal.content ? (
                        <div className="sm:col-span-2 rounded-md border border-gray-100 bg-gray-50/50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Content</p>
                            <ProposalContentView content={proposal.content} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
