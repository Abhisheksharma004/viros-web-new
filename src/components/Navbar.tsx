"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-[#06b6d4]/30 shadow-sm shadow-[#06124f]/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center group">
                            <Image
                                src="/logo.png"
                                alt="VIROS"
                                width={200}
                                height={70}
                                className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                                priority
                            />
                            <div className="ml-4 flex flex-col">
                                <span className="text-2xl font-bold bg-gradient-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent">
                                    VIROS
                                </span>
                                <span className="text-sm text-[#06124f] font-medium tracking-wide">
                                    Entrepreneurs
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <NavLink href="/">Home</NavLink>
                            <NavLink href="/about">About</NavLink>
                            <NavLink href="/products">Products</NavLink>
                            <NavLink href="/services">Services</NavLink>
                            <NavLink href="/certificates">Certificates</NavLink>
                            <NavLink href="/warranty">Warranty</NavLink>
                            <NavLink href="/career">Career</NavLink>
                            <NavLink href="/contact">Contact</NavLink>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-[#06124f] hover:text-[#06b6d4] hover:bg-gradient-to-r hover:from-[#06b6d4]/10 hover:to-[#06124f]/5 focus:outline-none focus:ring-2 focus:ring-[#06124f]/50 transition-all duration-200 border border-[#06124f]/20"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-gradient-to-b from-white/98 to-white/95 backdrop-blur-xl border-b border-[#06b6d4]/20 shadow-xl shadow-[#06124f]/10" id="mobile-menu">
                    <div className="px-4 pt-3 pb-4 space-y-2 sm:px-6">
                        <MobileNavLink href="/about">About</MobileNavLink>
                        <MobileNavLink href="/products">Products</MobileNavLink>
                        <MobileNavLink href="/services">Services</MobileNavLink>
                        <MobileNavLink href="/certificates">Certificates</MobileNavLink>
                        <MobileNavLink href="/warranty">Warranty</MobileNavLink>
                        <MobileNavLink href="/career">Career</MobileNavLink>
                        <MobileNavLink href="/contact">Contact</MobileNavLink>
                    </div>
                </div>
            )}
        </nav>
    );
}

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="text-[#06124f] hover:text-[#06b6d4] px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[#06b6d4]/10"
    >
        {children}
    </Link>
);

const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="text-[#06124f] hover:text-[#06b6d4] block px-4 py-3 rounded-lg text-base font-medium hover:bg-gradient-to-r hover:from-[#06b6d4]/10 hover:to-[#06124f]/5 transition-all duration-200 border-l-2 border-transparent hover:border-[#06b6d4]"
    >
        {children}
    </Link>
);