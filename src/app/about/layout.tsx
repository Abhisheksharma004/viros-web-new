import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Our Story, Mission & Vision",
  description: "Learn about VIROS - a leading AIDC solutions provider. Discover our mission, vision, core values, company milestones, and meet our expert team dedicated to transforming businesses with cutting-edge automation technology.",
  openGraph: {
    title: "About VIROS - Our Story, Mission & Vision",
    description: "Learn about VIROS - a leading AIDC solutions provider with expert team and proven track record.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
