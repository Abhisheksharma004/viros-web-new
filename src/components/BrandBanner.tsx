"use client";

import Image from "next/image";

export default function BrandBanner() {
    return (
        <section className="w-full bg-slate-50/60 relative py-8 sm:py-12 border-y border-slate-200/60 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
                {/* Header Logo Banner (Top) */}
                <div className="w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all duration-500 hover:shadow-xl">
                    <Image
                        src="/hlogo.png"
                        alt="Viros Entrepreneurs IT Solutions Private Limited - Innovate, Reliable, Grow"
                        width={2500}
                        height={950}
                        className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.008]"
                        priority
                    />
                </div>

                {/* Secondary Header Banner */}
                <div className="w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all duration-500 hover:shadow-xl">
                    <Image
                        src="/blogo.jpeg"
                        alt="Viros Entrepreneurs IT Solutions Private Limited"
                        width={2500}
                        height={950}
                        className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.008]"
                    />
                </div>

                {/* Brand Poster 1 */}
                <div className="w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all duration-500 hover:shadow-xl">
                    <Image
                        src="/blg1.jpeg"
                        alt="Viros Entrepreneurs - Thoughts Shape Our Actions, Actions Shape Our Future"
                        width={1800}
                        height={2400}
                        className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.008]"
                    />
                </div>

                {/* Brand Poster 2 */}
                <div className="w-full overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all duration-500 hover:shadow-xl">
                    <Image
                        src="/blg2.jpeg"
                        alt="Viros Entrepreneurs - Premium Label Manufacturing For Every Business Need"
                        width={1800}
                        height={2400}
                        className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.008]"
                    />
                </div>
            </div>
        </section>
    );
}
