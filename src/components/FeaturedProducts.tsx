"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import InquiryPopup from "./InquiryPopup";

interface Product {
    id: number;
    name: string;
    category: string;
    image_url: string;
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

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const section = document.getElementById("featured-products");
        if (section) observer.observe(section);

        return () => {
            if (section) observer.unobserve(section);
        };
    }, []);

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
                // Filter featured products or take first 9 (3 rows of 3)
                const featured = parsedData.filter((p: Product) => p.is_featured).slice(0, 9);
                setProducts(featured.length > 0 ? featured : parsedData.slice(0, 9));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="featured-products" className="py-24 bg-linear-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#06b6d4]/20 to-transparent" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#06b6d4]/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#06124f]/5 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className={`inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        PREMIUM SELECTION
                    </span>
                    <h2 className={`text-4xl md:text-5xl font-black text-[#06124f] mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Featured Products
                    </h2>
                    <p className={`text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Discover our top-rated barcode solutions designed to elevate your business efficiency.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-2/5 h-64 md:h-80 bg-gray-200"></div>
                                    <div className="md:w-3/5 p-6 space-y-4">
                                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-1 bg-gray-200 rounded w-16"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                                            <div className="h-6 bg-gray-200 rounded w-24"></div>
                                        </div>
                                        <div className="h-12 bg-gray-200 rounded-xl mt-4"></div>
                                    </div>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                        {products.map((product, index) => (
                            <div
                                key={product.id}
                                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-[#06b6d4]/10 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Image Section */}
                                    <div className="relative md:w-2/5 h-64 md:h-auto flex items-center justify-center p-6 overflow-hidden">
                                        {/* Product Image */}
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={product.image_url || "/placeholder-product.png"}
                                                alt={product.name}
                                                fill
                                                className="object-contain transition-transform duration-500 group-hover:scale-110"
                                            />
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
