import pool from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, Code, Tags, Settings, Monitor } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
    Printer: <Printer size={48} />,
    Code: <Code size={48} />,
    Tags: <Tags size={48} />,
    Settings: <Settings size={48} />,
    Monitor: <Monitor size={48} />,
};

export async function generateStaticParams() {
    const [rows]: any = await pool.query('SELECT slug as id FROM services');
    return rows;
}

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [rows]: any = await pool.query('SELECT * FROM services WHERE slug = ?', [id]);
    const service = rows[0];

    if (!service) {
        notFound();
    }

    // Parse JSON fields with safe fallbacks
    const features = typeof service.features === 'string' ? JSON.parse(service.features) : (service.features || []);
    const benefits = typeof service.benefits === 'string' ? JSON.parse(service.benefits) : (service.benefits || []);
    const specifications = typeof service.specifications === 'string' ? JSON.parse(service.specifications) : (service.specifications || []);
    const process = typeof service.process === 'string' ? JSON.parse(service.process) : (service.process || []);
    const faqs = typeof service.faqs === 'string' ? JSON.parse(service.faqs) : (service.faqs || []);
    const brands = typeof service.brands === 'string' ? JSON.parse(service.brands) : (service.brands || []);
    const products = typeof service.products === 'string' ? JSON.parse(service.products) : (service.products || []);
    const useCases = typeof service.useCases === 'string' ? JSON.parse(service.useCases) : (service.useCases || []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-125 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src={service.image_url}
                        alt={service.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className={`absolute inset-0 bg-linear-to-r ${service.gradient || 'from-[#06124f]/90 to-[#06b6d4]/80'} mix-blend-multiply`} suppressHydrationWarning />
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 text-white">
                        {iconMap[service.icon_name] || <Printer size={48} />}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        {service.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto font-light leading-relaxed">
                        {service.description}
                    </p>
                </div>
            </section>

            {/* Brands Section */}
            {Array.isArray(brands) && brands.length > 0 && (
                <section className="py-12 bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
                            Trusted Partner Brands
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                            {Array.isArray(brands) && brands.map((brand: any, idx: number) => (
                                <div key={brand.name || idx} className="flex items-center justify-center p-4 transition-transform duration-300 hover:scale-110">
                                    <div className="relative h-12 w-32">
                                        <Image
                                            src={brand.logo}
                                            alt={brand.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Overview & Key Benefits */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Description */}
                        <div>
                            <h2 className="text-3xl font-bold text-[#06124f] mb-6">Overview</h2>
                            <div className="prose prose-lg text-gray-600 mb-10 leading-relaxed whitespace-pre-wrap">
                                {service.long_description}
                            </div>

                            {Array.isArray(specifications) && specifications.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <h3 className="bg-gray-50 px-6 py-4 text-lg font-bold text-[#06124f] border-b border-gray-100">
                                        Technical Specifications
                                    </h3>
                                    <div className="p-6">
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                            {Array.isArray(specifications) && specifications.map((spec: any, idx: number) => (
                                                <div key={spec.label || idx} className="border-b border-gray-50 pb-2 last:border-0">
                                                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">{spec.label}</dt>
                                                    <dd className="mt-1 text-base font-semibold text-[#06124f]">{spec.value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Benefits Grid */}
                        <div>
                            <h2 className="text-3xl font-bold text-[#06124f] mb-8">Key Benefits</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {Array.isArray(benefits) && benefits.map((benefit: any, idx: number) => (
                                    <div key={benefit.title || idx} className="flex items-start p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mt-1">
                                            <svg className="w-5 h-5 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="ml-5">
                                            <h3 className="text-lg font-bold text-[#06124f] mb-2">{benefit.title}</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Examples Section */}
            {Array.isArray(products) && products.length > 0 && (
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#06124f] mb-4">Featured Products & Solutions</h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Explore our range of products and services tailored to meet your business needs
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {Array.isArray(products) && products.map((product: any, idx: number) => (
                                <div key={product.name || idx} className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                                        <Image
                                            src={product.image || product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="px-3 py-1 bg-[#06b6d4] text-white text-xs font-bold rounded-full shadow-sm">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Industry Use Cases */}
            {Array.isArray(useCases) && useCases.length > 0 && (
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#06124f] mb-4">Industry Use Cases</h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                See how businesses across industries leverage our solutions
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {Array.isArray(useCases) && useCases.map((useCase: any, idx: number) => (
                                <div key={useCase.industry || idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-[#06b6d4]/10 flex items-center justify-center mb-6">
                                        <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#06124f] mb-3">{useCase.industry}</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Challenge</span>
                                            <p className="text-gray-700 text-sm mt-1">{useCase.scenario}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-[#06b6d4] uppercase tracking-wide">Solution</span>
                                            <p className="text-gray-700 text-sm mt-1">{useCase.solution}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Our Process Section */}
            <section className="py-20 bg-[#06124f] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-[#06b6d4] font-bold tracking-widest uppercase text-sm mb-3 block">Workflow</span>
                        <h2 className="text-3xl md:text-5xl font-black">Our Service Process</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.isArray(process) && process.map((step: any, idx: number) => (
                            <div key={step.title || idx} className="relative group">
                                <div className="absolute -inset-0.5 bg-linear-to-r from-[#06b6d4] to-cyan-300 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-500" />
                                <div className="relative h-full bg-[#0a1a5c] p-8 rounded-2xl border border-white/10">
                                    <span className="text-5xl font-black text-white/5 absolute top-4 right-4">{step.step.toString().padStart(2, '0')}</span>
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#06b6d4] to-blue-500 flex items-center justify-center mb-6 text-white font-bold text-xl shadow-lg">
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#06b6d4] transition-colors">{step.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-4 mt-2">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQs Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-[#06124f] mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {Array.isArray(faqs) && faqs.map((faq: any, idx: number) => (
                            <div key={faq.question || idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                <h3 className="text-lg font-bold text-[#06124f] mb-3 flex items-start">
                                    <span className="text-[#06b6d4] mr-3 font-serif italic text-xl">Q.</span>
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600 pl-8 leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-[2.5rem] p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black mb-6">Ready to upgrade your operations?</h2>
                            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                                Get a custom quote for our {service.title} today. Our experts are ready to assist you.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center px-10 py-5 bg-white text-[#06124f] font-bold text-lg rounded-xl shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 group"
                            >
                                Contact Us Now
                                <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
