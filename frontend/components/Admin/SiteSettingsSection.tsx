"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";

interface SiteSettings {
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

  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  telegramUrl: string;

  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  appIconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  darkThemeBg: string;
  customCss: string;

  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  posthogApiKey: string;
  mixpanelToken: string;
  hotjarSiteId: string;
  customHeadScripts: string;
  customBodyScripts: string;
  webhookUrl: string;

  disposableEmailBlock: boolean;
  disposableBlockLevel: string;
  blockedDomains: string;
  allowedDomains: string;
  disposableApiKey: string;
  disposableProvider: string;
  disposableAction: string;
}

const DEFAULT_FORM: SiteSettings = {
  siteName: "VidyaLoans",
  tagline: "Overseas Education Financing & Study Abroad Loan Portal",
  metaTitle: "VidyaLoans - Instant Education Loans for Overseas Studies",
  metaDescription: "Compare and apply for top education loans with lowest interest rates, quick approval, and zero hidden charges.",
  supportEmail: "support@vidyaloans.com",
  contactEmail: "contact@vidyaloans.com",
  phone: "+91 1800-123-4567",
  tollFree: "1800-123-4567",
  address: "VidyaLoans Financial Tower, Sector 44, Gurgaon, Haryana 122003, India",
  currency: "INR",
  timezone: "Asia/Kolkata",
  copyrightText: "© 2026 VidyaLoans Inc. All rights reserved.",

  facebookUrl: "https://facebook.com/vidyaloans",
  instagramUrl: "https://instagram.com/vidyaloans",
  twitterUrl: "https://x.com/vidyaloans",
  linkedinUrl: "https://linkedin.com/company/vidyaloans",
  youtubeUrl: "https://youtube.com/@vidyaloans",
  whatsappNumber: "+919876543210",
  telegramUrl: "https://t.me/vidyaloans",

  logoLightUrl: "/images/vidyaloans-logo-transparent.png",
  logoDarkUrl: "/images/vidyaloans-logo-transparent.png",
  faviconUrl: "/favicon.ico",
  appIconUrl: "/images/icon.png",
  primaryColor: "#6605c7",
  secondaryColor: "#4f46e5",
  darkThemeBg: "#0f172a",
  customCss: "/* Custom CSS Overrides */\n:root {\n  --brand-primary: #6605c7;\n}",

  googleAnalyticsId: "G-VIDYA2026",
  googleTagManagerId: "GTM-VDY8899",
  facebookPixelId: "987654321098765",
  posthogApiKey: "phc_vidyaloans_live_key_998877",
  mixpanelToken: "mp_token_vidyaloans_production",
  hotjarSiteId: "3456789",
  customHeadScripts: "<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});})(window,document,'script','dataLayer','GTM-VDY8899');</script>",
  customBodyScripts: "<!-- Chat Widget -->\n<script>console.log('VidyaLoans Chat Widget Initialized');</script>",
  webhookUrl: "https://api.vidyaloans.com/v1/webhooks/events",

  disposableEmailBlock: true,
  disposableBlockLevel: "strict",
  blockedDomains: "tempmail.com, mailinator.com, 10minutemail.com, guerrillamail.com, throwawaymail.com, yopmail.com, trashmail.com, getnada.com, fakeinbox.com, dispostable.com, tempmailo.com, 10minutemail.net, temp-mail.org, mohmal.com, nada.ltd",
  allowedDomains: "gmail.com, yahoo.com, outlook.com, hotmail.com, icloud.com, proton.me, protonmail.com, vidyaloans.com",
  disposableApiKey: "",
  disposableProvider: "builtin",
  disposableAction: "reject",
};

export default function SiteSettingsSection() {
  const [activeTab, setActiveTab] = useState<"identity" | "social" | "branding" | "analytics" | "disposable">("identity");
  const [form, setForm] = useState<SiteSettings>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<SiteSettings>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Email Tester state
  const [testEmail, setTestEmail] = useState("user@tempmail.com");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Load Settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSiteSettings();
      if (res && res.data) {
        setForm(res.data);
        setInitialForm(res.data);
      }
    } catch (e) {
      console.error("Error fetching site settings:", e);
      showToast("Loaded default configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateSiteSettings(form);
      if (res && res.data) {
        setForm(res.data);
        setInitialForm(res.data);
        showToast("Site settings saved successfully!", "success");
      } else {
        showToast("Updated site configuration", "success");
        setInitialForm(form);
      }
    } catch (e) {
      console.error("Error saving site settings:", e);
      showToast("Failed to save site settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all site settings to factory defaults?")) return;
    setResetting(true);
    try {
      const res = await adminApi.resetSiteSettings();
      if (res && res.data) {
        setForm(res.data);
        setInitialForm(res.data);
        showToast("Settings reset to defaults", "success");
      }
    } catch (e) {
      console.error("Error resetting settings:", e);
      showToast("Failed to reset settings", "error");
    } finally {
      setResetting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestLoading(true);
    try {
      const res = await adminApi.testDisposableEmail(testEmail);
      if (res && res.data) {
        setTestResult(res.data);
      }
    } catch (e) {
      console.error("Error testing disposable email:", e);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Loading Site Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-3 transition-all animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-500 text-emerald-100 backdrop-blur-md"
              : "bg-rose-900/90 border-rose-500 text-rose-100 backdrop-blur-md"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <span className="material-symbols-outlined text-2xl">settings_suggest</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Site Settings & Platform Config</h1>
                <p className="text-xs text-slate-400">Manage branding, analytics, social channels, and email security shield</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 text-xs font-bold transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px]">BRANDING</span>
              <span className="font-bold text-white">{form.siteName || "VidyaLoans"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            <span className="material-symbols-outlined text-indigo-400 text-base">analytics</span>
            <div>
              <span className="text-slate-400 block text-[10px]">GA4 TRACKING</span>
              <span className="font-bold text-white">{form.googleAnalyticsId || "Disabled"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            <span className="material-symbols-outlined text-purple-400 text-base">share</span>
            <div>
              <span className="text-slate-400 block text-[10px]">SOCIAL CHANNELS</span>
              <span className="font-bold text-white">7 Channels Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
            <span className={`material-symbols-outlined text-base ${form.disposableEmailBlock ? "text-emerald-400" : "text-amber-400"}`}>
              {form.disposableEmailBlock ? "verified_user" : "gpp_maybe"}
            </span>
            <div>
              <span className="text-slate-400 block text-[10px]">DISPOSABLE SHIELD</span>
              <span className={`font-bold ${form.disposableEmailBlock ? "text-emerald-300" : "text-amber-300"}`}>
                {form.disposableEmailBlock ? `${form.disposableBlockLevel.toUpperCase()} BLOCK` : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "identity", label: "General Identity", icon: "badge" },
          { id: "social", label: "Social Media Links", icon: "share" },
          { id: "branding", label: "Branding Assets", icon: "palette" },
          { id: "analytics", label: "Integrations & Analytics", icon: "insights" },
          { id: "disposable", label: "Disposable Email Protection", icon: "security" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL IDENTITY */}
      {activeTab === "identity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b pb-3">
              <span className="material-symbols-outlined">domain</span>
              <h3>Core Site Identity</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Title / Name</label>
              <input
                type="text"
                value={form.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                placeholder="e.g. VidyaLoans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Slogan</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                placeholder="e.g. Overseas Education Financing Portal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Meta Title (SEO)</label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => handleChange("metaTitle", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Meta Description</label>
              <textarea
                rows={3}
                value={form.metaDescription}
                onChange={(e) => handleChange("metaDescription", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b pb-3">
              <span className="material-symbols-outlined">contact_phone</span>
              <h3>Contact Info & Locale</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sales/Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Toll-Free Number</label>
                <input
                  type="text"
                  value={form.tollFree}
                  onChange={(e) => handleChange("tollFree", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Office Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Copyright Text</label>
              <input
                type="text"
                value={form.copyrightText}
                onChange={(e) => handleChange("copyrightText", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA LINKS */}
      {activeTab === "social" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Social Media Profiles & Channels</h3>
              <p className="text-xs text-slate-500">Configure links to your social handles displayed across the header, footer, and emails</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              7 Channels Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "facebookUrl", label: "Facebook Page", icon: "facebook", placeholder: "https://facebook.com/yourpage", color: "text-blue-600" },
              { key: "instagramUrl", label: "Instagram Handle", icon: "photo_camera", placeholder: "https://instagram.com/yourhandle", color: "text-pink-600" },
              { key: "twitterUrl", label: "Twitter / X Profile", icon: "tag", placeholder: "https://x.com/yourhandle", color: "text-slate-800" },
              { key: "linkedinUrl", label: "LinkedIn Company", icon: "work", placeholder: "https://linkedin.com/company/yourcompany", color: "text-blue-700" },
              { key: "youtubeUrl", label: "YouTube Channel", icon: "play_circle", placeholder: "https://youtube.com/@yourchannel", color: "text-red-600" },
              { key: "whatsappNumber", label: "WhatsApp Business Number", icon: "chat", placeholder: "+919876543210", color: "text-emerald-600" },
              { key: "telegramUrl", label: "Telegram Channel", icon: "send", placeholder: "https://t.me/yourchannel", color: "text-sky-500" },
            ].map((s) => (
              <div key={s.key} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center ${s.color} shadow-sm shrink-0`}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-slate-800 mb-1">{s.label}</label>
                  <input
                    type="text"
                    value={(form as any)[s.key]}
                    onChange={(e) => handleChange(s.key as any, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs font-medium bg-white"
                    placeholder={s.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BRANDING ASSETS */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b pb-3">
                <span className="material-symbols-outlined">image</span>
                <h3>Logo & Icon URLs</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Light Mode Logo URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.logoLightUrl}
                    onChange={(e) => handleChange("logoLightUrl", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={form.logoLightUrl} alt="Logo Light" className="max-h-7 object-contain" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dark Mode Logo URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.logoDarkUrl}
                    onChange={(e) => handleChange("logoDarkUrl", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={form.logoDarkUrl} alt="Logo Dark" className="max-h-7 object-contain" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Favicon URL</label>
                  <input
                    type="text"
                    value={form.faviconUrl}
                    onChange={(e) => handleChange("faviconUrl", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile App Icon</label>
                  <input
                    type="text"
                    value={form.appIconUrl}
                    onChange={(e) => handleChange("appIconUrl", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b pb-3">
                <span className="material-symbols-outlined">colorize</span>
                <h3>Theme Color Palette</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dark Mode BG</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.darkThemeBg}
                      onChange={(e) => handleChange("darkThemeBg", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.darkThemeBg}
                      onChange={(e) => handleChange("darkThemeBg", e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Live Color Preview</span>
                <div className="flex items-center gap-3">
                  <button style={{ backgroundColor: form.primaryColor }} className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow">
                    Primary Button
                  </button>
                  <button style={{ backgroundColor: form.secondaryColor }} className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow">
                    Secondary Accent
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b pb-3">
              <span className="material-symbols-outlined">code</span>
              <h3>Custom CSS Overrides</h3>
            </div>
            <textarea
              rows={4}
              value={form.customCss}
              onChange={(e) => handleChange("customCss", e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-slate-900/90 text-emerald-400"
              placeholder="/* Add site wide custom CSS rules */"
            />
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRATIONS & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Google Analytics 4 ID", field: "googleAnalyticsId", placeholder: "G-XXXXXXXXXX", icon: "analytics" },
              { label: "Google Tag Manager ID", field: "googleTagManagerId", placeholder: "GTM-XXXXXXX", icon: "label" },
              { label: "Meta / Facebook Pixel ID", field: "facebookPixelId", placeholder: "123456789012345", icon: "cell_tower" },
              { label: "PostHog API Key", field: "posthogApiKey", placeholder: "phc_live_xxxxxxxx", icon: "dataset" },
              { label: "Mixpanel Project Token", field: "mixpanelToken", placeholder: "mp_token_xxxxxxx", icon: "insights" },
              { label: "Hotjar Site ID", field: "hotjarSiteId", placeholder: "1234567", icon: "visibility" },
            ].map((item) => (
              <div key={item.field} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="material-symbols-outlined text-indigo-600 text-sm">{item.icon}</span>
                  {item.label}
                </div>
                <input
                  type="text"
                  value={(form as any)[item.field]}
                  onChange={(e) => handleChange(item.field as any, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">code</span>
                  Custom &lt;head&gt; Scripts
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">HTML / JS Injector</span>
              </div>
              <textarea
                rows={6}
                value={form.customHeadScripts}
                onChange={(e) => handleChange("customHeadScripts", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs bg-slate-950 text-indigo-300"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">terminal</span>
                  Custom &lt;body&gt; Header / Footer Scripts
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Chat & Tracking Widgets</span>
              </div>
              <textarea
                rows={6}
                value={form.customBodyScripts}
                onChange={(e) => handleChange("customBodyScripts", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs bg-slate-950 text-emerald-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISPOSABLE EMAIL PROTECTION */}
      {activeTab === "disposable" && (
        <div className="space-y-6">
          {/* Master Switch & Mode Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.disposableEmailBlock ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <span className="material-symbols-outlined text-2xl">shield</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Disposable & Temporary Email Shield</h3>
                    <p className="text-xs text-slate-500">Prevent fake account creation and spam by blocking disposable domain emails</p>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.disposableEmailBlock}
                  onChange={(e) => handleChange("disposableEmailBlock", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-800">
                  {form.disposableEmailBlock ? "SHIELD ACTIVE" : "SHIELD DISABLED"}
                </span>
              </label>
            </div>

            {/* Enforcement Mode Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-3">Enforcement Level Policy</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "strict", title: "Strict Block", desc: "Instantly block registration and applications using disposable email domains.", icon: "block", color: "border-emerald-500 bg-emerald-50/40 text-emerald-900" },
                  { id: "warning", title: "Warning Banner", desc: "Warn the user that temp email addresses are discouraged before proceeding.", icon: "warning", color: "border-amber-500 bg-amber-50/40 text-amber-900" },
                  { id: "audit_only", title: "Audit Log Only", desc: "Allow registration but flag the user account in admin audit logs for staff review.", icon: "visibility", color: "border-indigo-500 bg-indigo-50/40 text-indigo-900" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleChange("disposableBlockLevel", mode.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      form.disposableBlockLevel === mode.id
                        ? `${mode.color} shadow-md ring-2 ring-indigo-500/20`
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="material-symbols-outlined text-xl">{mode.icon}</span>
                      {form.disposableBlockLevel === mode.id && (
                        <span className="material-symbols-outlined text-lg text-indigo-600">check_circle</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs mb-1">{mode.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blacklist and Whitelist Domain Managers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <span className="material-symbols-outlined">do_not_disturb_on</span>
                  <h3>Blocked Email Domains (Blacklist)</h3>
                </div>
                <span className="text-[10px] text-slate-400">Comma or newline separated</span>
              </div>
              <textarea
                rows={6}
                value={form.blockedDomains}
                onChange={(e) => handleChange("blockedDomains", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs bg-rose-50/30 text-rose-950"
                placeholder="tempmail.com, mailinator.com, yopmail.com"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <span className="material-symbols-outlined">verified</span>
                  <h3>Whitelisted Domains (Exceptions)</h3>
                </div>
                <span className="text-[10px] text-slate-400">Comma or newline separated</span>
              </div>
              <textarea
                rows={6}
                value={form.allowedDomains}
                onChange={(e) => handleChange("allowedDomains", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs bg-emerald-50/30 text-emerald-950"
                placeholder="gmail.com, yahoo.com, outlook.com"
              />
            </div>
          </div>

          {/* Real-time Email Protection Live Tester */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm border-b border-slate-800 pb-3">
              <span className="material-symbols-outlined text-lg">science</span>
              <h3>Live Disposable Email Tester Widget</h3>
            </div>

            <p className="text-xs text-slate-400">Test any email address against your active disposable email protection rules live</p>

            <div className="flex items-center gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="e.g. user@tempmail.com"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleTestEmail}
                disabled={testLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shrink-0 flex items-center gap-2"
              >
                {testLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">saved_search</span>
                    Test Email
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                  testResult.blocked
                    ? "bg-rose-950/60 border-rose-600/60 text-rose-200"
                    : "bg-emerald-950/60 border-emerald-600/60 text-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">
                      {testResult.blocked ? "cancel" : "check_circle"}
                    </span>
                    {testResult.blocked ? "DISPOSABLE EMAIL DETECTED" : "EMAIL IS VALID & ALLOWED"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10">
                    {testResult.action}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="opacity-60 block">DOMAIN</span>
                    <span className="font-mono font-bold">@{testResult.domain}</span>
                  </div>
                  <div>
                    <span className="opacity-60 block">SHIELD STATUS</span>
                    <span className="font-bold">{testResult.protectionEnabled ? "Active" : "Disabled"}</span>
                  </div>
                  <div>
                    <span className="opacity-60 block">ENFORCEMENT</span>
                    <span className="font-bold capitalize">{testResult.blockLevel}</span>
                  </div>
                  <div>
                    <span className="opacity-60 block">RESULT REASON</span>
                    <span className="truncate block" title={testResult.reason}>{testResult.reason}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
