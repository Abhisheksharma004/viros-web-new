"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ACCENT = "#0a2a5e";
const GRADIENT = "linear-gradient(135deg, #06124f, #0a2a5e)";
const SHADOW = "rgba(10,42,94,0.35)";

const FEATURES = [
    { icon: "🔒", text: "Secure encrypted access" },
    { icon: "📊", text: "Real-time dashboard analytics" },
    { icon: "🌐", text: "Full website content control" },
    { icon: "📦", text: "Product & service management" },
];

type LoginErrorCode =
    | "ATTENDANCE_PORTAL_DISABLED"
    | "PORTAL_INACTIVE"
    | "INVALID_CREDENTIALS"
    | "GENERIC"
    | null;

function loginAlertStyles(code: LoginErrorCode) {
    if (code === "ATTENDANCE_PORTAL_DISABLED") {
        return {
            box: "bg-amber-50 text-amber-950 border-amber-300",
            title: "Portal access disabled — attendance",
        };
    }
    if (code === "PORTAL_INACTIVE") {
        return {
            box: "bg-orange-50 text-orange-900 border-orange-200",
            title: "Portal access inactive",
        };
    }
    return {
        box: "bg-red-50 text-red-700 border-red-200",
        title: "Sign in failed",
    };
}

export default function AdminLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [formValues, setFormValues] = useState({ identifier: "", password: "" });
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginErrorCode, setLoginErrorCode] = useState<LoginErrorCode>(null);
    const [missedWorkingDays, setMissedWorkingDays] = useState<number | null>(null);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<"request" | "verify" | "success">("request");
    const [forgotIdentifier, setForgotIdentifier] = useState("");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotAccountType, setForgotAccountType] = useState<"employee" | "admin">("employee");
    const [forgotOtp, setForgotOtp] = useState("");
    const [forgotNewPassword, setForgotNewPassword] = useState("");
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const redirectIfAuthenticated = async () => {
            try {
                const [employeeRes, adminRes] = await Promise.all([
                    fetch("/api/employee-auth/me", { method: "GET", cache: "no-store" }),
                    fetch("/api/auth/me", { method: "GET", cache: "no-store" }),
                ]);

                if (!active) return;

                if (employeeRes.ok) {
                    router.replace("/employee-dashboard");
                    router.refresh();
                    return;
                }

                if (adminRes.ok) {
                    router.replace("/admin-dashboard");
                    router.refresh();
                }
            } catch {
                // User is not authenticated or network failed; keep login page.
            }
        };

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                redirectIfAuthenticated();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                redirectIfAuthenticated();
            }
        };

        redirectIfAuthenticated();
        window.addEventListener("pageshow", handlePageShow);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            active = false;
            window.removeEventListener("pageshow", handlePageShow);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [router]);

    useEffect(() => {
        if (!forgotOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeForgotModal();
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [forgotOpen]);

    const closeForgotModal = () => {
        setForgotOpen(false);
        setForgotStep("request");
        setForgotIdentifier("");
        setForgotEmail("");
        setForgotAccountType("employee");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setShowForgotPassword(false);
        setForgotLoading(false);
        setForgotError(null);
    };

    const handleForgotCloseClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        closeForgotModal();
    };

    const handleRequestOTP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError(null);

        try {
            const response = await fetch("/api/employee-forgot-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to send OTP");
            }

            if (typeof data.email === "string") {
                setForgotEmail(data.email);
            }
            if (data.accountType === "admin" || data.accountType === "employee") {
                setForgotAccountType(data.accountType);
            }

            setForgotStep("verify");
        } catch (err) {
            setForgotError(err instanceof Error ? err.message : "Failed to send OTP");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setForgotError(null);

        if (forgotNewPassword !== forgotConfirmPassword) {
            setForgotError("Passwords do not match");
            return;
        }

        const minPasswordLength = forgotAccountType === "admin" ? 8 : 6;
        if (forgotNewPassword.length < minPasswordLength) {
            setForgotError(`Password must be at least ${minPasswordLength} characters`);
            return;
        }

        if (forgotOtp.length !== 7) {
            setForgotError("Enter the 7-digit code from your email");
            return;
        }

        setForgotLoading(true);

        try {
            const response = await fetch("/api/employee-forgot-password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: forgotEmail.trim(),
                    otp: forgotOtp,
                    newPassword: forgotNewPassword,
                    accountType: forgotAccountType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            setForgotStep("success");
        } catch (err) {
            setForgotError(err instanceof Error ? err.message : "Failed to reset password");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setForgotOtp("");
        setForgotError(null);
        setForgotLoading(true);

        try {
            const response = await fetch("/api/employee-forgot-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: forgotIdentifier.trim() || forgotEmail.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to resend OTP");
            }

            if (typeof data.email === "string") {
                setForgotEmail(data.email);
            }
            if (data.accountType === "admin" || data.accountType === "employee") {
                setForgotAccountType(data.accountType);
            }
        } catch (err) {
            setForgotError(err instanceof Error ? err.message : "Failed to resend OTP");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoginErrorCode(null);
        setMissedWorkingDays(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: formValues.identifier.trim(),
                    password: formValues.password,
                    rememberMe,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const code: LoginErrorCode =
                    data.code === "ATTENDANCE_PORTAL_DISABLED"
                        ? "ATTENDANCE_PORTAL_DISABLED"
                        : data.code === "PORTAL_INACTIVE"
                          ? "PORTAL_INACTIVE"
                          : response.status === 401
                            ? "INVALID_CREDENTIALS"
                            : "GENERIC";
                setLoginErrorCode(code);
                if (
                    typeof data.consecutiveMissedWorkingDays === "number" &&
                    Number.isFinite(data.consecutiveMissedWorkingDays)
                ) {
                    setMissedWorkingDays(data.consecutiveMissedWorkingDays);
                }
                setError(
                    typeof data.message === "string"
                        ? data.message
                        : "Invalid employee ID/email or password.",
                );
                return;
            }

            const destination = data.role === "employee" ? "/employee-dashboard" : "/admin-dashboard";
            router.push(destination);
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            setLoginErrorCode("GENERIC");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen lg:min-h-[calc(100vh-5rem)] flex flex-col lg:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Mobile Brand Header (hidden on desktop) ── */}
            <div
                className="lg:hidden relative overflow-hidden flex flex-col items-center justify-end pb-10 pt-14 px-6"
                style={{
                    background: "linear-gradient(160deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    minHeight: "230px",
                    borderRadius: "0 0 36px 36px",
                }}
            >
                <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-10" style={{ background: "#00bcd4" }} />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10" style={{ background: "#00bcd4" }} />
                <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="mgrid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mgrid)" />
                </svg>
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="bg-white rounded-2xl p-3 shadow-xl">
                        <Image src="/logo.png" alt="Viros" width={52} height={52} className="object-contain" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-black text-2xl tracking-wider">VIROS</p>
                        <p className="text-white/50 text-xs tracking-widest uppercase mt-0.5">Management Portal</p>
                    </div>
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(0,188,212,0.18)", color: "#00e5ff", border: "1px solid rgba(0,188,212,0.35)" }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        Secure Access
                    </div>
                </div>
            </div>

            {/* ── Left Brand Panel (desktop only) ── */}
            <div
                className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, #06124f 0%, #0a2a5e 45%, #0d3a7a 100%)" }}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "#00bcd4" }} />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: "#00bcd4" }} />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-5" style={{ background: "#ffffff" }} />
                    {/* Grid dots */}
                    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-xl p-2 shadow-lg">
                            <Image src="/logo.png" alt="Viros" width={44} height={44} className="object-contain" />
                        </div>
                        <div>
                            <p className="text-white font-black text-xl tracking-wide">VIROS</p>
                            <p className="text-white/50 text-xs tracking-widest uppercase">Management Portal</p>
                        </div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 w-fit"
                        style={{ background: "rgba(0,188,212,0.15)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.3)" }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        Secure Admin Access
                    </div>

                    <h1 className="text-4xl font-black text-white leading-tight mb-4">
                        Welcome to<br />
                        <span style={{ color: "#00bcd4" }}>VIROS Portal</span>
                    </h1>
                    <p className="text-white/60 text-base leading-relaxed max-w-sm mb-10">
                        Centralized management for your website content, products, services and team operations.
                    </p>

                    {/* Feature list */}
                    <div className="grid grid-cols-1 gap-3">
                        {FEATURES.map((f) => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                >
                                    {f.icon}
                                </div>
                                <span className="text-white/70 text-sm">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="relative z-10">
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} VIROS. All rights reserved.
                    </p>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex-1 flex flex-col bg-white lg:items-center lg:justify-center">
                <div className="flex-1 flex flex-col px-5 pt-8 pb-8 lg:px-10 lg:pt-16 lg:pb-0 w-full lg:max-w-md">

                    {/* Heading */}
                    <div className="mb-6 lg:mb-8">
                        <h2 className="text-xl lg:text-2xl font-black text-gray-900 mb-1">Sign in to your account</h2>
                        <p className="text-gray-500 text-sm">Enter your credentials to access the portal</p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
                    >
                        {error && (
                            <div
                                className={`rounded-xl border p-3.5 text-sm ${loginAlertStyles(loginErrorCode).box}`}
                                role="alert"
                            >
                                <p className="font-bold">
                                    {loginAlertStyles(loginErrorCode).title}
                                </p>
                                <p className="mt-1.5 leading-relaxed">{error}</p>
                                {loginErrorCode === "ATTENDANCE_PORTAL_DISABLED" && (
                                    <p className="mt-2 text-xs leading-relaxed opacity-90">
                                        {missedWorkingDays != null && missedWorkingDays >= 2
                                            ? `Missed check-in on ${missedWorkingDays} consecutive working day(s). `
                                            : null}
                                        Please mark attendance daily on working days or apply leave in the
                                        portal before absence. HR/Admin can enable your account again from
                                        Employee Access.
                                    </p>
                                )}
                                {loginErrorCode === "INVALID_CREDENTIALS" && (
                                    <p className="mt-2 text-xs opacity-90">
                                        Check your employee ID or email and password, or use Forgot password.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Identifier */}
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Employee ID or Email
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                placeholder="e.g. EMP001 or name@company.com"
                                autoComplete="username"
                                value={formValues.identifier}
                                onChange={handleInput}
                                required
                                className="w-full px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                                style={{ height: "52px" }}
                                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = "#fff"; }}
                                onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    value={formValues.password}
                                    onChange={handleInput}
                                    required
                                    className="w-full px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                                    style={{ height: "52px" }}
                                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = "#fff"; }}
                                    onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between py-1">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: ACCENT }}
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setForgotOpen(true)}
                                className="cursor-pointer text-sm font-bold transition-colors hover:opacity-80"
                                style={{ color: ACCENT }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full cursor-pointer font-bold text-sm text-white tracking-wide rounded-2xl transition-all duration-200 active:scale-[0.97] hover:opacity-90 disabled:cursor-not-allowed"
                            style={{ height: "54px", background: GRADIENT, boxShadow: `0 6px 20px ${SHADOW}` }}
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </button>

                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6 lg:mt-8">
                        © {new Date().getFullYear()} VIROS. All rights reserved.
                    </p>

                </div>
            </div>

            {/* Forgot password modal — employee OTP reset */}
            {forgotOpen && (
                <div
                    className="fixed inset-0 z-50 flex cursor-pointer items-end justify-center overflow-hidden bg-[#06124f]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="forgot-password-title"
                    onClick={closeForgotModal}
                >
                    <div
                        className="relative z-10 flex w-full max-w-md max-h-[min(92dvh,720px)] cursor-default flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="relative shrink-0 overflow-hidden px-6 pb-8 pt-6"
                            style={{ background: "linear-gradient(145deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)" }}
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20" style={{ background: "#00bcd4" }} />
                            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-15" style={{ background: "#00bcd4" }} />

                            <button
                                type="button"
                                onClick={handleForgotCloseClick}
                                className="absolute right-4 top-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                                aria-label="Close forgot password dialog"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="relative flex flex-col items-center text-center">
                                <div
                                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                                    style={{ background: "rgba(0,188,212,0.2)", border: "1px solid rgba(0,188,212,0.4)" }}
                                >
                                    {forgotStep === "success" ? (
                                        <svg className="h-7 w-7 text-[#00e5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : forgotStep === "verify" ? (
                                        <svg className="h-7 w-7 text-[#00e5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-7 w-7 text-[#00e5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    )}
                                </div>
                                <h3 id="forgot-password-title" className="text-xl font-black text-white">
                                    {forgotStep === "request" && "Forgot password?"}
                                    {forgotStep === "verify" && "Enter verification code"}
                                    {forgotStep === "success" && "Password updated"}
                                </h3>
                                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
                                    {forgotStep === "request" &&
                                        "Enter employee ID or email. We verify admin (users) or employee (portal) accounts, then send a 7-digit OTP to the registered email."}
                                    {forgotStep === "verify" && (
                                        <>
                                            Code sent to{" "}
                                            <span className="font-semibold text-white/80">{forgotEmail}</span>
                                        </>
                                    )}
                                    {forgotStep === "success" &&
                                        "Your password has been updated. Sign in with your new password."}
                                </p>
                            </div>
                        </div>

                        <div
                            className={`min-h-0 flex-1 px-6 py-6 ${
                                forgotStep === "verify" ? "overflow-y-auto overscroll-contain" : "overflow-x-hidden"
                            }`}
                        >
                            {forgotError && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                                    {forgotError}
                                </div>
                            )}

                            {forgotStep === "request" && (
                                <form
                                    onSubmit={handleRequestOTP}
                                    className="flex flex-col gap-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
                                >
                                    <div>
                                        <label htmlFor="forgot-identifier" className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            Employee ID or email
                                        </label>
                                        <input
                                            id="forgot-identifier"
                                            type="text"
                                            placeholder="e.g. EMP001 or name@company.com"
                                            autoComplete="username"
                                            value={forgotIdentifier}
                                            onChange={(e) => setForgotIdentifier(e.target.value)}
                                            required
                                            disabled={forgotLoading}
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all disabled:opacity-60"
                                            style={{ height: "52px" }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`;
                                                e.currentTarget.style.borderColor = ACCENT;
                                                e.currentTarget.style.background = "#fff";
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.borderColor = "#e5e7eb";
                                                e.currentTarget.style.background = "#f9fafb";
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full cursor-pointer rounded-2xl text-sm font-bold tracking-wide text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{ height: "52px", background: GRADIENT, boxShadow: `0 6px 20px ${SHADOW}` }}
                                    >
                                        {forgotLoading ? "Sending..." : "Send OTP"}
                                    </button>
                                </form>
                            )}

                            {forgotStep === "verify" && (
                                <form
                                    onSubmit={handleResetPassword}
                                    className="flex flex-col gap-4 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed"
                                >
                                    <div>
                                        <label htmlFor="forgot-otp" className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            7-digit OTP
                                        </label>
                                        <input
                                            id="forgot-otp"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d{7}"
                                            maxLength={7}
                                            placeholder="0000000"
                                            value={forgotOtp}
                                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                            required
                                            disabled={forgotLoading}
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center font-mono text-2xl tracking-widest text-gray-800 outline-none transition-all disabled:opacity-60"
                                            style={{ height: "52px" }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`;
                                                e.currentTarget.style.borderColor = ACCENT;
                                                e.currentTarget.style.background = "#fff";
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.borderColor = "#e5e7eb";
                                                e.currentTarget.style.background = "#f9fafb";
                                            }}
                                        />
                                        <p className="mt-1 text-center text-xs text-gray-400">Expires in 15 minutes</p>
                                    </div>

                                    <div>
                                        <label htmlFor="forgot-new-password" className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            New password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="forgot-new-password"
                                                type={showForgotPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={forgotNewPassword}
                                                onChange={(e) => setForgotNewPassword(e.target.value)}
                                                required
                                            minLength={forgotAccountType === "admin" ? 8 : 6}
                                            disabled={forgotLoading}
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all disabled:opacity-60"
                                            style={{ height: "52px" }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`;
                                                e.currentTarget.style.borderColor = ACCENT;
                                                e.currentTarget.style.background = "#fff";
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.borderColor = "#e5e7eb";
                                                e.currentTarget.style.background = "#f9fafb";
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword((p) => !p)}
                                            className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-400 hover:text-gray-600"
                                        >
                                                {showForgotPassword ? (
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="forgot-confirm-password" className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            Confirm password
                                        </label>
                                        <input
                                            id="forgot-confirm-password"
                                            type={showForgotPassword ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={forgotConfirmPassword}
                                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                            required
                                            minLength={forgotAccountType === "admin" ? 8 : 6}
                                            disabled={forgotLoading}
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all disabled:opacity-60"
                                            style={{ height: "52px" }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}28`;
                                                e.currentTarget.style.borderColor = ACCENT;
                                                e.currentTarget.style.background = "#fff";
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.borderColor = "#e5e7eb";
                                                e.currentTarget.style.background = "#f9fafb";
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full cursor-pointer rounded-2xl text-sm font-bold tracking-wide text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{ height: "52px", background: GRADIENT, boxShadow: `0 6px 20px ${SHADOW}` }}
                                    >
                                        {forgotLoading ? "Updating..." : "Reset password"}
                                    </button>

                                    <p className="text-center text-xs text-gray-400">
                                        Didn&apos;t receive the code?{" "}
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={forgotLoading}
                                            className="cursor-pointer font-semibold transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{ color: ACCENT }}
                                        >
                                            Resend OTP
                                        </button>
                                    </p>
                                </form>
                            )}

                            {forgotStep === "success" && (
                                <div className="flex flex-col gap-4">
                                    <div
                                        className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
                                        style={{ background: "rgba(0,188,212,0.08)", borderColor: "rgba(0,188,212,0.25)" }}
                                    >
                                        <span className="mt-0.5 text-lg">✓</span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Password reset complete</p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                                                Only your portal password was updated. You can sign in now.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeForgotModal}
                                        className="w-full cursor-pointer rounded-2xl text-sm font-bold tracking-wide text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                                        style={{ height: "52px", background: GRADIENT, boxShadow: `0 6px 20px ${SHADOW}` }}
                                    >
                                        Continue to sign in
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
