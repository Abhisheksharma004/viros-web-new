"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const stats = [
  { 
    number: "500+", 
    label: "Happy Clients", 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    number: "1000+", 
    label: "Projects Delivered", 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    number: "50+", 
    label: "Cities Served", 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    number: "99.9%", 
    label: "Uptime Guarantee", 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Visionary leader with 15+ years in barcode technology and business automation solutions",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Sarah Chen",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Technology expert specializing in thermal printing and mobile scanning innovations",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Michael Rodriguez",
    role: "Head of Strategy",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Strategic consultant with expertise in barcode implementation across multiple industries",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Priya Sharma",
    role: "VP of Sales",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Sales leader driving growth in label printer and scanner solutions across India",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "David Kim",
    role: "Head of Engineering",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Engineering expert in barcode software development and system integration",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Lisa Thompson",
    role: "Customer Success Director",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Customer advocate ensuring successful barcode solution implementations and support",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Rajesh Patel",
    role: "Operations Manager",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Operations specialist managing supply chain and logistics for barcode equipment",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Emma Wilson",
    role: "Marketing Director",
    image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Marketing strategist promoting barcode solutions and building brand awareness",
    linkedin: "#",
    instagram: "#"
  },
  {
    name: "Carlos Martinez",
    role: "Technical Support Lead",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    bio: "Technical expert providing comprehensive support for printer and scanner installations",
    linkedin: "#",
    instagram: "#"
  }
];

const values = [
  {
    title: "Quality Excellence",
    description: "We provide professional-grade barcode equipment and solutions with superior performance and reliability for all business applications.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    gradient: "from-[#06b6d4] to-[#06124f]"
  },
  {
    title: "Technical Expertise",
    description: "Our team brings deep technical knowledge in barcode technology, thermal printing, and mobile scanning solutions.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: "from-[#06124f] to-[#06b6d4]"
  },
  {
    title: "Customer Success",
    description: "We build lasting partnerships with our clients, ensuring their barcode and IT solutions deliver maximum operational efficiency.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    gradient: "from-[#06b6d4] via-[#06124f] to-[#06b6d4]"
  },
  {
    title: "Innovation Focus",
    description: "We stay at the forefront of barcode technology, offering the latest solutions in thermal printing and mobile scanning.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: "from-[#06124f] via-[#06b6d4] to-[#06124f]"
  }
];

const features = [
  {
    title: "Label Printers",
    description: "Professional-grade thermal and direct thermal barcode label printers for industrial, desktop, and mobile applications.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    )
  },
  {
    title: "Handheld Scanners",
    description: "High-performance handheld barcode scanners with advanced reading capabilities for 1D and 2D barcodes with wireless connectivity.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Mobile TABs & Devices",
    description: "Rugged Android mobile computers and tablets with integrated barcode scanning for field operations and inventory management.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Labels & Ribbons",
    description: "Complete range of high-quality barcode labels and thermal transfer ribbons with superior adhesion and print clarity.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  {
    title: "IT Solutions",
    description: "Comprehensive IT infrastructure solutions including networking, servers, workstations, and system integration services.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    title: "Software Solutions",
    description: "Custom barcode generation, inventory management, and label design software tailored to your business needs.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section - Fully Mobile Responsive */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden pt-16 sm:pt-20 md:pt-24">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#06124f]/10 via-transparent to-[#06b6d4]/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,18,79,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Enhanced Subtitle Badge - Mobile Responsive */}
            <div className="mb-6 sm:mb-8 md:mb-10 flex justify-center">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#06b6d4]/20 to-[#06124f]/20 backdrop-blur-xl text-[#06124f] text-xs sm:text-sm md:text-sm font-bold rounded-full border border-[#06b6d4]/30 shadow-2xl shadow-[#06b6d4]/10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About VIROS Entrepreneurs
              </span>
            </div>

            {/* Enhanced Main Title - Mobile Responsive Typography */}
            <div className="mb-6 sm:mb-8 md:mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] bg-clip-text text-transparent drop-shadow-2xl">
                  Complete Barcode
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#06b6d4] to-[#06124f] bg-clip-text text-transparent drop-shadow-2xl">
                  Solutions Provider
                </span>
              </h1>
            </div>

            {/* Enhanced Description - Mobile Responsive */}
            <div className="mb-8 sm:mb-12 md:mb-16">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600 leading-relaxed max-w-5xl mx-auto font-light px-2 sm:px-0">
                VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including 
                <span className="text-[#06124f] font-semibold"> label printers</span>, 
                <span className="text-[#06b6d4] font-semibold"> handheld scanners</span>, 
                <span className="text-[#06124f] font-semibold"> mobile devices</span>, and 
                <span className="text-[#06b6d4] font-semibold"> custom software solutions</span> for modern business operations.
              </p>
            </div>

            {/* Call to Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 sm:px-0">
              <button className="group relative w-full sm:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#06b6d4]/30 hover:-translate-y-1 min-w-0 sm:min-w-[200px] touch-manipulation">
                <span className="relative z-10 flex items-center justify-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Your Journey
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] to-[#06124f] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              
              <button className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 border-2 border-[#06124f]/30 text-[#06124f] font-bold rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-[#06124f]/5 hover:border-[#06124f]/50 transition-all duration-300 min-w-0 sm:min-w-[200px] flex items-center justify-center touch-manipulation">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm sm:text-base">Watch Our Story</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`group text-center p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-[#06b6d4]/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-[#06b6d4] mb-3 sm:mb-4 md:mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent mb-2 sm:mb-3">
                  {stat.number}
                </div>
                <div className="text-gray-700 font-semibold text-sm sm:text-base md:text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06124f]/10 text-[#06124f] text-xs sm:text-sm font-bold rounded-full">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                What We Offer
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#06124f] mb-4 sm:mb-6 md:mb-8">
              Our Product Categories
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Everything you need for efficient barcode operations and business automation across multiple industries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-[#06b6d4] mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#06124f] mb-3 sm:mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Mission & Vision Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[#06124f]/5 to-[#06b6d4]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 md:gap-20 items-center">
            {/* Mission */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="mb-6 sm:mb-8">
                <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06124f]/10 text-[#06124f] text-xs sm:text-sm font-bold rounded-full">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Our Mission
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#06124f] mb-6 sm:mb-8">
                Leading Barcode Technology Provider
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-6 sm:mb-8 md:mb-10">
                We specialize in providing comprehensive barcode solutions that streamline business operations across industries. From thermal label printers to mobile scanning devices, we deliver professional-grade equipment and software solutions.
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Professional-Grade Barcode Equipment</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Custom Software & IT Solutions</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Multi-Industry Application Support</span>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/20 to-[#06124f]/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl"></div>
                <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
                  <div className="mb-6 sm:mb-8">
                    <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06b6d4]/20 text-[#06b6d4] text-xs sm:text-sm font-bold rounded-full">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Our Vision
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#06124f] mb-6 sm:mb-8">
                    Serving Businesses Nationwide
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                    To be India&apos;s most trusted barcode solutions provider, delivering innovative technology and exceptional service that enables businesses to achieve operational excellence and competitive advantage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Values Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#06b6d4]/20 to-[#06124f]/20 backdrop-blur-xl text-[#06124f] text-xs sm:text-sm font-bold rounded-full border border-[#06b6d4]/30 shadow-2xl shadow-[#06b6d4]/10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Our Core Values
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8">
              What Drives Us Forward
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Our core values are the foundation of everything we do, guiding every decision and shaping every solution we deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className={`group p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-[#06b6d4]/20 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-center">
                  <div className="text-[#06b6d4] mb-6 sm:mb-8 flex justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-black mb-4 sm:mb-6 bg-gradient-to-r ${value.gradient} bg-clip-text text-transparent`}>
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Team Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06124f]/10 text-[#06124f] text-xs sm:text-sm font-bold rounded-full">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Leadership Team
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#06124f] mb-4 sm:mb-6 md:mb-8">
              Meet the Visionaries
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Our experienced leadership team combines deep expertise in barcode technology, business operations, and customer success to deliver comprehensive solutions across industries.
            </p>
          </div>

          {/* Marquee Container */}
          <div className="relative overflow-hidden">
            {/* Gradient Overlays for Fade Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
            
            {/* Marquee Animation Container */}
            <div className="animate-marquee flex">
              {/* First Set of Team Members */}
              {team.map((member, index) => (
                <div
                  key={`first-${index}`}
                  className={`flex-shrink-0 w-80 sm:w-96 mx-4 sm:mx-6 transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Enhanced Card Container */}
                  <div className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100/50 backdrop-blur-sm group-hover:-translate-y-2 h-full">
                    {/* Decorative Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/5 via-transparent to-[#06124f]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Profile Image with Enhanced Design */}
                    <div className="relative mb-6 mx-auto w-32 h-32 sm:w-36 sm:h-36">
                      {/* Animated Background Ring */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4] via-[#06b6d4] to-[#06124f] rounded-full p-1 group-hover:scale-105 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-[#06b6d4]/25">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white p-1">
                          <div className="w-full h-full rounded-full overflow-hidden relative">
                            <Image
                              src={member.image}
                              alt={member.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#06124f]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Badge */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="text-center relative z-10">
                      {/* Name with Enhanced Typography */}
                      <h3 className="text-xl sm:text-2xl font-black text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors duration-300">
                        {member.name}
                      </h3>
                      
                      {/* Role Badge */}
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-[#06b6d4]/10 to-[#06124f]/10 text-[#06124f] text-sm font-bold rounded-full border border-[#06b6d4]/20 group-hover:border-[#06b6d4]/40 transition-all duration-300">
                          {member.role}
                        </span>
                      </div>
                      
                      {/* Bio with Better Styling */}
                      <p className="text-gray-600 leading-relaxed mb-6 text-sm group-hover:text-gray-700 transition-colors duration-300 line-clamp-3">
                        {member.bio}
                      </p>
                      
                      {/* Enhanced Social Links */}
                      <div className="flex justify-center space-x-3">
                        <a 
                          href={member.linkedin} 
                          className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-[#06124f]/10 to-[#06124f]/5 text-[#06124f] hover:bg-gradient-to-br hover:from-[#06124f] hover:to-[#06124f]/90 hover:text-white transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1"
                          aria-label={`${member.name} LinkedIn Profile`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        
                        <a 
                          href={member.instagram} 
                          className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-[#06b6d4]/10 to-[#06b6d4]/5 text-[#06b6d4] hover:bg-gradient-to-br hover:from-[#06b6d4] hover:to-[#06b6d4]/90 hover:text-white transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1"
                          aria-label={`${member.name} Twitter Profile`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        
                        {/* Contact Button */}
                        <button className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 hover:bg-gradient-to-br hover:from-[#06124f]/10 hover:to-[#06b6d4]/10 hover:text-[#06124f] transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Decorative Corner Elements */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-br from-[#06124f] to-[#06b6d4] rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
              
              {/* Duplicate Set for Seamless Loop */}
              {team.map((member, index) => (
                <div
                  key={`second-${index}`}
                  className="flex-shrink-0 w-80 sm:w-96 mx-4 sm:mx-6"
                >
                  {/* Enhanced Card Container */}
                  <div className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100/50 backdrop-blur-sm group-hover:-translate-y-2 h-full">
                    {/* Decorative Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/5 via-transparent to-[#06124f]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Profile Image with Enhanced Design */}
                    <div className="relative mb-6 mx-auto w-32 h-32 sm:w-36 sm:h-36">
                      {/* Animated Background Ring */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4] via-[#06b6d4] to-[#06124f] rounded-full p-1 group-hover:scale-105 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-[#06b6d4]/25">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white p-1">
                          <div className="w-full h-full rounded-full overflow-hidden relative">
                            <Image
                              src={member.image}
                              alt={member.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#06124f]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Badge */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="text-center relative z-10">
                      {/* Name with Enhanced Typography */}
                      <h3 className="text-xl sm:text-2xl font-black text-[#06124f] mb-3 group-hover:text-[#06b6d4] transition-colors duration-300">
                        {member.name}
                      </h3>
                      
                      {/* Role Badge */}
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-[#06b6d4]/10 to-[#06124f]/10 text-[#06124f] text-sm font-bold rounded-full border border-[#06b6d4]/20 group-hover:border-[#06b6d4]/40 transition-all duration-300">
                          {member.role}
                        </span>
                      </div>
                      
                      {/* Bio with Better Styling */}
                      <p className="text-gray-600 leading-relaxed mb-6 text-sm group-hover:text-gray-700 transition-colors duration-300 line-clamp-3">
                        {member.bio}
                      </p>
                      
                      {/* Enhanced Social Links */}
                      <div className="flex justify-center space-x-3">
                        <a 
                          href={member.linkedin} 
                          className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-[#06124f]/10 to-[#06124f]/5 text-[#06124f] hover:bg-gradient-to-br hover:from-[#06124f] hover:to-[#06124f]/90 hover:text-white transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1"
                          aria-label={`${member.name} LinkedIn Profile`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        
                        <a 
                          href={member.instagram} 
                          className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-[#06b6d4]/10 to-[#06b6d4]/5 text-[#06b6d4] hover:bg-gradient-to-br hover:from-[#06b6d4] hover:to-[#06b6d4]/90 hover:text-white transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1"
                          aria-label={`${member.name} Twitter Profile`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                        
                        {/* Contact Button */}
                        <button className="group/social relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 hover:bg-gradient-to-br hover:from-[#06124f]/10 hover:to-[#06b6d4]/10 hover:text-[#06124f] transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg transform hover:-translate-y-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Decorative Corner Elements */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-br from-[#06124f] to-[#06b6d4] rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-6 sm:mb-8">
              <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8">
              Ready to Optimize Your Operations?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 md:mb-12 leading-relaxed max-w-4xl mx-auto px-4 sm:px-0">
              Get premium barcode labels, thermal ribbons, and professional printer services to streamline your business operations with VIROS Entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 sm:px-0">
              <button className="group relative w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-white text-[#06124f] font-black rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-0 sm:min-w-[220px] text-base sm:text-lg touch-manipulation">
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Get Quote for Labels
                </span>
              </button>
              <button className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-2 border-white/40 text-white font-black rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/60 transition-all duration-300 min-w-0 sm:min-w-[220px] text-base sm:text-lg flex items-center justify-center touch-manipulation">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                View Products
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
