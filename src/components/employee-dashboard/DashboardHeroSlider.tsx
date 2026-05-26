"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cake, ChevronLeft, ChevronRight, Gift, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardHeroSlide, DashboardHeroSlideVariant } from "@/lib/employeeDashboard";

const HERO_GRADIENT = "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)";

/** Same layout for all birthday slides — only theme colors differ */
const BIRTHDAY_THEMES: Record<
    "birthday-today" | "birthday-soon",
    {
        gradient: string;
        accent: string;
        ring: string;
        dotActive: string;
        dotIdle: string;
        BadgeIcon: LucideIcon;
        decorEmoji: string;
    }
> = {
    "birthday-today": {
        gradient: "linear-gradient(145deg, #831843 0%, #be185d 35%, #ea580c 100%)",
        accent: "from-amber-200/30 to-orange-300/10",
        ring: "ring-amber-200/40",
        decorEmoji: "🎂",
        dotActive: "bg-rose-300",
        dotIdle: "bg-rose-300/40",
        BadgeIcon: Cake,
    },
    "birthday-soon": {
        gradient: "linear-gradient(145deg, #4c1d95 0%, #7c3aed 40%, #db2777 100%)",
        accent: "from-violet-200/25 to-fuchsia-300/10",
        ring: "ring-violet-200/35",
        decorEmoji: "🎁",
        dotActive: "bg-violet-300",
        dotIdle: "bg-violet-300/40",
        BadgeIcon: Gift,
    },
};

const BADGE_STYLES = {
    emerald: "border-emerald-400/30 bg-emerald-500/20 text-emerald-200",
    amber: "border-amber-400/35 bg-amber-500/25 text-amber-100",
    cyan: "border-white/25 bg-white/15 text-white",
    rose: "border-white/30 bg-white/20 text-white",
} as const;

const DOT_ACTIVE = "w-6 bg-white";
const DOT_IDLE = "w-2 bg-white/35";

const HERO_SECTION_CLASS =
    "relative flex h-full min-h-[11.5rem] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-md sm:min-h-[12.75rem] sm:rounded-3xl";

const BIRTHDAY_SECTION_CLASS =
    "relative flex h-full min-h-[10.25rem] flex-col overflow-hidden rounded-2xl border border-white/25 shadow-lg shadow-black/10 sm:min-h-[11rem] sm:rounded-3xl";

function getBirthdayTheme(variant: DashboardHeroSlideVariant | undefined) {
    if (variant === "birthday-today") return BIRTHDAY_THEMES["birthday-today"];
    return BIRTHDAY_THEMES["birthday-soon"];
}

function BirthdayConfetti() {
    const dots = [
        "left-[8%] top-[18%] h-1.5 w-1.5",
        "left-[22%] top-[72%] h-1 w-1",
        "right-[28%] top-[12%] h-1.5 w-1.5",
        "right-[12%] top-[55%] h-1 w-1",
        "left-[45%] top-[8%] h-1 w-1",
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

function BirthdaySlideLayout({ slide }: { slide: DashboardHeroSlide }) {
    const theme = getBirthdayTheme(slide.variant);
    const initials = slide.birthdayInitials ?? "?";
    const BadgeIcon = theme.BadgeIcon;
    const hint = slide.birthdayHint ?? "";

    return (
        <section className={BIRTHDAY_SECTION_CLASS} style={{ background: theme.gradient }}>
            <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.accent}`}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -left-12 top-0 h-40 w-40 rounded-full bg-white/15 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-white/10 blur-3xl"
                aria-hidden
            />
            <BirthdayConfetti />

            <div className="relative flex flex-1 items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md sm:text-[11px]">
                            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                            {slide.eyebrow}
                        </span>
                        {slide.badge ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md sm:text-[11px]">
                                <BadgeIcon className="h-3 w-3" aria-hidden />
                                {slide.badge.text}
                            </span>
                        ) : null}
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-xl font-black leading-[1.15] tracking-tight text-white drop-shadow-sm sm:text-[1.65rem]">
                        {slide.title}
                    </h2>

                    <p className="mt-1.5 line-clamp-2 text-sm font-medium text-white/90 sm:text-[0.9375rem]">
                        {slide.subtitle}
                    </p>

                    {hint ? (
                        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-white/70">{hint}</p>
                    ) : null}
                </div>

                <div className="relative shrink-0">
                    <div
                        className="absolute -inset-1 rounded-full bg-white/25 blur-md"
                        aria-hidden
                    />
                    <div
                        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-white/60 bg-white/20 text-lg font-black text-white shadow-xl backdrop-blur-sm ring-4 sm:h-16 sm:w-16 sm:text-xl ${theme.ring}`}
                        aria-hidden
                    >
                        {initials}
                    </div>
                    <span
                        className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/50 bg-white text-sm shadow-md sm:h-8 sm:w-8 sm:text-base"
                        aria-hidden
                    >
                        {theme.decorEmoji}
                    </span>
                </div>
            </div>
        </section>
    );
}

function DefaultSlideCard({ slide }: { slide: DashboardHeroSlide }) {
    const content = (
        <section
            className={`${HERO_SECTION_CLASS} border-white/10`}
            style={{ background: HERO_GRADIENT }}
        >
            <div className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-cyan-200/90">{slide.eyebrow}</p>
                        <h2 className="mt-0.5 text-xl font-black leading-tight text-white sm:text-2xl">
                            {slide.title}
                        </h2>
                        <p className="mt-1 text-xs text-white/70 sm:text-sm">{slide.subtitle}</p>
                    </div>
                    {slide.badge ? (
                        <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold sm:text-xs ${BADGE_STYLES[slide.badge.variant]}`}
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-90" />
                            {slide.badge.text}
                        </span>
                    ) : null}
                </div>

                {slide.metrics.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                        {slide.metrics.map((m) => (
                            <div
                                key={m.label}
                                className="rounded-xl border border-white/10 bg-white/10 px-2 py-2.5 text-center backdrop-blur-sm sm:px-3 sm:py-3"
                            >
                                <p className="text-base font-black text-white sm:text-lg">{m.value}</p>
                                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50 sm:text-[10px]">
                                    {m.label}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );

    if (slide.href) {
        return (
            <Link href={slide.href} className="block h-full touch-manipulation active:opacity-95">
                {content}
            </Link>
        );
    }

    return content;
}

function HeroSlideCard({ slide }: { slide: DashboardHeroSlide }) {
    const isBirthday = slide.variant === "birthday-today" || slide.variant === "birthday-soon";

    if (isBirthday) {
        return <BirthdaySlideLayout slide={slide} />;
    }

    return <DefaultSlideCard slide={slide} />;
}

function birthdayDotClass(slide: DashboardHeroSlide, isActive: boolean) {
    if (slide.variant !== "birthday-today" && slide.variant !== "birthday-soon") {
        return isActive ? DOT_ACTIVE : DOT_IDLE;
    }
    const theme = getBirthdayTheme(slide.variant);
    return isActive ? `w-6 ${theme.dotActive}` : `w-2 ${theme.dotIdle}`;
}

type DashboardHeroSliderProps = {
    slides: DashboardHeroSlide[];
};

export default function DashboardHeroSlider({ slides }: DashboardHeroSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const syncActiveFromScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || el.offsetWidth <= 0) return;
        const index = Math.round(el.scrollLeft / el.offsetWidth);
        setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
    }, [slides.length]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", syncActiveFromScroll, { passive: true });
        return () => el.removeEventListener("scroll", syncActiveFromScroll);
    }, [syncActiveFromScroll]);

    useEffect(() => {
        setActiveIndex(0);
        scrollRef.current?.scrollTo({ left: 0 });
    }, [slides]);

    const goToSlide = (index: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const next = Math.min(Math.max(index, 0), slides.length - 1);
        el.scrollTo({ left: next * el.offsetWidth, behavior: "smooth" });
        setActiveIndex(next);
    };

    const goPrev = () => goToSlide(activeIndex - 1);
    const goNext = () => goToSlide(activeIndex + 1);

    if (slides.length === 0) return null;

    const activeSlide = slides[activeIndex];
    const isBirthdayActive =
        activeSlide?.variant === "birthday-today" || activeSlide?.variant === "birthday-soon";

    return (
        <div className="relative">
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-roledescription="carousel"
                aria-label="Dashboard highlights"
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className="flex w-full shrink-0 snap-center snap-always flex-col"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
                        aria-hidden={activeIndex !== index}
                    >
                        <HeroSlideCard slide={slide} />
                    </div>
                ))}
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all touch-manipulation ${birthdayDotClass(slide, activeIndex === index)}`}
                        aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                        aria-current={activeIndex === index ? "true" : undefined}
                    />
                ))}
            </div>

            {activeIndex > 0 ? (
                <button
                    type="button"
                    onClick={goPrev}
                    className={`absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-lg backdrop-blur-sm transition sm:flex ${
                        isBirthdayActive
                            ? "border-white/30 bg-black/25 hover:bg-black/40"
                            : "border-white/20 bg-[#06124f]/80 hover:bg-[#0a2a5e]"
                    }`}
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            ) : null}
            {activeIndex < slides.length - 1 ? (
                <button
                    type="button"
                    onClick={goNext}
                    className={`absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-lg backdrop-blur-sm transition sm:flex ${
                        isBirthdayActive
                            ? "border-white/30 bg-black/25 hover:bg-black/40"
                            : "border-white/20 bg-[#06124f]/80 hover:bg-[#0a2a5e]"
                    }`}
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            ) : null}
        </div>
    );
}
