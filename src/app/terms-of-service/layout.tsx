import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Website Terms & Conditions",
  description: "Read VIROS terms of service governing the use of our website, products, and services. Understand your rights and responsibilities when engaging with VIROS.",
  openGraph: {
    title: "VIROS Terms of Service - Website Terms & Conditions",
    description: "Terms and conditions governing the use of VIROS website and services.",
  },
};

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
