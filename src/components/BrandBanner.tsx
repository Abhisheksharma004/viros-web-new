"use client";

import Image from "next/image";

export default function BrandBanner() {
    return (
        <section className="w-full bg-white relative py-4 sm:py-6 md:py-8 border-y border-slate-100 shadow-xs">
            <div className="w-full overflow-hidden">
                <Image
                    src="/hlogo.png"
                    alt="Viros Entrepreneurs IT Solutions Private Limited - Innovate, Reliable, Grow"
                    width={2500}
                    height={950}
                    className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.01]"
                    priority
                />
            </div>
        </section>
    );
}
