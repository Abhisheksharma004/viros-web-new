"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DashboardHeroSlide } from "@/lib/employeeDashboard";

const HERO_GRADIENT = "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)";

const BADGE_STYLES = {
    emerald: "border-emerald-400/30 bg-emerald-500/20 text-emerald-200",
    amber: "border-amber-400/35 bg-amber-500/25 text-amber-100",
    cyan: "border-cyan-400/30 bg-cyan-500/20 text-cyan-100",
} as const;

const DOT_ACTIVE = "w-6 bg-white";
const DOT_IDLE = "w-2 bg-white/35";

function HeroSlideCard({ slide }: { slide: DashboardHeroSlide }) {
    const content = (
        <section
            className="h-full overflow-hidden rounded-2xl border border-white/10 shadow-md sm:rounded-3xl"
            style={{ background: HERO_GRADIENT }}
        >
            <div className="px-4 py-4 sm:px-6 sm:py-5">
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
                        className="w-full shrink-0 snap-center snap-always"
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
                        className={`h-2 rounded-full transition-all touch-manipulation ${
                            activeIndex === index ? DOT_ACTIVE : DOT_IDLE
                        }`}
                        aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                        aria-current={activeIndex === index ? "true" : undefined}
                    />
                ))}
            </div>

            {activeIndex > 0 ? (
                <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#06124f]/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#0a2a5e] sm:flex"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            ) : null}
            {activeIndex < slides.length - 1 ? (
                <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#06124f]/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#0a2a5e] sm:flex"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            ) : null}
        </div>
    );
}
