import { Metadata } from "next";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Our Services - AIDC Solutions & Implementation",
  description: "Explore VIROS comprehensive AIDC services: Hardware Solutions (Barcode Printers, Scanners, RFID), Software Solutions (WMS, Inventory Tracking), Premium Consumables, and Custom Label Printing. Complete end-to-end implementation and support.",
  keywords: [
    "AIDC services",
    "barcode hardware",
    "warehouse management software",
    "inventory tracking solutions",
    "RFID solutions",
    "thermal printers",
    "label printing services",
    "barcode consumables"
  ],
  openGraph: {
    title: "VIROS Services - Complete AIDC Solutions",
    description: "Hardware, Software, Consumables & Label Printing - Complete AIDC solutions for your business.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
