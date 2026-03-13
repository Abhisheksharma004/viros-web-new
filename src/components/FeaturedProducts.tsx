"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import InquiryPopup from "./InquiryPopup";
import ProductCard from "./ProductCard";

interface Product {
    id: number;
    name: string;
    category: string;
    image_url: string;
    media_type?: 'image' | 'video';
    video_url?: string;
    description: string;
    tagline?: string;
    price_display?: string;
    is_featured: boolean;
    stock_status: string;
    specs?: string[];
    slug?: string;
}

export default function FeaturedProducts() {
    const [isVisible, setIsVisible] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; category: string; image: string; description: string; specs: string[] } | null>(null);

    const handleInquiry = (productName: string, productCategory: string, productImage: string, productDescription: string, productSpecs: string[]) => {
        setSelectedProduct({ name: productName, category: productCategory, image: productImage, description: productDescription, specs: productSpecs });
        setIsPopupOpen(true);
    };

    useEffect(() => {
        fetchProducts();

        // Fallback: ensure products are always visible even if IntersectionObserver doesn't fire
        const fallbackTimer = setTimeout(() => setIsVisible(true), 800);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    clearTimeout(fallbackTimer);
                }
            },
            { threshold: 0, rootMargin: "0px 0px -50px 0px" }
        );

        const section = document.getElementById("featured-products");
        if (section) observer.observe(section);

        return () => {
            clearTimeout(fallbackTimer);
            if (section) observer.unobserve(section);
        };
    }, []);

    // Shuffle array randomly using Fisher-Yates algorithm
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                const parsedData = data.map((p: any) => ({
                    ...p,
                    specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs,
                    is_featured: Boolean(p.is_featured)
                }));
                // Randomly shuffle and select exactly 8 products
                const shuffled = shuffleArray(parsedData);
                const selectedProducts = shuffled.slice(0, 8);
                setProducts(selectedProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="featured-products" className="py-12 md:py-24 bg-linear-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#06b6d4]/20 to-transparent" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#06b6d4]/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#06124f]/5 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className={`inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        FEATURED SELECTION
                    </span>
                    <h2 className={`text-4xl md:text-5xl font-black text-[#06124f] mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Featured Products
                    </h2>
                    <p className={`text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Discover our premium barcode solutions • Refresh to see more products
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 animate-pulse">
                                <div className="h-60 bg-gray-100"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 rounded"></div>
                                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                    <div className="h-24 bg-gray-100 rounded-xl mt-3"></div>
                                    <div className="h-10 bg-gray-200 rounded-xl mt-4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg mb-4">No featured products available yet.</p>
                        <Link href="/dashboard/products" className="text-[#06b6d4] hover:underline font-semibold">
                            Add products in dashboard →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                isVisible={isVisible}
                                onInquiry={handleInquiry}
                            />
                        ))}
                    </div>
                )}

                <div className={`text-center transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <Link
                        href="/products"
                        className="inline-flex items-center px-8 py-4 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:shadow-[#06b6d4]/25 hover:-translate-y-1 transition-all duration-300 group"
                    >
                        View Full Catalog
                        <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

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
        </section>
    );
}
