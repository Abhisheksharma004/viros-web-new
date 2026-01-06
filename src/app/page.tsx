import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedServices from "@/components/FeaturedServices";
import AboutSection from "@/components/AboutSection";
import ClientSection from "@/components/ClientSection";
import TestimonialSection from "@/components/TestimonialSection";
import TrustedPartners from "../components/TrustedPartners";

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
    </>
  );
}
