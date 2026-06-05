"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import LetterFormFields from "@/components/admin-dashboard/LetterFormFields";
import {
    formValuesToApiBody,
    letterToFormValues,
    mapApiRow,
    type LetterApiRow,
    type LetterFormValues,
} from "@/lib/letterUi";

export default function EditLetterPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [formValues, setFormValues] = useState<LetterFormValues | null>(null);
    const [letterNumber, setLetterNumber] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

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
                const row = mapApiRow((data.letter ?? data) as LetterApiRow);
                setLetterNumber(row.letterNumber);
                setFormValues(letterToFormValues(row));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load letter");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formValues || !formValues.clientName.trim() || !formValues.subject.trim()) return;

        setIsSubmitting(true);
        setError("");
        try {
            const resp = await fetch(`/api/admin/letters/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValuesToApiBody(formValues)),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update letter");
            }
            router.push(`/admin-dashboard/letter/${id}`);
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
            <Link
                href={`/admin-dashboard/letter/${id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a2a5e] hover:text-[#06b6d4]"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to letter
            </Link>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-6 lg:px-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                            <Pencil className="h-6 w-6" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white sm:text-2xl">Edit letter</h1>
                            <p className="mt-1 text-sm text-white/80">{letterNumber}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 bg-[#f8fafc] p-6 sm:p-8">
                    {error ? (
                        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
                    ) : null}

                    <LetterFormFields values={formValues} onChange={setFormValues} />

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                        <Link
                            href={`/admin-dashboard/letter/${id}`}
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
