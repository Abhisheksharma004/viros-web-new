"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const services = [
    {
        id: "hardware",
        title: "Hardware Solutions",
        description: "Premium barcode printers, scanners, and mobile computing devices for industrial and retail environments.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
        ),
        features: ["Industrial Label Printers", "Handheld Barcode Scanners", "Mobile Computers (PDA)", "RFID Readers"],
        image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "software",
        title: "Software Solutions",
        description: "Custom software for inventory management, asset tracking, and point-of-sale integration.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        features: ["Inventory Management System", "Asset Tracking Software", "Warehouse Management (WMS)", "Custom Integration APIs"],
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "consumables",
        title: "Consumables",
        description: "High-quality thermal transfer ribbons and labels designed for durability and print clarity.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
        ),
        features: ["Thermal Transfer Ribbons", "Direct Thermal Labels", "Polyester & Asset Tags", "Custom Pre-printed Labels"],
        image: "https://images.unsplash.com/photo-1626071466170-13f508008801?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "support",
        title: "Support & Maintenance",
        description: "Comprehensive after-sales support, annual maintenance contracts (AMC), and on-site repairs.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        features: ["Annual Maintenance Contracts", "On-site Installation", "Printer Repair Services", "Remote Technical Support"],
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "rental",
        title: "Laptop & Desktop Rental",
        description: "Scale your workforce instantly with our flexible high-performance IT equipment rental solutions.",
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        features: ["Short & Long-term Rentals", "Workstations & Servers", "MacBooks & Windows Laptops", "24/7 Replacement Support"],
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

export default function FeaturedServices() {
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

        const section = document.getElementById("featured-services");
        if (section) observer.observe(section);

        return () => {
            if (section) observer.unobserve(section);
        };
    }, []);

    return (
        <section id="featured-services" className="py-24 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.05),transparent_40%)]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-24">
                    <h2 className={`text-4xl md:text-5xl font-black text-[#06124f] mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Our Services
                    </h2>
                    <p className={`text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Comprehensive AIDC solutions tailored to your business needs
                    </p>
                </div>

                <div className="space-y-32">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
                            style={{ transitionDelay: `${index * 200}ms` }}
                        >
                            {/* Image Side */}
                            <div className="w-full lg:w-1/2 relative group">
                                <div className="absolute inset-0 bg-black/5 rounded-[2.5rem] transform translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6" />
                                <div className="relative h-[400px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Floating Icon Badge */}
                                    <div className="absolute bottom-8 left-8 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#06b6d4] transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                        {service.icon}
                                    </div>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full lg:w-1/2">
                                <h3 className="text-4xl md:text-5xl font-black text-[#06124f] mb-2">
                                    {service.title}
                                </h3>
                                {/* Blue Underline */}
                                <div className="w-24 h-1.5 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full mb-8" />

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed font-medium">
                                    {service.description}
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {service.features.map((feature, i) => (
                                        <li key={i} className="flex items-center group/item cursor-default">
                                            <div className="w-10 h-10 rounded-full bg-[#06b6d4]/10 flex-shrink-0 flex items-center justify-center mr-4 group-hover/item:bg-[#06b6d4] transition-colors duration-300">
                                                <svg className="w-4 h-4 text-[#06b6d4] group-hover/item:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-semibold group-hover/item:text-[#06124f] transition-colors">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/contact"
                                    className="inline-flex items-center px-8 py-4 bg-[#06124f] text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/btn"
                                >
                                    Explore Solutions
                                    <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
