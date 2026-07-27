import Image from "next/image";
import pool from "@/lib/db";

async function getClients() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM clients WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        return rows;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production' && error && typeof error === 'object' && 'code' in error && error.code !== 'ECONNREFUSED') {
            console.error('Error fetching clients:', error);
        }
        return [];
    }
}

async function getPartners() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM partners WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        return rows;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production' && error && typeof error === 'object' && 'code' in error && error.code !== 'ECONNREFUSED') {
            console.error('Error fetching partners:', error);
        }
        return [];
    }
}

const clientStats = [
    {
        value: "500+",
        label: "Happy Clients worldwide",
        icon: (
            <svg className="w-8 h-8 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        value: "98%",
        label: "Retention Rate worldwide",
        icon: (
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        )
    },
    {
        value: "24/7",
        label: "Dedicated Support worldwide",
        icon: (
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        )
    },
];

const partnerStats = [
    {
        value: "50+",
        label: "Global OEM Partners",
        icon: (
            <svg className="w-8 h-8 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        )
    },
    {
        value: "100%",
        label: "Genuine & Authorized",
        icon: (
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
        )
    },
    {
        value: "15+ Yrs",
        label: "Hardware Mastery",
        icon: (
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        )
    },
];

export default async function ClientSection() {
    const [clients, partners] = await Promise.all([getClients(), getPartners()]);

    if (clients.length === 0 && partners.length === 0) return null;

    const displayClients = clients.slice(0, 8);
    const displayPartners = partners.slice(0, 8);

    const clientTotal = displayClients.length;
    const partnerTotal = displayPartners.length;

    return (
        <section className="py-24 relative overflow-hidden bg-[#f3f7fd]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Title */}
                <div className="text-center mb-8">
                    <span className="inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-4 border border-[#06b6d4]/20 uppercase tracking-wider">
                        OUR TRUSTED NETWORK
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#06124f]">
                        Valued Clients & Strategic Partners
                    </h2>
                </div>

                {/* DESKTOP FULL DOUBLE-DOME SYSTEM */}
                <div className="hidden md:block relative w-full max-w-5xl mx-auto">
                    
                    {/* TOP DOME: CLIENTS */}
                    <div className="relative w-full h-[460px]">
                        {/* SVG Top Arc Rings & Node Dots */}
                        <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[460px] pointer-events-none" viewBox="0 0 1000 500" fill="none">
                            <path d="M 60 490 A 440 440 0 0 1 940 490" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
                            <path d="M 170 490 A 330 330 0 0 1 830 490" stroke="#06124f" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 270 490 A 230 230 0 0 1 730 490" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />
                            
                            <circle cx="210" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="280" cy="360" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="300" cy="450" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="790" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                        </svg>

                        {/* Top Center Stats (Clients) */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 z-20 w-full max-w-md text-center">
                            {clientStats.map((stat, idx) => (
                                <div key={idx} className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                                    <div className="mb-0.5">{stat.icon}</div>
                                    <h3 className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{stat.value}</h3>
                                    <p className="text-sm font-normal text-gray-600 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Top Arc Client Logos */}
                        {displayClients.map((client: any, index: number) => {
                            const delaySeconds = (index / clientTotal) * 24;

                            return (
                                <div
                                    key={`client-${client.id || index}`}
                                    style={{
                                        animationDelay: `-${delaySeconds}s`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className="absolute z-30 animate-arc-cw group/logo cursor-pointer"
                                >
                                    <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-white shadow-md group-hover/logo:shadow-2xl border-2 border-cyan-100 flex items-center justify-center p-3.5 transition-all duration-300 group-hover/logo:scale-115">
                                        <div className="relative w-full h-full">
                                            <Image src={client.logo_url} alt={client.name} fill className="object-contain p-1" />
                                        </div>
                                    </div>

                                    {/* Floating High-Contrast Client Name Tooltip */}
                                    <div className="absolute top-[106%] left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[130px] max-w-[190px]">
                                        <div className="bg-[#06124f] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl text-center border border-[#06b6d4]/40 whitespace-normal leading-snug">
                                            {client.name}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DIVIDER LINE */}
                    <div className="relative w-full border-b border-blue-200/70" />

                    {/* BOTTOM INVERTED DOME: PARTNERS */}
                    <div className="relative w-full h-[460px]">
                        {/* SVG Bottom Inverted Arc Rings & Node Dots */}
                        <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[460px] pointer-events-none" viewBox="0 0 1000 500" fill="none">
                            <path d="M 60 10 A 440 440 0 0 0 940 10" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
                            <path d="M 170 10 A 330 330 0 0 0 830 10" stroke="#06124f" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 270 10 A 230 230 0 0 0 730 10" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />

                            <circle cx="210" cy="230" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="280" cy="140" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="300" cy="50" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="790" cy="230" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                        </svg>

                        {/* Bottom Center Stats (Partners) */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 z-20 w-full max-w-md text-center">
                            {partnerStats.map((stat, idx) => (
                                <div key={idx} className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                                    <div className="mb-0.5">{stat.icon}</div>
                                    <h3 className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{stat.value}</h3>
                                    <p className="text-sm font-normal text-gray-600 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Inverted Arc Partner Logos */}
                        {displayPartners.map((partner: any, index: number) => {
                            const delaySeconds = (index / partnerTotal) * 24;

                            return (
                                <div
                                    key={`partner-${partner.id || index}`}
                                    style={{
                                        animationDelay: `-${delaySeconds}s`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className="absolute z-30 animate-bot-arc-cw group/logo cursor-pointer"
                                >
                                    <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-white shadow-md group-hover/logo:shadow-2xl border-2 border-indigo-100 flex items-center justify-center p-3.5 transition-all duration-300 group-hover/logo:scale-115">
                                        <div className="relative w-full h-full">
                                            <Image src={partner.logo_url} alt={partner.name} fill className="object-contain p-1" />
                                        </div>
                                    </div>

                                    {/* Floating High-Contrast Partner Name Tooltip */}
                                    <div className="absolute bottom-[106%] left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[130px] max-w-[190px]">
                                        <div className="bg-[#06124f] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl text-center border border-indigo-400/40 whitespace-normal leading-snug">
                                            {partner.name}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MOBILE / TABLET FALLBACK */}
                <div className="block md:hidden mt-8 space-y-10">
                    <div>
                        <h4 className="text-sm font-bold uppercase text-[#06b6d4] tracking-wider mb-4 text-center">Valued Clients</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {displayClients.map((client: any, index: number) => (
                                <div key={`mob-client-${client.id || index}`} className="aspect-square rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center p-3">
                                    <div className="relative w-full h-full"><Image src={client.logo_url} alt={client.name} fill className="object-contain" /></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase text-indigo-600 tracking-wider mb-4 text-center">Strategic Partners</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {displayPartners.map((partner: any, index: number) => (
                                <div key={`mob-partner-${partner.id || index}`} className="aspect-square rounded-full bg-white shadow-md border border-cyan-100 flex items-center justify-center p-3">
                                    <div className="relative w-full h-full"><Image src={partner.logo_url} alt={partner.name} fill className="object-contain" /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
