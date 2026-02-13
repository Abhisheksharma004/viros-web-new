import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedServices from "@/components/FeaturedServices";
import AboutSection from "@/components/AboutSection";
import ClientSection from "@/components/ClientSection";
import TestimonialSection from "@/components/TestimonialSection";
import TrustedPartners from "../components/TrustedPartners";
import FeedbackButton from "@/components/FeedbackButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIROS - Leading AIDC Solutions Provider | Barcode Printers, Scanners & Software",
  description: "VIROS provides cutting-edge AIDC solutions including industrial barcode printers, scanners, mobile computers, RFID readers, warehouse management software, and premium consumables. Trusted by leading brands across Manufacturing, Logistics, Retail & Healthcare.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <FeaturedServices />
      <AboutSection />
      <ClientSection />
      <TrustedPartners />
      <TestimonialSection />
      
      {/* Feedback Button */}
      <FeedbackButton />
    </>
  );
}
