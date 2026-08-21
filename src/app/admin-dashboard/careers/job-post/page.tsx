"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Briefcase,
    Plus,
    Search,
    Pencil,
    Trash2,
    Eye,
    Check,
    X,
    ExternalLink,
    Building2,
    Clock,
    DollarSign,
    MapPin,
    GraduationCap,
    Sparkles,
    CheckCircle2,
    FileText,
    Tag,
    ListChecks,
    Loader2
} from "lucide-react";
import Toast from "@/components/Toast";
import { JobOpening } from "@/data/careersData";

export default function AdminJobPostPage() {
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("All");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch jobs from database
    const loadJobs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/careers/jobs");
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.jobs)) {
                    setJobs(data.jobs);
                } else {
                    setJobs([]);
                }
            }
        } catch (err) {
            console.error("Error loading jobs from DB:", err);
            setJobs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    // Modal state
    const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

    // Form values
    const [formValues, setFormValues] = useState({
        title: "",
        department: "Engineering",
        location: "Noida / Delhi NCR (On-Site)",
        type: "Full-Time",
        experience: "2 - 5 Years",
        salary: "Competitive / Best in Industry",
        summary: "",
        tags: "",
        responsibilities: "",
        requirements: "",
    });

    const departments = ["All", "Engineering", "Software & IT", "Sales & Business", "Operations & Support"];

    // Stats
    const stats = useMemo(() => {
        return [
            { label: "Total Openings", value: jobs.length, tone: "text-gray-900" },
            { label: "Engineering Roles", value: jobs.filter(j => j.department === "Engineering" || j.department === "Software & IT").length, tone: "text-blue-600" },
            { label: "Sales & Support", value: jobs.filter(j => j.department === "Sales & Business" || j.department === "Operations & Support").length, tone: "text-purple-600" },
            { label: "Locations Covered", value: "Noida / NCR", tone: "text-green-600" },
        ];
    }, [jobs]);

    // Filtered
    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const matchesDept = selectedDepartment === "All" || job.department === selectedDepartment;
            const matchesSearch = searchQuery === "" ||
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesDept && matchesSearch;
        });
    }, [jobs, selectedDepartment, searchQuery]);

    const openAddModal = () => {
        setSelectedJob(null);
        setFormValues({
            title: "",
            department: "Engineering",
            location: "Noida / Delhi NCR (On-Site)",
            type: "Full-Time",
            experience: "2 - 5 Years",
            salary: "Competitive / Best in Industry",
            summary: "",
            tags: "",
            responsibilities: "",
            requirements: "",
        });
        setModalMode("add");
    };

    const openEditModal = (job: JobOpening) => {
        setSelectedJob(job);
        setFormValues({
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            experience: job.experience,
            salary: job.salary,
            summary: job.summary,
            tags: job.tags.join(", "),
            responsibilities: job.responsibilities.join("\n"),
            requirements: job.requirements.join("\n"),
        });
        setModalMode("edit");
    };

    const openViewModal = (job: JobOpening) => {
        setSelectedJob(job);
        setModalMode("view");
    };

    const handleSaveJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formValues.title.trim() || !formValues.summary.trim()) {
            setToast({ message: "Please fill required fields (Title & Summary).", type: "error" });
            return;
        }

        const formattedTags = formValues.tags.split(",").map(t => t.trim()).filter(Boolean);
        const formattedResponsibilities = formValues.responsibilities.split("\n").map(r => r.trim()).filter(Boolean);
        const formattedRequirements = formValues.requirements.split("\n").map(r => r.trim()).filter(Boolean);

        setIsSaving(true);
        try {
            if (modalMode === "edit" && selectedJob) {
                const res = await fetch(`/api/careers/jobs/${selectedJob.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: formValues.title,
                        department: formValues.department,
                        location: formValues.location,
                        type: formValues.type,
                        experience: formValues.experience,
                        salary: formValues.salary,
                        summary: formValues.summary,
                        tags: formattedTags,
                        responsibilities: formattedResponsibilities,
                        requirements: formattedRequirements
                    })
                });
                if (res.ok) {
                    setToast({ message: `Job "${formValues.title}" updated in database!`, type: "success" });
                    await loadJobs();
                    setModalMode(null);
                } else {
                    setToast({ message: "Failed to update job.", type: "error" });
                }
            } else {
                const res = await fetch(`/api/careers/jobs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: formValues.title,
                        department: formValues.department,
                        location: formValues.location,
                        type: formValues.type,
                        experience: formValues.experience,
                        salary: formValues.salary,
                        summary: formValues.summary,
                        tags: formattedTags,
                        responsibilities: formattedResponsibilities,
                        requirements: formattedRequirements
                    })
                });
                if (res.ok) {
                    setToast({ message: `New Job Post "${formValues.title}" saved to database!`, type: "success" });
                    await loadJobs();
                    setModalMode(null);
                } else {
                    setToast({ message: "Failed to create job in database.", type: "error" });
                }
            }
        } catch (error) {
            console.error("Error saving job:", error);
            setToast({ message: "Network error saving job.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteJob = async (job: JobOpening) => {
        if (window.confirm(`Delete job opening "${job.title}"? This cannot be undone.`)) {
            try {
                const res = await fetch(`/api/careers/jobs/${job.id}`, { method: "DELETE" });
                if (res.ok) {
                    setToast({ message: `Job "${job.title}" deleted from database.`, type: "success" });
                    await loadJobs();
                } else {
                    setToast({ message: "Failed to delete job.", type: "error" });
                }
            } catch (error) {
                console.error("Error deleting job:", error);
            }
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
                    <h1 className="text-xl font-bold text-gray-900">Careers & Job Openings</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage live career opportunities, specifications, and job postings.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadJobs}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer"
                    >
                        Refresh List
                    </button>
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-xs rounded-md cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Job Post
                    </button>
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
                        placeholder="Search jobs by title, department, or skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            type="button"
                            onClick={() => setSelectedDepartment(dept)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                selectedDepartment === dept
                                    ? "bg-[#06124f] text-white shadow-xs"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* JOBS TABLE */}
            <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role & Summary</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location & Mode</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        {isLoading ? "Loading jobs from database..." : "No job postings found. Click 'Add Job Post' to create one."}
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{job.summary}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-800 ring-1 ring-blue-600/15">
                                                {job.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                                            <div className="font-medium text-gray-900">{job.location}</div>
                                            <div className="text-gray-400">{job.type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-700">
                                            {job.experience}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => openViewModal(job)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 shadow-xs cursor-pointer"
                                                title="View Job Details"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(job)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50 shadow-xs cursor-pointer"
                                                title="Edit Job"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <Link
                                                href={`/careers/${job.id}`}
                                                target="_blank"
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                                                title="Open on Live Site"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" /> Live
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteJob(job)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer"
                                                title="Delete Job"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: VIEW / ADD / EDIT IN CONSISTENT STRUCTURED DESIGN */}
            {modalMode && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden my-6">
                        {/* Header Banner */}
                        <div
                            className="px-6 py-4 flex items-center justify-between text-white"
                            style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 100%)" }}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">
                                        {modalMode === "view" && (selectedJob?.title || "Job Details")}
                                        {modalMode === "add" && "Add New Job Opening"}
                                        {modalMode === "edit" && "Edit Job Opening"}
                                    </h3>
                                    {modalMode === "view" && selectedJob && (
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-teal-200">
                                            {selectedJob.id}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {modalMode === "view" && selectedJob ? (
                                        <>
                                            {selectedJob.department} • <span className="text-teal-300 font-medium">{selectedJob.type} ({selectedJob.location})</span>
                                        </>
                                    ) : (
                                        "Configure public career opening requirements, compensation, and responsibilities."
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalMode(null)}
                                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        {modalMode === "view" && selectedJob ? (
                            /* 1. VIEW JOB MODAL */
                            <div className="p-6 space-y-6 text-sm text-gray-800 max-h-[75vh] overflow-y-auto">
                                {/* Summary Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <div>
                                            <span className="text-gray-400 uppercase font-semibold text-[10px] block">Department</span>
                                            <span className="font-semibold text-blue-800">{selectedJob.department}</span>
                                        </div>
                                        <div className="h-6 w-px bg-gray-200" />
                                        <div>
                                            <span className="text-gray-400 uppercase font-semibold text-[10px] block">Work Mode</span>
                                            <span className="font-semibold text-gray-800">{selectedJob.type}</span>
                                        </div>
                                        <div className="h-6 w-px bg-gray-200" />
                                        <div>
                                            <span className="text-gray-400 uppercase font-semibold text-[10px] block">Experience</span>
                                            <span className="font-semibold text-gray-800">{selectedJob.experience}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/careers/${selectedJob.id}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#06124f] hover:bg-[#0a2a5e] text-white font-semibold text-xs shadow-xs transition"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open Live Page
                                        </Link>
                                    </div>
                                </div>

                                {/* Section 1: Role Overview & Specifications */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        1. Role Overview & Specifications
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Job Position Title</span>
                                            <span className="text-gray-900 font-bold block mt-0.5">{selectedJob.title}</span>
                                        </div>
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Department</span>
                                            <span className="text-blue-800 font-semibold block mt-0.5">{selectedJob.department}</span>
                                        </div>
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Job Location</span>
                                            <span className="text-gray-900 font-medium block mt-0.5">{selectedJob.location}</span>
                                        </div>
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Employment Type</span>
                                            <span className="text-gray-900 font-medium block mt-0.5">{selectedJob.type}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Compensation & Experience */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        2. Compensation & Experience
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Experience Required</span>
                                            <span className="text-gray-900 font-semibold block mt-0.5">{selectedJob.experience}</span>
                                        </div>
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Compensation / CTC</span>
                                            <span className="text-blue-900 font-bold block mt-0.5">{selectedJob.salary}</span>
                                        </div>
                                    </div>

                                    {selectedJob.tags && selectedJob.tags.length > 0 && (
                                        <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Keywords & Skill Tags</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedJob.tags.map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Summary */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        3. Role Summary
                                    </h4>
                                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 leading-relaxed">
                                        {selectedJob.summary}
                                    </div>
                                </div>

                                {/* Section 4: Responsibilities */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <ListChecks className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        4. Key Responsibilities
                                    </h4>
                                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                                        <ul className="space-y-1.5 text-xs text-gray-700">
                                            {selectedJob.responsibilities.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Section 5: Candidate Requirements */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        5. Candidate Requirements & Qualifications
                                    </h4>
                                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                                        <ul className="space-y-1.5 text-xs text-gray-700">
                                            {selectedJob.requirements.map((req, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* View Footer */}
                                <div className="px-6 py-3.5 bg-gray-50 -mx-6 -mb-6 mt-6 border-t border-gray-200 flex justify-end gap-2 rounded-b-md">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(selectedJob)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] rounded-md hover:opacity-90 cursor-pointer shadow-xs"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit This Job
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalMode(null)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-md cursor-pointer transition"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 2. ADD / EDIT JOB OPENING FORM IN SAME STRUCTURED DESIGN */
                            <form onSubmit={handleSaveJob} className="p-6 space-y-6 text-sm text-gray-800 max-h-[75vh] overflow-y-auto">
                                {/* Section 1: Basic Role Information */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        1. Basic Role Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Job Position Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Senior AIDC Solutions Engineer"
                                                value={formValues.title}
                                                onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formValues.department}
                                                onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            >
                                                <option value="Engineering">Engineering</option>
                                                <option value="Software & IT">Software & IT</option>
                                                <option value="Sales & Business">Sales & Business</option>
                                                <option value="Operations & Support">Operations & Support</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Employment Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formValues.type}
                                                onChange={(e) => setFormValues({ ...formValues, type: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            >
                                                <option value="Full-Time">Full-Time</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Contract">Contract</option>
                                            </select>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Work Location
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Noida / Delhi NCR (On-Site)"
                                                value={formValues.location}
                                                onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Experience & Compensation */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        2. Experience & Compensation
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Experience Required
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 2 - 5 Years"
                                                value={formValues.experience}
                                                onChange={(e) => setFormValues({ ...formValues, experience: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Compensation / CTC Info
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Competitive / 8 - 12 LPA"
                                                value={formValues.salary}
                                                onChange={(e) => setFormValues({ ...formValues, salary: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Keywords & Skill Tags (Comma Separated)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="AIDC, Zebra, Barcode, RFID, Hardware, React"
                                                value={formValues.tags}
                                                onChange={(e) => setFormValues({ ...formValues, tags: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Job Description & Specifications */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#06124f] uppercase tracking-wider mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#06b6d4]" />
                                        3. Job Description & Specifications
                                    </h4>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Role Summary <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                placeholder="Short 2-line summary of role and core mission..."
                                                value={formValues.summary}
                                                onChange={(e) => setFormValues({ ...formValues, summary: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Key Responsibilities (One per line)
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Deploy barcode printing and scanning solutions&#10;Perform site inspection and device calibration"
                                                value={formValues.responsibilities}
                                                onChange={(e) => setFormValues({ ...formValues, responsibilities: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Candidate Requirements & Qualifications (One per line)
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="B.Tech / Diploma in Electrical/CS&#10;2+ years in AIDC domain"
                                                value={formValues.requirements}
                                                onChange={(e) => setFormValues({ ...formValues, requirements: e.target.value })}
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder:text-gray-500 font-medium focus:ring-1 focus:ring-[#06124f] focus:border-[#06124f] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions Footer */}
                                <div className="px-6 py-3.5 bg-gray-50 -mx-6 -mb-6 mt-6 border-t border-gray-200 flex justify-end gap-3 rounded-b-md">
                                    <button
                                        type="button"
                                        onClick={() => setModalMode(null)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-md cursor-pointer transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 rounded-md transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>{modalMode === "add" ? "Save Job Opening" : "Update Job Opening"}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
