"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide navbar and footer on login and dashboard pages
  const hideNavAndFooter = pathname === "/login" || pathname?.startsWith("/dashboard");

  return (
    <>
      {!hideNavAndFooter && (
        <>
          <StructuredData />
          <Navbar />
        </>
      )}
      <main className={hideNavAndFooter ? "" : "pt-20"}>
        {children}
      </main>
      {!hideNavAndFooter && <Footer />}
    </>
  );
}
