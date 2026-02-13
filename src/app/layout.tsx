import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VIROS - Leading AIDC Solutions Provider | Barcode Printers, Scanners & Software",
    template: "%s | VIROS"
  },
  description: "VIROS provides cutting-edge AIDC solutions including industrial barcode printers, scanners, mobile computers, RFID readers, warehouse management software, and premium consumables. Trusted by leading brands across Manufacturing, Logistics, Retail & Healthcare.",
  keywords: [
    // Core AIDC Solutions
    "AIDC solutions",
    "automatic identification and data capture",
    "AIDC technology provider",
    "AIDC hardware supplier",
    "enterprise AIDC solutions",
    
    // Barcode Printers - Brands & Types
    "barcode printers",
    "industrial barcode printers",
    "thermal label printers",
    "thermal transfer printers",
    "direct thermal printers",
    "desktop barcode printers",
    "mobile barcode printers",
    "Zebra printers",
    "Zebra barcode printers",
    "Zebra ZT411 printer",
    "Zebra ZT600 series",
    "Honeywell printers",
    "TSC printers",
    "TSC TTP-247",
    "Sato printers",
    "industrial label printers",
    "4-inch barcode printer",
    "6-inch barcode printer",
    
    // Barcode Scanners
    "barcode scanners",
    "barcode readers",
    "handheld barcode scanners",
    "2D barcode scanners",
    "1D barcode scanners",
    "wireless barcode scanners",
    "bluetooth barcode scanner",
    "industrial barcode scanners",
    "rugged barcode scanners",
    "Honeywell scanners",
    "Honeywell Granit 1991i",
    "Zebra scanners",
    "image barcode scanner",
    "laser barcode scanner",
    "DPM barcode scanner",
    "fixed mount scanners",
    
    // RFID Technology
    "RFID readers",
    "RFID solutions",
    "RFID tags",
    "RFID printers",
    "RFID asset tracking",
    "UHF RFID readers",
    "passive RFID tags",
    "active RFID technology",
    
    // Mobile Computing
    "mobile computers",
    "handheld mobile computers",
    "rugged mobile devices",
    "Android mobile computers",
    "industrial PDAs",
    "mobile data terminals",
    "Zebra TC52",
    "Zebra mobile computers",
    "enterprise mobile computers",
    "warehouse mobile computers",
    
    // Software Solutions
    "warehouse management system",
    "WMS software",
    "inventory management software",
    "inventory tracking system",
    "asset tracking software",
    "asset management system",
    "barcode inventory software",
    "warehouse automation software",
    "supply chain management",
    "stock management system",
    
    // Consumables & Supplies
    "thermal transfer ribbons",
    "barcode ribbons",
    "wax ribbons",
    "resin ribbons",
    "wax resin ribbons",
    "barcode labels",
    "thermal labels",
    "industrial labels",
    "RFID labels",
    "shipping labels",
    "product labels",
    "asset tags",
    "label rolls",
    "printer ribbons",
    "barcode supplies",
    
    // Industries
    "manufacturing barcode solutions",
    "logistics barcode systems",
    "retail barcode solutions",
    "healthcare barcode systems",
    "warehouse automation",
    "distribution center solutions",
    "supply chain automation",
    "inventory control systems",
    
    // Services
    "barcode printer installation",
    "barcode system integration",
    "AIDC consulting",
    "barcode printer repair",
    "printer maintenance services",
    "technical support barcode",
    "barcode solution provider",
    
    // Location & Brand
    "VIROS",
    "VIROS Entrepreneurs",
    "VIROS AIDC solutions",
    "barcode solutions India",
    "AIDC provider India",
    
    // Product Features
    "300 dpi barcode printer",
    "600 dpi barcode printer",
    "WiFi barcode scanner",
    "bluetooth label printer",
    "rugged industrial equipment",
    "enterprise barcode hardware",
  ],
  authors: [{ name: "VIROS Entrepreneurs" }],
  creator: "VIROS Entrepreneurs",
  publisher: "VIROS Entrepreneurs",
  category: "Technology",
  classification: "AIDC Solutions, Barcode Hardware, Warehouse Management",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://virosentrepreneurs.com'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "VIROS",
    title: "VIROS - Leading AIDC Solutions Provider | Barcode Printers & Scanners",
    description: "Cutting-edge AIDC solutions including industrial barcode printers, handheld scanners, RFID readers, mobile computers, and warehouse management software. Authorized partner for Zebra, Honeywell, TSC, and Sato.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VIROS - AIDC Solutions Provider - Barcode Printers, Scanners & Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIROS - Leading AIDC Solutions Provider",
    description: "Industrial barcode printers, scanners, RFID readers & warehouse management software. Authorized Zebra, Honeywell, TSC partner.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // Add other verification codes as needed
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
