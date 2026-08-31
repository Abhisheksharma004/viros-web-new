"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Briefcase,
    MapPin,
    Search,
    Sparkles,
    TrendingUp,
    HeartPulse,
    GraduationCap,
    X,
    ChevronDown,
    Building2,
    Laptop
} from "lucide-react";
import { JobOpening } from "@/data/careersData";

const PERKS = [
    {
        icon: TrendingUp,
        title: "Career Growth",
        description: "Clear progression paths, merit appraisals, and mentorship to grow into leadership roles."
    },
    {
        icon: Sparkles,
        title: "Modern Tech Stack",
        description: "Work on advanced AIDC devices, Machine Vision, AI defect detection, and modern cloud systems."
    },
    {
        icon: HeartPulse,
        title: "Health & Wellbeing",
        description: "Medical insurance coverage for you and your family along with comprehensive health support."
    },
    {
        icon: GraduationCap,
        title: "Sponsored Certifications",
        description: "Company-sponsored technical training and OEM certifications (Zebra, Honeywell, etc.)."
    },
    {
        icon: Laptop,
        title: "Quality Work Equipment",
        description: "High-performance laptops, dual-monitor workstations, and testing hardware equipment."
    }
];

const EVENT_GALLERY = [
    { src: "/event/4.jpeg" },
    { src: "/event/4.jpg" },
    { src: "/event/1.jpeg" },
    { src: "/event/3.jpeg" },
    { src: "/event/6.jpeg" },
    { src: "/event/7.jpeg" },
    { src: "/event/8.jpeg" },
    { src: "/event/5.jpeg" }
];

const HIRING_STEPS = [
    { step: "1", title: "Apply Online", description: "Submit your profile or resume for open positions." },
    { step: "2", title: "Initial Screen", description: "A quick introductory call to discuss background and fit." },
    { step: "3", title: "Technical Round", description: "Hands-on discussion on domain skills and problem solving." },
    { step: "4", title: "Culture & Team", description: "Meet leadership and align with team culture." },
    { step: "5", title: "Offer & Welcome", description: "Receive your offer letter and join the team!" }
];

const FAQS = [
    {
        q: "What is the work culture like at Viros Entrepreneurs?",
        a: "We foster a collaborative, transparent, and problem-solving environment where team members have the autonomy to make meaningful impacts."
    },
    {
        q: "Where is the office located?",
        a: "Our corporate headquarters and solution testing lab are located in Badarpur, Delhi NCR."
    },
    {
        q: "Does Viros hire freshers and interns?",
        a: "Yes, we actively recruit fresh graduates and interns for engineering, sales, and software roles with high PPO conversion opportunities."
    },
    {
        q: "How soon can I expect a response after applying?",
        a: "Our talent acquisition team typically reviews applications and contacts shortlisted candidates within 2 to 3 business days."
    }
];

export default function CareersPage() {
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ src: string } | null>(null);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    useEffect(() => {
        const fetchLiveJobs = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/careers/jobs?active=true');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.jobs)) {
                        setJobs(data.jobs);
                    } else {
                        setJobs([]);
                    }
                }
            } catch (err) {
                console.error("Could not fetch live jobs:", err);
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveJobs();
    }, []);

    const departments = useMemo(() => {
        const set = new Set(jobs.map((j) => j.department));
        return ["All", ...Array.from(set)];
    }, [jobs]);

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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-linear-to-b from-[#06124f] via-[#081a63] to-[#06124f] text-white pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pt-30 lg:pb-16">
                {/* Background glow & mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#06b6d4]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#06b6d4]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Pill badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#06b6d4]/40 text-cyan-300 text-xs sm:text-sm font-semibold mb-4 shadow-inner animate-pulse">
                        <Sparkles className="w-4 h-4 text-[#06b6d4]" />
                        <span>We Are Hiring • Join Our Growing Team</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
                        Shape the Future of <br className="hidden sm:inline" />
                        <span className="bg-linear-to-r from-cyan-400 via-cyan-200 to-white bg-clip-text text-transparent">
                            Smart Industrial Automation & AIDC
                        </span>
                    </h1>

                    <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        At <strong className="text-white font-semibold">VIROS Entrepreneurs</strong>, we empower ambitious engineers, technologists, and leaders to build high-impact enterprise hardware, barcode intelligence, and software solutions.
                    </p>

                    <div className="mt-6 flex items-center justify-center">
                        <a
                            href="#open-positions"
                            className="px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold text-[#06124f] bg-[#06b6d4] hover:bg-cyan-300 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                        >
                            <Briefcase className="w-4 h-4" />
                            Explore Open Roles
                        </a>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto pt-6 border-t border-white/10">
                        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 sm:p-4">
                            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">500+</div>
                            <div className="text-xs text-slate-300 mt-0.5 font-medium">Enterprise Clients</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 sm:p-4">
                            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">1000+</div>
                            <div className="text-xs text-slate-300 mt-0.5 font-medium">Deployments</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 sm:p-4">
                            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">100%</div>
                            <div className="text-xs text-slate-300 mt-0.5 font-medium">YoY Innovation</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3.5 sm:p-4">
                            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">4.9 ★</div>
                            <div className="text-xs text-slate-300 mt-0.5 font-medium">Team Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY JOIN US / BENEFITS */}
            <section className="py-16 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#06124f]">
                            Why You'll Love Working Here
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-slate-600">
                            We provide the environment, tools, and support you need to do your best work.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PERKS.map((perk, idx) => {
                            const Icon = perk.icon;
                            return (
                                <div
                                    key={idx}
                                    className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#06b6d4]/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#06124f] text-[#06b6d4] flex items-center justify-center mb-4">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-[#06124f] mb-1.5">
                                        {perk.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {perk.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* OPEN POSITIONS / JOB LIST */}
            <section id="open-positions" className="py-16 bg-slate-50 border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#06124f]">
                                Open Positions
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"} available
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#06b6d4] focus:border-[#06b6d4]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Department Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {departments.map((dept) => (
                            <button
                                key={dept}
                                onClick={() => setSelectedDepartment(dept)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${selectedDepartment === dept
                                        ? "bg-[#06124f] text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>

                    {/* Job Cards */}
                    {filteredJobs.length > 0 ? (
                        <div className="space-y-4">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 hover:border-[#06b6d4]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="max-w-2xl">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#06b6d4]/10 text-[#06124f]">
                                                {job.department}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                                {job.type}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#06124f] mb-1">
                                            {job.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-3">
                                            {job.summary}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</span>
                                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {job.experience}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                        <Link
                                            href={`/careers/${job.id}`}
                                            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            href={`/careers/${job.id}/apply`}
                                            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#06124f] hover:bg-[#06b6d4] transition-colors"
                                        >
                                            Apply Now
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h3 className="text-base font-bold text-[#06124f]">
                                {isLoading ? "Loading openings..." : "No open positions found"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {isLoading ? "Fetching latest job opportunities..." : "There are currently no active job postings matching your criteria."}
                            </p>
                            {!isLoading && (searchQuery || selectedDepartment !== "All") && (
                                <button
                                    onClick={() => { setSelectedDepartment("All"); setSearchQuery(""); }}
                                    className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-[#06124f] hover:bg-slate-200 cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* GENERAL APPLICATION BOX */}
                    <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#06124f]">
                                Don't see a matching position?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                Send us your resume for future opportunities. We'll reach out when a suitable role opens.
                            </p>
                        </div>
                        <Link
                            href="/careers/apply"
                            className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#06124f] hover:bg-[#06b6d4] transition-colors shrink-0"
                        >
                            Drop Your Resume
                        </Link>
                    </div>
                </div>
            </section>

            {/* HIRING PROCESS */}
            <section className="py-16 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#06124f]">
                            Our Hiring Process
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            A straightforward and transparent 5-step journey.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        {HIRING_STEPS.map((step, idx) => (
                            <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-xl font-extrabold text-[#06b6d4] block mb-2">
                                    0{step.step}
                                </span>
                                <h4 className="text-sm font-bold text-[#06124f] mb-1">
                                    {step.title}
                                </h4>
                                <p className="text-xs text-slate-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM & EVENT PHOTOS */}
            <section className="py-16 bg-slate-50 border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#06124f]">
                            Life at Viros
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Moments from our team summits, workshops, and celebrations.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {EVENT_GALLERY.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedGalleryImage(item)}
                                className="relative h-44 sm:h-52 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:opacity-95 transition-opacity bg-slate-200"
                            >
                                <Image
                                    src={item.src}
                                    alt="Viros Event"
                                    fill
                                    unoptimized
                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQS */}
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#06124f]">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div
                                    key={idx}
                                    className="border border-slate-200 rounded-xl overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                        className="w-full px-5 py-4 text-left font-bold text-[#06124f] flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-sm sm:text-base cursor-pointer"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* LIGHTBOX MODAL */}
            {selectedGalleryImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
                    onClick={() => setSelectedGalleryImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedGalleryImage(null)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="relative w-full h-[360px] sm:h-[480px] md:h-[540px]">
                            <Image
                                src={selectedGalleryImage.src}
                                alt="Viros Event"
                                fill
                                unoptimized
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
