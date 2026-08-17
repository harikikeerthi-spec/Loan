export class UpdateSiteSettingsDto {
  // General Identity
  siteName?: string;
  tagline?: string;
  metaTitle?: string;
  metaDescription?: string;
  supportEmail?: string;
  contactEmail?: string;
  phone?: string;
  tollFree?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  copyrightText?: string;

  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
  telegramUrl?: string;

  // Branding Assets
  logoLightUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appIconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  darkThemeBg?: string;
  customCss?: string;

  // Integrations & Analytics
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  posthogApiKey?: string;
  mixpanelToken?: string;
  hotjarSiteId?: string;
  customHeadScripts?: string;
  customBodyScripts?: string;
  webhookUrl?: string;

  // Disposable Email Protection
  disposableEmailBlock?: boolean;
  disposableBlockLevel?: string;
  blockedDomains?: string;
  allowedDomains?: string;
  disposableApiKey?: string;
  disposableProvider?: string;
  disposableAction?: string;
}
