"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type PhotoLightboxProps = {
    open: boolean;
    src: string | null;
    alt?: string;
    mirrored?: boolean;
    onClose: () => void;
};

export default function PhotoLightbox({
    open,
    src,
    alt = "Photo",
    mirrored = true,
    onClose,
}: PhotoLightboxProps) {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open || !src) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Full size photo"
        >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} aria-hidden />

            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
                aria-label="Close"
            >
                <X className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                className="relative z-10 max-h-[min(90vh,920px)] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
                style={mirrored ? { transform: "scaleX(-1)" } : undefined}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
