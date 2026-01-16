"use client";

import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-6 right-6 z-100 animate-slide-in-right">
            <div
                className={`min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl border-2 flex items-start gap-4 ${
                    type === "success"
                        ? "bg-linear-to-r from-green-50 to-emerald-50 border-green-500"
                        : "bg-linear-to-r from-red-50 to-rose-50 border-red-500"
                }`}
            >
                <div className="shrink-0 mt-1">
                    {type === "success" ? (
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <div className="flex-1">
                    <h4
                        className={`font-bold text-base mb-1 ${
                            type === "success" ? "text-green-800" : "text-red-800"
                        }`}
                    >
                        {type === "success" ? "✓ Success!" : "✗ Error"}
                    </h4>
                    <p
                        className={`text-sm leading-relaxed ${
                            type === "success" ? "text-green-700" : "text-red-700"
                        }`}
                    >
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className={`shrink-0 p-1 rounded-lg transition-colors ${
                        type === "success"
                            ? "hover:bg-green-200 text-green-700"
                            : "hover:bg-red-200 text-red-700"
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
