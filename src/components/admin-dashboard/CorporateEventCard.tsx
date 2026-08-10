"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Sparkles, Users } from "lucide-react";
import type { CorporateEventApi, CorporateEventType } from "@/lib/corporateCalendar";
import HeroVortexBackground from "@/components/employee-dashboard/HeroVortexBackground";

const EVENT_THEMES: Record<
    CorporateEventType,
    {
        gradient: string;
        accent: string;
        ring: string;
        emoji: string;
        badgeLabel: string;
    }
> = {
    holiday: {
        gradient: "linear-gradient(145deg, #06124f 0%, #0a2a5e 45%, #1d4ed8 100%)",
        accent: "from-blue-200/25 to-indigo-300/10",
        ring: "ring-blue-200/40",
        emoji: "🏖️",
        badgeLabel: "Holiday",
    },
    company_event: {
        gradient: "linear-gradient(145deg, #1e1b4b 0%, #0a2a5e 45%, #4338ca 100%)",
        accent: "from-indigo-200/25 to-blue-300/10",
        ring: "ring-indigo-200/40",
        emoji: "🎉",
        badgeLabel: "Company Event",
    },
    meeting: {
        gradient: "linear-gradient(145deg, #0f172a 0%, #0a2a5e 50%, #0284c7 100%)",
        accent: "from-blue-200/25 to-sky-300/10",
        ring: "ring-blue-200/40",
        emoji: "📅",
        badgeLabel: "Meeting",
    },
    appraisal: {
        gradient: "linear-gradient(145deg, #1e1b4b 0%, #0a2a5e 45%, #d97706 100%)",
        accent: "from-amber-200/25 to-yellow-300/10",
        ring: "ring-amber-200/40",
        emoji: "📋",
        badgeLabel: "Appraisal",
    },
    training: {
        gradient: "linear-gradient(145deg, #083344 0%, #0a2a5e 50%, #0891b2 100%)",
        accent: "from-cyan-200/25 to-blue-300/10",
        ring: "ring-cyan-200/40",
        emoji: "🎓",
        badgeLabel: "Training",
    },
    milestone: {
        gradient: "linear-gradient(145deg, #4c0519 0%, #0a2a5e 50%, #e11d48 100%)",
        accent: "from-rose-200/25 to-pink-300/10",
        ring: "ring-rose-200/40",
        emoji: "🏆",
        badgeLabel: "Milestone",
    },
};

function formatDateRange(startIso: string, endIso: string): string {
    try {
        const start = new Date(startIso + "T00:00:00");
        const end = new Date(endIso + "T00:00:00");
        if (Number.isNaN(start.getTime())) return startIso;

        const startStr = start.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        if (startIso === endIso || Number.isNaN(end.getTime())) {
            return startStr;
        }

        const endStr = end.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            return `${start.getDate()} - ${endStr}`;
        }

        return `${startStr} - ${endStr}`;
    } catch {
        return startIso;
    }
}

export default function CorporateEventCard({
    event,
    compact = false,
    className = "",
    vortexActive = true,
}: {
    event: CorporateEventApi;
    compact?: boolean;
    className?: string;
    vortexActive?: boolean;
}) {
    const theme = EVENT_THEMES[event.event_type] || EVENT_THEMES.company_event;
    const dateFormatted = formatDateRange(event.start_date, event.end_date);

    return (
        <article
            className={`relative overflow-hidden rounded-md border border-white/25 shadow-lg shadow-black/10 transition-all hover:scale-[1.01] ${
                compact ? "min-h-0" : "min-h-[10.25rem] sm:min-h-[11rem]"
            } ${className}`}
            style={{ background: theme.gradient }}
        >
            <HeroVortexBackground theme="corporate-event" active={vortexActive} />
            <div
                className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br ${theme.accent}`}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                aria-hidden
            />

            <div
                className={`relative z-10 flex items-center gap-3 ${
                    compact ? "px-3.5 py-3.5" : "gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5"
                }`}
            >
                <div className="min-w-0 flex-1">
                    {/* Eyebrow & Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 font-bold uppercase tracking-wider text-white backdrop-blur-md ${
                                compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:text-[11px]"
                            }`}
                        >
                            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                            Corporate Event · {theme.badgeLabel}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 font-bold text-white backdrop-blur-md ${
                                compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:text-[11px]"
                            }`}
                        >
                            <Calendar className="h-3 w-3" aria-hidden />
                            {dateFormatted}
                        </span>

                        {event.is_mandatory && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                Mandatory
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3
                        className={`mt-2 line-clamp-2 font-black leading-snug tracking-tight text-white drop-shadow-sm ${
                            compact ? "text-base" : "text-xl sm:text-[1.5rem]"
                        }`}
                    >
                        {event.title}
                    </h3>

                    {/* Event Meta Details */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/90">
                        {event.location && event.location.trim() ? (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-white/80 shrink-0" />
                                {event.location.trim()}
                            </span>
                        ) : null}

                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-white/80 shrink-0" />
                            {event.is_all_day
                                ? "All Day"
                                : `${event.start_time || ""} - ${event.end_time || ""}`}
                        </span>

                        {event.audience && event.audience.trim() ? (
                            <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-white/80 shrink-0" />
                                {event.audience.trim()}
                            </span>
                        ) : null}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <p
                            className={`mt-1.5 line-clamp-1 leading-relaxed text-white/80 ${
                                compact ? "text-[10px]" : "text-xs sm:text-sm"
                            }`}
                        >
                            {event.description}
                        </p>
                    )}
                </div>

                {/* Event Icon Emoji Badge */}
                <div className="relative shrink-0 flex flex-col items-center gap-2">
                    <div
                        className={`relative flex items-center justify-center rounded-full border-[2.5px] border-white/60 bg-white/20 font-black text-white shadow-xl backdrop-blur-sm ring-4 ${
                            theme.ring
                        } ${compact ? "h-11 w-11 text-base" : "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl"}`}
                        aria-hidden
                    >
                        {theme.emoji}
                    </div>

                    <Link
                        href="/admin-dashboard/corporate-calendar"
                        className="text-[10px] sm:text-xs font-bold text-white/90 hover:text-white underline hover:opacity-100 transition-opacity"
                    >
                        View Calendar →
                    </Link>
                </div>
            </div>
        </article>
    );
}
