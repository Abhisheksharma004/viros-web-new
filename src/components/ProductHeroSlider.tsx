"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import InquiryPopup from "@/components/InquiryPopup";

interface ProductHeroSliderProps {
    products?: any[];
}

// Extract YouTube video ID from URL (supports regular videos and Shorts)
const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

export default function ProductHeroSlider({ products: initialProducts }: ProductHeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; category: string; image: string; description: string; specs: string[] } | null>(null);

    const featuredProducts = (initialProducts && initialProducts.length > 0) ? initialProducts : [];

    const handleInquiry = (product: any) => {
        setSelectedProduct({
            name: product.name,
            category: product.category,
            image: product.image_url || product.image,
            description: product.description,
            specs: product.specs || []
        });
        setIsPopupOpen(true);
    };

    useEffect(() => {
        if (featuredProducts.length <= 1) return;
        const timer = setInterval(() => {
            handleNext();
        }, 6000);
        return () => clearInterval(timer);
    }, [currentIndex, featuredProducts.length]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
    };

    // Safety check for empty products
    if (featuredProducts.length === 0) return null;

    const activeProduct = featuredProducts[currentIndex];

    return (
        <div className="relative w-full min-h-[600px] md:h-screen flex items-center overflow-hidden bg-gray-50 pt-20 md:pt-0">

            {/* Background Gradient Mesh */}
            <div className={`absolute inset-0 bg-gradient-to-br ${activeProduct.theme_color || activeProduct.color} opacity-10 transition-colors duration-1000`} />

            {/* Animated Background Shapes */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/40 via-transparent to-transparent blur-3xl" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-white/40 via-transparent to-transparent blur-3xl" />

            {/* Mobile Background Media (Absolute) */}
            <div className="absolute inset-0 z-0 md:hidden">
                {activeProduct.media_type === 'video' && activeProduct.video_url ? (
                    // YouTube Video Background
                    (() => {
                        const videoId = getYouTubeVideoId(activeProduct.video_url);
                        return videoId ? (
                            <div className="relative w-full h-full">
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    allow="autoplay; encrypted-media"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '100vw',
                                        height: '56.25vw',
                                        minHeight: '100vh',
                                        minWidth: '177.78vh',
                                        pointerEvents: 'none',
                                        filter: 'blur(2px)',
                                        opacity: 0.6
                                    }}
                                />
                            </div>
                        ) : (
                            <Image
                                src={activeProduct.image_url || activeProduct.image}
                                alt={activeProduct.name}
                                fill
                                className="object-cover opacity-60 blur-[2px] scale-110"
                                priority
                            />
                        );
                    })()
                ) : (
                    <Image
                        src={activeProduct.image_url || activeProduct.image}
                        alt={activeProduct.name}
                        fill
                        className="object-cover opacity-60 blur-[2px] scale-110"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60" />
            </div>

            {/* Content Container */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-0 md:gap-12 h-full py-0 md:py-0">

                {/* Text Content */}
                <div key={`text-${currentIndex}`} className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center space-y-6 md:space-y-8 animate-fade-in-up text-center md:text-left h-full md:h-auto">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-[#06b6d4]/20 text-[#06124f] text-xs md:text-sm font-bold shadow-sm">
                        <span className="w-2 h-2 bg-[#06b6d4] rounded-full mr-2 animate-pulse" />
                        Featured Product
                    </div>

                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#06124f] leading-tight tracking-tight max-w-md md:max-w-3xl drop-shadow-sm md:drop-shadow-none">
                        {activeProduct.name}
                    </h2>

                    <div className="space-y-3 md:space-y-4 max-w-lg">
                        <h3 className="text-xl md:text-2xl font-bold text-[#06b6d4]">
                            {activeProduct.tagline}
                        </h3>
                        <p className="text-gray-700 md:text-gray-600 text-lg md:text-xl leading-relaxed font-medium md:font-light">
                            {activeProduct.description}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 md:px-0 pt-4 md:pt-0">
                        <Link href="/contact" className="px-8 py-4 bg-[#06124f] text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:bg-[#06b6d4] transition-all duration-300 transform hover:-translate-y-1 text-center text-base">
                            Request Demo
                        </Link>
                        <button 
                            onClick={() => handleInquiry(activeProduct)}
                            className="px-8 py-4 border-2 border-[#06124f] bg-white/80 backdrop-blur text-[#06124f] font-bold rounded-xl hover:bg-[#06124f] hover:text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-center text-base flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Get Quote
                        </button>
                    </div>
                </div>

                {/* Media Content (Desktop Only) */}
                <div className="hidden md:flex w-full md:w-1/2 h-full items-center justify-center relative">
                    <div key={`img-${currentIndex}`} className="relative w-full h-full max-h-[600px] animate-fade-in-scale">
                        <div className={`absolute inset-0 bg-gradient-to-br ${activeProduct.theme_color || activeProduct.color} opacity-20 rounded-full blur-3xl transform rotate-6 scale-90 translate-y-12`} />
                        {activeProduct.media_type === 'video' && activeProduct.video_url ? (
                            // YouTube Video
                            (() => {
                                const videoId = getYouTubeVideoId(activeProduct.video_url);
                                return videoId ? (
                                    <div className="relative w-full h-full p-8">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                                            className="w-full h-full rounded-2xl shadow-2xl z-20 relative"
                                            allow="autoplay; encrypted-media"
                                            allowFullScreen
                                            style={{
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <Image
                                        src={activeProduct.image_url || activeProduct.image}
                                        alt={activeProduct.name}
                                        fill
                                        className="object-contain drop-shadow-2xl z-20 relative p-8"
                                        priority
                                    />
                                );
                            })()
                        ) : (
                            <Image
                                src={activeProduct.image_url || activeProduct.image}
                                alt={activeProduct.name}
                                fill
                                className="object-contain drop-shadow-2xl z-20 relative p-8"
                                priority
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Slide Indicators */}
            {featuredProducts.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden md:flex space-x-2 z-30">
                    {featuredProducts.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > currentIndex ? 1 : -1);
                                setCurrentIndex(idx);
                            }}
                            className={`transition-all duration-300 rounded-full ${idx === currentIndex
                                ? "bg-[#06124f] w-8 h-2 md:w-12 md:h-3"
                                : "bg-[#06124f]/20 w-2 h-2 md:w-3 md:h-3 hover:bg-[#06b6d4] hover:scale-110"
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Inquiry Popup */}
            {selectedProduct && (
                <InquiryPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    productName={selectedProduct.name}
                    productCategory={selectedProduct.category}
                    productImage={selectedProduct.image}
                    productDescription={selectedProduct.description}
                    productSpecs={selectedProduct.specs}
                />
            )}
        </div>
    );
}
