"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    ChevronDown,
    ChevronRight,
    Cpu,
    Pill,
    ScanBarcode,
    Layers,
    HeartPulse,
    Sparkles
} from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [isIndustryOpen, setIsIndustryOpen] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState("automotive");
    const [isMobileCompanyOpen, setIsMobileCompanyOpen] = useState(false);
    const [isMobileIndustryOpen, setIsMobileIndustryOpen] = useState(false);
    const [activeMobileIndustry, setActiveMobileIndustry] = useState<string | null>("automotive");

    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const companyDropdownRef = useRef<HTMLDivElement>(null);
    const industryDropdownRef = useRef<HTMLDivElement>(null);
    const companyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [navbarContent, setNavbarContent] = useState({
        logo_url: '/newlogo.png',
        brand_title: '',
        brand_subtitle: ''
    });

    useEffect(() => {
        setIsOpen(false);
        setIsCompanyOpen(false);
        setIsIndustryOpen(false);
        setIsMobileCompanyOpen(false);
        setIsMobileIndustryOpen(false);
    }, [pathname]);

    useEffect(() => {
        const fetchNavbarContent = async () => {
            try {
                const response = await fetch('/api/navbar/content');
                if (response.ok) {
                    const data = await response.json();
                    if (data && !data.error) {
                        setNavbarContent(prev => ({ ...prev, ...data }));
                    }
                }
            } catch (error) {
                console.error('Error fetching navbar content:', error);
            }
        };

        fetchNavbarContent();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            const target = event.target as Node;
            if (
                isOpen &&
                menuRef.current &&
                !menuRef.current.contains(target) &&
                buttonRef.current &&
                !buttonRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
            if (
                companyDropdownRef.current &&
                !companyDropdownRef.current.contains(target)
            ) {
                setIsCompanyOpen(false);
            }
            if (
                industryDropdownRef.current &&
                !industryDropdownRef.current.contains(target)
            ) {
                setIsIndustryOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    const handleMouseEnterCompany = () => {
        if (companyTimeoutRef.current) clearTimeout(companyTimeoutRef.current);
        setIsCompanyOpen(true);
    };

    const handleMouseLeaveCompany = () => {
        companyTimeoutRef.current = setTimeout(() => {
            setIsCompanyOpen(false);
        }, 150);
    };

    const activeLogoUrl = '/newlogo.png';
    const showSeparateText = false;

    const companySubItems = [
        { title: "ABOUT US", href: "/about" },
        { title: "CERTIFICATE", href: "/certificates" },
        { title: "CONTACT US", href: "/contact" }
    ];

    const industriesData = [
        {
            id: "automotive",
            name: "Automotive & EV",
            icon: Cpu,
            solutions: [
                { name: "Warehouse Intelligence", href: "/services" },
                { name: "Production Traceability", href: "/services" },
                { name: "Work-in-Progress Tracking", href: "/services" },
                { name: "Asset Tracking Intelligence", href: "/services" },
                { name: "Inventory Intelligence", href: "/services" },
                { name: "Product Inspection", href: "/services" },
                { name: "Energy & Line Monitoring", href: "/services" },
                { name: "Anti-Counterfeit Protection", href: "/services" },
                { name: "Check Weigh & Print Solution", href: "/services" }
            ]
        },
        {
            id: "pharma",
            name: "Pharmaceuticals & Biotech",
            icon: Pill,
            solutions: [
                { name: "Serialisation & Track and Trace", href: "/services" },
                { name: "Cold Chain Temperature Monitoring", href: "/services" },
                { name: "21 CFR Part 11 Compliance", href: "/services" },
                { name: "e-Batch Manufacturing Records", href: "/services" },
                { name: "High-Speed Vision Inspection", href: "/services" },
                { name: "Automated Warehouse Storage", href: "/services" }
            ]
        },
        {
            id: "healthcare",
            name: "Healthcare & Hospitals",
            icon: HeartPulse,
            solutions: [
                { name: "Patient ID & Wristband Tracking", href: "/services" },
                { name: "Surgical & Medical Device Traceability", href: "/services" },
                { name: "Lab Sample & Specimen Tracking", href: "/services" },
                { name: "Hospital Asset & Bed Management", href: "/services" },
                { name: "Pharmacy & Medication Verification", href: "/services" },
                { name: "Regulatory Compliance & Records", href: "/services" }
            ]
        },
        {
            id: "electronics",
            name: "Electronics & Tech",
            icon: Cpu,
            solutions: [
                { name: "PCB Inspection & Tracking", href: "/services" },
                { name: "Component-Level Traceability", href: "/services" },
                { name: "SMT Production Line Monitoring", href: "/services" },
                { name: "AI Defect Detection & Analytics", href: "/services" },
                { name: "Real-time WIP Tracking", href: "/services" },
                { name: "ESD & Quality Compliance", href: "/services" }
            ]
        },
        {
            id: "textile",
            name: "Textiles & Garments",
            icon: Layers,
            solutions: [
                { name: "Fabric Roll Inspection System", href: "/services" },
                { name: "Roll Tracking & Barcode Automation", href: "/services" },
                { name: "Yarn & Lot Inventory Management", href: "/services" },
                { name: "Loom Output & Efficiency Monitoring", href: "/services" },
                { name: "Quality Assurance Automation", href: "/services" },
                { name: "Automated Dispatch System", href: "/services" }
            ]
        },
        {
            id: "excise",
            name: "Government & Excise",
            icon: ScanBarcode,
            solutions: [
                { name: "Track & Trace Solution", href: "/services" },
                { name: "High-Speed Line Monitoring", href: "/services" },
                { name: "QR Code & Hologram Verification", href: "/services" },
                { name: "Dispatch & Supply Chain Control", href: "/services" }
            ]
        }
    ];

    const currentIndustryData = industriesData.find(ind => ind.id === selectedIndustry) || industriesData[0];
    const isCompanyActive = pathname === "/about" || pathname === "/certificates" || pathname === "/contact";

    return (
        <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-[#06b6d4]/30 shadow-sm shadow-[#06124f]/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="shrink-0">
                        <Link href="/" className="flex items-center group">
                            <Image
                                src={activeLogoUrl}
                                alt={navbarContent.brand_title || 'Viros Entrepreneurs IT Solutions Private Limited'}
                                width={280}
                                height={80}
                                className="h-12 sm:h-14 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                                priority
                            />
                            {showSeparateText && (
                                <div className="ml-4 flex flex-col">
                                    <span className="text-2xl font-bold bg-linear-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent">
                                        {navbarContent.brand_title}
                                    </span>
                                    <span className="text-[#06124f] text-sm font-medium tracking-wide">
                                        {navbarContent.brand_subtitle}
                                    </span>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-2 lg:space-x-4">
                            <NavLink href="/" active={pathname === "/"}>Home</NavLink>

                            {/* Simple & Clean Company Dropdown (Hoverable) */}
                            <div
                                ref={companyDropdownRef}
                                className="relative"
                                onMouseEnter={handleMouseEnterCompany}
                                onMouseLeave={handleMouseLeaveCompany}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCompanyOpen(prev => !prev);
                                        setIsIndustryOpen(false);
                                    }}
                                    aria-expanded={isCompanyOpen}
                                    className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isCompanyActive || isCompanyOpen
                                        ? "text-[#06b6d4] bg-[#06b6d4]/10 font-semibold"
                                        : "text-[#06124f] hover:text-[#06b6d4] hover:bg-[#06b6d4]/10"
                                        }`}
                                >
                                    <span>Company</span>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-200 ${isCompanyOpen ? "rotate-180 text-[#06b6d4]" : "text-[#06124f]/70"
                                            }`}
                                    />
                                </button>

                                {/* Simple Box Dropdown Menu */}
                                <div
                                    className={`absolute left-0 top-full pt-1.5 w-48 transition-all duration-150 transform origin-top-left z-50 ${isCompanyOpen
                                        ? "opacity-100 translate-y-0 pointer-events-auto visible"
                                        : "opacity-0 -translate-y-1 pointer-events-none invisible"
                                        }`}
                                >
                                    <div className="bg-white border border-[#06b6d4]/30 shadow-xl divide-y divide-gray-100 rounded-lg overflow-hidden">
                                        {companySubItems.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsCompanyOpen(false)}
                                                    className={`block px-4 py-3 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-colors ${isActive
                                                        ? "text-[#06b6d4] bg-[#06b6d4]/10 font-bold"
                                                        : "text-[#06124f] hover:text-[#06b6d4] hover:bg-[#06b6d4]/5"
                                                        }`}
                                                >
                                                    {item.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Industry Mega Menu (CLICK ONLY) */}
                            <div
                                ref={industryDropdownRef}
                                className="relative"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsIndustryOpen(prev => !prev);
                                        setIsCompanyOpen(false);
                                    }}
                                    aria-expanded={isIndustryOpen}
                                    className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${isIndustryOpen
                                        ? "text-[#06b6d4] bg-[#06b6d4]/10 font-semibold"
                                        : "text-[#06124f] hover:text-[#06b6d4] hover:bg-[#06b6d4]/10"
                                        }`}
                                >
                                    <span>Industry</span>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-200 ${isIndustryOpen ? "rotate-180 text-[#06b6d4]" : "text-[#06124f]/70"
                                            }`}
                                    />
                                </button>

                                {/* Perfectly Centered & Spacious Mega Menu Panel */}
                                <div
                                    className={`fixed left-1/2 -translate-x-1/2 top-[76px] w-[1000px] lg:w-[1060px] xl:w-[1120px] max-w-[95vw] transition-all duration-200 transform origin-top z-50 ${isIndustryOpen
                                        ? "opacity-100 translate-y-0 pointer-events-auto visible"
                                        : "opacity-0 -translate-y-2 pointer-events-none invisible"
                                        }`}
                                >
                                    <div className="bg-white border border-[#06b6d4]/30 shadow-2xl rounded-2xl p-7 lg:p-8 ring-1 ring-black/5 overflow-hidden">
                                        {/* Subtle Top Gradient Accent */}
                                        <div className="h-1 -mx-8 -mt-8 mb-6 bg-linear-to-r from-[#06124f] via-[#06b6d4] to-[#06124f]" />

                                        <div className="flex gap-8">
                                            {/* Left Column: Industry Tabs (Click Only) */}
                                            <div className="w-72 pr-6 border-r border-[#06b6d4]/15 flex flex-col space-y-1.5 shrink-0">
                                                <div className="text-xs font-bold tracking-wider text-[#06124f]/60 uppercase mb-2 px-3 flex items-center justify-between">
                                                    <span>INDUSTRIES</span>
                                                    <Sparkles className="w-3.5 h-3.5 text-[#06b6d4]" />
                                                </div>

                                                {industriesData.map((ind) => {
                                                    const Icon = ind.icon;
                                                    const isSelected = selectedIndustry === ind.id;
                                                    return (
                                                        <button
                                                            key={ind.id}
                                                            type="button"
                                                            onClick={() => setSelectedIndustry(ind.id)}
                                                            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-full text-left transition-all duration-150 cursor-pointer ${isSelected
                                                                ? "bg-linear-to-r from-[#06b6d4]/15 to-[#06124f]/5 text-[#06124f] border border-[#06b6d4]/40 font-semibold shadow-xs"
                                                                : "text-[#06124f]/80 hover:bg-[#06b6d4]/5 border border-transparent font-medium hover:text-[#06124f]"
                                                                }`}
                                                        >
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                                ? "border border-[#06b6d4]/40 bg-white text-[#06b6d4] shadow-xs"
                                                                : "border border-gray-200 bg-gray-50 text-[#06124f]/60"
                                                                }`}>
                                                                <Icon className="w-4.5 h-4.5" />
                                                            </div>
                                                            <span className="text-[14px] truncate">
                                                                {ind.name}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Right Area: Solutions & Sales Card */}
                                            <div className="flex-1 flex flex-col justify-between pl-2 min-w-0">
                                                <div>
                                                    {/* Selected Industry Header */}
                                                    <div className="text-xs font-bold uppercase tracking-wider text-[#06124f] mb-5 pb-2.5 border-b border-[#06b6d4]/20 flex items-center justify-between">
                                                        <span className="text-sm font-bold text-[#06124f]">{currentIndustryData.name}</span>
                                                    </div>

                                                    {/* Solutions Grid (2 Columns) */}
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                                        {currentIndustryData.solutions.map((sol, idx) => (
                                                            <Link
                                                                key={idx}
                                                                href={sol.href}
                                                                onClick={() => setIsIndustryOpen(false)}
                                                                className="text-sm sm:text-[14.5px] font-medium text-[#06124f]/85 hover:text-[#06b6d4] transition-colors flex items-center gap-2.5 group py-1"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#06124f]/30 group-hover:bg-[#06b6d4] group-hover:scale-125 transition-all shrink-0"></span>
                                                                <span className="truncate">{sol.name}</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Bottom Sales Card */}
                                                <div className="mt-8 bg-linear-to-r from-[#06124f]/5 via-[#06b6d4]/5 to-transparent border border-[#06b6d4]/25 rounded-xl p-5 flex items-center justify-between gap-4">
                                                    <div>
                                                        <h5 className="text-[15px] font-bold text-[#06124f]">
                                                            Need different solutions?
                                                        </h5>
                                                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                                            Get in touch with our experts to find the right solutions tailored to your business needs.
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href="/contact"
                                                        onClick={() => setIsIndustryOpen(false)}
                                                        className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 active:scale-95 shadow-md shrink-0 whitespace-nowrap"
                                                        style={{ background: "linear-gradient(135deg, #06124f, #06b6d4)" }}
                                                    >
                                                        Talk to sales
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <NavLink href="/products" active={pathname === "/products"}>Products</NavLink>
                            <NavLink href="/services" active={pathname === "/services"}>Services</NavLink>
                            <NavLink href="/warranty" active={pathname === "/warranty"}>Warranty</NavLink>

                            <Link
                                href="/admin-login"
                                className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95 flex items-center gap-1.5"
                                style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)", boxShadow: "0 2px 8px rgba(10,42,94,0.3)" }}
                            >
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-[#06124f] hover:text-[#06b6d4] hover:bg-gradient-to-r hover:from-[#06b6d4]/10 hover:to-[#06124f]/5 focus:outline-none focus:ring-2 focus:ring-[#06124f]/50 transition-all duration-200 border border-[#06124f]/20"
                            aria-controls="mobile-menu"
                            aria-expanded={isOpen}
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
                <div ref={menuRef} className="md:hidden bg-white border-b border-[#06b6d4]/20 shadow-xl max-h-[85vh] overflow-y-auto" id="mobile-menu">
                    <div className="px-4 pt-3 pb-4 space-y-1 sm:px-6">
                        <MobileNavLink href="/" active={pathname === "/"} onClick={() => setIsOpen(false)}>
                            Home
                        </MobileNavLink>

                        {/* Mobile Company Accordion */}
                        <div className="border border-[#06b6d4]/20 divide-y divide-gray-100 bg-white rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setIsMobileCompanyOpen(prev => !prev)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${isCompanyActive ? "text-[#06b6d4] bg-[#06b6d4]/10 font-bold" : "text-[#06124f]"
                                    }`}
                            >
                                <span>Company</span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 text-[#06124f]/60 ${isMobileCompanyOpen ? "rotate-180 text-[#06b6d4]" : ""
                                        }`}
                                />
                            </button>

                            {isMobileCompanyOpen && (
                                <div className="divide-y divide-gray-100 bg-[#06b6d4]/5">
                                    {companySubItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    setIsMobileCompanyOpen(false);
                                                }}
                                                className={`block pl-7 pr-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${isActive
                                                    ? "text-[#06b6d4] bg-[#06b6d4]/15 font-bold"
                                                    : "text-[#06124f] hover:text-[#06b6d4] hover:bg-[#06b6d4]/10"
                                                    }`}
                                            >
                                                {item.title}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Mobile Industry Accordion */}
                        <div className="border border-[#06b6d4]/20 divide-y divide-gray-100 bg-white rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setIsMobileIndustryOpen(prev => !prev)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${isMobileIndustryOpen ? "text-[#06b6d4] bg-[#06b6d4]/10 font-bold" : "text-[#06124f]"
                                    }`}
                            >
                                <span>Industry</span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 text-[#06124f]/60 ${isMobileIndustryOpen ? "rotate-180 text-[#06b6d4]" : ""
                                        }`}
                                />
                            </button>

                            {isMobileIndustryOpen && (
                                <div className="divide-y divide-gray-100 bg-[#06b6d4]/5 p-2 space-y-2">
                                    {industriesData.map((ind) => {
                                        const Icon = ind.icon;
                                        const isExpanded = activeMobileIndustry === ind.id;
                                        return (
                                            <div key={ind.id} className="rounded-lg border border-[#06b6d4]/20 bg-white overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMobileIndustry(isExpanded ? null : ind.id)}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-bold text-[#06124f]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#06b6d4] flex items-center justify-center">
                                                            <Icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span>{ind.name}</span>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-gray-100 bg-gray-50/50">
                                                        {ind.solutions.map((sol, sIdx) => (
                                                            <Link
                                                                key={sIdx}
                                                                href={sol.href}
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    setIsMobileIndustryOpen(false);
                                                                }}
                                                                className="block py-1 text-xs text-[#06124f]/80 hover:text-[#06b6d4] transition-colors"
                                                            >
                                                                • {sol.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Mobile Sales Button */}
                                    <div className="p-2">
                                        <Link
                                            href="/contact"
                                            onClick={() => {
                                                setIsOpen(false);
                                                setIsMobileIndustryOpen(false);
                                            }}
                                            className="block text-center w-full py-2.5 text-xs font-bold text-white rounded-lg shadow-md transition-opacity hover:opacity-90"
                                            style={{ background: "linear-gradient(135deg, #06124f, #06b6d4)" }}
                                        >
                                            Talk to sales
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <MobileNavLink href="/products" active={pathname === "/products"} onClick={() => setIsOpen(false)}>
                            Products
                        </MobileNavLink>
                        <MobileNavLink href="/services" active={pathname === "/services"} onClick={() => setIsOpen(false)}>
                            Services
                        </MobileNavLink>
                        <MobileNavLink href="/warranty" active={pathname === "/warranty"} onClick={() => setIsOpen(false)}>
                            Warranty
                        </MobileNavLink>

                        <div className="px-2 pt-2 pb-2">
                            <Link
                                href="/admin-login"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 shadow-md"
                                style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

const NavLink = ({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) => (
    <Link
        href={href}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
            ? "text-[#06b6d4] bg-[#06b6d4]/10 font-semibold"
            : "text-[#06124f] hover:text-[#06b6d4] hover:bg-[#06b6d4]/10"
            }`}
    >
        {children}
    </Link>
);

const MobileNavLink = ({
    href,
    active,
    children,
    onClick
}: {
    href: string;
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void
}) => (
    <Link
        href={href}
        onClick={onClick}
        className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${active
            ? "text-[#06b6d4] bg-[#06b6d4]/10 font-semibold border-l-4 border-[#06b6d4]"
            : "text-[#06124f] hover:text-[#06b6d4] hover:bg-linear-to-r hover:from-[#06b6d4]/10 hover:to-[#06124f]/5 border-l-4 border-transparent hover:border-[#06b6d4]"
            }`}
    >
        {children}
    </Link>
);