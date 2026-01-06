import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    const currentYear = new Date().getFullYear();

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
                            <span className="text-3xl font-bold text-white group-hover:text-[#06b6d4] transition-colors">VIROS</span>
                            <span className="block text-sm text-[#06b6d4] font-medium tracking-widest uppercase">Entrepreneurs</span>
                        </Link>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Empowering businesses with cutting-edge AIDC solutions. From barcode printers to enterprise mobility, we deliver efficiency and reliability.
                        </p>
                        <div className="flex space-x-4">
                            {/* Social Icons */}
                            {[
                                { name: "X", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                                { name: "LinkedIn", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                                { name: "Facebook", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                                { name: "Instagram", icon: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" },
                                { name: "YouTube", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" }
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href="#"
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
                            {["Home", "About Us", "Products", "Services", "Certificates", "Warranty", "Contact"].map((link) => (
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
                                    <Link href="/products" className="text-gray-400 hover:text-[#06b6d4] transition-colors flex items-center group/link">
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
                                <span className="text-gray-400 leading-relaxed">
                                    123 Tech Park, IT Zone,<br />
                                    Mumbai, Maharashtra,<br />
                                    India - 400001
                                </span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 text-[#06b6d4] mt-1 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div className="flex flex-col">
                                    <a href="tel:+919871029141" className="text-gray-400 hover:text-[#06b6d4] transition-colors font-medium">+91-987102-9141</a>
                                    <a href="tel:+917303779141" className="text-gray-400 hover:text-[#06b6d4] transition-colors text-sm mt-1">+91-730377-9141</a>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-6 h-6 text-[#06b6d4] mt-1 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div className="flex flex-col">
                                    <a href="mailto:info@virosentrepreneurs.com" className="text-gray-400 hover:text-[#06b6d4] transition-colors break-words">info@virosentrepreneurs.com</a>
                                    <a href="mailto:sales@virosentrepreneurs.com" className="text-gray-400 hover:text-[#06b6d4] transition-colors break-words text-sm mt-1">sales@virosentrepreneurs.com</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter & Bottom Bar */}
                <div className="border-t border-white/10 pt-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-gray-500 text-sm text-center md:text-left">
                            <p>&copy; {currentYear} VIROS Entrepreneurs. All rights reserved.</p>
                            <p className="text-xs text-gray-500 mt-1">Developed and maintained by Viros Software Team</p>
                            <div className="mt-2 space-x-4">
                                <a href="#" className="hover:text-[#06b6d4] transition-colors">Privacy Policy</a>
                                <span className="text-gray-700">|</span>
                                <a href="#" className="hover:text-[#06b6d4] transition-colors">Terms of Service</a>
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
