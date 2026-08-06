"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CertificatesPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<any>(null);

    useEffect(() => {
        setIsVisible(true);

        // Fetch certificates from API
        const fetchCertificates = async () => {
            try {
                const response = await fetch('/api/certificates?active=true');
                const data = await response.json();
                setCertificates(data);
            } catch (error) {
                console.error('Error fetching certificates:', error);
                // Use fallback data if fetch fails
                setCertificates(fallbackCertificates);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    // Fallback certificates data
    const fallbackCertificates = [
        {
            id: 1,
            title: "ISO 9001:2015 Certification",
            issuer: "International Organization for Standardization",
            year: "2023",
            image_url: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80",
            description: "Certified for Quality Management Systems in hardware distribution and service."
        },
        {
            id: 2,
            title: "Zebra Premier Business Partner",
            issuer: "Zebra Technologies",
            year: "2022",
            image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
            description: "Recognized as a top-tier partner for delivering excellence in Zebra solutions."
        },
        {
            id: 3,
            title: "Honeywell Platinum Partner",
            issuer: "Honeywell",
            year: "2023",
            image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
            description: "Awarded for outstanding performance in industrial automation and safety solutions."
        },
        {
            id: 4,
            title: "Excellence in Customer Service",
            issuer: "Industry Awards 2023",
            year: "2023",
            image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
            description: "Voted best-in-class for client support and technical assistance."
        },
        {
            id: 5,
            title: "Sustainability Leadership Award",
            issuer: "Green Tech Initiative",
            year: "2022",
            image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?auto=format&fit=crop&w=800&q=80",
            description: "Honored for commitment to eco-friendly practices in hardware lifecycle management."
        }
    ];

    // Use fetched data or fallback
    const displayCertificates = certificates.length > 0 ? certificates : fallbackCertificates;

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
                        {displayCertificates.map((cert, index) => (
                            <div
                                key={cert.id}
                                className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#06b6d4]/20 flex flex-col p-7 sm:p-8 border border-slate-100/80 backdrop-blur-sm ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Gradient Border on Hover */}
                                <div className="absolute inset-0 p-[1.5px] rounded-3xl bg-gradient-to-br from-[#06b6d4]/30 via-slate-200 to-[#06124f]/20 group-hover:from-[#06b6d4] group-hover:via-[#06124f] group-hover:to-[#06b6d4] transition-all duration-500 z-0 pointer-events-none" />

                                {/* Inner Content */}
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        {/* Card Header: Certificate Badge & Year */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#06b6d4]/15 to-[#06124f]/10 border border-[#06b6d4]/30 text-[#06124f] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            </div>
                                            {cert.year && (
                                                <span className="px-3.5 py-1.5 bg-gradient-to-r from-[#06b6d4]/10 to-[#06124f]/10 text-[#06124f] border border-[#06b6d4]/25 rounded-full text-xs font-extrabold tracking-wider shadow-2xs">
                                                    {cert.year}
                                                </span>
                                            )}
                                        </div>

                                        {/* Issuer Tag & Title */}
                                        <div className="mb-4">
                                            <p className="text-[#06b6d4] font-extrabold text-xs mb-2 uppercase tracking-widest">
                                                {cert.issuer}
                                            </p>
                                            <h3 className="text-2xl font-black text-[#06124f] leading-tight tracking-tight group-hover:text-[#06b6d4] transition-colors duration-300">
                                                {cert.title}
                                            </h3>
                                        </div>

                                        {/* Accent Line */}
                                        <div className="w-12 h-1 bg-slate-100 rounded-full mb-4 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-[#06b6d4] group-hover:to-[#06124f] transition-all duration-500" />

                                        {/* Description */}
                                        <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                                            {cert.description}
                                        </p>
                                    </div>

                                    {/* View Certificate Action Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedImage(cert.image_url || cert.image || "");
                                            setSelectedCert(cert);
                                        }}
                                        className="w-full py-3.5 px-6 bg-gradient-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:shadow-[#06b6d4]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 group/btn touch-manipulation cursor-pointer mt-2"
                                    >
                                        <svg className="w-5 h-5 text-[#06b6d4] group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span>View Certificate</span>
                                    </button>
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

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={() => {
                        setSelectedImage(null);
                        setSelectedCert(null);
                    }}
                >
                    <button
                        className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                        onClick={() => {
                            setSelectedImage(null);
                            setSelectedCert(null);
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div
                        className="relative max-w-6xl w-full max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt={selectedCert?.title || "Certificate"}
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />

                        {/* Certificate Info Overlay */}
                        {selectedCert && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 rounded-b-2xl">
                                <div className="text-[#06b6d4] text-sm font-bold uppercase tracking-wider mb-2">
                                    {selectedCert.issuer}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                                    {selectedCert.title}
                                </h3>
                                <p className="text-white/80 text-sm md:text-base">
                                    {selectedCert.description}
                                </p>
                                <div className="mt-4 inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-bold">
                                    Year: {selectedCert.year}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
