"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Client {
    id: number;
    name: string;
    logo_url: string;
}

interface Partner {
    id: number;
    name: string;
    logo_url: string;
}

interface Stat {
    value: string;
    label: string;
    icon: React.ReactNode;
}

interface ClientPartnerDomeProps {
    clients: Client[];
    partners: Partner[];
    clientStats: Stat[];
    partnerStats: Stat[];
}

export default function ClientPartnerDome({
    clients,
    partners,
    clientStats,
    partnerStats,
}: ClientPartnerDomeProps) {
    const [time, setTime] = useState(0);
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const clientCount = clients.length;
    const partnerCount = partners.length;

    const travelTime = 24; // Seconds for logo to cross full arc

    // Calculate timing for clients
    const clientStagger = clientCount > 8 ? 3 : (clientCount > 0 ? travelTime / clientCount : 3);
    const clientCycle = Math.max(clientCount * clientStagger, travelTime);

    // Calculate timing for partners
    const partnerStagger = partnerCount > 8 ? 3 : (partnerCount > 0 ? travelTime / partnerCount : 3);
    const partnerCycle = Math.max(partnerCount * partnerStagger, travelTime);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;
            setTime(elapsedSeconds);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="relative w-full max-w-5xl mx-auto">
            {/* TOP DOME: CLIENTS */}
            <div className="relative w-full h-[250px] xs:h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px]">
                {/* SVG Top Arc Rings & Node Dots */}
                <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[250px] xs:h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px] pointer-events-none" viewBox="0 0 1000 500" fill="none">
                    <path d="M 60 490 A 440 440 0 0 1 940 490" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
                    <path d="M 170 490 A 330 330 0 0 1 830 490" stroke="#06124f" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="5 5" />
                    <path d="M 270 490 A 230 230 0 0 1 730 490" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />

                    <circle cx="210" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="280" cy="360" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="300" cy="450" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="790" cy="270" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Top Center Stats (Clients) */}
                <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 xs:gap-2 sm:gap-3.5 lg:gap-5 z-20 w-full max-w-md text-center">
                    {clientStats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                            <div className="scale-60 xs:scale-75 sm:scale-90 lg:scale-100 mb-0.5">{stat.icon}</div>
                            <h3 className="text-sm xs:text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{stat.value}</h3>
                            <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-normal text-gray-600 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Top Arc Client Logos */}
                {clients.map((client, index) => {
                    const elapsed = (time + index * clientStagger) % clientCycle;
                    if (elapsed > travelTime) return null;

                    const progress = elapsed / travelTime;
                    let opacity = 1;
                    if (progress < 0.05) opacity = progress / 0.05;
                    else if (progress > 0.95) opacity = (1 - progress) / 0.05;

                    const angleDeg = 180 + progress * 180;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const leftPct = 50 + 44 * Math.cos(angleRad);
                    const topPct = 98 + 88 * Math.sin(angleRad);

                    return (
                        <div
                            key={`client-${client.id || index}`}
                            style={{
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                transform: 'translate(-50%, -50%)',
                                opacity,
                            }}
                            className="absolute z-30 group/logo cursor-pointer"
                        >
                            <div className="relative w-11 h-11 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-white shadow-md group-hover/logo:shadow-2xl border-2 border-cyan-100 flex items-center justify-center p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-3.5 transition-all duration-300 group-hover/logo:scale-115">
                                <div className="relative w-full h-full">
                                    <Image src={client.logo_url} alt={client.name} fill className="object-contain p-0.5 sm:p-1" />
                                </div>
                            </div>

                            {/* Floating High-Contrast Client Name Tooltip */}
                            <div className="absolute top-[106%] left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[90px] xs:min-w-[110px] sm:min-w-[130px] max-w-[170px]">
                                <div className="bg-[#06124f] text-white text-[9px] xs:text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl shadow-2xl text-center border border-[#06b6d4]/40 whitespace-normal leading-snug">
                                    {client.name}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* DIVIDER LINE */}
            <div className="relative w-full border-b border-blue-200/70 my-2 xs:my-4" />

            {/* BOTTOM INVERTED DOME: PARTNERS */}
            <div className="relative w-full h-[250px] xs:h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px]">
                {/* SVG Bottom Inverted Arc Rings & Node Dots */}
                <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[250px] xs:h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px] pointer-events-none" viewBox="0 0 1000 500" fill="none">
                    <path d="M 60 10 A 440 440 0 0 0 940 10" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
                    <path d="M 170 10 A 330 330 0 0 0 830 10" stroke="#06124f" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="5 5" />
                    <path d="M 270 10 A 230 230 0 0 0 730 10" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />

                    <circle cx="210" cy="230" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="280" cy="140" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="300" cy="50" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="790" cy="230" r="6" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Bottom Center Stats (Partners) */}
                <div className="absolute top-1 sm:top-2 lg:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 xs:gap-2 sm:gap-3.5 lg:gap-5 z-20 w-full max-w-md text-center">
                    {partnerStats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center group/stat transition-transform hover:scale-105">
                            <div className="scale-60 xs:scale-75 sm:scale-90 lg:scale-100 mb-0.5">{stat.icon}</div>
                            <h3 className="text-sm xs:text-base sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{stat.value}</h3>
                            <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-normal text-gray-600 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Bottom Inverted Arc Partner Logos */}
                {partners.map((partner, index) => {
                    const elapsed = (time + index * partnerStagger) % partnerCycle;
                    if (elapsed > travelTime) return null;

                    const progress = elapsed / travelTime;
                    let opacity = 1;
                    if (progress < 0.05) opacity = progress / 0.05;
                    else if (progress > 0.95) opacity = (1 - progress) / 0.05;

                    const angleDeg = 180 - progress * 180;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const leftPct = 50 + 44 * Math.cos(angleRad);
                    const topPct = 2 + 88 * Math.sin(angleRad);

                    return (
                        <div
                            key={`partner-${partner.id || index}`}
                            style={{
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                transform: 'translate(-50%, -50%)',
                                opacity,
                            }}
                            className="absolute z-30 group/logo cursor-pointer"
                        >
                            <div className="relative w-11 h-11 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-white shadow-md group-hover/logo:shadow-2xl border-2 border-indigo-100 flex items-center justify-center p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-3.5 transition-all duration-300 group-hover/logo:scale-115">
                                <div className="relative w-full h-full">
                                    <Image src={partner.logo_url} alt={partner.name} fill className="object-contain p-0.5 sm:p-1" />
                                </div>
                            </div>

                            {/* Floating High-Contrast Partner Name Tooltip */}
                            <div className="absolute bottom-[106%] left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[90px] xs:min-w-[110px] sm:min-w-[130px] max-w-[170px]">
                                <div className="bg-[#06124f] text-white text-[9px] xs:text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl shadow-2xl text-center border border-indigo-400/40 whitespace-normal leading-snug">
                                    {partner.name}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
