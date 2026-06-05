"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Pencil, Trash2 } from "lucide-react";
import LetterDocumentView from "@/components/admin-dashboard/LetterDocumentView";
import { downloadLetterPdf } from "@/lib/letterPdfExport";
import { type LetterStatus } from "@/lib/letterConstants";
import {
    mapApiRow,
    letterStatusStyles,
    type Letter,
    type LetterApiRow,
} from "@/lib/letterUi";

function StatusBadge({ status }: { status: LetterStatus }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${letterStatusStyles(status)}`}>
            {status}
        </span>
    );
}

export default function LetterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [letter, setLetter] = useState<Letter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!Number.isFinite(id) || id < 1) {
            setError("Invalid letter id");
            setIsLoading(false);
            return;
        }

        const load = async () => {
            try {
                const resp = await fetch(`/api/admin/letters/${id}`, { cache: "no-store" });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(typeof data.message === "string" ? data.message : "Failed to load letter");
                }
                setLetter(mapApiRow((data.letter ?? data) as LetterApiRow));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load letter");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [id]);

    const handleDownloadPdf = async () => {
        if (!letter) return;
        setIsDownloading(true);
        try {
            await downloadLetterPdf(letter);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Unable to download PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!letter) return;
        const ok = window.confirm(`Delete letter “${letter.letterNumber}”? This cannot be undone.`);
        if (!ok) return;

        setIsDeleting(true);
        try {
            const resp = await fetch(`/api/admin/letters/${id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            router.push("/admin-dashboard/letter");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Unable to delete letter.");
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

    if (!letter) {
        return (
            <div className="space-y-4">
                <Link href="/admin-dashboard/letter" className="text-sm font-semibold text-[#0a2a5e]">
                    ← Back to letters
                </Link>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error || "Letter not found."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/admin-dashboard/letter"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a2a5e] hover:text-[#06b6d4]"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back to letters
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={letter.status} />
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
                        href={`/admin-dashboard/letter/${id}/edit`}
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

            <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 shadow-sm">
                <LetterDocumentView letter={letter} />
            </div>
        </div>
    );
}
