"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CookiePreferences,
  DEFAULT_PREFERENCES,
  getSavedCookiePreferences,
  saveCookiePreferences,
  hasUserRespondedToConsent,
  clearCookieConsent,
} from "@/lib/cookies";

interface CookieContextType {
  preferences: CookiePreferences;
  hasResponded: boolean;
  isBannerOpen: boolean;
  isModalOpen: boolean;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  acceptAllCookies: () => void;
  declineNonEssentialCookies: () => void;
  savePreferences: (newPrefs: Partial<CookiePreferences>) => void;
  resetConsent: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasResponded, setHasResponded] = useState<boolean>(true); // Default true to avoid SSR flash
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const responded = hasUserRespondedToConsent();
    setHasResponded(responded);

    const saved = getSavedCookiePreferences();
    if (saved) {
      setPreferences(saved);
      setIsBannerOpen(false);
    } else {
      setIsBannerOpen(true);
    }
  }, []);

  const acceptAllCookies = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: DEFAULT_PREFERENCES.version,
    };
    const saved = saveCookiePreferences(allAccepted);
    setPreferences(saved);
    setHasResponded(true);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const declineNonEssentialCookies = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: DEFAULT_PREFERENCES.version,
    };
    const saved = saveCookiePreferences(essentialOnly);
    setPreferences(saved);
    setHasResponded(true);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const savePreferences = (newPrefs: Partial<CookiePreferences>) => {
    const saved = saveCookiePreferences(newPrefs);
    setPreferences(saved);
    setHasResponded(true);
    setIsBannerOpen(false);
    setIsModalOpen(false);
  };

  const resetConsent = () => {
    clearCookieConsent();
    setPreferences(DEFAULT_PREFERENCES);
    setHasResponded(false);
    setIsBannerOpen(true);
    setIsModalOpen(false);
  };

  const openPreferencesModal = () => {
    setIsModalOpen(true);
  };

  const closePreferencesModal = () => {
    setIsModalOpen(false);
  };

  return (
    <CookieContext.Provider
      value={{
        preferences,
        hasResponded,
        isBannerOpen,
        isModalOpen,
        openPreferencesModal,
        closePreferencesModal,
        acceptAllCookies,
        declineNonEssentialCookies,
        savePreferences,
        resetConsent,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieProvider");
  }
  return context;
}
