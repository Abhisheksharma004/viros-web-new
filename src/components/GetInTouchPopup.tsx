"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import Toast from "./Toast";

const COUNTRY_CODES = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
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
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    // Function to schedule opening popup after 15 seconds
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

        // Show initially after 3 seconds on page load so user sees it quickly
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
        if (!formData.fullName.trim()) {
            setToastMessage("Please enter your full name.");
            setToastType("error");
            setShowToast(true);
            return;
        }

        if (!formData.email.trim()) {
            setToastMessage("Please enter your email address.");
            setToastType("error");
            setShowToast(true);
            return;
        }

        if (!formData.phone.trim()) {
            setToastMessage("Please enter your phone number.");
            setToastType("error");
            setShowToast(true);
            return;
        }

        if (!formData.message.trim()) {
            setToastMessage("Please enter your message.");
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
                // Permanently remember submission in localStorage
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                    {/* Background Backdrop Click */}
                    <div className="absolute inset-0" onClick={handleClose} />

                    {/* Modal Card */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative z-[10000] w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close (X) Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-5 right-5 text-gray-700 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 stroke-[2.5]" />
                        </button>

                        {/* Title & Subtitle */}
                        <div className="text-center mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-2">
                                Get In Touch
                            </h2>
                            <p className="text-sm sm:text-base text-gray-500 font-medium">
                                We&apos;d love to hear from you
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Row 1: Full Name & Company Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                                <div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        required
                                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 focus:border-[#06124f] focus:ring-2 focus:ring-[#06124f]/15 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-sm sm:text-base transition-all bg-white"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Company Name"
                                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 focus:border-[#06124f] focus:ring-2 focus:ring-[#06124f]/15 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-sm sm:text-base transition-all bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Email Address & Phone Number */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                                <div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email Address"
                                        required
                                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 focus:border-[#06124f] focus:ring-2 focus:ring-[#06124f]/15 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-sm sm:text-base transition-all bg-white"
                                    />
                                </div>

                                {/* Phone Input with Country Code */}
                                <div className="relative" ref={dropdownRef}>
                                    <div className="flex items-center w-full rounded-xl sm:rounded-2xl border border-gray-300 focus-within:border-[#06124f] focus-within:ring-2 focus-within:ring-[#06124f]/15 transition-all bg-white overflow-hidden">
                                        {/* Country Selector Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center gap-1.5 px-3 py-3 sm:py-3.5 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors border-r border-gray-200 cursor-pointer"
                                        >
                                            <span className="text-base leading-none">{selectedCountry.flag}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-xs sm:text-sm text-gray-700 font-semibold">{selectedCountry.code}</span>
                                        </button>

                                        {/* Number input */}
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Phone Number"
                                            required
                                            className="w-full px-3 py-3 sm:py-3.5 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-sm sm:text-base bg-transparent"
                                        />
                                    </div>

                                    {/* Country Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-64 max-h-56 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-[10005] py-1">
                                            {COUNTRY_CODES.map((item) => (
                                                <button
                                                    key={item.code + item.country}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCountry(item);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                                                        selectedCountry.country === item.country
                                                            ? "bg-blue-50/70 font-semibold text-[#06124f]"
                                                            : "text-gray-700"
                                                    }`}
                                                >
                                                    <span className="text-base">{item.flag}</span>
                                                    <span className="flex-1 truncate">{item.country}</span>
                                                    <span className="text-gray-400 text-xs">{item.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Your Message */}
                            <div>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Your Message"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 focus:border-[#06124f] focus:ring-2 focus:ring-[#06124f]/15 outline-none text-gray-900 placeholder:text-gray-400 font-medium text-sm sm:text-base resize-none transition-all bg-white"
                                />
                            </div>

                            {/* Row 4: Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Submit</span>
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
