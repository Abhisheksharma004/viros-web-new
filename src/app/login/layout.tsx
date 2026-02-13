import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login - Access Dashboard",
  description: "Secure login portal for VIROS administrators to access the content management system and dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
