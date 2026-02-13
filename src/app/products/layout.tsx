import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products Catalog - Barcode Printers, Scanners & RFID Readers",
  description: "Browse VIROS extensive product catalog featuring industrial barcode printers, handheld scanners, mobile computers, RFID readers, thermal transfer ribbons, labels, and premium AIDC consumables from top brands like Zebra, Honeywell, TSC, and Sato.",
  keywords: [
    "barcode printers",
    "barcode scanners",
    "RFID readers",
    "mobile computers",
    "thermal transfer ribbons",
    "barcode labels",
    "Zebra printers",
    "Honeywell scanners",
    "TSC printers",
    "industrial printers"
  ],
  openGraph: {
    title: "VIROS Products - Premium AIDC Hardware & Consumables",
    description: "Shop industrial barcode printers, scanners, RFID readers, and consumables from leading brands.",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
