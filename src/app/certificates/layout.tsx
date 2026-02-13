import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificates & Certifications - Quality Assurance",
  description: "View VIROS industry certifications and quality assurance credentials. We maintain the highest standards in AIDC solutions delivery and support.",
  openGraph: {
    title: "VIROS Certifications - Quality Assurance Standards",
    description: "Industry certifications and quality credentials demonstrating our commitment to excellence.",
  },
};

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
