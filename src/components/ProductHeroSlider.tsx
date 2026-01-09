"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductHeroSliderProps {
    products?: any[];
}

export default function ProductHeroSlider({ products: initialProducts }: ProductHeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right

    const featuredProducts = (initialProducts && initialProducts.length > 0) ? initialProducts : [
        {
            id: 'fallback-1',
            name: "Zebra ZT411 Industrial Printer",
            tagline: "Rugged Durability for Demanding Applications",
            description: "Keep your critical operations running efficiently with Zebra's ZT411. Constructed with an all-metal frame and bi-fold door.",
            image_url: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
            theme_color: "from-[#06b6d4] to-[#06124f]"
        }
    ];

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

            {/* Mobile Background Image (Absolute) */}
            <div className="absolute inset-0 z-0 md:hidden">
                <Image
                    src={activeProduct.image_url || activeProduct.image}
                    alt={activeProduct.name}
                    fill
                    className="object-cover opacity-60 blur-[2px] scale-110"
                    priority
                />
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
                        <button className="px-8 py-4 border-2 border-[#06124f]/10 bg-white/50 backdrop-blur text-[#06124f] font-bold rounded-xl hover:bg-white transition-colors text-center text-base">
                            View Specifications
                        </button>
                    </div>
                </div>

                {/* Image Content (Desktop Only) */}
                <div className="hidden md:flex w-full md:w-1/2 h-full items-center justify-center relative">
                    <div key={`img-${currentIndex}`} className="relative w-full h-full max-h-[600px] animate-fade-in-scale">
                        <div className={`absolute inset-0 bg-gradient-to-br ${activeProduct.theme_color || activeProduct.color} opacity-20 rounded-full blur-3xl transform rotate-6 scale-90 translate-y-12`} />
                        <Image
                            src={activeProduct.image_url || activeProduct.image}
                            alt={activeProduct.name}
                            fill
                            className="object-contain drop-shadow-2xl z-20 relative p-8"
                            priority
                        />
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
        </div>
    );
}
