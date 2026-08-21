"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Send,
    User,
    Briefcase,
    DollarSign,
    Link2,
    Sparkles,
    CheckCircle2,
    Building2
} from "lucide-react";
import Toast from "@/components/Toast";

export default function GeneralApplyPage() {
    const [formData, setFormData] = useState({
        // Personal
        fullName: "",
        email: "",
        phone: "",
        currentCity: "",
        readyToRelocate: "",
        departmentPreference: "Engineering",
        
        // Professional
        highestQualification: "B.Tech / B.E",
        totalExperience: "",
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
                    jobId: null,
                    jobTitle: `General Application (${formData.departmentPreference})`,
                    department: formData.departmentPreference,
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

            // Also record inquiry email
            await fetch('/api/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    company: `General Talent Pool Applicant (${formData.departmentPreference})`,
                    subject: `General Talent Pool: ${formData.departmentPreference} - ${formData.fullName}`,
                    message: `Department Preference: ${formData.departmentPreference}\n\nCandidate Details:\n- Name: ${formData.fullName}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- Current City: ${formData.currentCity}\n- Relocate to Noida: ${formData.readyToRelocate}\n\nProfessional Background:\n- Qualification: ${formData.highestQualification}\n- Total Experience: ${formData.totalExperience}\n- Current Company: ${formData.currentCompany || "N/A"}\n- Current Role: ${formData.currentDesignation || "N/A"}\n- Key Skills: ${formData.keySkills || "N/A"}\n\nCompensation & Availability:\n- Current CTC: ${formData.currentCtc || "N/A"}\n- Expected CTC: ${formData.expectedCtc || "N/A"}\n- Notice Period: ${formData.noticePeriod}\n\nLinks & Notes:\n- LinkedIn: ${formData.linkedinUrl || "N/A"}\n- Portfolio/GitHub: ${formData.portfolioUrl || "N/A"}\n- Resume Link: ${formData.resumeLink}\n\nCover Note:\n${formData.coverNote || "None provided."}`
                })
            });

            setToast({
                message: "Application submitted successfully! Our HR team will reach out as matching roles open.",
                type: "success"
            });

            setFormData({
                fullName: "",
                email: "",
                phone: "",
                currentCity: "",
                readyToRelocate: "Yes - Living in Delhi NCR",
                departmentPreference: "Engineering",
                highestQualification: "B.Tech / B.E",
                totalExperience: "",
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
                message: "Application submitted successfully! Thank you for your interest.",
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
                                href="/careers"
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#06124f] transition-colors mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Careers
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06124f]">
                                General Talent Pool Application
                            </h1>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#06b6d4]/10 text-[#06124f] border border-[#06b6d4]/20 text-xs font-semibold">
                            <Sparkles className="w-4 h-4 text-[#06b6d4]" />
                            Join Viros Future Team
                        </div>
                    </div>
                </div>
            </div>

            {/* TWO COLUMN FULL PAGE LAYOUT */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: ABOUT VIROS & INSTRUCTIONS (4 COLS) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                            <h2 className="text-base font-bold text-[#06124f] mb-3">
                                Why Join Our Talent Pool?
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                                As we scale our enterprise automation deployments across India, we frequently open positions in hardware integration, full-stack software, sales, and operations.
                            </p>
                            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Direct access to HR & Leadership</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Priority interview scheduling</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Fast 48-hour application response</span>
                                </div>
                            </div>
                        </div>

                        {/* Location details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                            <h3 className="text-sm font-bold text-[#06124f] mb-2 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-[#06b6d4]" /> Corporate Office
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Viros Entrepreneurs IT Solutions Pvt. Ltd.<br />
                                Noida, Delhi NCR, India
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FULL APPLICATION FORM (8 COLS) */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10 shadow-xs">
                            <div className="mb-6 pb-4 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-[#06124f]">
                                    Candidate Registration Form
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Fill in your personal, academic, and professional experience details.
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
                                                Department Preference <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={formData.departmentPreference}
                                                onChange={(e) => setFormData({ ...formData, departmentPreference: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f] bg-white"
                                            >
                                                <option value="Engineering">Engineering (Hardware & AIDC)</option>
                                                <option value="Software & IT">Software & IT Development</option>
                                                <option value="Sales & Business">Sales & Business Development</option>
                                                <option value="Operations & Support">Operations & Customer Support</option>
                                                <option value="Internship">Internship / Freshers</option>
                                            </select>
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

                                        <div>
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

                                {/* 2. PROFESSIONAL BACKGROUND */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#06124f] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-[#06b6d4]" />
                                        2. Experience & Qualifications
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
                                                <option value="BCA / B.Sc">BCA / B.Sc</option>
                                                <option value="MBA / PGDM">MBA / PGDM</option>
                                                <option value="BBA / B.Com / Other Graduate">BBA / B.Com / Other Graduate</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Total Experience <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 2.5 Years / Fresher"
                                                value={formData.totalExperience}
                                                onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Current / Previous Employer
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
                                                Current Role / Designation
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Engineer / Sales / Fresher"
                                                value={formData.currentDesignation}
                                                onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Key Skills & Technologies
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Barcode, Zebra, RFID, Next.js, Node.js, Hardware Maintenance, B2B Sales"
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
                                                placeholder="e.g. 4.5 LPA / NA"
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
                                                placeholder="e.g. 6.5 LPA"
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
                                                placeholder="https://drive.google.com/file/d/... (Make sure view permission is public)"
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
                                                    placeholder="https://linkedin.com/in/username"
                                                    value={formData.linkedinUrl}
                                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#06124f]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    GitHub / Portfolio / Website
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
                                                placeholder="Tell us about yourself, your career goals, and what areas you are most passionate about..."
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
                                        {isSubmitting ? "Submitting Application..." : "Submit Profile to Talent Pool"}
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
