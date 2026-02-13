import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your Account",
  description: "Reset your VIROS account password securely using email verification.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
