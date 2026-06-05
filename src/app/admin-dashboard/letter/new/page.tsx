"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import LetterFormFields from "@/components/admin-dashboard/LetterFormFields";
import {
    EMPTY_LETTER_FORM,
    formValuesToApiBody,
    mapApiRow,
    type LetterApiRow,
    type LetterFormValues,
} from "@/lib/letterUi";

export default function NewLetterPage() {
    const router = useRouter();
    const [formValues, setFormValues] = useState<LetterFormValues>(EMPTY_LETTER_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formValues.clientName.trim() || !formValues.subject.trim()) return;

        setIsSubmitting(true);
        setError("");
        try {
            const resp = await fetch("/api/admin/letters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValuesToApiBody(formValues)),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to create letter");
            }
            const saved = mapApiRow((data.letter ?? data) as LetterApiRow);
            router.push(`/admin-dashboard/letter/${saved.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create letter.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Link
                href="/admin-dashboard/letter"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a2a5e] hover:text-[#06b6d4]"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to letters
            </Link>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-6 lg:px-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                            <Mail className="h-6 w-6" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white sm:text-2xl">New letter</h1>
                            <p className="mt-1 max-w-3xl text-sm text-white/80">
                                Fill in recipient and letter details. A letter ID (e.g. VEL0626001) will be generated on save.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 bg-[#f8fafc] p-6 lg:p-8">
                    {error ? (
                        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
                    ) : null}

                    <LetterFormFields values={formValues} onChange={setFormValues} />

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                        <Link
                            href="/admin-dashboard/letter"
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
                            Create letter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
