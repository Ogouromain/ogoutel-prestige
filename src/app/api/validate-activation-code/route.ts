// ============================================
// OGOUTEL_Prestige - API: Validation code d'activation
// Fichier : app/api/validate-activation-code/route.ts
//
// POST /api/validate-activation-code (PUBLIC)
// - Reçoit un code d'activation
// - Vérifie dans Supabase :
//   * Code existe ?
//   * Code pas encore utilisé ?
//   * Code pas expiré ?
//   * Plan associé ?
// - Retourne: valid, plan_name, plan_id, hotel_name, expires_at
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_CODE } from '@/lib/rate-limit';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ValidateCodeBody {
  code: string;
}

interface ValidationResponse {
  valid: boolean;
  code?: string;
  plan_name?: string;
  plan_id?: string;
  hotel_name?: string;
  expires_at?: string;
  error?: string;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium',
};

// ─── Codes de démonstration (quand Supabase non configuré) ──────────────────

const DEMO_CODES: Record<string, { plan_id: string; plan_name: string; hotel_name: string }> = {
  'OGT-DEMO-HOT1': { plan_id: 'premium', plan_name: 'Premium', hotel_name: 'Hôtel Le Prestige' },
  'OGT-DEMO-HTP1': { plan_id: 'premium', plan_name: 'Premium', hotel_name: 'Hôtel Le Palmier' },
  'OGT-DEMO-STD1': { plan_id: 'standard', plan_name: 'Standard', hotel_name: 'Hôtel La Dignité' },
  'OGT-DEMO-BAS1': { plan_id: 'basique', plan_name: 'Basique', hotel_name: 'Hôtel Le Petit Prince' },
};

// ─── Shared rate limit key prefix (GET + POST share quota) ──────────────────

const RATE_LIMIT_KEY_PREFIX = 'validate-code:';

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateLimitKey = RATE_LIMIT_KEY_PREFIX + clientIp;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CODE);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ── 0. Vérifier Supabase ──
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // ── 0b. MODE DÉMO : codes de test quand Supabase non configuré ──
    if (!hasSupabase) {
      // En production, refuser les codes démo
      if (process.env.NODE_ENV === 'production') {
        const body: ValidateCodeBody = await request.json();
        const { code } = body;
        if (!code || typeof code !== 'string') {
          return NextResponse.json<ValidationResponse>({
            valid: false,
            error: 'Le code d\'activation est requis.',
          }, { status: 400 });
        }
        return NextResponse.json<ValidationResponse>({
          valid: false,
          error: 'Service de validation indisponible. Contactez le support.',
        }, { status: 503 });
      }

      const body: ValidateCodeBody = await request.json();
      const { code } = body;

      if (!code || typeof code !== 'string') {
        return NextResponse.json<ValidationResponse>({
          valid: false,
          error: 'Le code d\'activation est requis.',
        }, { status: 400 });
      }

      const normalizedCode = code.trim().toUpperCase();
      const demoCode = DEMO_CODES[normalizedCode];

      if (demoCode) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        return NextResponse.json<ValidationResponse>({
          valid: true,
          code: normalizedCode,
          plan_id: demoCode.plan_id,
          plan_name: demoCode.plan_name,
          hotel_name: demoCode.hotel_name,
          expires_at: expiresAt.toISOString(),
        });
      }

      // Code non reconnu en mode démo
      const codePattern = /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!codePattern.test(normalizedCode)) {
        return NextResponse.json<ValidationResponse>({
          valid: false,
          error: 'Format de code invalide. Le code doit être au format OGT-XXXX-XXXX.',
        }, { status: 400 });
      }

      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Code inconnu. Utilisez un code de démonstration.',
      });
    }

    // ── 1. Parser le body ──
    const body: ValidateCodeBody = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Le code d\'activation est requis.',
      }, { status: 400 });
    }

    // Normaliser le code (mettre en majuscules, trim)
    const normalizedCode = code.trim().toUpperCase();

    // Vérifier le format OGT-XXXX-XXXX
    const codePattern = /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Format de code invalide. Le code doit être au format OGT-XXXX-XXXX.',
      }, { status: 400 });
    }

    // ── 2. Rechercher le code dans Supabase ──
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Erreur de connexion au service de validation.',
      }, { status: 500 });
    }

    const { data: codeData, error: fetchError } = await supabase
      .from('codes_acces')
      .select('code, plan, date_expiration, est_utilise, utilise_par, demande_id, nom_hotel')
      .eq('code', normalizedCode)
      .maybeSingle();

    // ── 3. Vérifications ──

    // 3a. Code existe ?
    if (fetchError) {
      console.error('[validate-activation-code] Erreur Supabase:', fetchError);
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Erreur lors de la vérification du code. Veuillez réessayer.',
      }, { status: 500 });
    }

    if (!codeData) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Code d\'activation introuvable. Vérifiez que vous avez entré le bon code.',
      }, { status: 404 });
    }

    // 3b. Code pas encore utilisé ?
    if (codeData.est_utilise) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        code: normalizedCode,
        error: 'Ce code a déjà été utilisé. Chaque code d\'activation ne peut être utilisé qu\'une seule fois.',
      });
    }

    // 3c. Code pas expiré ?
    if (codeData.date_expiration && new Date(codeData.date_expiration) < new Date()) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        code: normalizedCode,
        error: 'Ce code d\'activation a expiré. Contactez le support pour obtenir un nouveau code.',
      });
    }

    // ── 4. Code valide ! ──
    const hotelName = codeData.nom_hotel ?? 'Hôtel non spécifié';
    const planId = codeData.plan;
    const planName = PLAN_LABELS[planId] ?? planId;

    return NextResponse.json<ValidationResponse>({
      valid: true,
      code: normalizedCode,
      plan_id: planId,
      plan_name: planName,
      hotel_name: hotelName,
      expires_at: codeData.date_expiration ?? undefined,
    });
  } catch (error) {
    console.error('[validate-activation-code] Erreur:', error);
    return NextResponse.json<ValidationResponse>({
      valid: false,
      error: 'Erreur interne du serveur. Veuillez réessayer.',
    }, { status: 500 });
  }
}

// ── GET endpoint for convenience (query param ?code=OGT-XXXX-XXXX) ──
// Uses same rate limit key prefix as POST to prevent double quota bypass

export async function GET(request: NextRequest) {
  try {
    // ── Rate Limiting (shared key with POST) ──
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(RATE_LIMIT_KEY_PREFIX + clientIp, RATE_LIMIT_CODE);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Paramètre "code" requis dans l\'URL.',
      }, { status: 400 });
    }

    // Validate format directly (no nested POST to avoid double rate limit)
    if (!code || typeof code !== 'string') {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Le code d\'activation est requis.',
      }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const codePattern = /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Format de code invalide. Le code doit être au format OGT-XXXX-XXXX.',
      }, { status: 400 });
    }

    // Check demo codes
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!hasSupabase) {
      // En production, refuser
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json<ValidationResponse>({
          valid: false,
          error: 'Service de validation indisponible. Contactez le support.',
        }, { status: 503 });
      }

      const demoCode = DEMO_CODES[normalizedCode];
      if (demoCode) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        return NextResponse.json<ValidationResponse>({
          valid: true,
          code: normalizedCode,
          plan_id: demoCode.plan_id,
          plan_name: demoCode.plan_name,
          hotel_name: demoCode.hotel_name,
          expires_at: expiresAt.toISOString(),
        });
      }
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Code inconnu. Utilisez un code de démonstration.',
      });
    }

    // Supabase lookup
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Erreur de connexion au service de validation.',
      }, { status: 500 });
    }

    const { data: codeData, error: fetchError } = await supabase
      .from('codes_acces')
      .select('code, plan, date_expiration, est_utilise, utilise_par, demande_id, nom_hotel')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (fetchError) {
      console.error('[validate-activation-code] Erreur Supabase:', fetchError);
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Erreur lors de la vérification du code. Veuillez réessayer.',
      }, { status: 500 });
    }

    if (!codeData) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Code d\'activation introuvable. Vérifiez que vous avez entré le bon code.',
      }, { status: 404 });
    }

    if (codeData.est_utilise) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        code: normalizedCode,
        error: 'Ce code a déjà été utilisé. Chaque code d\'activation ne peut être utilisé qu\'une seule fois.',
      });
    }

    if (codeData.date_expiration && new Date(codeData.date_expiration) < new Date()) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        code: normalizedCode,
        error: 'Ce code d\'activation a expiré. Contactez le support pour obtenir un nouveau code.',
      });
    }

    const hotelName = codeData.nom_hotel ?? 'Hôtel non spécifié';
    const planId = codeData.plan;
    const planName = PLAN_LABELS[planId] ?? planId;

    return NextResponse.json<ValidationResponse>({
      valid: true,
      code: normalizedCode,
      plan_id: planId,
      plan_name: planName,
      hotel_name: hotelName,
      expires_at: codeData.date_expiration ?? undefined,
    });
  } catch (error) {
    console.error('[validate-activation-code] Erreur GET:', error);
    return NextResponse.json<ValidationResponse>({
      valid: false,
      error: 'Erreur interne du serveur.',
    }, { status: 500 });
  }
}
