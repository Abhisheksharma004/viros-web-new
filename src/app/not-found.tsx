import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found | VIROS",
  description: "The page you are looking for could not be found. Return to the VIROS homepage to explore our AIDC solutions.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-[#00C2CB]" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">

          {/* 404 Visual */}
          <div className="relative mb-8 select-none">
            <p
              className="text-[160px] sm:text-[220px] font-extrabold leading-none tracking-tighter"
              style={{
                color: "transparent",
                WebkitTextStroke: "2px #022B42",
                opacity: 0.08,
                userSelect: "none",
              }}
            >
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <p className="text-6xl sm:text-8xl font-extrabold text-[#022B42] tracking-tight leading-none">
                  4<span className="text-[#00C2CB]">0</span>4
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-[#00C2CB]" />
            <div className="h-2 w-2 rounded-full bg-[#022B42]" />
            <div className="h-px w-16 bg-[#00C2CB]" />
          </div>

          {/* Message */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#022B42] mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-10 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: "Services", href: "/services" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-[#022B42] hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Primary CTA */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[#022B42] text-white font-semibold text-sm hover:bg-[#033a58] transition-colors duration-200 shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Homepage
          </Link>
        </div>
      </main>

      {/* Bottom accent bar */}
      <div className="h-1 w-full bg-[#022B42]" />
    </div>
  );
}
