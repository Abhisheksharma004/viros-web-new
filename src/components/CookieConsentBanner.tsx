"use client";

import React from "react";
import Link from "next/link";
import { useCookieConsent } from "@/context/CookieContext";

export default function CookieConsentBanner() {
  const { isBannerOpen, acceptAllCookies, declineNonEssentialCookies, openPreferencesModal } = useCookieConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie Consent Banner"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 transition-all duration-500 transform translate-y-0"
    >
      <div className="bg-[#06124f]/95 backdrop-blur-md text-white p-5 sm:p-6 rounded-2xl shadow-2xl border border-[#06b6d4]/30 relative overflow-hidden group">
        {/* Ambient Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#06124f] via-[#06b6d4] to-[#0077b6]" />
        
        {/* Glow Element */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#06b6d4]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4">
          {/* Cookie Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center shrink-0 text-[#06b6d4] mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              We Value Your Privacy
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
              We use cookies and similar technologies to enhance your browsing experience, serve essential portal capabilities, analyze web traffic, and personalize enterprise content. Read our{" "}
              <Link href="/cookie-policy" className="text-[#06b6d4] underline hover:text-cyan-300 font-medium">
                Cookie Policy
              </Link>{" "}
              for details.
            </p>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={acceptAllCookies}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0077b6] hover:from-cyan-400 hover:to-blue-600 text-white shadow-md hover:shadow-cyan-500/25 transition-all duration-200"
              >
                Accept All
              </button>

              <button
                type="button"
                onClick={declineNonEssentialCookies}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-all duration-200"
              >
                Essential Only
              </button>

              <button
                type="button"
                onClick={openPreferencesModal}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-cyan-300 hover:text-white underline hover:no-underline transition-all duration-200 ml-auto sm:ml-0"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
