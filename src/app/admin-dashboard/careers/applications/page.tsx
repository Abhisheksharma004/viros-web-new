"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    Search,
    Eye,
    Check,
    X,
    FileText,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    DollarSign,
    GraduationCap,
    Clock,
    Building2,
    Calendar,
    Award,
    Globe,
    CheckCircle2
} from "lucide-react";
import Toast from "@/components/Toast";

interface CandidateApplication {
    id: string;
    jobId?: string;
    jobTitle?: string;
    role: string;
    department: string;
    fullName: string;
    email: string;
    phone: string;
    currentCity: string;
    readyToRelocate?: string;
    highestQualification: string;
    totalExperience?: string;
    experience: string;
    currentCompany?: string;
    currentDesignation?: string;
    keySkills?: string;
    currentCtc?: string;
    expectedCtc: string;
    noticePeriod: string;
    resumeLink: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    coverNote?: string;
    status: "new" | "reviewed" | "interview" | "shortlisted" | "rejected";
    appliedDate: string;
}

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<CandidateApplication[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedDepartment, setSelectedDepartment] = useState("All");
    const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadApplications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/careers/applications");
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.applications)) {
                    const formatted = data.applications.map((app: any) => ({
                        ...app,
                        role: app.jobTitle || app.role || "General Application",
                        experience: app.totalExperience || app.experience || "N/A"
                    }));
                    setApplications(formatted);
                }
            }
        } catch (err) {
            console.error("Error loading applications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const departments = ["All", "Engineering", "Software & IT", "Sales & Business", "Operations & Support", "General Talent Pool"];

    const stats = useMemo(() => {
        return [
            { label: "Total Applications", value: applications.length, tone: "text-gray-900" },
            { label: "New Submissions", value: applications.filter(a => a.status === "new").length, tone: "text-blue-600" },
            { label: "Interview Stage", value: applications.filter(a => a.status === "interview").length, tone: "text-amber-600" },
            { label: "Shortlisted", value: applications.filter(a => a.status === "shortlisted").length, tone: "text-green-600" },
        ];
    }, [applications]);

    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus = selectedStatus === "all" || app.status === selectedStatus;
            const matchesDept = selectedDepartment === "All" || app.department === selectedDepartment;
            const matchesSearch = searchQuery === "" ||
                app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.keySkills && app.keySkills.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesDept && matchesSearch;
        });
    }, [applications, selectedStatus, selectedDepartment, searchQuery]);

    const handleUpdateStatus = async (id: string, newStatus: CandidateApplication["status"]) => {
        try {
            const res = await fetch(`/api/careers/applications/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
                if (selectedApp && selectedApp.id === id) {
                    setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
                }
                setToast({ message: `Status updated to ${newStatus.toUpperCase()}`, type: "success" });
            } else {
                setToast({ message: "Failed to update status in database.", type: "error" });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            setToast({ message: "Network error updating status.", type: "error" });
        }
    };

    const getStatusBadge = (status: CandidateApplication["status"]) => {
        switch (status) {
            case "new":
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 ring-1 ring-blue-600/15">New</span>;
            case "reviewed":
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-800 ring-1 ring-purple-600/15">Reviewed</span>;
            case "interview":
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 ring-1 ring-amber-600/15">Interview</span>;
            case "shortlisted":
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-800 ring-1 ring-green-600/15">Shortlisted</span>;
            case "rejected":
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 ring-1 ring-rose-600/15">Rejected</span>;
            default:
                return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-800 ring-1 ring-gray-600/15">Unknown</span>;
        }
    };

    return (
        <div className="space-y-6 relative pb-12">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* TOP ACTION BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Job Applications & Candidates</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Review candidate profiles, resumes, qualifications, and manage recruitment stages.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadApplications}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer"
                    >
                        Refresh List
                    </button>
                    <Link
                        href="/admin-dashboard/careers/job-post"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[#06124f] text-white hover:bg-[#0a2a5e] shadow-xs"
                    >
                        Manage Job Posts
                    </Link>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item) => (
                    <div key={item.label} className="bg-white rounded-md border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-white rounded-md border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by candidate name, email, role, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-900 bg-white focus:ring-1 focus:ring-[#06124f] outline-none"
                    >
                        <option value="all">All Stages</option>
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="interview">Interview</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    {/* Department filter */}
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-900 bg-white focus:ring-1 focus:ring-[#06124f] outline-none"
                    >
                        {departments.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* CANDIDATES TABLE */}
            <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Position Applied</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience & CTC</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Applied Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                        {isLoading ? "Loading applications from database..." : "No job applications found matching your criteria."}
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{app.fullName}</div>
                                            <div className="text-xs text-gray-500">{app.email} • {app.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-800 font-medium">{app.role}</div>
                                            <span className="text-[11px] text-gray-400">{app.department}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                                            <div className="font-semibold text-gray-900">{app.experience}</div>
                                            <div className="text-gray-500 mt-0.5">Exp: {app.expectedCtc}</div>
                                            <div className="text-gray-400">{app.currentCity}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {app.appliedDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedApp(app)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 shadow-xs cursor-pointer"
                                                title="View Full Profile"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                            <a
                                                href={app.resumeLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-green-200 bg-green-50 text-xs font-semibold text-green-700 hover:bg-green-100 shadow-xs"
                                                title="Open Resume Link"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Resume
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FULL DETAIL VIEW MODAL - SIMPLE & CLEAN DESIGN */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden my-6">
                        {/* Header Banner */}
                        <div
                            className="px-6 py-4 flex items-center justify-between text-white"
                            style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 100%)" }}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">{selectedApp.fullName}</h3>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-teal-200">
                                        ID #{selectedApp.id}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {selectedApp.role} • <span className="text-teal-300 font-medium">{selectedApp.department}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedApp(null)}
                                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 text-sm text-gray-800 max-h-[75vh] overflow-y-auto">
                            {/* Summary Bar & Quick Resume Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-md border border-gray-200">
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <div>
                                        <span className="text-gray-400 uppercase font-semibold text-[10px] block">Applied Date</span>
                                        <span className="font-semibold text-gray-800">{selectedApp.appliedDate || "Recently"}</span>
                                    </div>
                                    <div className="h-6 w-px bg-gray-200" />
                                    <div>
                                        <span className="text-gray-400 uppercase font-semibold text-[10px] block">Current Stage</span>
                                        <div className="mt-0.5">{getStatusBadge(selectedApp.status)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={selectedApp.resumeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Open Resume PDF
                                        <ExternalLink className="w-3 h-3 ml-0.5" />
                                    </a>
                                </div>
                            </div>

                            {/* Section 1: Contact & Location */}
                            <div>
                                <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[#06b6d4]" />
                                    1. Contact & Location Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Email Address</span>
                                        <a href={`mailto:${selectedApp.email}`} className="text-blue-700 font-semibold hover:underline block mt-0.5 truncate">
                                            {selectedApp.email}
                                        </a>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Phone / WhatsApp</span>
                                        <a href={`tel:${selectedApp.phone}`} className="text-gray-900 font-semibold hover:text-[#06124f] block mt-0.5 font-mono">
                                            {selectedApp.phone}
                                        </a>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Current City & State</span>
                                        <span className="text-gray-900 font-medium block mt-0.5">{selectedApp.currentCity || "N/A"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Relocation Preference</span>
                                        <span className="text-gray-900 font-medium block mt-0.5">{selectedApp.readyToRelocate || "Yes"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Experience & Qualifications */}
                            <div>
                                <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-[#06b6d4]" />
                                    2. Professional & Academic Qualifications
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Highest Qualification</span>
                                        <span className="text-gray-900 font-semibold block mt-0.5">{selectedApp.highestQualification || "Graduate"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Total Work Experience</span>
                                        <span className="text-gray-900 font-semibold block mt-0.5">{selectedApp.experience || selectedApp.totalExperience || "N/A"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Current Employer</span>
                                        <span className="text-gray-900 font-medium block mt-0.5">{selectedApp.currentCompany || "N/A"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Current Role / Designation</span>
                                        <span className="text-gray-900 font-medium block mt-0.5">{selectedApp.currentDesignation || "N/A"}</span>
                                    </div>
                                </div>

                                {selectedApp.keySkills && (
                                    <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Key Skills & Technologies</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedApp.keySkills.split(",").map((sk, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-medium">
                                                    {sk.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Compensation & Notice Period */}
                            <div>
                                <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-[#06b6d4]" />
                                    3. Compensation & Availability
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Current Annual CTC</span>
                                        <span className="text-gray-800 font-semibold block mt-0.5">{selectedApp.currentCtc || "N/A"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Expected Annual CTC</span>
                                        <span className="text-blue-900 font-bold block mt-0.5">{selectedApp.expectedCtc || "N/A"}</span>
                                    </div>
                                    <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase block">Notice Period</span>
                                        <span className="text-emerald-700 font-semibold block mt-0.5">{selectedApp.noticePeriod || "Immediate"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Cloud Resume & External Profiles */}
                            <div>
                                <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-[#06b6d4]" />
                                    4. Profiles & Links
                                </h4>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <a
                                        href={selectedApp.resumeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Candidate Resume Link</span>
                                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                                    </a>

                                    {selectedApp.linkedinUrl && (
                                        <a
                                            href={selectedApp.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold hover:bg-blue-100 transition"
                                        >
                                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                                            <span>LinkedIn Profile</span>
                                            <ExternalLink className="w-3 h-3 text-blue-500" />
                                        </a>
                                    )}

                                    {selectedApp.portfolioUrl && (
                                        <a
                                            href={selectedApp.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold hover:bg-purple-100 transition"
                                        >
                                            <Award className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Portfolio / GitHub</span>
                                            <ExternalLink className="w-3 h-3 text-purple-500" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Section 5: Cover Note */}
                            {selectedApp.coverNote && (
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                                        5. Candidate Cover Note
                                    </h4>
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                        {selectedApp.coverNote}
                                    </div>
                                </div>
                            )}

                            {/* Section 6: Recruitment Stage Pipeline Update */}
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                                    Update Recruitment Stage:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {(["new", "reviewed", "interview", "shortlisted", "rejected"] as const).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => handleUpdateStatus(selectedApp.id, st)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                                selectedApp.status === st
                                                    ? "bg-[#06124f] text-white ring-2 ring-[#06124f]/20"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {st.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedApp(null)}
                                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-md cursor-pointer transition"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
