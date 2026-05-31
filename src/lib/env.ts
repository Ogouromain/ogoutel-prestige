// ============================================
// OGOUTEL_Prestige - Centralized Environment Config
//
// Single source of truth for all environment variables.
// Supports multiple naming conventions (fallbacks) for
// maximum compatibility across deployment platforms.
// All values are automatically trimmed to prevent
// invisible characters (spaces, newlines) from breaking
// connections (common issue when pasting on Vercel).
//
// Usage:
//   import env from '@/lib/env';
//   const url = env.SUPABASE_URL;
// ============================================

/** Helper: safely read and trim an env var */
function envVar(name: string, fallback: string = ''): string {
  const val = process.env[name];
  return val ? val.trim() : fallback;
}

const env = {
  // ─── Supabase ────────────────────────────────────────────
  /** Supabase project URL (public) */
  get SUPABASE_URL(): string {
    return (
      envVar('NEXT_PUBLIC_SUPABASE_URL') ||
      envVar('SUPABASE_URL') ||
      ''
    );
  },

  /** Supabase anon/public key */
  get SUPABASE_ANON_KEY(): string {
    return (
      envVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      envVar('ANON_KEY') ||
      ''
    );
  },

  /** Supabase service role key (server only!) */
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return (
      envVar('SUPABASE_SERVICE_ROLE_KEY') ||
      envVar('SERVICE_ROLE_KEY') ||
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
      envVar('NEXT_PUBLIC_APP_NAME') ||
      envVar('APP_NAME') ||
      'OGOUTEL_Prestige'
    );
  },

  /** Application URL */
  get APP_URL(): string {
    return (
      envVar('NEXT_PUBLIC_APP_URL') ||
      envVar('APP_URL') ||
      'http://localhost:3000'
    );
  },

  /** Admin email for notifications */
  get ADMIN_EMAIL(): string {
    return (
      envVar('ADMIN_EMAIL') ||
      envVar('SUPER_ADMIN_EMAIL') ||
      'omouitsi@gmail.com'
    );
  },

  // ─── Email (Resend) ──────────────────────────────────────
  /** Resend API key */
  get RESEND_API_KEY(): string {
    return envVar('RESEND_API_KEY');
  },

  /** Sender email for Resend */
  get RESEND_FROM_EMAIL(): string {
    return (
      envVar('RESEND_FROM_EMAIL') ||
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
    return envVar('WHATSAPP_NUMBER', '2250576103277');
  },

  /** WhatsApp direct link */
  get WHATSAPP_LINK(): string {
    return (
      envVar('NEXT_PUBLIC_WHATSAPP_LINK') ||
      `https://wa.me/${env.WHATSAPP_NUMBER}`
    );
  },

  // ─── Subscription & Security ────────────────────────────
  /** Activation code expiration (days) */
  get CODE_ACTIVATION_EXPIRATION_DAYS(): number {
    return parseInt(
      envVar('CODE_ACTIVATION_EXPIRATION_DAYS', '30'),
      10
    );
  },

  /** Subscription suspension delay (days after expiry) */
  get ABONNEMENT_SUSPENSION_DELAY(): number {
    return parseInt(
      envVar('ABONNEMENT_SUSPENSION_DELAY', '7'),
      10
    );
  },

  // ─── Webhook ────────────────────────────────────────────
  get WEBHOOK_SECRET(): string {
    return envVar('WEBHOOK_SECRET');
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
