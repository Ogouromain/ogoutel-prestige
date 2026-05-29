// ============================================
// OGOUTEL_Prestige - Configuration Email (Resend)
// Centralisation de l'envoi d'emails transactionnels
// ───────────────────────────────────────────────
// Module serveur uniquement ('use server' compatible)
// Utilise l'import dynamique de Resend pour éviter
// un crash si le package n'est pas configuré.
//
// Variables d'environnement requises :
//   RESEND_API_KEY      — Clé API Resend
//   RESEND_FROM_EMAIL   — Expéditeur par défaut (optionnel)
//   ADMIN_EMAIL         — Email de l'administrateur (optionnel)
// ============================================

import type { Resend as ResendClient } from 'resend';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Email de l'expéditeur par défaut (nom applicatif + adresse Resend) */
export const APP_EMAIL: string =
  process.env.RESEND_FROM_EMAIL ?? 'OGOUTEL_Prestige <onboarding@resend.dev>';

/** Email de l'administrateur principal */
export const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL ?? 'omouitsi@gmail.com';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Options communes pour l'envoi d'un email */
export interface EmailOptions {
  /** Adresse email du destinataire */
  to: string;
  /** Objet de l'email */
  subject: string;
  /** Contenu HTML du corps de l'email */
  html: string;
  /** Adresse de réponse optionnelle */
  replyTo?: string;
}

/** Résultat d'un envoi d'email */
export interface EmailResult {
  /** Indique si l'email a été envoyé avec succès */
  success: boolean;
  /** Identifiant de l'email renvoyé par Resend (si succès) */
  emailId?: string;
  /** Message d'erreur éventuel */
  error?: string;
}

// ─── Client Resend ─────────────────────────────────────────────────────────

/** Cache du client Resend pour éviter de recréer l'instance */
let cachedClient: ResendClient | null | undefined = undefined;

/**
 * Retourne une instance du client Resend ou null si non configuré.
 *
 * Patterns utilisés :
 *  - Import dynamique du SDK (évite le crash si Resend absent)
 *  - Cache de l'instance entre les appels
 *  - Log en mode développement
 *
 * @example
 * ```ts
 * const resend = await getResendClient();
 * if (!resend) return;
 * await resend.emails.send({ from: APP_EMAIL, to: '…', subject: '…', html: '…' });
 * ```
 */
export async function getResendClient(): Promise<ResendClient | null> {
  // Retourner le client en cache si déjà résolu
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[resend] RESEND_API_KEY non configuré — les emails seront désactivés.'
      );
    }
    cachedClient = null;
    return null;
  }

  try {
    const { Resend } = await import('resend');
    cachedClient = new Resend(apiKey);

    if (process.env.NODE_ENV === 'development') {
      console.log('[resend] Client Resend initialisé avec succès.');
    }

    return cachedClient;
  } catch (erreur) {
    console.error('[resend] Erreur lors de l\'import du SDK Resend :', erreur);
    cachedClient = null;
    return null;
  }
}

// ─── Fonctions d'envoi ─────────────────────────────────────────────────────

/**
 * Envoie un email à l'administrateur.
 *
 * Destinataire : `ADMIN_EMAIL` (ou `omouitsi@gmail.com` par défaut)
 * Expéditeur   : `APP_EMAIL`
 *
 * @param options - Options de l'email (to est ignoré, ADMIN_EMAIL est utilisé)
 * @returns Résultat de l'envoi (succès ou erreur silencieuse)
 *
 * @example
 * ```ts
 * const résultat = await envoyerEmailAdmin({
 *   subject: 'Nouvelle réservation',
 *   html: '<h1>Réservation #123</h1>',
 * });
 * ```
 */
export async function envoyerEmailAdmin(options: Omit<EmailOptions, 'to'>): Promise<EmailResult> {
  const resend = await getResendClient();

  if (!resend) {
    console.log('[resend] Envoi admin ignoré — client non configuré.');
    return { success: false, error: 'Resend non configuré.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: APP_EMAIL,
      to: ADMIN_EMAIL,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('[resend] Erreur envoi email admin :', error);
      return { success: false, error: error.message };
    }

    console.log(`[resend] Email admin envoyé → ${ADMIN_EMAIL} (id: ${data?.id ?? 'inconnu'})`);
    return { success: true, emailId: data?.id };
  } catch (erreur: unknown) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
    console.error('[resend] Erreur imprévue envoi email admin :', erreur);
    return { success: false, error: message };
  }
}

/**
 * Envoie un email à un client / destinataire arbitraire.
 *
 * Destinataire : celui renseigné dans `options.to`
 * Expéditeur   : `APP_EMAIL`
 *
 * @param options - Options de l'email (to est obligatoire)
 * @returns Résultat de l'envoi (succès ou erreur silencieuse)
 *
 * @example
 * ```ts
 * const résultat = await envoyerEmailClient({
 *   to: 'client@example.com',
 *   subject: 'Confirmation de réservation',
 *   html: '<h1>Merci !</h1>',
 * });
 * ```
 */
export async function envoyerEmailClient(options: EmailOptions): Promise<EmailResult> {
  if (!options.to) {
    console.warn('[resend] Envoi client ignoré — destinataire manquant.');
    return { success: false, error: 'Destinataire manquant.' };
  }

  const resend = await getResendClient();

  if (!resend) {
    console.log(`[resend] Envoi client ignoré vers ${options.to} — client non configuré.`);
    return { success: false, error: 'Resend non configuré.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: APP_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error(`[resend] Erreur envoi email client → ${options.to} :`, error);
      return { success: false, error: error.message };
    }

    console.log(`[resend] Email client envoyé → ${options.to} (id: ${data?.id ?? 'inconnu'})`);
    return { success: true, emailId: data?.id };
  } catch (erreur: unknown) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
    console.error(`[resend] Erreur imprévue envoi email client → ${options.to} :`, erreur);
    return { success: false, error: message };
  }
}
