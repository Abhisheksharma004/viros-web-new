"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Clock,
    Users,
    AlertCircle,
    CheckCircle2,
    Edit2,
    Trash2,
    X,
    Loader2,
    Building2,
    Sparkles,
    Briefcase,
    ListFilter,
    CalendarDays,
    Grid,
    Info,
    MapPin,
    Target,
} from "lucide-react";
import type { CorporateEventApi, CorporateEventType } from "@/lib/corporateCalendar";

const CORPORATE_TYPE_CONFIG: Record<
    CorporateEventType,
    { label: string; bg: string; text: string; border: string; dot: string }
> = {
    holiday: {
        label: "Company Holiday",
        bg: "bg-emerald-50 text-emerald-800",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
    },
    company_event: {
        label: "Company Event",
        bg: "bg-purple-50 text-purple-800",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
    },
    meeting: {
        label: "Board / Town Hall",
        bg: "bg-blue-50 text-blue-800",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
    },
    appraisal: {
        label: "Appraisal Cycle",
        bg: "bg-amber-50 text-amber-800",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
    },
    training: {
        label: "Training & Workshop",
        bg: "bg-cyan-50 text-cyan-800",
        text: "text-cyan-700",
        border: "border-cyan-200",
        dot: "bg-cyan-500",
    },
    milestone: {
        label: "Project Milestone",
        bg: "bg-red-50 text-red-800",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
    },
};

const COLOR_OPTIONS = [
    { value: "emerald", label: "Emerald Green", bg: "bg-emerald-500" },
    { value: "purple", label: "Royal Purple", bg: "bg-purple-500" },
    { value: "blue", label: "Ocean Blue", bg: "bg-blue-500" },
    { value: "amber", label: "Warm Amber", bg: "bg-amber-500" },
    { value: "cyan", label: "Teal Cyan", bg: "bg-cyan-500" },
    { value: "red", label: "Ruby Red", bg: "bg-red-500" },
];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-1 focus:ring-[#0a2a5e]";
const labelClass = "block text-xs font-semibold text-gray-700 mb-1";

function formatDateDisplay(iso: string) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const year = parts[0];
    const monthIdx = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
}

type EventFormState = {
    id?: number;
    title: string;
    event_type: CorporateEventType;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    location: string;
    audience: string;
    color_tag: string;
    description: string;
    is_mandatory: boolean;
};

const emptyForm: EventFormState = {
    title: "",
    event_type: "company_event",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    start_time: "09:30",
    end_time: "17:30",
    is_all_day: true,
    location: "Office HQ",
    audience: "All Employees",
    color_tag: "blue",
    description: "",
    is_mandatory: false,
};

export default function CorporateCalendarPage() {
    const [events, setEvents] = useState<CorporateEventApi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"calendar" | "agenda">("calendar");

    // Current displayed Month & Year for Calendar View
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formState, setFormState] = useState<EventFormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<CorporateEventApi | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast Notification
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Fetch Corporate Events from API
    const fetchEvents = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/corporate-calendar", { cache: "no-store" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to fetch corporate calendar");
            }
            setEvents(Array.isArray(data.events) ? data.events : []);
        } catch (error) {
            console.error("Fetch corporate calendar error:", error);
            showToast("Failed to load corporate calendar events", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void fetchEvents();
    }, [fetchEvents]);

    // Calendar Navigation
    const handlePrevMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Filtered Events List
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesType =
                selectedTypeFilter === "all" || ev.event_type === selectedTypeFilter;
            const matchesSearch =
                !searchTerm.trim() ||
                ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [events, selectedTypeFilter, searchTerm]);

    // Stats Computation
    const stats = useMemo(() => {
        const total = events.length;
        const holidays = events.filter((e) => e.event_type === "holiday").length;
        const meetings = events.filter((e) => e.event_type === "meeting").length;
        const eventsAndTrainings = events.filter(
            (e) => e.event_type === "company_event" || e.event_type === "training" || e.event_type === "appraisal" || e.event_type === "milestone"
        ).length;
        return { total, holidays, meetings, eventsAndTrainings };
    }, [events]);

    // Open Modal for Create
    const handleOpenCreateModal = (presetDate?: string) => {
        const todayStr = presetDate || new Date().toISOString().slice(0, 10);
        setFormState({
            ...emptyForm,
            start_date: todayStr,
            end_date: todayStr,
        });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEditModal = (ev: CorporateEventApi) => {
        setFormState({
            id: ev.id,
            title: ev.title,
            event_type: ev.event_type,
            start_date: ev.start_date,
            end_date: ev.end_date,
            start_time: ev.start_time || "09:30",
            end_time: ev.end_time || "17:30",
            is_all_day: ev.is_all_day,
            location: ev.location,
            audience: ev.audience,
            color_tag: ev.color_tag,
            description: ev.description,
            is_mandatory: ev.is_mandatory,
        });
        setIsModalOpen(true);
    };

    // Save Event (Create or Update)
    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.title.trim()) {
            showToast("Event title is required", "error");
            return;
        }
        if (!formState.start_date) {
            showToast("Start date is required", "error");
            return;
        }

        try {
            setIsSubmitting(true);
            const isEdit = Boolean(formState.id);
            const url = isEdit
                ? `/api/admin/corporate-calendar/${formState.id}`
                : "/api/admin/corporate-calendar";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formState.title,
                    event_type: formState.event_type,
                    start_date: formState.start_date,
                    end_date: formState.end_date || formState.start_date,
                    start_time: formState.is_all_day ? null : formState.start_time,
                    end_time: formState.is_all_day ? null : formState.end_time,
                    is_all_day: formState.is_all_day,
                    location: formState.location,
                    audience: formState.audience,
                    color_tag: formState.color_tag,
                    description: formState.description,
                    is_mandatory: formState.is_mandatory,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to save corporate event");
            }

            showToast(
                isEdit ? "Corporate event updated successfully" : "Corporate event added successfully"
            );
            setIsModalOpen(false);
            void fetchEvents();
        } catch (error) {
            console.error("Save corporate event error:", error);
            showToast(
                error instanceof Error ? error.message : "Failed to save corporate event",
                "error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Event
    const handleDeleteEvent = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/corporate-calendar/${deleteTarget.id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to delete corporate event");
            }
            showToast("Corporate event deleted successfully");
            setDeleteTarget(null);
            void fetchEvents();
        } catch (error) {
            console.error("Delete corporate event error:", error);
            showToast(
                error instanceof Error ? error.message : "Failed to delete event",
                "error"
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // Generate Days Matrix for Calendar Grid
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startingDayOfWeek === -1) startingDayOfWeek = 6;

        const totalDaysInMonth = lastDayOfMonth.getDate();

        // Days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = [];
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            prevMonthDays.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                isoDate: "",
            });
        }

        // Days of current month
        const currentMonthDays = [];
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const monthStr = String(month + 1).padStart(2, "0");
            const dayStr = String(d).padStart(2, "0");
            const isoDate = `${year}-${monthStr}-${dayStr}`;
            currentMonthDays.push({
                day: d,
                isCurrentMonth: true,
                isoDate,
            });
        }

        // Days from next month to complete matrix
        const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
        const nextMonthDays = [];
        const remainingCells = 35 - totalCellsSoFar >= 0 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
        for (let n = 1; n <= remainingCells; n++) {
            nextMonthDays.push({
                day: n,
                isCurrentMonth: false,
                isoDate: "",
            });
        }

        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    }, [currentDate]);

    // Today ISO
    const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

    return (
        <div className="space-y-6 font-sans">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed right-5 top-20 z-50 flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold shadow-xl transition-all ${toast.type === "success"
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                    role="alert"
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Standard Admin Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0a2a5e]">
                        Corporate Calendar
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Schedule official holidays, company townhalls, board meetings, trainings, and key milestones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleOpenCreateModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2a5e] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06124f]"
                    >
                        <Plus className="h-4 w-4" />
                        Add Event
                    </button>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total events</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Company holidays</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.holidays}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Town halls & meetings</p>
                    <p className="mt-2 text-3xl font-semibold text-purple-600">{stats.meetings}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Trainings & outings</p>
                    <p className="mt-2 text-3xl font-semibold text-[#06b6d4]">{stats.eventsAndTrainings}</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100"
                        title="Previous Month"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="min-w-[140px] text-center text-base font-bold text-[#0a2a5e]">
                        {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100"
                        title="Next Month"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleToday}
                        className="ml-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                    >
                        Today
                    </button>
                </div>

                {/* Filters & View Switcher */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-xs font-medium text-gray-900 outline-none focus:border-[#0a2a5e] focus:ring-1 focus:ring-[#0a2a5e]"
                        />
                    </div>

                    {/* Category Dropdown */}
                    <select
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#0a2a5e] focus:ring-1 focus:ring-[#0a2a5e]"
                    >
                        <option value="all">All Categories</option>
                        <option value="holiday">Company Holidays</option>
                        <option value="company_event">Company Events & Outings</option>
                        <option value="meeting">Board & Town Halls</option>
                        <option value="appraisal">Appraisal Cycles</option>
                        <option value="training">Trainings & Workshops</option>
                        <option value="milestone">Project Milestones</option>
                    </select>

                    {/* View Switcher Toggle */}
                    <div className="flex rounded-md border border-gray-200 bg-gray-100 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition ${viewMode === "calendar"
                                    ? "bg-white text-[#0a2a5e] shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Grid className="h-3.5 w-3.5" />
                            Calendar
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("agenda")}
                            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition ${viewMode === "agenda"
                                    ? "bg-white text-[#0a2a5e] shadow-xs"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <ListFilter className="h-3.5 w-3.5" />
                            Agenda
                        </button>
                    </div>
                </div>
            </div>

            {/* Content View: Calendar Grid vs Agenda List */}
            {isLoading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-gray-100 bg-white py-12 text-sm text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
                    <p className="font-medium">Loading corporate calendar events...</p>
                </div>
            ) : viewMode === "calendar" ? (
                /* MONTHLY CALENDAR GRID VIEW */
                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <div className="py-3">Mon</div>
                        <div className="py-3">Tue</div>
                        <div className="py-3">Wed</div>
                        <div className="py-3">Thu</div>
                        <div className="py-3">Fri</div>
                        <div className="py-3 text-red-600">Sat</div>
                        <div className="py-3 text-red-600">Sun</div>
                    </div>

                    {/* Day Cells Matrix */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                        {calendarGrid.map((cell, idx) => {
                            const dayEvents = cell.isoDate
                                ? filteredEvents.filter(
                                    (ev) =>
                                        ev.start_date <= cell.isoDate &&
                                        ev.end_date >= cell.isoDate
                                )
                                : [];
                            const isToday = cell.isoDate === todayIso;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (cell.isCurrentMonth && cell.isoDate) {
                                            handleOpenCreateModal(cell.isoDate);
                                        }
                                    }}
                                    className={`group relative min-h-[110px] p-2 transition ${cell.isCurrentMonth
                                            ? "bg-white hover:bg-gray-50/80 cursor-pointer"
                                            : "bg-gray-50/50 text-gray-300"
                                        }`}
                                >
                                    {/* Date Number */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday
                                                    ? "bg-[#06b6d4] text-white shadow-sm"
                                                    : cell.isCurrentMonth
                                                        ? "text-gray-800"
                                                        : "text-gray-400"
                                                }`}
                                        >
                                            {cell.day}
                                        </span>
                                        {cell.isCurrentMonth && (
                                            <span className="opacity-0 transition group-hover:opacity-100 text-[10px] font-semibold text-[#06b6d4]">
                                                + Add
                                            </span>
                                        )}
                                    </div>

                                    {/* Events in cell */}
                                    <div className="mt-1.5 space-y-1 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((ev) => {
                                            const cfg = CORPORATE_TYPE_CONFIG[ev.event_type] || CORPORATE_TYPE_CONFIG.company_event;
                                            return (
                                                <div
                                                    key={ev.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditModal(ev);
                                                    }}
                                                    className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold shadow-2xs transition hover:scale-[1.02] ${cfg.bg} border ${cfg.border}`}
                                                    title={`${ev.title} (${cfg.label})`}
                                                >
                                                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                    {ev.title}
                                                </div>
                                            );
                                        })}

                                        {dayEvents.length > 3 && (
                                            <p className="text-[9px] font-bold text-gray-500 pl-1">
                                                +{dayEvents.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* AGENDA / LIST VIEW */
                <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                        <p className="text-sm font-semibold text-gray-900">Agenda Records</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Showing {filteredEvents.length} corporate event(s).
                        </p>
                    </div>

                    {filteredEvents.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredEvents.map((ev) => {
                                const cfg = CORPORATE_TYPE_CONFIG[ev.event_type] || CORPORATE_TYPE_CONFIG.company_event;
                                return (
                                    <div
                                        key={ev.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/80 transition"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-gray-100 font-bold text-[#0a2a5e]">
                                                <span className="text-[10px] uppercase">
                                                    {MONTH_NAMES[Number(ev.start_date.slice(5, 7)) - 1]?.slice(0, 3)}
                                                </span>
                                                <span className="text-base leading-none">
                                                    {Number(ev.start_date.slice(8, 10))}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {ev.title}
                                                    </h3>
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${cfg.bg} ${cfg.border}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {ev.is_mandatory && (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase text-red-700">
                                                            Mandatory
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                        {formatDateDisplay(ev.start_date)}
                                                        {ev.start_date !== ev.end_date && ` → ${formatDateDisplay(ev.end_date)}`}
                                                    </span>
                                                    {!ev.is_all_day && ev.start_time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                            {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ""}
                                                        </span>
                                                    )}
                                                    {ev.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                            {ev.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                                        Audience: {ev.audience}
                                                    </span>
                                                </div>
                                                {ev.description && (
                                                    <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
                                                        {ev.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(ev)}
                                                className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(ev)}
                                                className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center text-sm text-gray-500">
                            <Info className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="font-semibold text-gray-700">No events found</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Try adjusting your search query or category filter.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE / EDIT EVENT MODAL */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative w-full max-w-lg overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 bg-[#0a2a5e] px-6 py-4 text-white">
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-[#06b6d4]" />
                                {formState.id ? "Edit Corporate Event" : "Create Corporate Event"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className={labelClass}>Event Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Q2 Town Hall / Independence Day Celebration"
                                    value={formState.title}
                                    onChange={(e) =>
                                        setFormState((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Category *</label>
                                    <select
                                        value={formState.event_type}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                event_type: e.target.value as CorporateEventType,
                                            }))
                                        }
                                        className={inputClass}
                                    >
                                        <option value="holiday">Company Holiday</option>
                                        <option value="company_event">Company Event / Retreat</option>
                                        <option value="meeting">Board & Town Hall</option>
                                        <option value="appraisal">Appraisal Cycle</option>
                                        <option value="training">Training & Workshop</option>
                                        <option value="milestone">Project Milestone</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Location / Platform</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Auditorium / Zoom / Office HQ"
                                        value={formState.location}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                location: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formState.start_date}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            setFormState((prev) => ({
                                                ...prev,
                                                start_date: newStart,
                                                end_date: prev.end_date < newStart ? newStart : prev.end_date,
                                            }));
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        min={formState.start_date}
                                        value={formState.end_date}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                end_date: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Target Audience</label>
                                <input
                                    type="text"
                                    placeholder="e.g., All Employees / Leadership Team / Finance"
                                    value={formState.audience}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            audience: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>

                            {/* All Day Toggle & Time Inputs */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formState.is_all_day}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                is_all_day: e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                    />
                                    All Day Event
                                </label>

                                {!formState.is_all_day && (
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                                Start Time
                                            </label>
                                            <input
                                                type="time"
                                                value={formState.start_time}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        start_time: e.target.value,
                                                    }))
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                                End Time
                                            </label>
                                            <input
                                                type="time"
                                                value={formState.end_time}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        end_time: e.target.value,
                                                    }))
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Color Tag Selector */}
                            <div>
                                <label className={labelClass}>Color Tag</label>
                                <div className="flex items-center gap-3">
                                    {COLOR_OPTIONS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    color_tag: c.value,
                                                }))
                                            }
                                            className={`h-7 w-7 rounded-full ${c.bg} transition ${formState.color_tag === c.value
                                                    ? "ring-4 ring-[#0a2a5e]/30 scale-110"
                                                    : "opacity-70 hover:opacity-100"
                                                }`}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Description / Details</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter additional event details or instructions..."
                                    value={formState.description}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div className="pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formState.is_mandatory}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                is_mandatory: e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-red-600"
                                    />
                                    Mandatory Attendance / Official Event
                                </label>
                            </div>

                            {/* Form Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#06124f] disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {formState.id ? "Update Event" : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Delete Corporate Event</h3>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-gray-600">
                            Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteTarget.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteEvent}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
