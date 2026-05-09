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
  const hideNavAndFooter =
    pathname === "/login" ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin-dashboard") ||
    pathname?.startsWith("/employee-dashboard");

  // Hide navbar and footer only on mobile for admin-login
  const mobileHideNavAndFooter = pathname === "/admin-login";

  return (
    <>
      {!hideNavAndFooter && (
        <div className={mobileHideNavAndFooter ? "hidden lg:block" : ""}>
          <StructuredData />
          <Navbar />
        </div>
      )}
      <main className={hideNavAndFooter ? "" : mobileHideNavAndFooter ? "lg:pt-20" : "pt-20"}>
        {children}
      </main>
      {!hideNavAndFooter && (
        <div className={mobileHideNavAndFooter ? "hidden lg:block" : ""}>
          <Footer />
        </div>
      )}
    </>
  );
}
