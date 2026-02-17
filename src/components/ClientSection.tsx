import Image from "next/image";
import pool from "@/lib/db";

async function getClients() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM clients WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        return rows;
    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
}

const stats = [
    { value: "500+", label: "Happy Clients" },
    { value: "98%", label: "Retention Rate" },
    { value: "24/7", label: "Support Available" },
];

export default async function ClientSection() {
    const clients = await getClients();

    if (clients.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden bg-white">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#06b6d4]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-[#06124f]/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-6 border border-[#06b6d4]/20">
                        OUR SUCCESS STORIES
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#06124f] mb-6">
                        Valued Clients
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                        
                    </p>
                </div>

                {/* Marquee Container */}
                <div className="relative flex overflow-hidden group mb-20">
                    <div className="flex animate-marquee whitespace-nowrap shrink-0">
                        {clients.map((client: any, index: number) => (
                            <div
                                key={client.id || index}
                                className="mx-8 flex items-center justify-center w-40 h-32 shrink-0 transition-all duration-300"
                            >
                                <div className="relative w-full h-full p-2">
                                    <Image
                                        src={client.logo_url}
                                        alt={client.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Duplicate for infinite scroll */}
                    <div className="flex animate-marquee whitespace-nowrap shrink-0">
                        {clients.map((client: any, index: number) => (
                            <div
                                key={`clone-${client.id || index}`}
                                className="mx-8 flex items-center justify-center w-40 h-32 shrink-0 transition-all duration-300"
                            >
                                <div className="relative w-full h-full p-2">
                                    <Image
                                        src={client.logo_url}
                                        alt={client.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-[#06124f] rounded-3xl p-12 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.4),transparent_50%)] opacity-30" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-[#06b6d4]/20">
                        {stats.map((stat, index) => (
                            <div key={index} className="pt-8 md:pt-0 md:px-8 first:pt-0">
                                <h3 className="text-5xl font-black text-white mb-2">{stat.value}</h3>
                                <p className="text-[#06b6d4] font-bold tracking-wide uppercase text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
