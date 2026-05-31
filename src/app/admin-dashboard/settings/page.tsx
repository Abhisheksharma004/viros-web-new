"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const resp = await fetch("/api/auth/me", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load profile");
            }
            setEmail(typeof data.email === "string" ? data.email : "");
            setName(typeof data.name === "string" ? data.name : "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Display name is required.");
            setSuccess("");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");
            const resp = await fetch("/api/auth/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to save");
            }
            setName(typeof data.name === "string" ? data.name : trimmed);
            setSuccess("Display name saved. New tasks will show this name as “Assigned by”.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading profile…
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin profile</h1>
                <p className="mt-1 text-sm text-gray-600">
                    This name appears when you assign tasks to employees (Assigned by).
                </p>
            </div>

            <form
                onSubmit={(e) => void handleSave(e)}
                className="space-y-5 rounded-md border border-gray-100 bg-white p-6 shadow-sm"
            >
                {error ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </p>
                ) : null}
                {success ? (
                    <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        {success}
                    </p>
                ) : null}

                <div>
                    <label htmlFor="admin-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                        Login email
                    </label>
                    <input
                        id="admin-email"
                        type="email"
                        value={email}
                        readOnly
                        className="h-11 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600"
                    />
                </div>

                <div>
                    <label htmlFor="admin-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                        Display name
                    </label>
                    <input
                        id="admin-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Abhishek Kumar"
                        className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                        Use your real name so employees know who assigned their tasks.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#001540] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    {saving ? "Saving…" : "Save name"}
                </button>
            </form>
        </div>
    );
}
