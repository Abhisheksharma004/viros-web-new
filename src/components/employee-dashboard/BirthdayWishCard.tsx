"use client";

import { Cake, Gift, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BirthdayWishCardData } from "@/lib/employeeBirthdayCards";

const BIRTHDAY_THEMES: Record<
    BirthdayWishCardData["variant"],
    {
        gradient: string;
        accent: string;
        ring: string;
        BadgeIcon: LucideIcon;
        decorEmoji: string;
    }
> = {
    "birthday-today": {
        gradient: "linear-gradient(145deg, #831843 0%, #be185d 35%, #ea580c 100%)",
        accent: "from-amber-200/30 to-orange-300/10",
        ring: "ring-amber-200/40",
        decorEmoji: "🎂",
        BadgeIcon: Cake,
    },
    "birthday-soon": {
        gradient: "linear-gradient(145deg, #4c1d95 0%, #7c3aed 40%, #db2777 100%)",
        accent: "from-violet-200/25 to-fuchsia-300/10",
        ring: "ring-violet-200/35",
        decorEmoji: "🎁",
        BadgeIcon: Gift,
    },
};

function BirthdayConfetti() {
    const dots = [
        "left-[8%] top-[18%] h-1.5 w-1.5",
        "left-[22%] top-[72%] h-1 w-1",
        "right-[28%] top-[12%] h-1.5 w-1.5",
        "right-[12%] top-[55%] h-1 w-1",
    ];
    return (
        <>
            {dots.map((pos, i) => (
                <span
                    key={i}
                    className={`pointer-events-none absolute rounded-full bg-white/50 ${pos}`}
                    aria-hidden
                />
            ))}
        </>
    );
}

type BirthdayWishCardProps = BirthdayWishCardData & {
    /** Tighter layout for What's New panel (320px) */
    compact?: boolean;
    className?: string;
};

export default function BirthdayWishCard({
    variant,
    eyebrow,
    title,
    subtitle,
    badgeText,
    hint,
    initials,
    compact = false,
    className = "",
}: BirthdayWishCardProps) {
    const theme = BIRTHDAY_THEMES[variant];
    const BadgeIcon = theme.BadgeIcon;

    return (
        <article
            className={`relative overflow-hidden rounded-xl border border-white/25 shadow-lg shadow-black/10 ${compact ? "min-h-0" : "min-h-[10.25rem] sm:min-h-[11rem]"} ${className}`}
            style={{ background: theme.gradient }}
        >
            <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.accent}`}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -left-8 top-0 h-28 w-28 rounded-full bg-white/15 blur-2xl"
                aria-hidden
            />
            <BirthdayConfetti />

            <div
                className={`relative flex items-center gap-3 ${compact ? "px-3.5 py-3.5" : "gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5"}`}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 font-bold uppercase tracking-wider text-white backdrop-blur-md ${compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:text-[11px]"}`}
                        >
                            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                            {eyebrow}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 font-bold text-white backdrop-blur-md ${compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:text-[11px]"}`}
                        >
                            <BadgeIcon className="h-3 w-3" aria-hidden />
                            {badgeText}
                        </span>
                    </div>

                    <h3
                        className={`mt-2 line-clamp-2 font-black leading-snug tracking-tight text-white drop-shadow-sm ${compact ? "text-base" : "text-xl sm:text-[1.65rem]"}`}
                    >
                        {title}
                    </h3>

                    <p
                        className={`mt-1 line-clamp-2 font-medium text-white/90 ${compact ? "text-xs" : "text-sm sm:text-[0.9375rem]"}`}
                    >
                        {subtitle}
                    </p>

                    {hint ? (
                        <p
                            className={`mt-1.5 line-clamp-2 leading-relaxed text-white/70 ${compact ? "text-[10px]" : "text-xs"}`}
                        >
                            {hint}
                        </p>
                    ) : null}
                </div>

                <div className="relative shrink-0">
                    <div
                        className={`relative flex items-center justify-center rounded-full border-[2.5px] border-white/60 bg-white/20 font-black text-white shadow-xl backdrop-blur-sm ring-4 ${theme.ring} ${compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl"}`}
                        aria-hidden
                    >
                        {initials}
                    </div>
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-white/50 bg-white shadow-md ${compact ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm sm:h-8 sm:w-8 sm:text-base"}`}
                        aria-hidden
                    >
                        {theme.decorEmoji}
                    </span>
                </div>
            </div>
        </article>
    );
}
