import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

const DEFAULT_SETTINGS = {
  id: 'default',
  // General Identity
  siteName: 'VidyaLoans',
  tagline: 'Overseas Education Financing & Study Abroad Loan Portal',
  metaTitle: 'VidyaLoans - Instant Education Loans for Overseas Studies',
  metaDescription: 'Compare and apply for top education loans with lowest interest rates, quick approval, and zero hidden charges.',
  supportEmail: 'support@vidyaloans.com',
  contactEmail: 'contact@vidyaloans.com',
  phone: '+91 1800-123-4567',
  tollFree: '1800-123-4567',
  address: 'VidyaLoans Financial Tower, Sector 44, Gurgaon, Haryana 122003, India',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  copyrightText: '© 2026 VidyaLoans Inc. All rights reserved.',

  // Social Media Links
  facebookUrl: 'https://facebook.com/vidyaloans',
  instagramUrl: 'https://instagram.com/vidyaloans',
  twitterUrl: 'https://x.com/vidyaloans',
  linkedinUrl: 'https://linkedin.com/company/vidyaloans',
  youtubeUrl: 'https://youtube.com/@vidyaloans',
  whatsappNumber: '+919876543210',
  telegramUrl: 'https://t.me/vidyaloans',

  // Branding Assets
  logoLightUrl: '/images/vidyaloans-logo-transparent.png',
  logoDarkUrl: '/images/vidyaloans-logo-transparent.png',
  faviconUrl: '/favicon.ico',
  appIconUrl: '/images/icon.png',
  primaryColor: '#6605c7',
  secondaryColor: '#4f46e5',
  darkThemeBg: '#0f172a',
  customCss: '/* Custom site overrides */\n:root {\n  --brand-primary: #6605c7;\n}',

  // Integrations & Analytics
  googleAnalyticsId: 'G-SB8FV1EK2S',
  googleTagManagerId: 'GTM-MD6CB6LJ',
  facebookPixelId: '987654321098765',
  posthogApiKey: 'phc_vidyaloans_live_key_998877',
  mixpanelToken: 'mp_token_vidyaloans_production',
  hotjarSiteId: '3456789',
  customHeadScripts: '<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':new Date().getTime(),event:\'gtm.js\'});})(window,document,\'script\',\'dataLayer\',\'GTM-MD6CB6LJ\');</script>',
  customBodyScripts: '<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MD6CB6LJ" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
  webhookUrl: 'https://api.vidyaloans.com/v1/webhooks/events',

  // AI Service Settings
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  aiModel: 'google/gemini-2.0-flash-001',
  aiTemperature: 0.7,
  groqApiKey: process.env.GROQ_API_KEY || '',

  // Disposable Email Protection
  disposableEmailBlock: true,
  disposableBlockLevel: 'strict', // strict, warning, audit_only
  blockedDomains: require('./disposable-domains.json').join(', '),
  allowedDomains: 'gmail.com, yahoo.com, outlook.com, hotmail.com, icloud.com, proton.me, protonmail.com, vidyaloans.com',
  disposableApiKey: '',
  disposableProvider: 'builtin', // builtin, kickbox, zerobounce, debounce, hunter
  disposableAction: 'reject', // reject, otp_verify, flag_review
};

// In-memory fallback in case Prisma model is pending migration
let memorySettingsStore: any = { ...DEFAULT_SETTINGS };

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    try {
      if ((this.prisma as any).siteSetting) {
        const settings = await (this.prisma as any).siteSetting.findUnique({
          where: { id: 'default' },
        });

        if (settings) {
          memorySettingsStore = { ...settings };
          return settings;
        }

        // If not found in DB, seed default entry
        const created = await (this.prisma as any).siteSetting.create({
          data: DEFAULT_SETTINGS,
        });
        memorySettingsStore = { ...created };
        return created;
      }
    } catch (e) {
      this.logger.warn(`Database query for siteSetting failed, using in-memory store fallback: ${e.message}`);
    }

    return memorySettingsStore;
  }

  async updateSettings(dto: UpdateSiteSettingsDto) {
    try {
      if ((this.prisma as any).siteSetting) {
        const updated = await (this.prisma as any).siteSetting.upsert({
          where: { id: 'default' },
          update: { ...dto },
          create: { ...DEFAULT_SETTINGS, ...dto },
        });
        memorySettingsStore = { ...updated };
        return updated;
      }
    } catch (e) {
      this.logger.warn(`Database update for siteSetting failed, falling back to memory store: ${e.message}`);
    }

    memorySettingsStore = {
      ...memorySettingsStore,
      ...dto,
      updatedAt: new Date(),
    };

    return memorySettingsStore;
  }

  async resetDefaults() {
    try {
      if ((this.prisma as any).siteSetting) {
        const reset = await (this.prisma as any).siteSetting.upsert({
          where: { id: 'default' },
          update: { ...DEFAULT_SETTINGS },
          create: { ...DEFAULT_SETTINGS },
        });
        memorySettingsStore = { ...reset };
        return reset;
      }
    } catch (e) {
      this.logger.warn(`Database reset failed, resetting memory store: ${e.message}`);
    }

    memorySettingsStore = { ...DEFAULT_SETTINGS, updatedAt: new Date() };
    return memorySettingsStore;
  }

  async checkDisposableEmail(email: string) {
    const settings = await this.getSettings();

    if (!email || !email.includes('@')) {
      return {
        isDisposable: false,
        domain: '',
        allowed: false,
        reason: 'Invalid email format',
        action: 'reject',
      };
    }

    const domain = email.split('@')[1].toLowerCase().trim();
    const blockedList = (settings.blockedDomains || '')
      .split(/[\n,]+/)
      .map((d: string) => d.trim().toLowerCase())
      .filter(Boolean);

    const allowedList = (settings.allowedDomains || '')
      .split(/[\n,]+/)
      .map((d: string) => d.trim().toLowerCase())
      .filter(Boolean);

    // 1. Check explicit whitelist
    if (allowedList.some((al: string) => domain === al || domain.endsWith('.' + al))) {
      return {
        email,
        domain,
        isDisposable: false,
        blocked: false,
        whitelisted: true,
        protectionEnabled: settings.disposableEmailBlock,
        blockLevel: settings.disposableBlockLevel,
        action: 'allow',
        reason: 'Domain is explicitly whitelisted',
      };
    }

    // 2. Check blacklist if protection is enabled
    const isBlocked = blockedList.some((bl: string) => domain === bl || domain.endsWith('.' + bl));

    if (isBlocked && settings.disposableEmailBlock) {
      return {
        email,
        domain,
        isDisposable: true,
        blocked: true,
        whitelisted: false,
        protectionEnabled: settings.disposableEmailBlock,
        blockLevel: settings.disposableBlockLevel,
        action: settings.disposableAction || 'reject',
        reason: `Domain '@${domain}' is registered as a disposable temporary email provider`,
      };
    }

    return {
      email,
      domain,
      isDisposable: false,
      blocked: false,
      whitelisted: false,
      protectionEnabled: settings.disposableEmailBlock,
      blockLevel: settings.disposableBlockLevel,
      action: 'allow',
      reason: 'Domain passed validation checks',
    };
  }
}
