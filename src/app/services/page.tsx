"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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
        gradient: "from-[#06b6d4] to-[#06124f]",
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
        gradient: "from-[#06124f] to-[#06b6d4]",
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
        gradient: "from-[#06b6d4] via-[#06124f] to-[#06b6d4]",
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
        gradient: "from-[#06124f] via-[#06b6d4] to-[#06124f]",
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
        gradient: "from-[#06b6d4] to-[#06124f]",
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

const processSteps = [
    {
        step: "01",
        title: "Consultation",
        description: "We analyze your business requirements and operational workflows to identify the ideal barcode solution."
    },
    {
        step: "02",
        title: "Solution Design",
        description: "Our experts design a tailored solution integrating the right hardware and software components."
    },
    {
        step: "03",
        title: "Implementation",
        description: "Seamless installation and setup of equipment with comprehensive staff training."
    },
    {
        step: "04",
        title: "Support",
        description: "Ongoing technical support and maintenance ensuring maximum uptime for your operations."
    }
];

export default function ServicesPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Hero Section */}
            <section className="relative py-24 lg:py-36 overflow-hidden pt-32">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-[#06124f]/5" />
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#06b6d4]/10 via-transparent to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-0 w-2/3 h-full bg-gradient-to-r from-[#06124f]/10 via-transparent to-transparent blur-3xl" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#06124f]/10 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-transparent">
                    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-[#06b6d4]/20 text-[#06124f] text-sm font-bold mb-8 shadow-sm">
                            <span className="w-2 h-2 bg-[#06b6d4] rounded-full mr-2 animate-pulse" />
                            Our Expertise
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-[#06124f] mb-8 tracking-tight leading-tight">
                            We Provide Complete AIDC, <br className="hidden md:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#06124f]">IT Hardware & Software Solutions</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
                            We provide end-to-end solutions for all your identification and tracking needs, helping you achieve operational excellence.
                        </p>
                    </div>
                </div>
            </section>

            {/* Enhanced Services Grid */}
            <section className="py-24 -mt-20 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-24">
                        {services.map((service, index) => (
                            <div
                                key={service.id}
                                className={`group relative flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                    }`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Image Section with Enhanced Design */}
                                <div className="relative w-full lg:w-1/2 h-[400px] lg:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-all duration-700 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(6,182,212,0.3)]">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-30 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-40`} />

                                    {/* Floating Badge */}
                                    <div className={`absolute bottom-8 ${index % 2 === 0 ? 'left-8' : 'right-8'} p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg transform transition-transform duration-500 group-hover:scale-105`}>
                                        <div className="w-12 h-12 flex items-center justify-center text-[#06b6d4]">
                                            {service.icon}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section with Modern Layout */}
                                <div className="w-full lg:w-1/2 relative">
                                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#06b6d4]/10 to-[#06124f]/10 rounded-full blur-3xl -z-10" />

                                    <h3 className="text-3xl md:text-5xl font-black text-[#06124f] mb-6 leading-tight">
                                        {service.title}
                                    </h3>

                                    <div className="w-20 h-1.5 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full mb-8" />

                                    <p className="text-gray-600 mb-10 leading-relaxed text-lg lg:text-xl font-light">
                                        {service.description}
                                    </p>

                                    <ul className="grid grid-cols-1 gap-4 mb-10">
                                        {service.features.map((feature, i) => (
                                            <li key={i} className="flex items-center text-gray-700 font-medium group/item p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">
                                                <div className="w-8 h-8 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mr-4 group-hover/item:bg-[#06b6d4] transition-colors duration-300">
                                                    <svg className="w-4 h-4 text-[#06b6d4] group-hover/item:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href="/contact" className="group/btn inline-flex items-center px-8 py-4 bg-[#06124f] text-white font-bold rounded-xl overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <span className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#06124f] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                        <span className="relative z-10 flex items-center">
                                            Explore Solutions
                                            <svg className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Process Section */}
            <section className="py-24 bg-[#06124f] relative overflow-hidden text-white">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
                    <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-[#06b6d4] font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Our Process</span>
                        <h2 className="text-4xl md:text-6xl font-black mb-6">How We Deliver Excellence</h2>
                        <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light">
                            Our proven methodology ensures that every solution is perfectly tailored to your business needs.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4]/30 to-transparent transform -translate-y-1/2" />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {processSteps.map((step, index) => (
                                <div key={index} className="relative group">
                                    <div className="relative z-10 bg-[#06124f] p-4 rounded-3xl border border-[#06b6d4]/10 hover:border-[#06b6d4]/40 transition-colors duration-300 h-full">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#06124f] p-[1px] mb-6 mx-auto transform group-hover:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full bg-[#06124f] rounded-2xl flex items-center justify-center relative overflow-hidden">
                                                <span className="text-2xl font-black text-white relative z-10">{step.step}</span>
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4] to-[#06124f] opacity-20" />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-center text-white mb-3">{step.title}</h3>
                                        <p className="text-gray-400 text-center text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#06b6d4] via-[#06124f] to-[#06b6d4]" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black text-[#06124f] mb-8">
                        Ready to Transform Your Business?
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-light">
                        Contact us today for a free consultation and discover how our barcode solutions can optimize your operations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <button className="px-10 py-5 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative">Get a Custom Quote</span>
                        </button>
                        <button className="px-10 py-5 border-2 border-[#06124f]/10 text-[#06124f] font-bold text-lg rounded-2xl hover:bg-[#06124f]/5 hover:border-[#06124f]/30 transition-all duration-300">
                            View Case Studies
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
