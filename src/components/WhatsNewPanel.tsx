"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BirthdayWishCard from "@/components/employee-dashboard/BirthdayWishCard";
import type { BirthdayWishCardData } from "@/lib/employeeBirthdayCards";

interface WhatsNewItem {
    id: number;
    tag: string;
    tag_color: string;
    title: string;
    description: string;
    link: string;
    link_text: string;
    is_new: boolean | number;
    is_active: boolean | number;
    display_order: number;
}

export default function WhatsNewPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<WhatsNewItem[]>([]);
    const [birthdayCards, setBirthdayCards] = useState<BirthdayWishCardData[]>([]);

    useEffect(() => {
        fetch("/api/whats-new")
            .then((r) => r.json())
            .then((data: WhatsNewItem[]) => {
                setItems(Array.isArray(data) ? data.filter((i) => i.is_active) : []);
            })
            .catch(() => {});

        fetch("/api/whats-new/birthdays", { cache: "no-store" })
            .then((r) => {
                if (!r.ok) return { cards: [] as BirthdayWishCardData[] };
                return r.json() as Promise<{ cards: BirthdayWishCardData[] }>;
            })
            .then((data) => {
                setBirthdayCards(Array.isArray(data.cards) ? data.cards : []);
            })
            .catch(() => setBirthdayCards([]));
    }, []);

    const newCount = items.filter((i) => i.is_new).length + birthdayCards.length;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-998 bg-black/40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div
                className="fixed z-999"
                style={{
                    right: isOpen ? "320px" : "0px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    transition: "right 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {newCount > 0 && (
                    <span
                        className="absolute flex items-center justify-center rounded-full text-white font-black"
                        style={{
                            background: "#e63946",
                            fontSize: "0.6rem",
                            width: "20px",
                            height: "20px",
                            top: "-6px",
                            left: "-6px",
                            zIndex: 2,
                            boxShadow: "0 0 0 2px #fff",
                            animation: "wn-pulse 2s ease-out infinite",
                        }}
                    >
                        {newCount}
                    </span>
                )}

                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="relative"
                    style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        background: "#00bcd4",
                        color: "#ffffff",
                        padding: "1.4rem 0.75rem",
                        borderRadius: "0 8px 8px 0",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        boxShadow: "-4px 0 16px rgba(0,188,212,0.45)",
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        userSelect: "none",
                        transform: "rotate(180deg)",
                        transition: "background 0.2s",
                    }}
                    aria-label="Toggle What's New panel"
                >
                    What&apos;s New
                </button>

                <style jsx global>{`
                    @keyframes wn-pulse {
                        0% {
                            box-shadow:
                                0 0 0 2px #fff,
                                0 0 0 3px rgba(230, 57, 70, 0.7);
                        }
                        70% {
                            box-shadow:
                                0 0 0 2px #fff,
                                0 0 0 8px rgba(230, 57, 70, 0);
                        }
                        100% {
                            box-shadow:
                                0 0 0 2px #fff,
                                0 0 0 3px rgba(230, 57, 70, 0);
                        }
                    }
                `}</style>
            </div>

            <div
                className="fixed top-0 right-0 h-full z-999 flex flex-col"
                style={{
                    width: "320px",
                    background: "#ffffff",
                    boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ background: "#0a2a5e" }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base tracking-wide">
                            What&apos;s New
                        </span>
                        {newCount > 0 && (
                            <span
                                className="flex items-center justify-center rounded-full text-white font-bold"
                                style={{
                                    background: "#e63946",
                                    fontSize: "0.65rem",
                                    width: "20px",
                                    height: "20px",
                                }}
                            >
                                {newCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white transition-colors text-xl leading-none"
                        aria-label="Close panel"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {birthdayCards.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {birthdayCards.map((card) => (
                                <BirthdayWishCard key={card.id} {...card} compact />
                            ))}
                        </div>
                    ) : null}

                    {items.length === 0 && birthdayCards.length === 0 && (
                        <p className="text-center text-gray-400 text-sm mt-8">No updates yet.</p>
                    )}

                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl overflow-hidden"
                            style={{
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div
                                className="flex items-center justify-between px-4 py-2"
                                style={{ background: item.tag_color }}
                            >
                                <span className="text-white text-xs font-bold tracking-widest uppercase">
                                    {item.tag}
                                </span>
                                {item.is_new ? (
                                    <span
                                        className="text-xs font-bold rounded-full px-2 py-0.5"
                                        style={{ background: "#f0c040", color: "#0a2a5e" }}
                                    >
                                        NEW
                                    </span>
                                ) : null}
                            </div>

                            <div className="p-4 bg-white">
                                <p className="font-semibold text-gray-800 text-sm mb-1 leading-snug">
                                    {item.title}
                                </p>
                                <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                                    {item.description}
                                </p>
                                <Link
                                    href={item.link}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-block text-xs font-bold px-4 py-1.5 rounded-full transition-all hover:opacity-90"
                                    style={{ background: item.tag_color, color: "#ffffff" }}
                                >
                                    {item.link_text} →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    className="px-5 py-3 text-center"
                    style={{ borderTop: "1px solid #e5e7eb" }}
                >
                    <p className="text-gray-400 text-xs">
                        © {new Date().getFullYear()} VIROS — Latest Updates
                    </p>
                </div>
            </div>
        </>
    );
}
