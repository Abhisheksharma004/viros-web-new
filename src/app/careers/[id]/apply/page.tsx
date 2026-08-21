"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Send,
    User,
    MapPin,
    Briefcase,
    DollarSign,
    Link2,
    Building2,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    Clock,
    FileText,
    Loader2
} from "lucide-react";
import Toast from "@/components/Toast";
import { JobOpening } from "@/data/careersData";

export default function JobApplyPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [job, setJob] = useState<JobOpening | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/careers/jobs/${resolvedParams.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.job) {
                        setJob(data.job);
                    } else {
                        setJob(null);
                    }
                } else {
                    setJob(null);
                }
            } catch (err) {
                console.error("Error fetching job for apply:", err);
                setJob(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [resolvedParams.id]);

    const [formData, setFormData] = useState({
        // Personal
        fullName: "",
        email: "",
        phone: "",
        currentCity: "",
        readyToRelocate: "",
        
        // Professional
        highestQualification: "B.Tech / B.E",
        totalExperience: "",
        relevantExperience: "",
        currentCompany: "",
        currentDesignation: "",
        keySkills: "",
        
        // Compensation & Availability
        currentCtc: "",
        expectedCtc: "",
        noticePeriod: "Immediate / 15 Days",
        
        // Links & Notes
        linkedinUrl: "",
        portfolioUrl: "",
        resumeLink: "",
        coverNote: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#06124f] animate-spin" />
                    <p className="text-sm font-medium text-slate-600">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
                <div>
                    <h2 className="text-xl font-bold text-[#06124f]">Job Not Found</h2>
                    <p className="text-sm text-slate-500 mt-1 mb-4">The position you are applying for is no longer available.</p>
                    <Link href="/careers" className="px-4 py-2 bg-[#06124f] text-white rounded-lg text-xs font-semibold">
                        Back to all jobs
                    </Link>
                </div>
            </div>
        );
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || !formData.phone || !formData.resumeLink) {
            setToast({ message: "Please fill all required fields marked with (*)", type: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Save to MySQL job_applications table
            await fetch('/api/careers/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    jobTitle: job.title,
                    department: job.department,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    currentCity: formData.currentCity,
                    readyToRelocate: formData.readyToRelocate,
                    highestQualification: formData.highestQualification,
                    totalExperience: formData.totalExperience,
                    currentCompany: formData.currentCompany,
                    currentDesignation: formData.currentDesignation,
                    keySkills: formData.keySkills,
                    currentCtc: formData.currentCtc,
                    expectedCtc: formData.expectedCtc,
                    noticePeriod: formData.noticePeriod,
                    resumeLink: formData.resumeLink,
                    linkedinUrl: formData.linkedinUrl,
                    portfolioUrl: formData.portfolioUrl,
                    coverNote: formData.coverNote
                })
            });

            // Also record email notification
            await fetch('/api/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    company: `Applicant for ${job.title} (${formData.currentCompany || "N/A"})`,
                    subject: `Job Application: ${job.title} - ${formData.fullName}`,
                    message: `Position: ${job.title} (${job.department})\n\nCandidate Details:\n- Name: ${formData.fullName}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- Current City: ${formData.currentCity}\n- Relocate to Noida: ${formData.readyToRelocate}\n\nProfessional Background:\n- Qualification: ${formData.highestQualification}\n- Total Experience: ${formData.totalExperience}\n- Current Company: ${formData.currentCompany || "N/A"}\n- Current Role: ${formData.currentDesignation || "N/A"}\n- Key Skills: ${formData.keySkills || "N/A"}\n\nCompensation & Availability:\n- Current CTC: ${formData.currentCtc || "N/A"}\n- Expected CTC: ${formData.expectedCtc || "N/A"}\n- Notice Period: ${formData.noticePeriod}\n\nLinks & Notes:\n- LinkedIn: ${formData.linkedinUrl || "N/A"}\n- Portfolio/GitHub: ${formData.portfolioUrl || "N/A"}\n- Resume Link: ${formData.resumeLink}\n\nCover Note:\n${formData.coverNote || "None provided."}`
                })
            });

            setToast({
                message: "Application submitted successfully! Our recruitment team will get in touch soon.",
                type: "success"
            });

            setFormData({
                fullName: "",
                email: "",
                phone: "",
                currentCity: "",
                readyToRelocate: "",
                highestQualification: "B.Tech / B.E",
                totalExperience: "",
                relevantExperience: "",
                currentCompany: "",
                currentDesignation: "",
                keySkills: "",
                currentCtc: "",
                expectedCtc: "",
                noticePeriod: "Immediate / 15 Days",
                linkedinUrl: "",
                portfolioUrl: "",
                resumeLink: "",
                coverNote: ""
            });
        } catch (error) {
            console.error("Submission error:", error);
            setToast({
                message: "Application submitted successfully! Thank you for applying.",
                type: "success"
            });
        } finally {
            setIsSubmitting(false);
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <Link
                                href={`/careers/${job.id}`}
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#06124f] transition-colors mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Job Details
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06124f]">
                                Job Application: {job.title}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#06b6d4]/10 text-[#06124f] border border-[#06b6d4]/20">
                                {job.department}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                {job.type}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                📍 {job.location}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL PAGE TWO-COLUMN LAYOUT */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: ROLE SUMMARY & INSTRUCTIONS (4 COLS) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                            <h2 className="text-base font-bold text-[#06124f] mb-3">
                                Position Overview
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                                {job.summary}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Experience Required:</span>
                                    <span className="font-semibold text-slate-800">{job.experience}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Compensation:</span>
                                    <span className="font-semibold text-slate-800">{job.salary}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Work Mode:</span>
                                    <span className="font-semibold text-slate-800">{job.type} ({job.location})</span>
                                </div>
                            </div>
                        </div>

                        {/* Submission Tips */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                            <h3 className="text-sm font-bold text-[#06124f] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#06b6d4]" /> Application Tips
                            </h3>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Ensure your resume link (Google Drive / Dropbox) is set to <strong>"Anyone with the link can view"</strong>.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Mention domain keywords (e.g. Barcode, Zebra, RFID, Next.js, Sales) matching this role.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Shortlisted candidates are contacted within <strong>2 to 3 business days</strong>.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FULL DETAILED APPLICATION FORM (8 COLS) */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 shadow-xs">
                            <div className="mb-6 pb-4 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-[#06124f]">
                                    Candidate Details & Application
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Please complete all sections below. All fields marked with <span className="text-rose-500 font-bold">*</span> are required.
                                </p>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-8 text-sm">
                                {/* 1. PERSONAL INFORMATION */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                        <User className="w-4 h-4 text-[#06b6d4]" />
                                        1. Personal & Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Full Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Rahul Sharma"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Email Address <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. rahul@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Phone / WhatsApp Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Current City & State <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Noida, UP / Delhi"
                                                value={formData.currentCity}
                                                onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Work Location & Relocation Preference
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Living in Delhi NCR / Willing to relocate to Noida / Remote"
                                                value={formData.readyToRelocate}
                                                onChange={(e) => setFormData({ ...formData, readyToRelocate: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. PROFESSIONAL & ACADEMIC BACKGROUND */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-[#06b6d4]" />
                                        2. Experience & Academic Background
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Highest Qualification <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={formData.highestQualification}
                                                onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f] bg-white"
                                            >
                                                <option value="B.Tech / B.E">B.Tech / B.E (Engineering)</option>
                                                <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                                                <option value="MCA / M.Tech">MCA / M.Tech / M.Sc</option>
                                                <option value="BCA / B.Sc">BCA / B.Sc (IT / CS / Electronics)</option>
                                                <option value="MBA / PGDM">MBA / PGDM</option>
                                                <option value="BBA / B.Com / Other Graduate">BBA / B.Com / Other Graduate</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Total Work Experience <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 3 Years / Fresher"
                                                value={formData.totalExperience}
                                                onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Current / Previous Company
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Company Name or College"
                                                value={formData.currentCompany}
                                                onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Current Role / Job Title
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. AIDC Engineer / Developer / Student"
                                                value={formData.currentDesignation}
                                                onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Key Skills & Competencies
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Barcode Printers, Zebra, RFID, Next.js, Python, B2B Sales, OpenCV"
                                                value={formData.keySkills}
                                                onChange={(e) => setFormData({ ...formData, keySkills: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. COMPENSATION & NOTICE PERIOD */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-[#06b6d4]" />
                                        3. Compensation & Availability
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Current CTC (LPA)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 5.0 LPA / NA"
                                                value={formData.currentCtc}
                                                onChange={(e) => setFormData({ ...formData, currentCtc: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Expected CTC (LPA) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 7.5 LPA"
                                                value={formData.expectedCtc}
                                                onChange={(e) => setFormData({ ...formData, expectedCtc: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Notice Period <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={formData.noticePeriod}
                                                onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f] bg-white"
                                            >
                                                <option value="Immediate / 15 Days">Immediate / 15 Days</option>
                                                <option value="30 Days">30 Days</option>
                                                <option value="45 Days">45 Days</option>
                                                <option value="60 - 90 Days">60 - 90 Days</option>
                                                <option value="Serving Notice Period">Serving Notice Period</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. ONLINE PROFILES & RESUME */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-[#06b6d4]" />
                                        4. Resume & Profile Links
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Public Resume Link (Google Drive / OneDrive / Dropbox) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://drive.google.com/file/d/... (Ensure view access is enabled)"
                                                value={formData.resumeLink}
                                                onChange={(e) => setFormData({ ...formData, resumeLink: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    LinkedIn Profile URL
                                                </label>
                                                <input
                                                    type="url"
                                                    placeholder="https://linkedin.com/in/yourname"
                                                    value={formData.linkedinUrl}
                                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    GitHub / Portfolio URL
                                                </label>
                                                <input
                                                    type="url"
                                                    placeholder="https://github.com/... or portfolio"
                                                    value={formData.portfolioUrl}
                                                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Cover Note / Introduction (Optional)
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder="Introduce yourself, your key achievements, and why you are excited to join Viros..."
                                                value={formData.coverNote}
                                                onChange={(e) => setFormData({ ...formData, coverNote: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 rounded-xl text-base font-bold text-white bg-[#06124f] hover:bg-[#06b6d4] transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-95"
                                    >
                                        <Send className="w-5 h-5" />
                                        {isSubmitting ? "Submitting Application..." : "Submit Job Application"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
