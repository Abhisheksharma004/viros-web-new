import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dashboard - Admin Panel",
    template: "%s - Dashboard | VIROS"
  },
  description: "VIROS admin dashboard for managing website content, products, services, testimonials, and more.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayoutMetadata({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
