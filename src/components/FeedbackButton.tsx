"use client";

import { useState } from "react";
import FeedbackPopup from "./FeedbackPopup";

export default function FeedbackButton() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <>
            {/* Feedback Button - Fixed Bottom Left */}
            <button
                onClick={() => setIsPopupOpen(true)}
                className="fixed bottom-6 left-6 z-50 group"
                aria-label="Send Feedback"
            >
                <div className="flex items-center gap-3 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-105">
                    {/* Icon */}
                    <svg 
                        className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
                        />
                    </svg>
                    {/* Text */}
                    <span className="font-bold text-sm whitespace-nowrap">
                        Feedback
                    </span>
                </div>
            </button>

            {/* Feedback Popup */}
            <FeedbackPopup 
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
            />
        </>
    );
}
