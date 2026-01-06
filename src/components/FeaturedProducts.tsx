"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const featuredProducts = [
    {
        id: 1,
        name: "Industrial Label Printer ZT411",
        category: "Printers",
        image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
        description: "Robust industrial printing offered in a durable metal frame. Ideal for manufacturing and logistics.",
        price: "Best Seller"
    },
    {
        id: 2,
        name: "Handheld Scanner DS2200",
        category: "Scanners",
        image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80",
        description: "Affordable 1D/2D imager that doesn't compromise on performance or features.",
        price: "Popular"
    },
    {
        id: 3,
        name: "Enterprise PDA MC9300",
        category: "Mobility",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        description: "The ultimate ultra-rugged mobile touch computer for demanding environments.",
        price: "New Arrival"
    }
];

export default function FeaturedProducts() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
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

    return (
        <section id="featured-products" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#06b6d4]/20 to-transparent" />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {featuredProducts.map((product, index) => (
                        <div
                            key={product.id}
                            className={`group relative bg-white rounded-3xl p-4 shadow-xl hover:shadow-2xl hover:shadow-[#06b6d4]/10 transition-all duration-500 hover:-translate-y-2 border border-gray-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                            style={{ transitionDelay: `${index * 150 + 300}ms` }}
                        >
                            <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-50 mb-6 group-hover:bg-[#06124f]/5 transition-colors duration-500">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-bold text-[#06124f] shadow-sm">
                                        {product.price}
                                    </span>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                <span className="text-[#06b6d4] text-sm font-bold mb-2 block">{product.category}</span>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors">{product.name}</h3>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                    {product.description}
                                </p>

                                <Link
                                    href="/products"
                                    className="w-full block py-3 rounded-xl border-2 border-[#06124f]/10 text-[#06124f] font-bold text-center hover:bg-[#06124f] hover:text-white hover:border-[#06124f] transition-all duration-300"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`text-center transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <Link
                        href="/products"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:shadow-[#06b6d4]/25 hover:-translate-y-1 transition-all duration-300 group"
                    >
                        View Full Catalog
                        <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
