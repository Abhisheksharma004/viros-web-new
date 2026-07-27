import Image from "next/image";
import pool from "@/lib/db";
import ClientPartnerDome from "./ClientPartnerDome";

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

    return (
        <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden bg-[#f3f7fd]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Title */}
                <div className="text-center mb-8 sm:mb-12">
                    <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-xs sm:text-sm font-bold mb-3 sm:mb-4 border border-[#06b6d4]/20 uppercase tracking-wider">
                        OUR TRUSTED NETWORK
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#06124f] tracking-tight">
                        Valued Clients & Strategic Partners
                    </h2>
                </div>

                {/* FULL SEQUENTIAL DOUBLE-DOME SLIDER SHOWCASING ALL DATABASE CLIENTS & PARTNERS */}
                <ClientPartnerDome
                    clients={clients}
                    partners={partners}
                    clientStats={clientStats}
                    partnerStats={partnerStats}
                />
            </div>
        </section>
    );
}

