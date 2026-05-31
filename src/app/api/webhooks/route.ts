// ============================================
// OGOUTEL_Prestige - API: Webhook général
// Fichier : app/api/webhooks/route.ts
//
// POST /api/webhooks
// - Webhook général pour futures intégrations
// - Supporte les webhooks: payment, email, notification, custom
// - Vérifie la signature si webhook secret est configuré
// - Log les événements dans la table activites_log (si Supabase)
// - Retourne acknowledgment immédiat
//
// Intégrations futures supportées :
//   - CinetPay / Mobile Money (paiements)
//   - Resend (événements email)
//   - Custom (notifications push, SMS, etc.)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import env from '@/lib/env';

// ─── Types ──────────────────────────────────────────────────────────────────

type WebhookType = 'payment' | 'email' | 'notification' | 'custom';

interface WebhookPayload {
  type?: WebhookType;
  event?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  id?: string;
  [key: string]: unknown;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const SUPPORTED_WEBHOOK_TYPES: WebhookType[] = ['payment', 'email', 'notification', 'custom'];

const APP_NAME = 'OGOUTEL_Prestige';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Vérifie la signature HMAC-SHA256 du webhook (si secret configuré)
 */
async function verifySignature(payload: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    // In production, reject unverified webhooks
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true; // Allow in development without secret
  }
  if (!signature) return false;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(WEBHOOK_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const data = encoder.encode(payload);
    const sig = await crypto.subtle.sign('HMAC', key, data);
    const expectedSignature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

/**
 * Extrait les informations essentielles du payload pour le log
 */
function extractLogInfo(payload: WebhookPayload): {
  description: string;
  metadata: Record<string, unknown>;
} {
  const { type, event, data, id } = payload;

  const description = `[${type ?? 'unknown'}] ${event ?? 'no-event'}${id ? ` (${id})` : ''}`;

  const metadata: Record<string, unknown> = {
    webhook_type: type,
    webhook_event: event,
    webhook_id: id,
  };

  if (data) {
    // Extraire les champs pertinents selon le type
    if (type === 'payment' && data) {
      metadata.payment_amount = data.amount;
      metadata.payment_status = data.status;
      metadata.payment_reference = data.reference;
    } else if (type === 'email' && data) {
      metadata.email_to = data.to;
      metadata.email_status = data.status;
      metadata.email_id = data.email_id;
    }

    // Ne pas logger plus de 10 champs pour éviter les payloads trop gros
    const keys = Object.keys(data).slice(0, 10);
    keys.forEach((k) => {
      metadata[`data_${k}`] = data[k];
    });
  }

  return { description, metadata };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Lire le payload brut (pour vérification signature) ──
    const rawBody = await request.text();
    let payload: WebhookPayload;

    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload JSON invalide.' },
        { status: 400 }
      );
    }

    // ── 2. Vérifier la signature si configurée ──
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-webhook-signature') ?? request.headers.get('x-signature');
      if (!await verifySignature(rawBody, signature)) {
        console.warn('[webhooks] Signature invalide — rejeté');
        return NextResponse.json(
          { success: false, error: 'Signature de webhook invalide.' },
          { status: 401 }
        );
      }
    }

    // ── 3. Valider le type de webhook ──
    const { type, event } = payload;
    if (type && !SUPPORTED_WEBHOOK_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Type de webhook non supporté: "${type}". Types supportés: ${SUPPORTED_WEBHOOK_TYPES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // ── 4. Logger l'événement ──
    console.log(`[webhooks] ${APP_NAME} webhook received:`, {
      type: type ?? 'unknown',
      event: event ?? 'unknown',
      id: payload.id ?? 'no-id',
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });

    // ── 5. Enregistrer dans activites_log (si Supabase) ──
    const hasSupabase = !!(
      env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (hasSupabase) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        if (adminSupabase) {
          const { description, metadata } = extractLogInfo(payload);

          await adminSupabase.from('activites_log').insert({
            type_action: `webhook_${type ?? 'unknown'}`,
            description,
            metadata,
            ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
          });
        }
      } catch (logErr) {
        console.error('[webhooks] Erreur log Supabase:', logErr);
        // Non bloquant
      }
    }

    // ── 6. Traitement spécifique par type (placeholder pour futures intégrations) ──

    switch (type) {
      case 'payment':
        // Futur: traiter les notifications de paiement (CinetPay, etc.)
        console.log('[webhooks] Payment event:', event, payload.data);
        break;

      case 'email':
        // Futur: traiter les événements email (Resend, etc.)
        console.log('[webhooks] Email event:', event, payload.data);
        break;

      case 'notification':
        // Futur: traiter les notifications push / SMS
        console.log('[webhooks] Notification event:', event, payload.data);
        break;

      case 'custom':
      default:
        console.log('[webhooks] Custom event:', event, payload.data);
        break;
    }

    // ── 7. Acknowledgment immédiat ──
    return NextResponse.json({
      success: true,
      message: 'Webhook reçu et traité avec succès.',
      received: {
        type: type ?? 'unknown',
        event: event ?? 'unknown',
        id: payload.id ?? null,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[webhooks] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ── OPTIONS pour CORS (préflight) ──
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-signature, x-signature',
      'Access-Control-Max-Age': '86400',
    },
  });
}
