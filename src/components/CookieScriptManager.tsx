"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/context/CookieContext";

export default function CookieScriptManager() {
  const { preferences } = useCookieConsent();

  useEffect(() => {
    // 1. Analytics Scripts Management
    if (preferences.analytics) {
      // Enable Google Analytics / web measurement if configured in environment
      const gaId = process.env.NEXT_PUBLIC_GA_ID;
      if (gaId && typeof window !== "undefined") {
        (window as any)[`ga-disable-${gaId}`] = false;
      }
    } else {
      // Disable Google Analytics tracking if consent was declined/revoked
      const gaId = process.env.NEXT_PUBLIC_GA_ID;
      if (gaId && typeof window !== "undefined") {
        (window as any)[`ga-disable-${gaId}`] = true;
      }
    }

    // 2. Marketing Scripts Management
    if (preferences.marketing) {
      // Custom promotional/marketing pixel initializations
    }

    // 3. Functional Scripts Management
    if (preferences.functional) {
      // UI preference & popup state retention enabled
    }
  }, [preferences]);

  return null;
}
