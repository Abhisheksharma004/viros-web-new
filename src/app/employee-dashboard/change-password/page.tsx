"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Shield } from "lucide-react";

const inputClassName =
    "w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white";

function PasswordField({
    id,
    label,
    value,
    onChange,
    autoComplete,
    show,
    onToggleShow,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    show: boolean;
    onToggleShow: () => void;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    autoComplete={autoComplete}
                    className={inputClassName}
                />
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-gray-400 hover:text-[#0a2a5e] transition-colors"
                    aria-label={show ? "Hide password" : "Show password"}
                >
                    {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
            </div>
        </div>
    );
}

export default function EmployeeChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "New password must be at least 6 characters." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/employee/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update password");
            }

            setMessage({ type: "success", text: "Password updated successfully." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to update password",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const allVisible = showCurrentPassword && showNewPassword && showConfirmPassword;

    return (
        <div className="space-y-4 sm:space-y-6 relative pb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 sm:px-6 pt-5 pb-6 sm:pt-6 sm:pb-8">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#06124f] flex items-center justify-center text-white shadow-lg ring-4 ring-white/90 shrink-0">
                            <KeyRound className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                                Update portal password
                            </h2>
                            <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
                                Use a strong password to keep your account secure
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
                    {message && (
                        <div
                            className={`rounded-xl px-4 py-3 text-sm font-medium ${
                                message.type === "success"
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 flex items-start gap-3">
                        <Shield className="h-5 w-5 text-[#0a2a5e] shrink-0 mt-0.5" aria-hidden />
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            Your new password must be at least 6 characters. After updating, use it the next time you
                            sign in to the employee portal.
                        </p>
                    </div>

                    <div className="flex items-center justify-end sm:max-w-xl sm:ml-auto">
                        <button
                            type="button"
                            onClick={() => {
                                const next = !allVisible;
                                setShowCurrentPassword(next);
                                setShowNewPassword(next);
                                setShowConfirmPassword(next);
                            }}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a2a5e] hover:underline"
                        >
                            {allVisible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                            {allVisible ? "Hide all passwords" : "Show all passwords"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:max-w-xl">
                        <PasswordField
                            id="current-password"
                            label="Current password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            autoComplete="current-password"
                            show={showCurrentPassword}
                            onToggleShow={() => setShowCurrentPassword((v) => !v)}
                        />
                        <PasswordField
                            id="new-password"
                            label="New password"
                            value={newPassword}
                            onChange={setNewPassword}
                            autoComplete="new-password"
                            show={showNewPassword}
                            onToggleShow={() => setShowNewPassword((v) => !v)}
                        />
                        <PasswordField
                            id="confirm-password"
                            label="Confirm new password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            autoComplete="new-password"
                            show={showConfirmPassword}
                            onToggleShow={() => setShowConfirmPassword((v) => !v)}
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 sm:max-w-xl">
                        <Link
                            href="/employee-dashboard/profile"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Back to profile
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60 sm:min-w-[180px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                            {isSubmitting ? "Updating…" : "Update password"}
                        </button>
                    </div>
                </form>
            </div>

            <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
                <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Contact admin if you cannot access your account or need a password reset.
            </p>
        </div>
    );
}
