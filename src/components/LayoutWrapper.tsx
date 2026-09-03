"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import { CookieProvider } from "@/context/CookieContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import CookiePreferencesModal from "@/components/CookiePreferencesModal";
import CookieScriptManager from "@/components/CookieScriptManager";
import GetInTouchPopup from "@/components/GetInTouchPopup";

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
    <CookieProvider>
      <CookieScriptManager />
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
      {!hideNavAndFooter && pathname !== "/admin-login" && !pathname?.startsWith("/products") && <GetInTouchPopup />}
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </CookieProvider>
  );
}

