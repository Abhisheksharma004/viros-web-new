"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductHeroSlider from "@/components/ProductHeroSlider";
import InquiryPopup from "@/components/InquiryPopup";

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

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [isVisible, setIsVisible] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; category: string; image: string; description: string; specs: string[] } | null>(null);

    const handleInquiry = (productName: string, productCategory: string, productImage: string, productDescription: string, productSpecs: string[]) => {
        setSelectedProduct({ name: productName, category: productCategory, image: productImage, description: productDescription, specs: productSpecs });
        setIsPopupOpen(true);
    };

    useEffect(() => {
        setIsVisible(true);
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                const parsedData = data.map((p: any) => ({
                    ...p,
                    specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs,
                    is_featured: Boolean(p.is_featured)
                }));
                setProducts(parsedData);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = activeCategory === "All"
        ? products
        : products.filter(p => p.category === activeCategory);

    const featuredProducts = products.filter(p => p.is_featured);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative w-full">
                <ProductHeroSlider products={featuredProducts} />
            </section>

            {/* Filter & Grid Section */}
            <section className="py-10 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-4 mb-16 relative z-30 px-4">
                        <div className="flex flex-wrap justify-center w-full gap-3 p-2 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 shadow-xl">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 transform ${activeCategory === cat
                                        ? "bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white shadow-lg scale-105"
                                        : "bg-transparent text-[#06124f] hover:bg-white/50 hover:scale-105"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredProducts.map((product, index) => (
                            <div
                                key={product.id}
                                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-[#06b6d4]/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Image Section */}
                                    <div className="relative md:w-2/5 h-64 md:h-auto flex items-center justify-center p-6 overflow-hidden">
                                        {/* Product Media (Image or Video) */}
                                        <div className="relative w-full h-full">
                                            {product.media_type === 'video' && product.video_url ? (
                                                // YouTube Video
                                                (() => {
                                                    const videoId = getYouTubeVideoId(product.video_url);
                                                    return videoId ? (
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`}
                                                            className="absolute inset-0 w-full h-full rounded-lg"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        // Fallback to image if video ID can't be extracted
                                                        <Image
                                                            src={product.image_url || "/placeholder-product.png"}
                                                            alt={product.name}
                                                            fill
                                                            className="object-contain transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                    );
                                                })()
                                            ) : (
                                                // Image
                                                <Image
                                                    src={product.image_url || "/placeholder-product.png"}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                                                />
                                            )}
                                        </div>

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-[#06124f] shadow-md">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="md:w-3/5 p-6 flex flex-col justify-between">
                                        <div>
                                            {/* Product Name */}
                                            <h3 className="text-xl md:text-2xl font-bold text-[#06124f] mb-2 line-clamp-2 group-hover:text-[#06b6d4] transition-colors duration-300">
                                                {product.name}
                                            </h3>

                                            {/* Tagline */}
                                            {product.tagline && (
                                                <p className="text-sm text-[#06b6d4] font-semibold mb-3">
                                                    {product.tagline}
                                                </p>
                                            )}

                                            {/* Divider */}
                                            <div className="w-16 h-1 bg-linear-to-r from-[#06124f] to-[#06b6d4] rounded-full mb-4 group-hover:w-24 transition-all duration-500"></div>

                                            {/* Description */}
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                                {product.description}
                                            </p>

                                            {/* Specs */}
                                            {product.specs && product.specs.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {product.specs.slice(0, 4).map((spec: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                                                <svg className="w-3.5 h-3.5 text-[#06b6d4]" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="text-gray-700 font-medium">{spec}</span>
                                                            </div>
                                                        ))}
                                                        {product.specs.length > 4 && (
                                                            <span className="text-xs text-gray-500 font-medium">+{product.specs.length - 4} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleInquiry(product.name, product.category, product.image_url, product.description, product.specs || [])}
                                                className="w-full px-6 py-3 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm">Get Quote</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Effect Overlay */}
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#06b6d4]/30 rounded-2xl transition-all duration-500 pointer-events-none"></div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-500">No products found in this category.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#06b6d4] via-[#06124f] to-[#06b6d4]" />
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-black text-[#06124f] mb-6">Need Custom Hardware?</h2>
                    <p className="text-xl text-gray-600 mb-10">
                        We specialize in sourcing and configuring specific hardware solutions for unique business requirements.
                    </p>
                    <Link href="/contact" className="inline-block px-10 py-4 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        Contact Sales Team
                    </Link>
                </div>
            </section>

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
