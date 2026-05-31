// ============================================
// OGOUTEL_Prestige - Centralized Environment Config
//
// Single source of truth for all environment variables.
// Supports multiple naming conventions (fallbacks) for
// maximum compatibility across deployment platforms.
//
// Usage:
//   import { env } from '@/lib/env';
//   const url = env.SUPABASE_URL;
// ============================================

const env = {
  // ─── Supabase ────────────────────────────────────────────
  /** Supabase project URL (public) */
  get SUPABASE_URL(): string {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
    );
  },

  /** Supabase anon/public key */
  get SUPABASE_ANON_KEY(): string {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.ANON_KEY ||
      ''
    );
  },

  /** Supabase service role key (server only!) */
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      ''
    );
  },

  /** Whether Supabase is fully configured */
  get SUPABASE_CONFIGURED(): boolean {
    return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
  },

  /** Whether Supabase admin (service role) is configured */
  get SUPABASE_ADMIN_CONFIGURED(): boolean {
    return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  },

  // ─── Application ─────────────────────────────────────────
  /** Application name (public) */
  get APP_NAME(): string {
    return (
      process.env.NEXT_PUBLIC_APP_NAME ||
      process.env.APP_NAME ||
      'OGOUTEL_Prestige'
    );
  },

  /** Application URL */
  get APP_URL(): string {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'
    );
  },

  /** Admin email for notifications */
  get ADMIN_EMAIL(): string {
    return (
      process.env.ADMIN_EMAIL ||
      process.env.SUPER_ADMIN_EMAIL ||
      'omouitsi@gmail.com'
    );
  },

  // ─── Email (Resend) ──────────────────────────────────────
  /** Resend API key */
  get RESEND_API_KEY(): string {
    return process.env.RESEND_API_KEY || '';
  },

  /** Sender email for Resend */
  get RESEND_FROM_EMAIL(): string {
    return (
      process.env.RESEND_FROM_EMAIL ||
      'OGOUTEL_Prestige <onboarding@resend.dev>'
    );
  },

  /** Whether Resend is configured */
  get RESEND_CONFIGURED(): boolean {
    return !!env.RESEND_API_KEY;
  },

  // ─── WhatsApp ───────────────────────────────────────────
  /** WhatsApp number (international, no +) */
  get WHATSAPP_NUMBER(): string {
    return process.env.WHATSAPP_NUMBER || '2250576103277';
  },

  /** WhatsApp direct link */
  get WHATSAPP_LINK(): string {
    return (
      process.env.NEXT_PUBLIC_WHATSAPP_LINK ||
      `https://wa.me/${env.WHATSAPP_NUMBER}`
    );
  },

  // ─── Subscription & Security ────────────────────────────
  /** Activation code expiration (days) */
  get CODE_ACTIVATION_EXPIRATION_DAYS(): number {
    return parseInt(
      process.env.CODE_ACTIVATION_EXPIRATION_DAYS || '30',
      10
    );
  },

  /** Subscription suspension delay (days after expiry) */
  get ABONNEMENT_SUSPENSION_DELAY(): number {
    return parseInt(
      process.env.ABONNEMENT_SUSPENSION_DELAY || '7',
      10
    );
  },

  // ─── Webhook ────────────────────────────────────────────
  get WEBHOOK_SECRET(): string {
    return process.env.WEBHOOK_SECRET || '';
  },

  // ─── Environment ────────────────────────────────────────
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },

  get isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return env.NODE_ENV === 'production';
  },
} as const;

export default env;
