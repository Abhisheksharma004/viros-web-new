import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warranty Information - Product Guarantee & Support",
  description: "Learn about VIROS product warranty coverage, terms, and conditions. We stand behind our AIDC hardware and software solutions with comprehensive warranty support.",
  openGraph: {
    title: "VIROS Warranty Information - Product Coverage",
    description: "Comprehensive warranty coverage for all VIROS AIDC products and solutions.",
  },
};

export default function WarrantyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
