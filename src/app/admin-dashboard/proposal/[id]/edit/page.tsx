"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import ProposalFormFields from "@/components/admin-dashboard/ProposalFormFields";
import {
    formValuesToApiBody,
    mapApiRow,
    proposalToFormValues,
    type ProposalApiRow,
    type ProposalFormValues,
} from "@/lib/proposalUi";

export default function EditProposalPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [formValues, setFormValues] = useState<ProposalFormValues | null>(null);
    const [proposalNumber, setProposalNumber] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

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
                const row = mapApiRow((data.proposal ?? data) as ProposalApiRow);
                setProposalNumber(row.proposalNumber);
                setFormValues(proposalToFormValues(row));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load proposal");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formValues || !formValues.clientName.trim() || !formValues.projectTitle.trim()) return;

        setIsSubmitting(true);
        setError("");
        try {
            const resp = await fetch(`/api/admin/proposals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValuesToApiBody(formValues)),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update proposal");
            }
            router.push(`/admin-dashboard/proposal/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save changes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#0a2a5e]" />
            </div>
        );
    }

    if (!formValues) {
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
            <Link
                href={`/admin-dashboard/proposal/${id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a2a5e] hover:text-[#06b6d4]"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to proposal
            </Link>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-6 lg:px-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                            <Pencil className="h-6 w-6" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white sm:text-2xl">Edit proposal</h1>
                            <p className="mt-1 text-sm text-white/80">{proposalNumber}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 bg-[#f8fafc] p-6 sm:p-8">
                    {error ? (
                        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </p>
                    ) : null}

                    <ProposalFormFields values={formValues} onChange={setFormValues} />

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                        <Link
                            href={`/admin-dashboard/proposal/${id}`}
                            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Save changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
