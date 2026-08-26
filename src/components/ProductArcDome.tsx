"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface Product {
    id: number;
    name: string;
    image_url: string;
    category?: string;
}

// Helper to safely extract primary image URL
const parsePrimaryImage = (imageUrl?: string): string => {
    if (!imageUrl) return "";
    try {
        if (imageUrl.startsWith("[") && imageUrl.endsWith("]")) {
            const parsed = JSON.parse(imageUrl);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
                return parsed[0].trim();
            }
        }
    } catch { }
    if (imageUrl.includes(",")) {
        const parts = imageUrl.split(",");
        if (parts[0]) return parts[0].trim();
    }
    return imageUrl.trim();
};

// Check if string is a valid URL or valid local path
const isValidImageUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

export default function ProductArcDome({ products }: { products: Product[] }) {
    const [time, setTime] = useState(0);
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const N = products?.length || 0;
    const travelTime = 24; // Seconds to cross full arc
    const staggerTime = 3;  // Seconds delay between sequential products
    const totalCycleTime = Math.max(N * staggerTime, travelTime);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;
            setTime(elapsedSeconds);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    if (!products || products.length === 0) return null;

    return (
        <div className="relative w-full max-w-5xl mx-auto h-[260px] xs:h-[310px] sm:h-[390px] md:h-[460px] lg:h-[540px] mt-2">
            {/* SVG Concentric Arc Rings & Node Dots */}
            <svg className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full h-[240px] xs:h-[290px] sm:h-[370px] md:h-[440px] lg:h-[500px] pointer-events-none" viewBox="0 0 1000 500" fill="none">
                <path d="M 60 490 A 440 440 0 0 1 940 490" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
                <path d="M 170 490 A 330 330 0 0 1 830 490" stroke="#06124f" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="5 5" />
                <path d="M 270 490 A 230 230 0 0 1 730 490" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />

                <circle cx="210" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="280" cy="360" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="300" cy="450" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="790" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Central Stacked Stats */}
            <div className="absolute bottom-2 sm:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 xs:gap-2 sm:gap-4 lg:gap-6 z-20 w-full max-w-md text-center">
                <div className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                    <div className="mb-0.5">
                        <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-sm xs:text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-none tracking-tight">100+</h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-normal text-gray-600 mt-0.5">AIDC Products</p>
                </div>

                <div className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                    <div className="mb-0.5">
                        <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 008.06 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                    <h3 className="text-sm xs:text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-none tracking-tight">100%</h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-normal text-gray-600 mt-0.5">Industrial Grade</p>
                </div>

                <div className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                    <div className="mb-0.5">
                        <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-sm xs:text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-none tracking-tight">Fast</h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-normal text-gray-600 mt-0.5">Pan-India Dispatch</p>
                </div>
            </div>

            {/* Circular Product Badges Positioned Dynamically Along Arc */}
            {products.map((product, index) => {
                const elapsed = (time + index * staggerTime) % totalCycleTime;
                if (elapsed > travelTime) return null;

                const progress = elapsed / travelTime;
                let opacity = 1;
                if (progress < 0.05) opacity = progress / 0.05;
                else if (progress > 0.95) opacity = (1 - progress) / 0.05;

                const angleDeg = 190 + progress * 160;
                const angleRad = (angleDeg * Math.PI) / 180;
                const leftPct = 50 + 38 * Math.cos(angleRad);
                const topPct = 90 + 74 * Math.sin(angleRad);

                const primaryImg = parsePrimaryImage(product.image_url);
                const isImageValid = isValidImageUrl(primaryImg);

                return (
                    <div
                        key={`prod-${product.id || index}`}
                        style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            transform: 'translate(-50%, -50%)',
                            opacity: opacity,
                        }}
                        className="absolute z-30 group/logo cursor-pointer"
                    >
                        <div className="relative w-11 h-11 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-white shadow-md group-hover/logo:shadow-2xl border-2 border-emerald-100 flex items-center justify-center p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-3.5 transition-all duration-300 group-hover/logo:scale-115">
                            <div className="relative w-full h-full flex items-center justify-center">
                                {isImageValid ? (
                                    <Image
                                        src={primaryImg}
                                        alt={product.name || "Product"}
                                        fill
                                        sizes="(max-width: 640px) 56px, (max-width: 1024px) 96px, 128px"
                                        className="object-contain p-0.5 sm:p-1"
                                    />
                                ) : (
                                    <Package className="w-1/2 h-1/2 text-gray-300" />
                                )}
                            </div>
                        </div>

                        {/* Floating High-Contrast Product Name Tooltip */}
                        <div className="absolute top-[106%] left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[90px] xs:min-w-[110px] sm:min-w-[130px] max-w-[170px]">
                            <div className="bg-[#06124f] text-white text-[9px] xs:text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl shadow-2xl text-center border border-[#06b6d4]/40 whitespace-normal leading-snug">
                                {product.name}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
