"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  cta_secondary: string;
  display_order: number;
  is_active: boolean;
}

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/hero-slides');
        if (response.ok) {
          const data = await response.json();
          // Filter active slides and sort by display_order
          const activeSlides = data
            .filter((s: HeroSlide) => s.is_active)
            .sort((a: HeroSlide, b: HeroSlide) => a.display_order - b.display_order);
          setSlides(activeSlides);
        }
      } catch (error) {
        console.error('Error fetching hero slides:', error);
      }
    };
    fetchSlides();
  }, []);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  // Loading state management
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevSlide();
      } else if (event.key === 'ArrowRight') {
        nextSlide();
      } else if (event.key >= '1' && event.key <= '3') {
        const slideIndex = parseInt(event.key) - 1;
        if (slideIndex < slides.length) {
          goToSlide(slideIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#06124f]" />;

  if (slides.length === 0 && !isLoading) return null;

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Slider - Mobile Optimized */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105'
              }`}
          >
            {/* Background Image with Mobile-Optimized Overlay */}
            <div className="relative h-full w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className={`object-cover object-center transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                quality={index === 0 ? 90 : 75}
                onLoad={() => index === 0 && setIsLoading(false)}
              />
              {/* Loading placeholder */}
              {isLoading && index === currentSlide && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#06124f] to-[#06b6d4] animate-pulse" />
              )}
              {/* Enhanced Mobile Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#06124f]/90 via-[#06124f]/75 to-[#06124f]/40 sm:from-[#06124f]/85 sm:via-[#06124f]/70 sm:to-[#06124f]/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06124f]/60 via-transparent to-transparent sm:from-[#06124f]/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Content - Mobile-First Responsive Design */}
      <div className="relative z-10 min-h-screen flex items-start sm:items-center justify-center pt-20 sm:pt-0">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="text-center">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`transition-all duration-700 ease-out ${index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none absolute inset-0'
                  }`}
              >
                {/* Subtitle Badge - Mobile Responsive */}
                <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
                  <span className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#06b6d4]/25 backdrop-blur-md text-[#06b6d4] text-xs sm:text-sm font-semibold rounded-full border border-[#06b6d4]/50 shadow-lg">
                    {slide.subtitle}
                  </span>
                </div>

                {/* Main Title - Mobile-First Typography */}
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight tracking-tight hero-mobile-padding hero-mobile-text">
                    <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                      {slide.title}
                    </span>
                  </h1>
                </div>

                {/* Description - Mobile Optimized */}
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-4xl mx-auto font-light hero-mobile-padding">
                    {slide.description}
                  </p>
                </div>

                {/* CTA Buttons - Mobile-First Design */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
                  <button className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#06b6d4]/30 hover:-translate-y-1 min-w-0 sm:min-w-[160px] touch-manipulation">
                    <span className="relative z-10 text-sm sm:text-base">{slide.cta}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#06124f] to-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/50 text-white font-semibold rounded-lg sm:rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/70 transition-all duration-300 min-w-0 sm:min-w-[160px] touch-manipulation">
                    <span className="text-sm sm:text-base">{slide.cta_secondary}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide Indicators - Mobile Enhanced */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 touch-manipulation ${index === currentSlide
              ? 'bg-[#06b6d4] scale-125 shadow-lg shadow-[#06b6d4]/50'
              : 'bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar - Mobile Optimized */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
        <div
          className="h-full bg-gradient-to-r from-[#06b6d4] to-[#06124f] transition-all duration-300 ease-linear"
          style={{
            width: `${slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0}%`
          }}
        />
      </div>

      {/* Scroll Indicator - Hidden on Mobile, Visible on Desktop */}
      <div className="hidden md:flex absolute bottom-6 sm:bottom-8 right-6 sm:right-8 z-20 flex-col items-center text-white/60">
        <span className="text-xs sm:text-sm font-medium mb-2 rotate-90 origin-center">Scroll</span>
        <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}