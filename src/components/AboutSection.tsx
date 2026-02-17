"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AboutSection() {
    const [isVisible, setIsVisible] = useState(false);
    const [content, setContent] = useState<any>(null);
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch dynamic content from API
        const fetchContent = async () => {
            try {
                const [contentRes, statsRes] = await Promise.all([
                    fetch('/api/about/content'),
                    fetch('/api/about/stats')
                ]);

                const contentData = await contentRes.json();
                const statsData = await statsRes.json();

                setContent(contentData);
                setStats(Array.isArray(statsData) ? statsData : []);
            } catch (error) {
                console.error('Error fetching homepage about content:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const section = document.getElementById("homepage-about");
        if (section) observer.observe(section);

        return () => {
            if (section) observer.unobserve(section);
        };
    }, []);

    const badge = content?.homepage_badge || "";
    const title = content?.homepage_title || "";
    const description = content?.homepage_description || "";
    const imageUrl = content?.homepage_image_url || "";
    const cardTitle = content?.homepage_card_title || "";
    const cardSubtitle = content?.homepage_card_subtitle || "";
    const displayStats = stats.length > 0 ? stats : [];

    return (
        <section id="homepage-about" className="py-24 relative overflow-hidden bg-[#06124f] text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.4),transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text Content */}
                    <div className={`w-full lg:w-1/2 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                        <span className="inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-6 border border-[#06b6d4]/20">
                            {badge}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                            {title.split(' ').slice(0, 2).join(' ')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-white">
                                {title.split(' ').slice(2).join(' ')}
                            </span>
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed font-light">
                            {description}
                        </p>

                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {displayStats.map((stat, index) => (
                                <div key={index}>
                                    <div className="text-3xl font-black text-[#06b6d4] mb-1">{stat.value}</div>
                                    <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/about"
                            className="inline-flex items-center px-8 py-4 bg-white text-[#06124f] font-bold rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-300 group"
                        >
                            Read Our Story
                            <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Image Composition */}
                    {imageUrl && (
                        <div className={`w-full lg:w-1/2 relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            <div className="relative h-[600px] w-full bg-gradient-to-br from-[#06b6d4]/20 to-[#06124f]/20 rounded-[2.5rem] p-4">
                                <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl">
                                    <Image
                                        src={imageUrl}
                                        alt="Warehouse Operations"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-[#06124f]/30 mix-blend-multiply" />

                                    {/* Floating Card */}
                                    {(cardTitle || cardSubtitle) && (
                                        <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[#06b6d4]/10 rounded-full flex items-center justify-center text-[#06b6d4]">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-[#06124f] font-bold text-lg">{cardTitle}</h4>
                                                    <p className="text-sm text-gray-500">{cardSubtitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
