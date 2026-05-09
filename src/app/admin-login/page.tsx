"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const ACCENT = "#0a2a5e";
const GRADIENT = "linear-gradient(135deg, #06124f, #0a2a5e)";
const SHADOW = "rgba(10,42,94,0.35)";

const FEATURES = [
    { icon: "🔒", text: "Secure encrypted access" },
    { icon: "📊", text: "Real-time dashboard analytics" },
    { icon: "🌐", text: "Full website content control" },
    { icon: "📦", text: "Product & service management" },
];

export default function AdminLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formValues, setFormValues] = useState({ email: "", password: "" });

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues((prev) => ({ ...prev, [e.target.id]: e.target.value }));
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
                    <form className="flex flex-col gap-4">

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                autoComplete="email"
                                value={formValues.email}
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
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                                <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm font-bold transition-colors" style={{ color: ACCENT }}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full font-bold text-sm text-white tracking-wide rounded-2xl transition-all duration-200 active:scale-[0.97] hover:opacity-90"
                            style={{ height: "54px", background: GRADIENT, boxShadow: `0 6px 20px ${SHADOW}` }}
                        >
                            Sign In
                        </button>

                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6 lg:mt-8">
                        © {new Date().getFullYear()} VIROS. All rights reserved.
                    </p>

                </div>
            </div>
        </div>
    );
}
