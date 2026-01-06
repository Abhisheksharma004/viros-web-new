"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ContactPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Hero Section */}
            <section className="relative w-full pt-32 pb-24 overflow-hidden bg-[#06124f]">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#06b6d4]/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#06b6d4]/5 blur-[80px] rounded-full mix-blend-screen" />
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold mb-6">
                            <span className="w-2 h-2 bg-[#06b6d4] rounded-full mr-2 animate-pulse" />
                            Get in Touch
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                            Let&apos;s Start a <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-cyan-200">Conversation</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                            Have a question about our products or services? We&apos;re here to help you find the perfect solution for your business.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="relative z-20 -mt-16 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-5">

                            {/* Left Side: Contact Info */}
                            <div className="lg:col-span-2 bg-[#06124f] p-8 lg:p-12 text-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#06b6d4] opacity-20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Contact Information</h3>
                                    <p className="text-white/60 mb-10">Reach out to us directly through any of these channels.</p>

                                    <div className="space-y-8">
                                        <div className="flex items-start">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mr-4">
                                                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Phone</h4>
                                                <p className="text-white/80 mt-1">+91 98765 43210</p>
                                                <p className="text-white/40 text-xs mt-1">Mon-Fri, 9am - 6pm</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mr-4">
                                                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Email</h4>
                                                <p className="text-white/80 mt-1">support@viros-entrepreneurs.com</p>
                                                <p className="text-white/80">info@viros-entrepreneurs.com</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mr-4">
                                                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">Headquarters</h4>
                                                <p className="text-white/80 mt-1">
                                                    123 Tech Park, IT Zone<br />
                                                    Mumbai, Maharashtra<br />
                                                    India - 400001
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-12 border-t border-white/10">
                                        <h4 className="font-bold mb-4">Follow Us</h4>
                                        <div className="flex space-x-4">
                                            {/* Twitter / X */}
                                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-colors duration-300 group">
                                                <span className="sr-only">Twitter</span>
                                                <svg className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                            </a>

                                            {/* LinkedIn */}
                                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-colors duration-300 group">
                                                <span className="sr-only">LinkedIn</span>
                                                <svg className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                            </a>

                                            {/* Facebook */}
                                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-colors duration-300 group">
                                                <span className="sr-only">Facebook</span>
                                                <svg className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                            </a>

                                            {/* Instagram */}
                                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-colors duration-300 group">
                                                <span className="sr-only">Instagram</span>
                                                <svg className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                            </a>

                                            {/* YouTube */}
                                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-colors duration-300 group">
                                                <span className="sr-only">YouTube</span>
                                                <svg className="w-5 h-5 text-white opacity-80 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Contact Form */}
                            <div className="lg:col-span-3 p-8 lg:p-12">
                                <h3 className="text-2xl font-bold text-[#06124f] mb-6">Send us a Message</h3>
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Your Name</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all shadow-sm" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                                            <input type="tel" className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all shadow-sm" placeholder="+91 98765 43210" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                        <input type="email" className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all shadow-sm" placeholder="john@company.com" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                                        <select className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all shadow-sm">
                                            <option>General Inquiry</option>
                                            <option>Product Support</option>
                                            <option>Request Quote</option>
                                            <option>Partnership Opportunity</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                                        <textarea rows={5} className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/10 outline-none transition-all resize-none shadow-sm" placeholder="Tell us how we can help..." />
                                    </div>

                                    <div className="pt-4">
                                        <button type="button" className="w-full py-4 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            Send Message
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Department Contact Section */}
                    <div className="mt-12 md:mt-20 mb-8 md:mb-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#06124f] mb-2">Contact by Department</h2>
                        <p className="text-gray-600 mb-8 md:mb-12">Reach out to the right team for faster assistance</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {/* Sales Department */}
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#06124f] transition-colors duration-300">
                                    <svg className="w-8 h-8 text-[#06124f] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3">Sales Department</h3>
                                <p className="text-gray-500 text-sm mb-6">Product inquiries, quotes, and new business</p>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <a href="mailto:sales@virosentrepreneurs.com" className="text-[#06b6d4] hover:text-[#06124f] font-medium text-sm transition-colors break-words">sales@virosentrepreneurs.com</a>
                                        <a href="mailto:marketing@virosentrepreneurs.com" className="text-[#06b6d4] hover:text-[#06124f] font-medium text-sm transition-colors break-words">marketing@virosentrepreneurs.com</a>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <a href="tel:+919871029141" className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 rounded-full py-1 px-3 flex items-center justify-center gap-2 transition-colors w-full mx-auto">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="whitespace-nowrap">+91-987102-9141</span>
                                        </a>
                                        <a href="tel:+919871029142" className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 rounded-full py-1 px-3 flex items-center justify-center gap-2 transition-colors w-full mx-auto">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="whitespace-nowrap">+91-987102-9142</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Support */}
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#06124f] transition-colors duration-300">
                                    <svg className="w-8 h-8 text-[#06124f] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3">Technical Support</h3>
                                <p className="text-gray-500 text-sm mb-6">24/7 support for existing customers</p>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <a href="mailto:it@virosentrepreneurs.com" className="text-[#06b6d4] hover:text-[#06124f] font-medium text-sm transition-colors break-words">it@virosentrepreneurs.com</a>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <a href="tel:+918377929141" className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 rounded-full py-1 px-3 flex items-center justify-center gap-2 transition-colors w-full mx-auto">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="whitespace-nowrap">+91-837792-9141</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* AMC Services */}
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#06124f] transition-colors duration-300">
                                    <svg className="w-8 h-8 text-[#06124f] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3">AMC Services</h3>
                                <p className="text-gray-500 text-sm mb-6">Annual maintenance contracts and servicing</p>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <a href="mailto:info@virosentrepreneurs.com" className="text-[#06b6d4] hover:text-[#06124f] font-medium text-sm transition-colors break-words">info@virosentrepreneurs.com</a>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <a href="tel:+917303779141" className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 rounded-full py-1 px-3 flex items-center justify-center gap-2 transition-colors w-full mx-auto">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="whitespace-nowrap">+91-730377-9141</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Training Center */}
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#06124f] transition-colors duration-300">
                                    <svg className="w-8 h-8 text-[#06124f] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#06124f] mb-3">Training Center</h3>
                                <p className="text-gray-500 text-sm mb-6">Product training and certification programs</p>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <a href="mailto:helpdesk@virosentrepreneurs.com" className="text-[#06b6d4] hover:text-[#06124f] font-medium text-sm transition-colors break-words">helpdesk@virosentrepreneurs.com</a>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <a href="tel:+918743839141" className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 rounded-full py-1 px-3 flex items-center justify-center gap-2 transition-colors w-full mx-auto">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="whitespace-nowrap">+91-874383-9141</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Care / Escalations Section */}
                    <div className="w-full mb-12 md:mb-20">
                        <div className="bg-gradient-to-br from-[#06124f] to-[#06b6d4] rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden text-center">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#06b6d4] opacity-20 blur-2xl rounded-full transform -translate-x-1/3 translate-y-1/3" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20">
                                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">Customer Care & Dispatch Related Inquiries</h2>
                                <p className="text-white/80 mb-8 max-w-xl mx-auto text-base md:text-lg">
                                    We are committed to providing the best experience. If your query includes dispatch issues or hasn't been resolved, please contact our dedicated team.
                                </p>

                                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                                    <a href="mailto:customercare@virosentrepreneurs.com" className="flex items-center group bg-white/10 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none w-full md:w-auto justify-center md:justify-start hover:bg-white/20 md:hover:bg-transparent transition-colors">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-[#06124f] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs text-white/60 uppercase tracking-wider font-bold">Email Us</div>
                                            <div className="font-bold text-base md:text-lg group-hover:text-cyan-200 transition-colors break-all md:break-normal">customercare@virosentrepreneurs.com</div>
                                        </div>
                                    </a>

                                    <div className="h-12 w-px bg-white/20 hidden md:block" />

                                    <a href="tel:+911145678900" className="flex items-center group bg-white/10 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none w-full md:w-auto justify-center md:justify-start hover:bg-white/20 md:hover:bg-transparent transition-colors">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-[#06124f] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs text-white/60 uppercase tracking-wider font-bold">Call Us</div>
                                            <div className="font-bold text-base md:text-lg group-hover:text-cyan-200 transition-colors">+91-987102-9141</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
