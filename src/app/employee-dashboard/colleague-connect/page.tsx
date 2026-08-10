"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Briefcase,
    Building2,
    Check,
    Copy,
    Filter,
    Grid,
    List,
    Mail,
    Phone,
    RefreshCw,
    Search,
    UserCheck,
    Users,
} from "lucide-react";

type Colleague = {
    id: number;
    employeeId: string;
    fullName: string;
    officialEmail: string;
    officialMobile: string;
    department: string;
    designation: string;
    employeeStatus: string;
    workLocation: string;
};

export default function ColleagueConnectPage() {
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const fetchColleagues = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/employee/colleagues", { cache: "no-store" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to load colleagues directory");
            }
            const data = await res.json();
            setColleagues(data.colleagues || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error fetching colleagues";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleagues();
    }, []);

    const departments = useMemo(() => {
        const set = new Set<string>();
        for (const c of colleagues) {
            if (c.department && c.department.trim()) {
                set.add(c.department.trim());
            }
        }
        return Array.from(set).sort();
    }, [colleagues]);

    const filteredColleagues = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return colleagues.filter((c) => {
            const matchesDept =
                selectedDepartment === "ALL" ||
                c.department.toLowerCase() === selectedDepartment.toLowerCase();

            if (!matchesDept) return false;
            if (!query) return true;

            return (
                c.fullName.toLowerCase().includes(query) ||
                c.officialEmail.toLowerCase().includes(query) ||
                c.officialMobile.toLowerCase().includes(query) ||
                c.department.toLowerCase().includes(query) ||
                c.designation.toLowerCase().includes(query) ||
                c.workLocation.toLowerCase().includes(query)
            );
        });
    }, [colleagues, searchQuery, selectedDepartment]);

    const stats = useMemo(() => {
        const total = colleagues.length;
        const deptsCount = departments.length;
        const withEmail = colleagues.filter((c) => Boolean(c.officialEmail)).length;
        const withMobile = colleagues.filter((c) => Boolean(c.officialMobile)).length;

        return { total, deptsCount, withEmail, withMobile };
    }, [colleagues, departments]);

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => {
            setCopiedKey(null);
        }, 2000);
    };

    const getInitials = (name: string) => {
        const clean = name.trim();
        if (!clean) return "E";
        const parts = clean.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return clean.substring(0, 2).toUpperCase();
    };

    return (
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 pb-2 sm:space-y-6 sm:pb-6">
            {/* Page Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-gray-100 bg-white p-3.5 shadow-sm ring-1 ring-gray-100 sm:p-5">
                <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2a5e]">
                        <Users className="w-3.5 h-3.5 text-[#0a2a5e]" /> Team Directory
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight sm:text-2xl lg:text-3xl">
                        Colleague Connect
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 sm:mt-1">
                        Access official email addresses and mobile numbers of active team members.
                    </p>
                </div>
                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <button
                        onClick={fetchColleagues}
                        disabled={loading}
                        className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-3.5 text-xs sm:text-sm font-semibold text-white shadow-sm touch-manipulation transition hover:bg-[#0a2a5e]/95 active:scale-[0.98] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh Directory
                    </button>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                <div className="flex flex-col justify-between rounded-md border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            Total Colleagues
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0a2a5e]/10 text-[#0a2a5e] sm:h-9 sm:w-9">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 mt-2 sm:text-2xl lg:text-3xl">{stats.total}</p>
                </div>

                <div className="flex flex-col justify-between rounded-md border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            Departments
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 sm:h-9 sm:w-9">
                            <Building2 className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 mt-2 sm:text-2xl lg:text-3xl">{stats.deptsCount}</p>
                </div>

                <div className="flex flex-col justify-between rounded-md border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            Official Email
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 sm:h-9 sm:w-9">
                            <Mail className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 mt-2 sm:text-2xl lg:text-3xl">{stats.withEmail}</p>
                </div>

                <div className="flex flex-col justify-between rounded-md border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            Mobile Number
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600 sm:h-9 sm:w-9">
                            <Phone className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 mt-2 sm:text-2xl lg:text-3xl">{stats.withMobile}</p>
                </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="rounded-md border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Search Bar Input */}
                <div className="relative w-full sm:w-72 lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, designation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 sm:h-11 w-full rounded-md border border-gray-300 bg-white pl-9 pr-9 text-xs sm:text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Filter Dropdown & View Mode Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 h-10 sm:h-11 shadow-sm flex-1 sm:flex-none">
                        <Filter className="w-3.5 h-3.5 text-[#0a2a5e] shrink-0" />
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full sm:w-auto bg-transparent text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer pr-1 truncate"
                        >
                            <option value="ALL">All Departments ({colleagues.length})</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grid / List View Toggle */}
                    <div className="flex items-center rounded-md border border-gray-200 bg-gray-100 p-1 shrink-0">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 sm:p-2 rounded text-xs font-bold transition-all touch-manipulation active:scale-95 ${
                                viewMode === "grid"
                                    ? "bg-[#0a2a5e] text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="Grid View"
                        >
                            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 sm:p-2 rounded text-xs font-bold transition-all touch-manipulation active:scale-95 ${
                                viewMode === "list"
                                    ? "bg-[#0a2a5e] text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm">
                    <span>{error}</span>
                    <button
                        onClick={fetchColleagues}
                        className="font-bold text-rose-700 hover:underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="rounded-md border border-gray-100 bg-white p-4 shadow-sm animate-pulse space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-gray-200 shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="h-3 bg-gray-100 rounded w-full" />
                                <div className="h-3 bg-gray-100 rounded w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredColleagues.length === 0 && (
                <div className="rounded-md border border-gray-100 bg-white p-8 sm:p-12 text-center shadow-sm">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">No Colleagues Found</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                        {searchQuery || selectedDepartment !== "ALL"
                            ? "No team members matched your search criteria. Try adjusting your search term or department filter."
                            : "No active colleagues are currently listed."}
                    </p>
                </div>
            )}

            {/* Main Content */}
            {!loading && filteredColleagues.length > 0 && (
                <>
                    {/* GRID VIEW */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
                            {filteredColleagues.map((colleague) => {
                                const emailKey = `grid-email-${colleague.id}`;
                                const phoneKey = `grid-phone-${colleague.id}`;

                                return (
                                    <div
                                        key={colleague.id}
                                        className="group rounded-md border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100/80 touch-manipulation transition hover:border-[#0a2a5e]/20 flex flex-col justify-between sm:p-5"
                                    >
                                        <div>
                                            {/* Header Info */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-[#0a2a5e] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm shrink-0">
                                                    {getInitials(colleague.fullName)}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-[#0a2a5e] transition-colors truncate">
                                                        {colleague.fullName}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-[#0a2a5e] mt-0.5 truncate">
                                                        {colleague.designation}
                                                    </p>
                                                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <UserCheck className="w-3 h-3" /> Active
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Department */}
                                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                                <Building2 className="w-3.5 h-3.5 text-[#0a2a5e] shrink-0" />
                                                <span className="truncate">{colleague.department}</span>
                                            </div>
                                        </div>

                                        {/* Contact Buttons / Detail Cards */}
                                        <div className="mt-3.5 pt-2.5 border-t border-gray-100 space-y-2">
                                            {/* Official Email */}
                                            <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/90 rounded border border-gray-200/60">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Mail className="w-3.5 h-3.5 text-[#0a2a5e] shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Official Email</p>
                                                        {colleague.officialEmail ? (
                                                            <a
                                                                href={`mailto:${colleague.officialEmail}`}
                                                                className="text-xs font-semibold text-gray-900 hover:text-[#0a2a5e] hover:underline truncate block"
                                                            >
                                                                {colleague.officialEmail}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Not Provided</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {colleague.officialEmail && (
                                                    <button
                                                        onClick={() => handleCopy(colleague.officialEmail, emailKey)}
                                                        className="p-1.5 text-gray-400 hover:text-[#0a2a5e] hover:bg-white rounded touch-manipulation active:scale-95 transition-all"
                                                        title="Copy Email"
                                                    >
                                                        {copiedKey === emailKey ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mobile Number */}
                                            <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/90 rounded border border-gray-200/60">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Mobile Number</p>
                                                        {colleague.officialMobile ? (
                                                            <a
                                                                href={`tel:${colleague.officialMobile}`}
                                                                className="text-xs font-semibold text-gray-900 hover:text-emerald-700 hover:underline truncate block"
                                                            >
                                                                {colleague.officialMobile}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Not Provided</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {colleague.officialMobile && (
                                                    <button
                                                        onClick={() => handleCopy(colleague.officialMobile, phoneKey)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-white rounded touch-manipulation active:scale-95 transition-all"
                                                        title="Copy Mobile"
                                                    >
                                                        {copiedKey === phoneKey ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* LIST / TABLE VIEW */}
                    {viewMode === "list" && (
                        <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                                    <thead>
                                        <tr className="bg-[#0a2a5e]/5 border-b border-gray-100 text-[10px] sm:text-xs font-bold text-[#0a2a5e] uppercase tracking-wider">
                                            <th className="py-3 px-3 sm:px-5">Employee</th>
                                            <th className="py-3 px-3 sm:px-4">Designation & Dept</th>
                                            <th className="py-3 px-3 sm:px-4">Official Email</th>
                                            <th className="py-3 px-3 sm:px-4">Mobile Number</th>
                                            <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm font-medium">
                                        {filteredColleagues.map((colleague) => {
                                            const emailKey = `tbl-email-${colleague.id}`;
                                            const phoneKey = `tbl-phone-${colleague.id}`;

                                            return (
                                                <tr
                                                    key={colleague.id}
                                                    className="hover:bg-gray-50/80 transition-colors"
                                                >
                                                    {/* Name & Avatar */}
                                                    <td className="py-3 px-3 sm:px-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#0a2a5e] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                                                {getInitials(colleague.fullName)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 truncate">
                                                                    {colleague.fullName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Designation & Dept */}
                                                    <td className="py-3 px-3 sm:px-4">
                                                        <p className="font-semibold text-gray-900 truncate">
                                                            {colleague.designation}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {colleague.department}
                                                        </p>
                                                    </td>

                                                    {/* Official Email */}
                                                    <td className="py-3 px-3 sm:px-4">
                                                        {colleague.officialEmail ? (
                                                            <a
                                                                href={`mailto:${colleague.officialEmail}`}
                                                                className="font-semibold text-[#0a2a5e] hover:underline truncate block"
                                                            >
                                                                {colleague.officialEmail}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">
                                                                Not Provided
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Mobile Number */}
                                                    <td className="py-3 px-3 sm:px-4">
                                                        {colleague.officialMobile ? (
                                                            <a
                                                                href={`tel:${colleague.officialMobile}`}
                                                                className="font-semibold text-emerald-700 hover:underline truncate block"
                                                            >
                                                                {colleague.officialMobile}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">
                                                                Not Provided
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Copy Actions */}
                                                    <td className="py-3 px-3 sm:px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {colleague.officialEmail && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleCopy(
                                                                            colleague.officialEmail,
                                                                            emailKey
                                                                        )
                                                                    }
                                                                    className="p-1.5 text-gray-500 hover:text-[#0a2a5e] hover:bg-gray-100 rounded touch-manipulation active:scale-95 transition-all"
                                                                    title="Copy Email"
                                                                >
                                                                    {copiedKey === emailKey ? (
                                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    )}
                                                                </button>
                                                            )}
                                                            {colleague.officialMobile && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleCopy(
                                                                            colleague.officialMobile,
                                                                            phoneKey
                                                                        )
                                                                    }
                                                                    className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded touch-manipulation active:scale-95 transition-all"
                                                                    title="Copy Mobile"
                                                                >
                                                                    {copiedKey === phoneKey ? (
                                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
