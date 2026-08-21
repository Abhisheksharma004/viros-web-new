"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Send,
    MapPin,
    Briefcase,
    DollarSign,
    Share2,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    HeartPulse,
    GraduationCap,
    Laptop,
    Check,
    Building2,
    Clock
} from "lucide-react";
import Toast from "@/components/Toast";
import { JOB_OPENINGS } from "@/data/careersData";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [job, setJob] = useState(JOB_OPENINGS.find((j) => j.id === resolvedParams.id) || null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/careers/jobs/${resolvedParams.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.job) {
                        setJob(data.job);
                    }
                }
            } catch (err) {
                console.error("Error fetching live job:", err);
            }
        };
        fetchJob();
    }, [resolvedParams.id]);

    if (!job) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
                <div>
                    <h2 className="text-xl font-bold text-[#06124f]">Job Not Found</h2>
                    <p className="text-sm text-slate-500 mt-1 mb-4">This position may have been filled or closed.</p>
                    <Link href="/careers" className="px-4 py-2 bg-[#06124f] text-white rounded-lg text-xs font-semibold">
                        Back to all jobs
                    </Link>
                </div>
            </div>
        );
    }

    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setToast({ message: "Job link copied to clipboard!", type: "success" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* FULL WIDTH TOP BAR */}
            <div className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <Link
                                href="/careers"
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#06124f] transition-colors mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Careers
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06124f]">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#06b6d4]/10 text-[#06124f] border border-[#06b6d4]/20">
                                    {job.department}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                    {job.type}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    📍 {job.location}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleShare}
                                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Share2 className="w-4 h-4 text-slate-500" />
                                {copied ? "Link Copied!" : "Share"}
                            </button>
                            <Link
                                href={`/careers/${job.id}/apply`}
                                className="px-6 py-2.5 rounded-lg bg-[#06124f] hover:bg-[#06b6d4] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-xs hover:scale-[1.01] active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                                Apply for this Position
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL PAGE TWO-COLUMN LAYOUT */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: ROLE SPECIFICATIONS & QUICK APPLY (4 COLS) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                        {/* Highlights Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                            <h2 className="text-base font-bold text-[#06124f] mb-4 pb-3 border-b border-slate-100">
                                Job Snapshot
                            </h2>

                            <div className="space-y-3.5 text-xs sm:text-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-slate-400" /> Department:
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">{job.department}</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" /> Employment:
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">{job.type}</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-slate-400" /> Location:
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">{job.location}</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 text-slate-400" /> Experience:
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">{job.experience}</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-slate-400" /> Compensation:
                                    </span>
                                    <span className="font-semibold text-slate-800 text-right">{job.salary}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <Link
                                    href={`/careers/${job.id}/apply`}
                                    className="w-full py-3 rounded-lg text-sm font-bold text-white bg-[#06124f] hover:bg-[#06b6d4] transition-all flex items-center justify-center gap-2 shadow-xs"
                                >
                                    <Send className="w-4 h-4" />
                                    Apply for this Position
                                </Link>
                            </div>
                        </div>

                        {/* Quick Viros Perks Snapshot */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                            <h3 className="text-sm font-bold text-[#06124f] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#06b6d4]" /> Why Work at Viros?
                            </h3>
                            <ul className="space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Work with Fortune 500 manufacturing & logistics enterprises.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Industry-recognized OEM certifications (Zebra, Honeywell).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Comprehensive medical health insurance for you and your family.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DETAILED ROLE SPECIFICATIONS (8 COLS) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* 1. Overview */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                            <h2 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-3">
                                1. Role Overview
                            </h2>
                            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                                {job.summary}
                            </p>

                            {/* Tags */}
                            {job.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                    {job.tags.map((tag, idx) => (
                                        <span key={idx} className="px-2.5 py-1 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Responsibilities */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                            <h2 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4">
                                2. Key Responsibilities
                            </h2>
                            <ul className="space-y-3">
                                {job.responsibilities.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                                        <Check className="w-5 h-5 text-[#06b6d4] shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. Requirements */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                            <h2 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4">
                                3. Candidate Requirements & Qualifications
                            </h2>
                            <ul className="space-y-3">
                                {job.requirements.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                                        <Check className="w-5 h-5 text-[#06b6d4] shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 4. Nice to have */}
                        {job.niceToHave.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                                <h2 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4">
                                    4. Preferred / Nice to Have
                                </h2>
                                <ul className="space-y-3">
                                    {job.niceToHave.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                                            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 5. What We Offer */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                            <h2 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4">
                                5. What We Offer
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <TrendingUp className="w-5 h-5 text-[#06b6d4] mb-2" />
                                    <h4 className="font-bold text-xs text-[#06124f]">Career Growth</h4>
                                    <p className="text-xs text-slate-600 mt-1">Clear appraisal tracks and continuous advancement.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <HeartPulse className="w-5 h-5 text-[#06b6d4] mb-2" />
                                    <h4 className="font-bold text-xs text-[#06124f]">Health & Wellness</h4>
                                    <p className="text-xs text-slate-600 mt-1">Medical coverage for employees and family members.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <GraduationCap className="w-5 h-5 text-[#06b6d4] mb-2" />
                                    <h4 className="font-bold text-xs text-[#06124f]">OEM Certifications</h4>
                                    <p className="text-xs text-slate-600 mt-1">Zebra, Honeywell & barcode engineering training.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                                    <Laptop className="w-5 h-5 text-[#06b6d4] mb-2" />
                                    <h4 className="font-bold text-xs text-[#06124f]">Workstation & Lab Equipment</h4>
                                    <p className="text-xs text-slate-600 mt-1">High-performance laptops, scanners, and testing labs.</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Full Banner Apply */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-[#06124f]">
                                    Ready to apply for this role?
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Submit your resume and contact details to get in touch with our HR team.
                                </p>
                            </div>
                            <Link
                                href={`/careers/${job.id}/apply`}
                                className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#06124f] hover:bg-[#06b6d4] transition-colors shrink-0 flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Apply for this Position
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
