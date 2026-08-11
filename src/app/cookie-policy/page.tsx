"use client";

import React from "react";
import Link from "next/link";
import { useCookieConsent } from "@/context/CookieContext";

export default function CookiePolicyPage() {
  const { openPreferencesModal } = useCookieConsent();

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 overflow-hidden relative">
          {/* Top Decorative Wave Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#06124f] via-[#06b6d4] to-[#0077b6]" />

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-200">
            <div>
              <span className="text-xs font-bold text-[#06b6d4] tracking-widest uppercase bg-[#06b6d4]/10 px-3 py-1 rounded-full">
                Privacy & Compliance
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#06124f] mt-3">
                Cookie Policy
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: August 11, 2026 | VIROS Entrepreneurs IT Solutions Pvt. Ltd.
              </p>
            </div>

            <button
              onClick={openPreferencesModal}
              className="px-5 py-3 text-sm font-bold rounded-2xl bg-gradient-to-r from-[#06124f] to-[#0077b6] hover:from-[#06b6d4] hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
              Manage Cookie Preferences
            </button>
          </div>

          {/* Policy Main Content */}
          <div className="mt-8 space-y-8 text-gray-700 leading-relaxed text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#06124f]">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files placed on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, remember your preferences across sessions, secure client/employee portals, and provide analytical data to site owners.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#06124f]">2. How VIROS Uses Cookies</h2>
              <p>
                At VIROS Entrepreneurs, we prioritize data privacy and transparency. We use cookies and similar browser storage mechanisms to ensure session security, enhance user experience, evaluate public traffic patterns, and optimize our enterprise AIDC solution offerings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#06124f]">3. Categories of Cookies We Use</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-gray-900">Strictly Necessary Cookies</h3>
                  </div>
                  <p className="text-xs text-gray-600">
                    Essential for secure authentication into administrator and employee portals (`auth_token`, `employee_auth_token`), network security, and layout stability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
                    <h3 className="font-bold text-gray-900">Analytics & Performance Cookies</h3>
                  </div>
                  <p className="text-xs text-gray-600">
                    Collect aggregated, anonymized metrics about web traffic, page response speeds, and navigation flows to help us improve site efficiency.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h3 className="font-bold text-gray-900">Functional & Preference Cookies</h3>
                  </div>
                  <p className="text-xs text-gray-600">
                    Remember your choices such as cookie preferences, dynamic drawer state, search queries, and custom UI options.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-gray-900">Marketing & Targeting Cookies</h3>
                  </div>
                  <p className="text-xs text-gray-600">
                    Help deliver relevant announcements regarding new barcode hardware, software releases, and tailored enterprise solutions.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#06124f]">4. Cookie Declaration Table</h2>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#06124f] text-white">
                    <tr>
                      <th className="p-3 font-semibold">Cookie Name</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Purpose</th>
                      <th className="p-3 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#06124f]">auth_token</td>
                      <td className="p-3">Strictly Necessary</td>
                      <td className="p-3">Secures administrator portal authentication sessions</td>
                      <td className="p-3">Session / 1 Day</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#06124f]">employee_auth_token</td>
                      <td className="p-3">Strictly Necessary</td>
                      <td className="p-3">Secures employee dashboard access and operations</td>
                      <td className="p-3">Session / 1 Day</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#06124f]">viros_cookie_consent</td>
                      <td className="p-3">Functional</td>
                      <td className="p-3">Records that you have accepted/configured cookie preferences</td>
                      <td className="p-3">1 Year</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-[#06124f]">viros_cookie_preferences</td>
                      <td className="p-3">Functional</td>
                      <td className="p-3">Stores your granular consent preferences (analytics, marketing, functional)</td>
                      <td className="p-3">1 Year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#06124f]">5. Managing Your Preferences</h2>
              <p>
                You can change your consent preferences at any time by clicking the{" "}
                <button
                  type="button"
                  onClick={openPreferencesModal}
                  className="text-[#06b6d4] font-bold hover:underline"
                >
                  Manage Cookie Preferences
                </button>{" "}
                button above or via the "Cookie Preferences" link in our website footer. You can also clear cookies through your browser settings.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-gray-200">
              <h2 className="text-xl font-bold text-[#06124f]">6. Contact Us</h2>
              <p>
                If you have questions about our Cookie Policy or data handling practices, please contact us at:
              </p>
              <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100 text-xs sm:text-sm text-gray-700">
                <p className="font-bold text-[#06124f]">VIROS Entrepreneurs IT Solutions Private Limited</p>
                <p className="mt-1">Email: info@virosentrepreneurs.com | support@virosentrepreneurs.com</p>
                <p className="mt-1">Website Legal: <Link href="/privacy-policy" className="text-[#06b6d4] underline">Privacy Policy</Link> | <Link href="/terms-of-service" className="text-[#06b6d4] underline">Terms of Service</Link></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
