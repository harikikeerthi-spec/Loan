"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { siteSettingsApi } from "@/lib/api";

export interface PublicSiteSettings {
  siteName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  supportEmail: string;
  contactEmail: string;
  phone: string;
  tollFree: string;
  address: string;
  currency: string;
  timezone: string;
  copyrightText: string;

  // Social Links
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  telegramUrl: string;

  // Branding Assets
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  appIconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  darkThemeBg: string;
  customCss: string;

  // Tracking & Analytics
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  customHeadScripts: string;
  customBodyScripts: string;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSiteSettings = {
  siteName: "VidyaLoans",
  tagline: "Overseas Education Financing & Study Abroad Loan Portal",
  metaTitle: "VidyaLoans - Instant Education Loans for Overseas Studies",
  metaDescription:
    "Compare and apply for top education loans with lowest interest rates, quick approval, and zero hidden charges.",
  supportEmail: "support@vidyaloans.com",
  contactEmail: "contact@vidyaloans.com",
  phone: "+91 8143797779",
  tollFree: "1800-123-4567",
  address: "VidyaLoans Financial Tower, Sector 44, Gurgaon, Haryana 122003, India",
  currency: "INR",
  timezone: "Asia/Kolkata",
  copyrightText: `© ${new Date().getFullYear()} VidyaLoans Inc. All rights reserved.`,

  facebookUrl: "https://facebook.com/vidyaloans",
  instagramUrl: "https://www.instagram.com/vidya_loans/",
  twitterUrl: "https://x.com/VidyaLoans07",
  linkedinUrl: "https://www.linkedin.com/company/vidyaloans/",
  youtubeUrl: "https://youtube.com/@vidyaloans",
  whatsappNumber: "+918143797779",
  telegramUrl: "https://t.me/vidyaloans",

  logoLightUrl: "/images/vidyaloans-logo-transparent.png",
  logoDarkUrl: "/images/vidyaloans-logo-transparent.png",
  faviconUrl: "/favicon.ico",
  appIconUrl: "/images/icon.png",
  primaryColor: "#6605c7",
  secondaryColor: "#4f46e5",
  darkThemeBg: "#0f172a",
  customCss: "",

  googleAnalyticsId: "G-1Z8RYR9RBW",
  googleTagManagerId: "GTM-PSHKZ8FK",
  facebookPixelId: "",
  customHeadScripts: "",
  customBodyScripts: "",
};

interface SiteSettingsContextValue {
  settings: PublicSiteSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_PUBLIC_SETTINGS,
  loading: false,
  refetch: async () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  const applyDomChanges = useCallback((data: PublicSiteSettings) => {
    if (typeof document === "undefined") return;

    // 1. Dynamic CSS Variables on :root
    const root = document.documentElement;
    if (data.primaryColor) {
      root.style.setProperty("--color-primary", data.primaryColor);
      root.style.setProperty("--brand-primary", data.primaryColor);
    }
    if (data.secondaryColor) {
      root.style.setProperty("--color-indigo", data.secondaryColor);
      root.style.setProperty("--brand-secondary", data.secondaryColor);
    }

    // 2. Dynamic Custom CSS Injection
    let styleTag = document.getElementById("dynamic-site-custom-css") as HTMLStyleElement | null;
    if (data.customCss && data.customCss.trim()) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "dynamic-site-custom-css";
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = data.customCss;
    } else if (styleTag) {
      styleTag.remove();
    }

    // 3. Dynamic Favicon
    if (data.faviconUrl) {
      let linkTag = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!linkTag) {
        linkTag = document.createElement("link");
        linkTag.rel = "icon";
        document.head.appendChild(linkTag);
      }
      linkTag.href = data.faviconUrl;
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await siteSettingsApi.getPublicSettings();
      if (res && res.data) {
        const merged: PublicSiteSettings = {
          ...DEFAULT_PUBLIC_SETTINGS,
          ...res.data,
        };
        setSettings(merged);
        applyDomChanges(merged);
      }
    } catch (err) {
      console.warn("Failed to fetch public site settings, using defaults:", err);
    } finally {
      setLoading(false);
    }
  }, [applyDomChanges]);

  useEffect(() => {
    fetchSettings();

    // Listen for custom admin-update events across the same window session
    const handleSettingsUpdated = (event: any) => {
      if (event?.detail) {
        const merged: PublicSiteSettings = {
          ...DEFAULT_PUBLIC_SETTINGS,
          ...event.detail,
        };
        setSettings(merged);
        applyDomChanges(merged);
      } else {
        fetchSettings();
      }
    };

    window.addEventListener("site-settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("site-settings-updated", handleSettingsUpdated);
    };
  }, [fetchSettings, applyDomChanges]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  return context || { settings: DEFAULT_PUBLIC_SETTINGS, loading: false, refetch: async () => {} };
}
