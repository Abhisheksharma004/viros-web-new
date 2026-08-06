"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for all dynamic content
  const [content, setContent] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [values, setValues] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'marquee' | 'grid'>('marquee');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, statsRes, featuresRes, valuesRes, milestonesRes, teamRes] = await Promise.all([
          fetch('/api/about/content'),
          fetch('/api/about/stats'),
          fetch('/api/about/features'),
          fetch('/api/about/values'),
          fetch('/api/about/milestones'),
          fetch('/api/team-members')
        ]);

        const contentData = await contentRes.json();
        const statsData = await statsRes.json();
        const featuresData = await featuresRes.json();
        const valuesData = await valuesRes.json();
        const milestonesData = await milestonesRes.json();
        const teamData = await teamRes.json();

        setContent(contentData);
        setStats(Array.isArray(statsData) ? statsData : []);
        setFeatures(Array.isArray(featuresData) ? featuresData : []);
        setValues(Array.isArray(valuesData) ? valuesData : []);
        setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
        setTeam(Array.isArray(teamData) ? teamData : []);
      } catch (error) {
        console.error('Error fetching about page data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    setIsVisible(true);
  }, []);

  // Fallback data for stats if database is empty
  const displayStats = stats.length > 0 ? stats : [
    { label: "Happy Clients", value: "500+", icon: null },
    { label: "Projects Delivered", value: "1000+", icon: null },
    { label: "Cities Served", value: "50+", icon: null },
    { label: "Uptime Guarantee", value: "99.9%", icon: null }
  ];

  // Fallback data for features if database is empty
  const displayFeatures = features.length > 0 ? features : [
    { title: "Label Printers", description: "Professional-grade thermal and direct thermal barcode label printers.", icon: null },
    { title: "Handheld Scanners", description: "High-performance handheld barcode scanners with advanced reading capabilities.", icon: null },
    { title: "Mobile TABs & Devices", description: "Rugged Android mobile computers and tablets with integrated barcode scanning.", icon: null },
    { title: "Labels & Ribbons", description: "Complete range of high-quality barcode labels and thermal transfer ribbons.", icon: null },
    { title: "IT Solutions", description: "Comprehensive IT infrastructure solutions including networking and servers.", icon: null },
    { title: "Software Solutions", description: "Custom barcode generation and inventory management software.", icon: null }
  ];

  // Fallback data for values if database is empty
  const displayValues = values.length > 0 ? values : [
    { title: "Quality Excellence", description: "We provide professional-grade barcode equipment and solutions.", icon: null, gradient: "from-[#06b6d4] to-[#06124f]" },
    { title: "Technical Expertise", description: "Our team brings deep technical knowledge in barcode technology.", icon: null, gradient: "from-[#06124f] to-[#06b6d4]" },
    { title: "Customer Success", description: "We build lasting partnerships with our clients.", icon: null, gradient: "from-[#06b6d4] via-[#06124f] to-[#06b6d4]" },
    { title: "Innovation Focus", description: "We stay at the forefront of barcode technology.", icon: null, gradient: "from-[#06124f] via-[#06b6d4] to-[#06124f]" }
  ];

  // Fallback data for milestones if database is empty
  const displayMilestones = milestones.length > 0 ? milestones : [
    { year: "2018", title: "Inception", description: "VIROS Entrepreneurs was founded with a vision to simplify barcode solutions." },
    { year: "2019", title: "Strategic Partnerships", description: "Secured key partnerships with major printer manufacturers." },
    { year: "2021", title: "National Expansion", description: "Expanded operations to serve clients across 20+ states in India." },
    { year: "2023", title: "Innovation & Software", description: "Launched our custom software development wing." },
    { year: "2024", title: "Market Leadership", description: "Recognized as a top barcode solutions provider with over 500+ satisfied clients." }
  ];

  // Fallback data for team if database is empty
  const fallbackTeam = [
    {
      id: 1,
      name: "Mr. Bibhransh Yadav",
      role: "Managing Director (MD)",
      image: "/team/bibhransh.jpg",
      bio: "Passionate entrepreneur and technology enthusiast with strong expertise in AIDC (Automatic Identification and Data Capture), barcode technology, and enterprise tech solutions.",
      linkedin: "#",
      instagram: "#"
    },
    {
      id: 2,
      name: "Rachna Rajput",
      role: "Account Manager",
      image: "/team/rachna.jpg",
      bio: "Account Manager with extensive experience in inventory management, stock control, purchase coordination, and day-to-day accounting operations.",
      linkedin: "#",
      instagram: "#"
    },
    {
      id: 3,
      name: "Shekhar",
      role: "System Administrator",
      image: "/team/shekhar.jpg",
      bio: "System administrator specializing in securing, maintaining, and scaling core IT infrastructure and network operations at Viros.",
      linkedin: "#",
      instagram: "#"
    }
  ];

  const displayTeam = [...(team.length > 0 ? team : fallbackTeam)].sort(
    (a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero Section - Fully Mobile Responsive */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden pt-16 sm:pt-20 md:pt-24">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-r from-[#06124f]/10 via-transparent to-[#06b6d4]/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,18,79,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Enhanced Subtitle Badge - Mobile Responsive */}
            <div className="mb-6 sm:mb-8 md:mb-10 flex justify-center">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-linear-to-r from-[#06b6d4]/20 to-[#06124f]/20 backdrop-blur-xl text-[#06124f] text-xs sm:text-sm md:text-sm font-bold rounded-full border border-[#06b6d4]/30 shadow-2xl shadow-[#06b6d4]/10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {content?.subtitle || "About VIROS Entrepreneurs"}
              </span>
            </div>

            {/* Enhanced Main Title - Mobile Responsive Typography */}
            <div className="mb-6 sm:mb-8 md:mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight">
                <span className="bg-linear-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] bg-clip-text text-transparent drop-shadow-2xl">
                  {content?.title || "Complete Barcode Solutions Provider"}
                </span>
              </h1>
            </div>

            {/* Enhanced Description - Mobile Responsive */}
            <div className="mb-8 sm:mb-12 md:mb-16">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600 leading-relaxed max-w-5xl mx-auto font-light px-2 sm:px-0">
                {content?.description || "VIROS Entrepreneurs specializes in providing comprehensive barcode solutions including label printers, handheld scanners, mobile devices, and custom software solutions for modern business operations."}
              </p>
            </div>

            {/* Call to Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 sm:px-0">
              <button className="group relative w-full sm:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#06b6d4]/30 hover:-translate-y-1 min-w-0 sm:min-w-50 touch-manipulation">
                <span className="relative z-10 flex items-center justify-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Your Journey
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-[#06b6d4] to-[#06124f] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 border-2 border-[#06124f]/30 text-[#06124f] font-bold rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-[#06124f]/5 hover:border-[#06124f]/50 transition-all duration-300 min-w-0 sm:min-w-50 flex items-center justify-center touch-manipulation">
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
      <section className="py-12 sm:py-16 md:py-20 bg-linear-to-r from-white/80 to-gray-50/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {displayStats.map((stat, index) => (
              <div
                key={index}
                className={`group text-center p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-[#06b6d4]/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-[#06b6d4] mb-3 sm:mb-4 md:mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-linear-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent mb-2 sm:mb-3">
                  {stat.value}
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
            {displayFeatures.map((feature, index) => (
              <div
                key={index}
                className={`group p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-linear-to-br from-white to-gray-50/50 border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-[#06124f]/5 to-[#06b6d4]/5">
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
                {content?.mission || "We specialize in providing comprehensive barcode solutions that streamline business operations across industries. From thermal label printers to mobile scanning devices, we deliver professional-grade equipment and software solutions."}
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-full shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Professional-Grade Barcode Equipment</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-full shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Custom Software & IT Solutions</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-linear-to-r from-[#06b6d4] to-[#06124f] rounded-full shrink-0"></div>
                  <span className="text-gray-700 font-semibold text-sm sm:text-base">Multi-Industry Application Support</span>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-[#06b6d4]/20 to-[#06124f]/20 rounded-2xl sm:rounded-3xl backdrop-blur-xl"></div>
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
                    {content?.vision || "To be India's most trusted barcode solutions provider, delivering innovative technology and exceptional service that enables businesses to achieve operational excellence and competitive advantage."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Journey Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#06b6d4]/5 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#06124f]/5 rounded-full blur-3xl translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06124f]/10 text-[#06124f] text-xs sm:text-sm font-bold rounded-full">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Our History
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#06124f] mb-4 sm:mb-6 md:mb-8">
              The VIROS Journey
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              From humble beginnings to becoming a leader in barcode technology, explore the milestones that defined our path.
            </p>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#06b6d4]/0 via-[#06b6d4]/30 to-[#06b6d4]/0 hidden md:block" />

            <div className="space-y-12 sm:space-y-16 md:space-y-24">
              {displayMilestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}>
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#06b6d4] rounded-full ring-4 ring-white shadow-lg hidden md:block">
                    <div className="absolute inset-0 bg-[#06b6d4] rounded-full animate-ping opacity-20" />
                  </div>

                  {/* Content */}
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'} pl-8 md:pl-0 border-l-2 md:border-l-0 border-[#06b6d4]/30 md:border-none ml-4 md:ml-0 pb-8 md:pb-0`}>
                    <div
                      className={`group p-6 sm:p-8 rounded-2xl bg-white border border-[#06b6d4]/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl sm:text-3xl font-black text-[#06b6d4]">{milestone.year}</span>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-[#06124f]/5 to-[#06b6d4]/5 rounded-xl flex items-center justify-center text-[#06124f] group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#06124f] mb-3">{milestone.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Values Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-linear-to-r from-[#06b6d4]/20 to-[#06124f]/20 backdrop-blur-xl text-[#06124f] text-xs sm:text-sm font-bold rounded-full border border-[#06b6d4]/30 shadow-2xl shadow-[#06b6d4]/10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Our Core Values
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-linear-to-r from-[#06124f] to-[#06b6d4] bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8">
              What Drives Us Forward
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
              Our core values are the foundation of everything we do, guiding every decision and shaping every solution we deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {displayValues.map((value, index) => (
              <div
                key={index}
                className={`group p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-[#06b6d4]/20 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-center">
                  <div className="text-[#06b6d4] mb-6 sm:mb-8 flex justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-black mb-4 sm:mb-6 bg-linear-to-r ${value.gradient} bg-clip-text text-transparent`}>
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
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-gray-50/70 via-slate-50/50 to-white relative overflow-hidden">
        {/* Subtle Background Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#06b6d4]/10 via-[#06124f]/5 to-[#06b6d4]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[#06b6d4]/15 via-[#06124f]/10 to-[#06b6d4]/15 backdrop-blur-md text-[#06124f] text-xs sm:text-sm font-extrabold rounded-full border border-[#06b6d4]/30 shadow-md">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Leadership Team
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#06124f] mb-4 sm:mb-6 tracking-tight">
              Meet the <span className="bg-gradient-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] bg-clip-text text-transparent">Visionaries</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0 font-normal">
              Our experienced leadership team combines deep expertise in barcode technology, business operations, and customer success to deliver comprehensive solutions across industries.
            </p>

            {/* View Mode Toggle Switch */}
            <div className="mt-8 flex justify-center items-center space-x-3">
              <button
                onClick={() => setViewMode('marquee')}
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center space-x-2 touch-manipulation ${
                  viewMode === 'marquee'
                    ? 'bg-[#06124f] text-white shadow-lg shadow-[#06124f]/25 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Continuous Scroll</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center space-x-2 touch-manipulation ${
                  viewMode === 'grid'
                    ? 'bg-[#06124f] text-white shadow-lg shadow-[#06124f]/25 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Grid View</span>
              </button>
            </div>
          </div>

          {viewMode === 'marquee' ? (
            /* Marquee Container with Fade Edges */
            <div className="relative overflow-hidden py-4">
              {/* Gradient Side Masks */}
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent z-20 pointer-events-none" />

              {/* Marquee Animation Track */}
              <div className="animate-marquee flex hover:[animation-play-state:paused]">
                {/* First Loop */}
                {displayTeam.map((member, index) => (
                  <div key={`first-${index}`} className="shrink-0 w-80 sm:w-[350px] mx-3 sm:mx-4">
                    <TeamCard member={member} isVisible={isVisible} index={index} />
                  </div>
                ))}
                {/* Duplicate Loop for Seamless Infinite Scroll */}
                {displayTeam.map((member, index) => (
                  <div key={`second-${index}`} className="shrink-0 w-80 sm:w-[350px] mx-3 sm:mx-4">
                    <TeamCard member={member} isVisible={isVisible} index={index} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto py-4">
              {displayTeam.map((member, index) => (
                <div key={`grid-${index}`} className="h-full">
                  <TeamCard member={member} isVisible={isVisible} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Enhanced CTA Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-r from-[#06124f] via-[#06124f] to-[#06b6d4] relative overflow-hidden">
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
              <Link href="/contact" className="w-full sm:w-auto">
                <button className="group relative w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-white text-[#06124f] font-black rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 min-w-0 sm:min-w-55 text-base sm:text-lg touch-manipulation">
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Get Quote for Labels
                  </span>
                </button>
              </Link>
              <Link href="/products" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-2 border-white/40 text-white font-black rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/60 transition-all duration-300 min-w-0 sm:min-w-55 text-base sm:text-lg flex items-center justify-center touch-manipulation">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View Products
                </button>
              </Link>
              <Link href="/certificates" className="w-full sm:w-auto">
                <button className="w-full px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-2 border-white/40 text-white font-black rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/60 transition-all duration-300 text-base sm:text-lg flex items-center justify-center touch-manipulation">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  View Certificates
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamCard({ member, isVisible, index }: { member: any; isVisible: boolean; index: number }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative h-full transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${(index % 6) * 100}ms` }}
    >
      {/* Outer Glow & Gradient Border Frame */}
      <div className="relative h-full rounded-[28px] p-[1.5px] bg-gradient-to-b from-[#06b6d4]/40 via-slate-200 to-[#06124f]/30 group-hover:from-[#06b6d4] group-hover:via-[#06124f] group-hover:to-[#06b6d4] transition-all duration-500 shadow-xl group-hover:shadow-2xl group-hover:shadow-[#06b6d4]/20">
        
        {/* Inner Card Container with Backdrop Blur */}
        <div className="relative h-full rounded-[26px] bg-white/95 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between overflow-hidden group-hover:-translate-y-2 transition-all duration-500">
          
          {/* Subtle Accent Glow In Background */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#06b6d4]/10 via-transparent to-transparent rounded-bl-full pointer-events-none group-hover:from-[#06b6d4]/25 transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-[#06124f]/5 via-transparent to-transparent rounded-tr-full pointer-events-none group-hover:from-[#06124f]/15 transition-all duration-500" />

          {/* Top Barcode Graphic Cues */}
          <div className="absolute top-4 left-6 flex items-center space-x-1 opacity-25 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
            <div className="w-1 h-3.5 bg-[#06124f] rounded-full" />
            <div className="w-0.5 h-3.5 bg-[#06b6d4] rounded-full" />
            <div className="w-1.5 h-3.5 bg-[#06124f] rounded-full" />
            <div className="w-0.5 h-3.5 bg-[#06b6d4] rounded-full" />
            <div className="w-1 h-3.5 bg-[#06124f] rounded-full" />
          </div>

          {/* Top Badge: Active Member Indicator */}
          <div className="absolute top-4 right-6 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4] inline-block shadow-sm animate-pulse" />
          </div>

          <div>
            {/* Avatar Section */}
            <div className="relative mb-6 mt-2 mx-auto w-32 h-32 sm:w-36 sm:h-36 group/avatar">
              {/* Pulsing Aura Behind Avatar */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#06124f] via-[#06b6d4] to-[#06124f] rounded-full blur-md opacity-40 group-hover/avatar:opacity-80 group-hover:scale-105 transition-all duration-500" />

              {/* Avatar Border Frame */}
              <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-[#06124f] via-[#06b6d4] to-[#06124f] shadow-lg group-hover/avatar:shadow-2xl group-hover/avatar:shadow-[#06b6d4]/40 transition-all duration-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-1 ring-2 ring-white">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {member.image && !imageError ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#06124f] via-[#06124f] to-[#06b6d4] text-white flex items-center justify-center font-black text-3xl shadow-inner">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'V'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06124f]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#06b6d4] to-[#06124f] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Content Details */}
            <div className="text-center relative z-10">
              <h3 className="text-xl sm:text-2xl font-black text-[#06124f] mb-2 tracking-tight group-hover:text-[#06b6d4] transition-colors duration-300">
                {member.name}
              </h3>

              {/* Role Pill Badge */}
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-[#06b6d4]/10 via-[#06124f]/5 to-[#06b6d4]/10 text-[#06124f] text-xs sm:text-sm font-bold rounded-full border border-[#06b6d4]/25 group-hover:border-[#06b6d4]/50 group-hover:shadow-xs transition-all duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] mr-2 animate-pulse" />
                  {member.role}
                </span>
              </div>

              {/* Member Bio */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 min-h-[4rem] group-hover:text-slate-800 transition-colors duration-300 font-normal">
                {member.bio}
              </p>
            </div>
          </div>

          {/* Social Links Footer */}
          <div className="relative z-10 pt-4 border-t border-slate-100 flex justify-center items-center space-x-3">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative p-3 rounded-2xl bg-slate-100/90 text-[#06124f] hover:bg-[#06124f] hover:text-white transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-[#06124f]/25 hover:-translate-y-1 touch-manipulation"
                aria-label={`${member.name} LinkedIn`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}

            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative p-3 rounded-2xl bg-slate-100/90 text-pink-600 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-pink-500/25 hover:-translate-y-1 touch-manipulation"
                aria-label={`${member.name} Instagram`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
