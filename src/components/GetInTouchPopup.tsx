"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    ChevronDown,
    Loader2,
    Send,
    Search,
    MessageSquare,
    Sparkles
} from "lucide-react";
import Toast from "./Toast";

interface CountryCode {
    code: string;
    country: string;
    flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA / Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+968", country: "Oman", flag: "🇴🇲" },
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
];

export default function GetInTouchPopup() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        message: "",
    });
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchCountry, setSearchCountry] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const dropdownRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const checkIfSubmitted = () => {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem("viros_get_in_touch_submitted") === "true";
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scheduleNextPopup = (delayMs: number = 15000) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            if (!checkIfSubmitted()) {
                setIsOpen(true);
            }
        }, delayMs);
    };

    useEffect(() => {
        setMounted(true);

        const handleForceOpen = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setIsOpen(true);
        };

        window.addEventListener("open_get_in_touch_popup", handleForceOpen);

        if (!checkIfSubmitted()) {
            scheduleNextPopup(15000);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener("open_get_in_touch_popup", handleForceOpen);
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (!checkIfSubmitted()) {
            scheduleNextPopup(30000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/inquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: `${selectedCountry.code} ${formData.phone}`,
                    company: formData.companyName || null,
                    message: formData.message,
                    source: "website_popup",
                    subject: `Quick Inquiry from ${formData.fullName}`,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                try {
                    localStorage.setItem("viros_get_in_touch_submitted", "true");
                } catch { }

                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }

                setToastMessage("Inquiry submitted successfully! Our team will contact you shortly.");
                setToastType("success");
                setShowToast(true);

                setFormData({
                    fullName: "",
                    companyName: "",
                    email: "",
                    phone: "",
                    message: "",
                });

                setTimeout(() => {
                    setIsOpen(false);
                }, 1500);
            } else {
                setToastMessage(data.error || data.message || "Failed to submit inquiry. Please try again.");
                setToastType("error");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            setToastMessage("Network error. Please check your connection and try again.");
            setToastType("error");
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCountries = COUNTRY_CODES.filter(
        (c) =>
            c.country.toLowerCase().includes(searchCountry.toLowerCase()) ||
            c.code.includes(searchCountry)
    );

    if (!mounted) return null;

    return (
        <>
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden">
                    <div className="absolute inset-0" onClick={handleClose} />

                    {/* Exact Dashboard Modal Container */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative z-[10000] w-full max-w-lg bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Gradient like Dashboard Modals */}
                        <div
                            className="flex items-center justify-between px-6 py-4 text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                        >
                            <div className="flex items-center gap-2 font-bold text-base text-white">
                                <MessageSquare className="h-5 w-5 text-teal-300" />
                                Get in Touch / Quick Inquiry
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form Body - Exactly matching Dashboard Modal styling */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        required
                                        className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Company / Organization"
                                        className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative" ref={dropdownRef}>
                                        <div className="flex rounded-md border border-gray-200 focus-within:border-[#0a2a5e] focus-within:ring-2 focus-within:ring-[#0a2a5e]/20 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                                className="flex items-center gap-1 px-2.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs border-r border-gray-200 cursor-pointer rounded-l-md shrink-0 select-none"
                                            >
                                                <span>{selectedCountry.flag}</span>
                                                <span>{selectedCountry.code}</span>
                                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="837792 9141"
                                                required
                                                className="w-full px-3 py-2 text-sm text-gray-800 outline-none bg-transparent rounded-r-md"
                                            />
                                        </div>

                                        {/* Country Selector Dropdown */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-xl border border-gray-200 z-[10005] py-1">
                                                <div className="px-2 pb-1.5 mb-1 border-b border-gray-100">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-xs">
                                                        <Search className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <input
                                                            type="text"
                                                            value={searchCountry}
                                                            onChange={(e) => setSearchCountry(e.target.value)}
                                                            placeholder="Search country..."
                                                            className="w-full bg-transparent outline-none text-gray-700 text-xs"
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                <div className="max-h-44 overflow-y-auto">
                                                    {filteredCountries.length > 0 ? (
                                                        filteredCountries.map((item) => (
                                                            <button
                                                                key={item.code + item.country}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCountry(item);
                                                                    setIsDropdownOpen(false);
                                                                    setSearchCountry("");
                                                                }}
                                                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 cursor-pointer ${
                                                                    selectedCountry.code === item.code && selectedCountry.country === item.country
                                                                        ? "bg-blue-50 text-[#0a2a5e] font-semibold"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                <span>{item.flag}</span>
                                                                <span className="flex-1 truncate">{item.country}</span>
                                                                <span className="text-gray-400 font-mono">{item.code}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">
                                                            No country found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Message / Requirement <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Tell us about your hardware, software, or labeling requirements..."
                                    required
                                    rows={3}
                                    className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>

                            {/* Footer - Gray Action Bar exactly like Dashboard Modals */}
                            <div className="px-6 py-4 bg-gray-50 -mx-6 -mb-6 mt-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-md">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 rounded-md transition-opacity cursor-pointer shadow-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Send Inquiry</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
