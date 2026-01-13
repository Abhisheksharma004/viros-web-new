"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function WarrantyPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [serial, setSerial] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'expired' | 'invalid'>('idle');
    const [resultData, setResultData] = useState<any>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/warranties/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serial_number: serial.trim() })
            });

            if (response.ok) {
                const data = await response.json();
                setStatus(data.status as 'active' | 'expired');
                setResultData(data);
            } else {
                setStatus('invalid');
                setResultData(null);
            }
        } catch (error) {
            console.error('Error checking warranty:', error);
            setStatus('invalid');
            setResultData(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Hero Section */}
            <section className="relative w-full pt-32 pb-24 overflow-hidden bg-[#06124f]">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-[#06b6d4]/10 blur-[100px] rounded-full transform -translate-x-1/3" />
                    <div className="absolute bottom-0 right-0 w-1/3 h-full bg-[#06b6d4]/10 blur-[80px] rounded-full transform translate-x-1/3" />
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold mb-6">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                            Official Support
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                            Check Warranty <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-cyan-200">Status</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                            Verify your product's warranty coverage instantly. Enter your serial number below to get started.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="relative z-20 -mt-16 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Glassmorphic Container */}
                    <div className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <div className="p-8 md:p-12">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-center">
                                <p className="text-blue-800 font-medium">
                                    Need help finding your Serial Number? Look for the sticker on the back or bottom of your device.
                                </p>
                                <div className="mt-2 text-xs text-blue-600/70">
                                    Try: <span className="font-mono bg-blue-100 px-1 rounded">SN-VIROS-001</span> (Active) or <span className="font-mono bg-blue-100 px-1 rounded">SN-VIROS-002</span> (Expired)
                                </div>
                            </div>

                            <form onSubmit={handleCheck} className="max-w-xl mx-auto space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Enter Serial Number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={serial}
                                            onChange={(e) => setSerial(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-900 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all text-lg font-mono placeholder:font-sans placeholder:text-gray-400 shadow-sm"
                                            placeholder="SN-XXXXXXXX"
                                        />
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M8 11h.01M12 12h.02" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-4 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Verifying...
                                        </>
                                    ) : 'Check Status'}
                                </button>
                            </form>

                            {/* Result Section */}
                            {status === 'active' && (
                                <div className="mt-8 animate-fadeIn">
                                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="text-xl font-bold text-green-800">Warranty Active</h3>
                                            <p className="text-green-700 mt-1">{resultData.product}</p>
                                            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-green-800/80">
                                                <span className="flex items-center"><span className="font-bold mr-1">Type:</span> {resultData.type}</span>
                                                <span className="flex items-center"><span className="font-bold mr-1">Expires:</span> {resultData.expiry}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === 'expired' && (
                                <div className="mt-8 animate-fadeIn">
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="text-xl font-bold text-orange-800">Warranty Expired</h3>
                                            <p className="text-orange-700 mt-1">{resultData.product}</p>
                                            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-orange-800/80">
                                                <span className="flex items-center"><span className="font-bold mr-1">Expired on:</span> {resultData.expiry}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Link href="/contact" className="text-sm font-bold text-orange-700 hover:text-orange-900 underline decoration-2">Contact support for renewal options</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === 'invalid' && (
                                <div className="mt-8 animate-fadeIn">
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                                        <h3 className="text-lg font-bold text-red-800 mb-2">Serial Number Not Found</h3>
                                        <p className="text-red-600 text-sm">We couldn't find a record for "<span className="font-mono font-bold">{serial}</span>". Please double-check the number and try again.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                                <p className="text-gray-500 mb-4">Having trouble?</p>
                                <Link href="/contact" className="inline-flex items-center text-[#06124f] font-bold hover:text-[#06b6d4] transition-colors">
                                    Contact Support Team <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Policy Overview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-[#06124f] mb-4">Coverage You Can Count On</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Our standard warranty plan ensures your business keeps running smoothly with minimal downtime.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "1-Year Standard", desc: "Full coverage on parts and labor for manufacturing defects.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                            { title: "Express Replacement", desc: "Receive a replacement unit while yours is being serviced.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                            { title: "24/7 Tech Support", desc: "Round-the-clock access to our certified technical team.", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#06b6d4]/30 hover:shadow-lg transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-xl bg-white text-[#06124f] flex items-center justify-center shadow-md mb-6 group-hover:bg-[#06b6d4] group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3">{item.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
