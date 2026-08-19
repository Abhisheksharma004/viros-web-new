"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    ChevronDown,
    Loader2,
    User,
    Building2,
    Mail,
    Phone,
    MessageSquare,
    Send,
    Sparkles,
    ShieldCheck,
    Search,
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

    // Check submission status from localStorage safely on client
    const checkIfSubmitted = () => {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem("viros_get_in_touch_submitted") === "true";
        } catch {
            return false;
        }
    };

    // Close country dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Function to schedule opening popup after delay
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

        if (checkIfSubmitted()) {
            return;
        }

        // Show initially after 3 seconds on page load
        const initialTimer = setTimeout(() => {
            if (!checkIfSubmitted()) {
                setIsOpen(true);
            }
        }, 3000);

        return () => {
            clearTimeout(initialTimer);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setIsDropdownOpen(false);
        // Schedule next popup after 15 seconds
        scheduleNextPopup(15000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
            setToastMessage("Please fill in all required fields.");
            setToastType("error");
            setShowToast(true);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/contact/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.fullName.trim(),
                    company: formData.companyName.trim() || undefined,
                    email: formData.email.trim(),
                    phone: `${selectedCountry.code} ${formData.phone.trim()}`,
                    subject: "Get In Touch Popup Lead",
                    message: formData.message.trim(),
                    source: "website_popup",
                }),
            });

            const result = await response.json();

            if (response.ok) {
                try {
                    localStorage.setItem("viros_get_in_touch_submitted", "true");
                } catch (e) {
                    console.error("localStorage error:", e);
                }

                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }

                setToastMessage("Thank you! Your message has been sent successfully.");
                setToastType("success");
                setShowToast(true);

                // Reset and close
                setFormData({
                    fullName: "",
                    companyName: "",
                    email: "",
                    phone: "",
                    message: "",
                });
                setIsOpen(false);
            } else {
                setToastMessage(result.error || "Failed to submit. Please try again.");
                setToastType("error");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Popup submit error:", error);
            setToastMessage("Something went wrong. Please check your connection and try again.");
            setToastType("error");
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCountries = COUNTRY_CODES.filter((c) =>
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[#06124f]/60 backdrop-blur-sm transition-all duration-300">
                    {/* Background Backdrop Click */}
                    <div className="absolute inset-0" onClick={handleClose} />

                    {/* Modal Card - Compact Size (max-w-md / 460px) */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative z-[10000] w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(6,18,79,0.3)] border border-[#06b6d4]/20 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Gradient Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#06124f] via-[#06b6d4] to-[#022B42]" />

                        {/* Subtle decorative background glow */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#06b6d4]/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center border border-slate-200/60 shadow-2xs cursor-pointer group z-10"
                            aria-label="Close"
                        >
                            <X className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" />
                        </button>

                        {/* Header - Compact */}
                        <div className="text-center mb-4 sm:mb-4.5 pt-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 border border-cyan-200/60 text-[#007b92] mb-1.5 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-[#06b6d4]" />
                                <span>Quick Inquiry</span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-[#06124f] tracking-tight">
                                Get In{" "}
                                <span className="bg-linear-to-r from-[#06124f] via-[#0b256d] to-[#06b6d4] bg-clip-text text-transparent">
                                    Touch
                                </span>
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
                                Leave your requirements and our team will get in touch promptly.
                            </p>
                        </div>

                        {/* Form - Compact Inputs */}
                        <form onSubmit={handleSubmit} className="space-y-2.5">
                            {/* Row 1: Name & Company */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Name */}
                                <div className="group">
                                    <div className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#06b6d4] focus-within:ring-2 focus-within:ring-[#06b6d4]/15 transition-all overflow-hidden px-2.5 py-2 gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#06b6d4] shrink-0" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="Name *"
                                            required
                                            className="w-full outline-none text-slate-800 placeholder:text-slate-400 font-medium text-xs sm:text-[13px] bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Company */}
                                <div className="group">
                                    <div className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#06b6d4] focus-within:ring-2 focus-within:ring-[#06b6d4]/15 transition-all overflow-hidden px-2.5 py-2 gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#06b6d4] shrink-0" />
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            placeholder="Company"
                                            className="w-full outline-none text-slate-800 placeholder:text-slate-400 font-medium text-xs sm:text-[13px] bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Email */}
                            <div className="group">
                                <div className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#06b6d4] focus-within:ring-2 focus-within:ring-[#06b6d4]/15 transition-all overflow-hidden px-2.5 py-2 gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#06b6d4] shrink-0" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email Address *"
                                        required
                                        className="w-full outline-none text-slate-800 placeholder:text-slate-400 font-medium text-xs sm:text-[13px] bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Phone Number with Country Code */}
                            <div className="relative" ref={dropdownRef}>
                                <div className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#06b6d4] focus-within:ring-2 focus-within:ring-[#06b6d4]/15 transition-all overflow-hidden">
                                    {/* Country Selector Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-1 px-2 py-2 bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-medium text-xs transition-colors border-r border-slate-200 cursor-pointer shrink-0"
                                    >
                                        <span className="text-sm leading-none">{selectedCountry.flag}</span>
                                        <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">{selectedCountry.code}</span>
                                        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Number input */}
                                    <div className="flex items-center w-full px-2.5 py-2 gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Phone Number *"
                                            required
                                            className="w-full outline-none text-slate-800 placeholder:text-slate-400 font-medium text-xs sm:text-[13px] bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Country Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-hidden bg-white rounded-xl shadow-xl border border-slate-200 z-[10005] py-1.5 animate-in fade-in zoom-in-95">
                                        {/* Search box inside dropdown */}
                                        <div className="px-2 pb-1.5 mb-1 border-b border-slate-100">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/90 text-xs">
                                                <Search className="w-3 h-3 text-slate-400 shrink-0" />
                                                <input
                                                    type="text"
                                                    value={searchCountry}
                                                    onChange={(e) => setSearchCountry(e.target.value)}
                                                    placeholder="Search country..."
                                                    className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>

                                        {/* List of Countries */}
                                        <div className="max-h-36 overflow-y-auto">
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
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-cyan-50/70 transition-colors cursor-pointer ${
                                                            selectedCountry.country === item.country
                                                                ? "bg-cyan-50 font-semibold text-[#06124f]"
                                                                : "text-slate-700"
                                                        }`}
                                                    >
                                                        <span className="text-sm">{item.flag}</span>
                                                        <span className="flex-1 truncate">{item.country}</span>
                                                        <span className="text-slate-400 text-[11px] font-mono">{item.code}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                                                    No country found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 4: Message Textarea */}
                            <div className="group">
                                <div className="flex items-start w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white focus-within:border-[#06b6d4] focus-within:ring-2 focus-within:ring-[#06b6d4]/15 transition-all overflow-hidden px-2.5 py-2 gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#06b6d4] shrink-0 mt-0.5" />
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="How can we help your business? *"
                                        required
                                        rows={2}
                                        className="w-full outline-none text-slate-800 placeholder:text-slate-400 font-medium text-xs sm:text-[13px] resize-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Trust Indicator */}
                            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium pt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#06b6d4]" />
                                <span>100% Confidential • Fast response</span>
                            </div>

                            {/* Row 5: Submit Button */}
                            <div className="pt-0.5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 sm:py-3 rounded-xl bg-linear-to-r from-[#06124f] via-[#0b256d] to-[#06b6d4] hover:from-[#040e3b] hover:to-[#0891b2] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#06124f]/20 hover:shadow-cyan-500/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 group cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Inquiry</span>
                                            <Send className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
