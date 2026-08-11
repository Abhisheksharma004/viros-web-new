"use client";

export interface CookiePreferences {
  essential: boolean; // Always true for security & essential features
  analytics: boolean; // Traffic measurement, Google Analytics
  functional: boolean; // Preferences, UI choices, state memory
  marketing: boolean; // Targeted offers, promotional banners
  timestamp: string;
  version: string;
}

export const COOKIE_CONSENT_KEY = "viros_cookie_consent";
export const COOKIE_PREFERENCES_KEY = "viros_cookie_preferences";
export const CURRENT_COOKIE_VERSION = "1.0";

export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: true,
  functional: true,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CURRENT_COOKIE_VERSION,
};

/**
 * Gets a cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

/**
 * Sets a cookie in document.cookie with configurable options
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 365,
  options: { sameSite?: "Strict" | "Lax" | "None"; secure?: boolean; path?: string } = {}
): void {
  if (typeof document === "undefined") return;

  const { sameSite = "Lax", secure = true, path = "/" } = options;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}`;

  if (secure && typeof window !== "undefined" && window.location.protocol === "https:") {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}

/**
 * Deletes a cookie by setting an expired date
 */
export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

/**
 * Gets saved cookie preferences from cookies / localStorage
 */
export function getSavedCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const cookieVal = getCookie(COOKIE_PREFERENCES_KEY);
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          essential: true, // Always true
        };
      }
    }

    const localVal = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (localVal) {
      const parsed = JSON.parse(localVal);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          essential: true,
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse saved cookie preferences", e);
  }

  return null;
}

/**
 * Saves cookie preferences to cookies and localStorage, and syncs to backend database
 */
export function saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
  const fullPrefs: CookiePreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    essential: true, // Essential is always true
    timestamp: new Date().toISOString(),
    version: CURRENT_COOKIE_VERSION,
  };

  const jsonStr = JSON.stringify(fullPrefs);

  setCookie(COOKIE_CONSENT_KEY, "true", 365);
  setCookie(COOKIE_PREFERENCES_KEY, jsonStr, 365);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "true");
      localStorage.setItem(COOKIE_PREFERENCES_KEY, jsonStr);
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }

    // Sync consent log asynchronously to backend MySQL database
    fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        essential: fullPrefs.essential,
        analytics: fullPrefs.analytics,
        functional: fullPrefs.functional,
        marketing: fullPrefs.marketing,
      }),
    }).catch((err) => {
      console.error("Failed to sync cookie consent to database:", err);
    });
  }

  return fullPrefs;
}

/**
 * Checks if user has responded to cookie consent
 */
export function hasUserRespondedToConsent(): boolean {
  if (typeof window === "undefined") return false;
  return getCookie(COOKIE_CONSENT_KEY) === "true" || localStorage.getItem(COOKIE_CONSENT_KEY) === "true";
}

/**
 * Clears saved cookie consent and preferences from browser
 */
export function clearCookieConsent(): void {
  deleteCookie(COOKIE_CONSENT_KEY);
  deleteCookie(COOKIE_PREFERENCES_KEY);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    } catch (e) {
      console.error("Failed to clear localStorage consent keys", e);
    }
  }
}

/**
 * Utility to check if a specific cookie category has user consent
 */
export function hasConsentedTo(category: keyof Omit<CookiePreferences, "timestamp" | "version">): boolean {
  if (category === "essential") return true;
  const prefs = getSavedCookiePreferences();
  if (!prefs) return false;
  return Boolean(prefs[category]);
}



