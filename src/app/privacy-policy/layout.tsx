import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Data Protection & Security",
  description: "Read VIROS privacy policy. Learn how we collect, use, protect, and manage your personal information while ensuring compliance with data protection regulations.",
  openGraph: {
    title: "VIROS Privacy Policy - Your Data Protection",
    description: "Our commitment to protecting your privacy and personal information.",
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
