"use client";

import Link from "next/link";
import { useState, useEffect } from 'react';


export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [contactInfo, setContactInfo] = useState({
        address: '123 Tech Park, IT Zone,\nMumbai, Maharashtra,\nIndia - 400001',
        general_phone: '+91-987102-9141',
        general_email_support: 'info@virosentrepreneurs.com',
        general_email_info: 'sales@virosentrepreneurs.com',
        social_twitter: '#',
        social_linkedin: '#',
        social_facebook: '#',
        social_instagram: '#',
        social_youtube: '#'
    });
    const [footerContent, setFooterContent] = useState({
        description: 'Empowering businesses with cutting-edge AIDC solutions. From barcode printers to enterprise mobility, we deliver efficiency and reliability.',
        copyright_text: 'VIROS Entrepreneurs. All rights reserved.',
        developer_text: 'Developed and maintained by Viros Software Team'
    });
    const [navbarContent, setNavbarContent] = useState({
        brand_title: 'VIROS',
        brand_subtitle: 'Entrepreneurs'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contactRes, footerRes, navbarRes] = await Promise.all([
                    fetch('/api/contact/content'),
                    fetch('/api/footer/content'),
                    fetch('/api/navbar/content')
                ]);

                if (contactRes.ok) {
                    const contactData = await contactRes.json();
                    setContactInfo(prev => ({ ...prev, ...contactData }));
                }

                if (footerRes.ok) {
                    const footerData = await footerRes.json();
                    setFooterContent(prev => ({ ...prev, ...footerData }));
                }

                if (navbarRes.ok) {
                    const navbarData = await navbarRes.json();
                    // Navbar API returns {logo_url, brand_title, brand_subtitle, ...}
                    setNavbarContent(prev => ({ ...prev, ...navbarData }));
                }
            } catch (error) {
                console.error('Error fetching footer data:', error);
            }
        };

        fetchData();
    }, []);

    const socialLinks = [
        { name: "X", icon: "M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z", href: contactInfo.social_twitter },
        { name: "LinkedIn", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", href: contactInfo.social_linkedin },
        { name: "Facebook", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", href: contactInfo.social_facebook },
        { name: "Instagram", icon: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z", href: contactInfo.social_instagram },
        { name: "YouTube", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", href: contactInfo.social_youtube }
    ].filter(link => link.href && link.href !== '#' && link.href !== '');

    return (
        <footer className="bg-[#06124f] text-white pt-20 pb-10 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#06b6d4]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#06b6d4]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="inline-block mb-6 group">
                            <span className="text-3xl font-bold text-white group-hover:text-[#06b6d4] transition-colors">{navbarContent.brand_title}</span>
                            <span className="block text-sm text-[#06b6d4] font-medium tracking-widest uppercase">{navbarContent.brand_subtitle}</span>
                        </Link>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            {footerContent.description}
                        </p>
                        <div className="flex space-x-4">
                            {/* Social Icons */}
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#06b6d4] transition-all duration-300 group/icon"
                                    aria-label={social.name}
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-300 group-hover/icon:text-white transition-colors"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d={social.icon} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6 border-b border-[#06b6d4]/30 pb-2 inline-block">Quick Links</h4>
                        <ul className="space-y-3">
                            {["Home", "About", "Products", "Services", "Certificates", "Warranty", "Contact"].map((link) => (
                                <li key={link}>
                                    <Link
                                        href={link === "Home" ? "/" : `/${link.toLowerCase().replace(" ", "-")}`}
                                        className="text-gray-400 hover:text-[#06b6d4] transition-colors flex items-center group/link"
                                    >
                                        <span className="w-0 group-hover/link:w-2 h-0.5 bg-[#06b6d4] mr-0 group-hover/link:mr-2 transition-all duration-300" />
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solutions */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6 border-b border-[#06b6d4]/30 pb-2 inline-block">Our Solutions</h4>
                        <ul className="space-y-3">
                            {[
                                "Industrial Printers",
                                "Barcode Scanners",
                                "Mobile Computing",
                                "RFID Solutions",
                                "Software Integration",
                                "Consumables"
                            ].map((item) => (
                                <li key={item}>
                                    <Link href="/products" className="text-gray-400 hover:text-[#06b6d4] transition-colors flex items-center group/link"
                                        aria-label={item}
                                    >
                                        <span className="w-0 group-hover/link:w-2 h-0.5 bg-[#06b6d4] mr-0 group-hover/link:mr-2 transition-all duration-300" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-6 border-b border-[#06b6d4]/30 pb-2 inline-block">Contact Us</h4>
                        <ul className="space-y-6">
                            <li className="flex items-start">
                                <svg className="w-6 h-6 text-[#06b6d4] mt-1 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-400 leading-relaxed type-address whitespace-pre-line">
                                    {contactInfo.address}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 text-[#06b6d4] mt-1 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div className="flex flex-col">
                                    <a href={`tel:${contactInfo.general_phone}`} className="text-gray-400 hover:text-[#06b6d4] transition-colors font-medium">{contactInfo.general_phone}</a>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 text-[#06b6d4] mt-1 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div className="flex flex-col">
                                    <a href={`mailto:${contactInfo.general_email_support}`} className="text-gray-400 hover:text-[#06b6d4] transition-colors break-words">{contactInfo.general_email_support}</a>
                                    <a href={`mailto:${contactInfo.general_email_info}`} className="text-gray-400 hover:text-[#06b6d4] transition-colors break-words text-sm mt-1">{contactInfo.general_email_info}</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter & Bottom Bar */}
                <div className="border-t border-white/10 pt-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-gray-500 text-sm text-center md:text-left">
                            <p>&copy; {currentYear} {footerContent.copyright_text}</p>
                            <p className="text-xs text-gray-500 mt-1">{footerContent.developer_text}</p>
                            <div className="mt-2 space-x-4">
                                <Link href="/privacy-policy" className="hover:text-[#06b6d4] transition-colors">Privacy Policy</Link>
                                <span className="text-gray-700">|</span>
                                <Link href="/terms-of-service" className="hover:text-[#06b6d4] transition-colors">Terms of Service</Link>
                            </div>
                        </div>

                        {/* Newsletter Input */}
                        <div className="w-full md:w-auto">
                            <form className="relative max-w-sm mx-auto md:mx-0">
                                <input
                                    type="email"
                                    placeholder="Subscribe to our newsletter"
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-6 pr-32 text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all"
                                />
                                <button
                                    type="button"
                                    className="absolute right-1 top-1 bottom-1 px-6 bg-[#06b6d4] hover:bg-cyan-500 text-white text-sm font-bold rounded-full transition-colors"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
