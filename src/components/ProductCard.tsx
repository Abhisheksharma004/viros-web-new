"use client";

import Image from "next/image";

const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

interface ProductCardProps {
    product: {
        id: number;
        name: string;
        category: string;
        image_url: string;
        media_type?: "image" | "video";
        video_url?: string;
        description: string;
        tagline?: string;
        price_display?: string;
        specs?: string[];
        stock_status?: string;
    };
    index: number;
    isVisible: boolean;
    onInquiry: (
        name: string,
        category: string,
        image: string,
        description: string,
        specs: string[]
    ) => void;
}

export default function ProductCard({ product, index, isVisible, onInquiry }: ProductCardProps) {
    const hasSpecs = product.specs && product.specs.length > 0;

    return (
        <div
            className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#06b6d4]/20 border border-gray-100 transition-all duration-500 hover:-translate-y-2 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
        >
            {/* Image Area */}
            <div className="relative h-60 shrink-0 overflow-hidden bg-gray-50">
                {product.media_type === "video" && product.video_url ? (
                    (() => {
                        const videoId = getYouTubeVideoId(product.video_url);
                        return videoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
                                className="absolute inset-0 w-full h-full"
                                title={`${product.name} video`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <Image
                                src={product.image_url || "/placeholder-product.png"}
                                alt={product.name}
                                fill
                                className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                            />
                        );
                    })()
                ) : (
                    <Image
                        src={product.image_url || "/placeholder-product.png"}
                        alt={product.name}
                        fill
                        className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    />
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-[#06124f] text-white text-xs font-bold rounded-full shadow">
                        {product.category}
                    </span>
                </div>

                {/* Bottom gradient fade into info panel */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent" />
            </div>

            {/* Info Panel */}
            <div className="flex flex-col flex-1 p-5">
                {/* Product Name */}
                <h3 className="text-lg font-black text-[#06124f] leading-snug mb-1 line-clamp-2 group-hover:text-[#06b6d4] transition-colors duration-300">
                    {product.name}
                </h3>

                {/* Tagline */}
                {product.tagline && (
                    <p className="text-[#06b6d4] font-semibold text-sm mb-2">
                        {product.tagline}
                    </p>
                )}

                {/* Divider */}
                <div className="w-10 h-0.5 bg-linear-to-r from-[#06124f] to-[#06b6d4] rounded-full mb-3 group-hover:w-20 transition-all duration-500" />

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                    {product.description}
                </p>

                {/* Specs Table */}
                {hasSpecs && (
                    <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm border-collapse min-w-full">
                            <thead>
                                <tr className="bg-[#06124f]">
                                    <th className="text-left text-white text-xs font-bold px-3 py-2 tracking-wide" colSpan={2}>
                                        Specifications
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {product.specs!.map((spec: string, i: number) => (
                                    <tr key={i} className={`border-t border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                        <td className="px-3 py-2 w-10 align-middle border-r border-gray-200 text-center">
                                            <div className="w-5 h-5 rounded-full bg-[#06124f] flex items-center justify-center mx-auto">
                                                <span className="text-white text-xs font-bold leading-none">{i + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-gray-600 leading-snug wrap-break-word">{spec}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CTA Button */}
                <button
                    onClick={() =>
                        onInquiry(
                            product.name,
                            product.category,
                            product.image_url,
                            product.description,
                            product.specs || []
                        )
                    }
                    className="mt-auto w-full py-3 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl text-sm tracking-wide shadow-md hover:shadow-lg hover:shadow-[#06b6d4]/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Get Quote
                </button>
            </div>
        </div>
    );
}
