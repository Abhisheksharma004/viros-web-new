import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers - Join the Viros Team | Build Next-Gen AIDC & Tech Solutions",
  description: "Explore exciting career opportunities at VIROS Entrepreneurs. Join our high-impact team developing cutting-edge barcode, RFID, vision systems, and enterprise IT automation solutions.",
  openGraph: {
    title: "Careers at VIROS Entrepreneurs - Grow Your Career With Us",
    description: "Join a fast-growing team of innovators, engineers, and problem-solvers transforming industrial AIDC and enterprise software.",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
