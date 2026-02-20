"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import InquiryPopup from "@/components/InquiryPopup";
import {
    Printer, Code, Tags, Settings, Monitor, RefreshCcw, Palmtree
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactElement> = {
    "Printer": <Printer size={24} />,
    "Code": <Code size={24} />,
    "Tags": <Tags size={24} />,
    "Settings": <Settings size={24} />,
    "Monitor": <Monitor size={24} />,
    "RefreshCcw": <RefreshCcw size={24} />,
    "Palmtree": <Palmtree size={24} />
};

interface PageContent {
    hero_badge: string;
    hero_title: string;
    hero_description: string;
    process_badge: string;
    process_title: string;
    process_description: string;
    process_steps: Array<{
        step: string;
        title: string;
        description: string;
    }>;
    cta_title: string;
    cta_description: string;
    cta_primary_button: string;
    cta_secondary_button: string;
    inquiry_product_name: string;
    inquiry_product_category: string;
    inquiry_product_description: string;
}

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [pageContent, setPageContent] = useState<PageContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        
        const fetchData = async () => {
            try {
                // Add timestamp to bypass all caching layers
                const timestamp = new Date().getTime();
                
                // Fetch services with no cache
                const servicesRes = await fetch(`/api/services?_t=${timestamp}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                const servicesData = await servicesRes.json();
                const activeServices = servicesData.filter((s: any) => s.status === 'Active').map((s: any) => ({
                    ...s,
                    features: typeof s.features === 'string' ? JSON.parse(s.features) : s.features,
                    benefits: typeof s.benefits === 'string' ? JSON.parse(s.benefits) : s.benefits,
                    specifications: typeof s.specifications === 'string' ? JSON.parse(s.specifications) : s.specifications,
                    process: typeof s.process === 'string' ? JSON.parse(s.process) : s.process,
                    faqs: typeof s.faqs === 'string' ? JSON.parse(s.faqs) : s.faqs
                }));
                setServices(activeServices);
                
                // Fetch page content with no cache
                const contentRes = await fetch(`/api/services/content?_t=${timestamp}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (contentRes.ok) {
                    const contentData = await contentRes.json();
                    setPageContent(contentData);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Hero Section */}
            <section className="relative py-24 lg:py-36 overflow-hidden pt-32">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-[#06124f]/5" />
                <div className="absolute top-0 right-0 w-2/3 h-full bg-linear-to-l from-[#06b6d4]/10 via-transparent to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-0 w-2/3 h-full bg-linear-to-r from-[#06124f]/10 via-transparent to-transparent blur-3xl" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-[#06b6d4]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#06124f]/10 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-transparent">
                    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-[#06b6d4]/20 text-[#06124f] text-sm font-bold mb-8 shadow-sm">
                            <span className="w-2 h-2 bg-[#06b6d4] rounded-full mr-2 animate-pulse" />
                            {pageContent?.hero_badge || 'Our Expertise'}
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-[#06124f] mb-8 tracking-tight leading-tight">
                            {pageContent?.hero_title ? (
                                <span dangerouslySetInnerHTML={{ __html: pageContent.hero_title }} />
                            ) : (
                                <>
                                    We Provide Complete AIDC, <br className="hidden md:block" />
                                    <span className="bg-clip-text text-transparent bg-linear-to-r from-[#06b6d4] to-[#06124f]">IT Hardware & Software Solutions</span>
                                </>
                            )}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
                            {pageContent?.hero_description || 'We provide end-to-end solutions for all your identification and tracking needs, helping you achieve operational excellence.'}
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
                                className={`group relative flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Image Section with Enhanced Design */}
                                <div className="relative w-full lg:w-1/2 h-100 lg:h-125 rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-all duration-700 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(6,182,212,0.3)]">
                                    <Image
                                        src={service.image_url || "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80"}
                                        alt={service.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className={`absolute inset-0 bg-linear-to-br ${service.gradient || 'from-[#06b6d4] to-[#06124f]'} opacity-30 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-40`} />

                                    {/* Floating Badge */}
                                    <div className={`absolute bottom-8 ${index % 2 === 0 ? 'left-8' : 'right-8'} p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg transform transition-transform duration-500 group-hover:scale-105`}>
                                        <div className="w-12 h-12 flex items-center justify-center text-[#06b6d4]">
                                            {ICON_MAP[service.icon_name] || <Printer size={24} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section with Modern Layout */}
                                <div className="w-full lg:w-1/2 relative">
                                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-linear-to-br from-[#06b6d4]/10 to-[#06124f]/10 rounded-full blur-3xl -z-10" />

                                    <h3 className="text-3xl md:text-5xl font-black text-[#06124f] mb-6 leading-tight">
                                        {service.title}
                                    </h3>

                                    <div className="w-20 h-1.5 bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-full mb-8" />

                                    <p className="text-gray-600 mb-10 leading-relaxed text-lg lg:text-xl font-light">
                                        {service.description}
                                    </p>

                                    <ul className="grid grid-cols-1 gap-4 mb-10">
                                        {service.features.map((feature: string, i: number) => (
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

                                    <Link href={`/services/${service.slug}`} className="group/btn inline-flex items-center px-8 py-4 bg-[#06124f] text-white font-bold rounded-xl overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <span className="absolute inset-0 bg-linear-to-r from-[#06b6d4] to-[#06124f] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
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
                    <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] mask-[linear-gradient(to_bottom,white,transparent)]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-[#06b6d4] font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
                            {pageContent?.process_badge || 'Our Process'}
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black mb-6">
                            {pageContent?.process_title || 'How We Deliver Excellence'}
                        </h2>
                        <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light">
                            {pageContent?.process_description || 'Our proven methodology ensures that every solution is perfectly tailored to your business needs.'}
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[#06b6d4]/30 to-transparent transform -translate-y-1/2" />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {(pageContent?.process_steps || []).map((step, index) => (
                                <div key={index} className="relative group">
                                    <div className="relative z-10 bg-[#06124f] p-4 rounded-3xl border border-[#06b6d4]/10 hover:border-[#06b6d4]/40 transition-colors duration-300 h-full">
                                        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#06b6d4] to-[#06124f] p-px mb-6 mx-auto transform group-hover:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full bg-[#06124f] rounded-2xl flex items-center justify-center relative overflow-hidden">
                                                <span className="text-2xl font-black text-white relative z-10">{step.step}</span>
                                                <div className="absolute inset-0 bg-linear-to-br from-[#06b6d4] to-[#06124f] opacity-20" />
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
                <div className="absolute inset-0 bg-linear-to-br from-gray-50 to-white" />
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-[#06b6d4] via-[#06124f] to-[#06b6d4]" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black text-[#06124f] mb-8">
                        {pageContent?.cta_title || 'Ready to Transform Your Business?'}
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-light">
                        {pageContent?.cta_description || 'Contact us today for a free consultation and discover how our barcode solutions can optimize your operations.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <button 
                            onClick={() => setIsPopupOpen(true)}
                            className="px-10 py-5 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative">{pageContent?.cta_primary_button || 'Get a Custom Quote'}</span>
                        </button>
                        <Link href="/contact">
                            <button className="px-10 py-5 border-2 border-[#06124f]/10 text-[#06124f] font-bold text-lg rounded-2xl hover:bg-[#06124f]/5 hover:border-[#06124f]/30 transition-all duration-300">
                                {pageContent?.cta_secondary_button || 'Contact Our Team'}
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Inquiry Popup */}
            <InquiryPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                productName={pageContent?.inquiry_product_name || "AIDC & IT Solutions"}
                productCategory={pageContent?.inquiry_product_category || "Services"}
                productDescription={pageContent?.inquiry_product_description || "Get a customized quote for our complete AIDC, IT Hardware & Software solutions tailored to your business needs."}
            />
        </div>
    );
}
