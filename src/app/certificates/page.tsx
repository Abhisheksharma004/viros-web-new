"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";


// Mock Certificates Data
const certificates = [
    {
        id: 1,
        title: "ISO 9001:2015 Certification",
        issuer: "International Organization for Standardization",
        year: "2023",
        image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80",
        description: "Certified for Quality Management Systems in hardware distribution and service."
    },
    {
        id: 2,
        title: "Zebra Premier Business Partner",
        issuer: "Zebra Technologies",
        year: "2022",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
        description: "Recognized as a top-tier partner for delivering excellence in Zebra solutions."
    },
    {
        id: 3,
        title: "Honeywell Platinum Partner",
        issuer: "Honeywell",
        year: "2023",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
        description: "Awarded for outstanding performance in industrial automation and safety solutions."
    },
    {
        id: 4,
        title: "Excellence in Customer Service",
        issuer: "Industry Awards 2023",
        year: "2023",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        description: "Voted best-in-class for client support and technical assistance."
    },
    {
        id: 5,
        title: "Sustainability Leadership Award",
        issuer: "Green Tech Initiative",
        year: "2022",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?auto=format&fit=crop&w=800&q=80",
        description: "Honored for commitment to eco-friendly practices in hardware lifecycle management."
    }
];

export default function CertificatesPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Hero Section */}
            <section className="relative w-full pt-32 pb-32 overflow-hidden bg-[#06124f]">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#06b6d4]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#06b6d4]/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                        <div className="inline-flex items-center px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold mb-8 shadow-2xl hover:scale-105 transition-transform cursor-default">
                            <span className="relative flex h-3 w-3 mr-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06b6d4] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#06b6d4]"></span>
                            </span>
                            Awards & Recognitions
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tight">
                            Excellence <br className="md:hidden" />
                            <span className="relative whitespace-nowrap">
                                <span className="absolute -inset-1 bg-gradient-to-r from-[#06b6d4] to-cyan-300 blur-2xl opacity-20" />
                                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-cyan-200 to-white">
                                    Recognized.
                                </span>
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed mb-12">
                            Proving our commitment to <span className="text-white font-semibold">quality</span>, <span className="text-white font-semibold">innovation</span>, and <span className="text-white font-semibold">reliability</span> through industry-standard certifications.
                        </p>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="animate-bounce p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Certificates Grid */}
            <section className="py-20 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {certificates.map((cert, index) => (
                            <div
                                key={cert.id}
                                className={`group relative bg-white rounded-[2rem] overflow-hidden shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#06b6d4]/20 flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Gradient Border on Hover */}
                                <div className="absolute inset-0 p-[1px] rounded-[2rem] bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-[#06b6d4] group-hover:via-[#06124f] group-hover:to-[#06b6d4] transition-all duration-700 z-0 opacity-0 group-hover:opacity-100" />

                                {/* Card Background */}
                                <div className="absolute inset-[1px] bg-white rounded-[2rem] z-0" />

                                {/* Image Area */}
                                <div className="relative h-64 overflow-hidden z-10 m-[1px] rounded-t-[2rem]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#06124f] via-transparent to-transparent z-10 opacity-80" />
                                    <Image
                                        src={cert.image}
                                        alt={cert.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold tracking-wider uppercase shadow-lg">
                                            {cert.year}
                                        </div>
                                    </div>

                                    {/* Hover Overlay Icon */}
                                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[#06124f]/40 backdrop-blur-[2px]">
                                        <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur text-[#06124f] flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex flex-col flex-grow relative z-10">
                                    <div className="mb-4">
                                        <p className="text-[#06b6d4] font-bold text-xs mb-2 uppercase tracking-widest">
                                            {cert.issuer}
                                        </p>
                                        <h3 className="text-2xl font-black text-[#06124f] leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#06124f] group-hover:to-[#06b6d4] transition-all duration-300">
                                            {cert.title}
                                        </h3>
                                    </div>
                                    <div className="w-12 h-1 bg-gray-100 rounded-full mb-4 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-[#06b6d4] group-hover:to-[#06124f] transition-all duration-700" />
                                    <p className="text-gray-500 text-sm leading-relaxed flex-grow font-medium">
                                        {cert.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white relative overflow-hidden text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-[#06124f] mb-6">Partner with a Certified Leader</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Trust your business technology to a team that meets the highest standards of quality and service.
                    </p>
                    <Link href="/contact" className="inline-block px-10 py-4 bg-[#06124f] text-white font-bold rounded-xl shadow-lg hover:bg-[#06b6d4] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        Get in Touch
                    </Link>
                </div>
            </section>
        </div>
    );
}
