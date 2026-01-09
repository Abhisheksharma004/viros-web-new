"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductHeroSlider from "@/components/ProductHeroSlider";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [isVisible, setIsVisible] = useState(false);

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
                                        ? "bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white shadow-lg scale-105"
                                        : "bg-transparent text-[#06124f] hover:bg-white/50 hover:scale-105"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((product, index) => (
                            <div
                                key={product.id}
                                className={`group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#06b6d4]/20 flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#06b6d4]/30 rounded-[2rem] transition-colors duration-500 pointer-events-none z-10" />

                                <div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[#06124f] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>

                                    <Image
                                        src={product.image_url || "/placeholder-product.png"}
                                        alt={product.name}
                                        fill
                                        className="object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-lg"
                                    />

                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-[#06124f] shadow-sm tracking-wide border border-gray-100">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow relative bg-white">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-black text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors duration-300 line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>
                                        <div className="w-12 h-1 bg-gradient-to-r from-[#06124f] to-[#06b6d4] rounded-full group-hover:w-20 transition-all duration-500" />
                                    </div>

                                    <p className="text-gray-600 mb-6 line-clamp-2 flex-grow font-medium leading-relaxed">
                                        {product.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {product.specs?.map((spec: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-200 group-hover:border-[#06b6d4]/30 group-hover:text-[#06124f] transition-colors duration-300">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>

                                    <Link href={`/products/${product.slug}`} className="w-full py-4 rounded-xl bg-[#06124f] text-white font-bold text-center text-lg shadow-lg shadow-[#06124f]/20 group-hover:bg-[#06b6d4] group-hover:shadow-[#06b6d4]/30 transition-all duration-300 relative overflow-hidden">
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Get Quote
                                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </span>
                                    </Link>
                                </div>
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
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] via-[#06124f] to-[#06b6d4]" />
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-black text-[#06124f] mb-6">Need Custom Hardware?</h2>
                    <p className="text-xl text-gray-600 mb-10">
                        We specialize in sourcing and configuring specific hardware solutions for unique business requirements.
                    </p>
                    <Link href="/contact" className="inline-block px-10 py-4 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        Contact Sales Team
                    </Link>
                </div>
            </section>
        </div>
    );
}
