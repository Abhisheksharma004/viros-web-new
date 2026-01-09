"use client";

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Hide navbar and footer on login and dashboard pages
  const hideNavAndFooter = pathname === "/login" || pathname?.startsWith("/dashboard");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        {!hideNavAndFooter && <Navbar />}
        <main className={hideNavAndFooter ? "" : "pt-16"}>
          {children}
        </main>
        {!hideNavAndFooter && <Footer />}
      </body>
    </html>
  );
}
