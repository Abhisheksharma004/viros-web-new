"use client";

import React, { useState, useEffect } from "react";
import { useCookieConsent } from "@/context/CookieContext";
import Link from "next/link";

export default function CookiePreferencesModal() {
  const { isModalOpen, closePreferencesModal, preferences, savePreferences, acceptAllCookies, declineNonEssentialCookies } =
    useCookieConsent();

  const [analytics, setAnalytics] = useState(preferences.analytics);
  const [functional, setFunctional] = useState(preferences.functional);
  const [marketing, setMarketing] = useState(preferences.marketing);

  useEffect(() => {
    setAnalytics(preferences.analytics);
    setFunctional(preferences.functional);
    setMarketing(preferences.marketing);
  }, [preferences, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSave = () => {
    savePreferences({
      analytics,
      functional,
      marketing,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-[#06124f] text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#06b6d4]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center text-[#06b6d4]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 id="cookie-modal-title" className="text-xl font-bold text-white">
                  Cookie Preferences
                </h2>
                <p className="text-xs text-gray-300">VIROS Privacy Management Center</p>
              </div>
            </div>
            <button
              onClick={closePreferencesModal}
              aria-label="Close dialog"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-700">
          <p className="text-sm leading-relaxed text-gray-600">
            Customize your cookie settings below. Essential cookies are necessary for proper operation of portal authentication, security, and navigation. You can enable or disable non-essential categories at any time. Learn more in our{" "}
            <Link href="/cookie-policy" onClick={closePreferencesModal} className="text-[#06b6d4] font-medium hover:underline">
              Cookie Policy
            </Link>
            .
          </p>

          <div className="space-y-4">
            {/* Category 1: Strictly Necessary */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-base">1. Strictly Necessary Cookies</h4>
                  <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-md uppercase tracking-wider">
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Required for core platform features such as user sessions (`auth_token`, `employee_auth_token`), CSRF protection, secure navigation, and system stability. Cannot be disabled.
                </p>
              </div>
              <div className="relative inline-flex items-center cursor-not-allowed shrink-0 mt-1">
                <input type="checkbox" checked disabled className="sr-only peer" />
                <div className="w-11 h-6 bg-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </div>
            </div>

            {/* Category 2: Analytics & Performance */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">2. Analytics & Performance Cookies</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Help us understand how visitors interact with public pages, count web traffic, measure load speeds, and improve solution navigation across the website.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]" />
              </label>
            </div>

            {/* Category 3: Functional & Preferences */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">3. Functional & Preference Cookies</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enable advanced UI functionality, such as remembering feedback popups state, inquiry preferences, search inputs, and layout settings across sessions.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]" />
              </label>
            </div>

            {/* Category 4: Marketing & Targeting */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">4. Marketing & Targeting Cookies</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Used to deliver relevant campaign promotions, track ad conversions, and show personalized AIDC solutions based on your browsing interests.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06b6d4]" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={declineNonEssentialCookies}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            >
              Reject Optional
            </button>
            <button
              type="button"
              onClick={acceptAllCookies}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-900 hover:bg-black text-white transition-colors"
            >
              Accept All
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0077b6] hover:from-cyan-400 hover:to-blue-600 text-white shadow-md hover:shadow-cyan-500/25 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
