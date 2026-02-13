import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch for AIDC Solutions",
  description: "Contact VIROS for expert AIDC solutions consultation. Reach out to our sales, support, or technical team. We're here to help transform your business with cutting-edge barcode and automation technology.",
  openGraph: {
    title: "Contact VIROS - Expert AIDC Solutions Consultation",
    description: "Get in touch with our expert team for AIDC solutions consultation and support.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
