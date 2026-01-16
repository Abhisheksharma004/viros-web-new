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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <div key={i} className="bg-white rounded-3xl p-4 shadow-xl animate-pulse">
                                <div className="h-64 bg-gray-200 rounded-2xl mb-6"></div>
                                <div className="px-4 pb-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {products.map((product, index) => (
                            <div
                                key={product.id}
                                className={`group relative bg-white rounded-4xl overflow-hidden border border-gray-100 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#06b6d4]/20 flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#06b6d4]/30 rounded-4xl transition-colors duration-500 pointer-events-none z-10" />

                                <div className="relative h-72 overflow-hidden p-6 flex items-center justify-center">
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[#06124f] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>

                                    <Image
                                        src={product.image_url || '/placeholder-product.png'}
                                        alt={product.name}
                                        fill
                                        className="object-contain transition-transform duration-700 group-hover:scale-110"
                                    />

                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-[#06124f] shadow-sm tracking-wide border border-gray-100">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col grow relative bg-white">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-black text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors duration-300 line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>
                                        <div className="w-12 h-1 bg-linear-to-r from-[#06124f] to-[#06b6d4] rounded-full group-hover:w-20 transition-all duration-500" />
                                    </div>

                                    <p className="text-gray-600 mb-6 line-clamp-2 grow font-medium leading-relaxed">
                                        {product.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {product.specs?.map((spec: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-200 group-hover:border-[#06b6d4]/30 group-hover:text-[#06124f] transition-colors duration-300">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleInquiry(product.name, product.category, product.image_url, product.description, product.specs || [])}
                                        className="w-full py-4 rounded-xl bg-[#06124f] text-white font-bold text-center text-lg shadow-lg shadow-[#06124f]/20 group-hover:bg-[#06b6d4] group-hover:shadow-[#06b6d4]/30 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Inquiry Product
                                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
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
