import Image from "next/image";
import pool from "@/lib/db";

async function getPartners() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM partners WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        return rows;
    } catch (error) {
        // Suppress errors during build when database is unavailable
        if (process.env.NODE_ENV !== 'production' && error && typeof error === 'object' && 'code' in error && error.code !== 'ECONNREFUSED') {
            console.error('Error fetching partners:', error);
        }
        return [];
    }
}

export default async function TrustedPartners() {
    const partners = await getPartners();

    if (partners.length === 0) return null;

    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <span className="text-[#06b6d4] font-bold tracking-wider uppercase text-sm mb-2 block">
                        TRUSTED BY INDUSTRY LEADERS
                    </span>
                    <h2 className="text-4xl font-extrabold text-[#06124f] sm:text-5xl">
                        Our Strategic Partners
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        
                    </p>
                </div>

                <div className="relative flex overflow-hidden group">
                    <div className="flex animate-marquee whitespace-nowrap shrink-0">
                        {partners.map((partner: any, index: number) => (
                            <div
                                key={partner.id || index}
                                className="mx-8 flex items-center justify-center h-24 w-40 shrink-0"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={partner.logo_url}
                                        alt={partner.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Duplicate for infinite scroll */}
                    <div className="flex animate-marquee whitespace-nowrap shrink-0">
                        {partners.map((partner: any, index: number) => (
                            <div
                                key={`clone-${partner.id || index}`}
                                className="mx-8 flex items-center justify-center h-24 w-40 shrink-0"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={partner.logo_url}
                                        alt={partner.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
