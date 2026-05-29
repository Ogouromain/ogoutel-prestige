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

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 0. Vérifier Supabase ──
    const hasSupabase = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!hasSupabase) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Service de validation temporairement indisponible.',
      }, { status: 503 });
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
      .select(`
        code,
        plan_choisi,
        date_expiration,
        actif,
        utilise_par,
        subscription_request_id,
        abonnement_demandes!inner(nom_hotel)
      `)
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
    if (codeData.utilise_par) {
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

    // 3d. Code actif ?
    if (codeData.actif === false) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        code: normalizedCode,
        error: 'Ce code a été désactivé. Contactez le support pour plus d\'informations.',
      });
    }

    // ── 4. Code valide ! ──
    const hotelName = codeData.abonnement_demandes?.nom_hotel ?? 'Hôtel non spécifié';
    const planId = codeData.plan_choisi;
    const planName = PLAN_LABELS[planId] ?? planId;

    return NextResponse.json<ValidationResponse>({
      valid: true,
      code: normalizedCode,
      plan_id: planId,
      plan_name: planName,
      hotel_name: hotelName,
      expires_at: codeData.date_expiration,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json<ValidationResponse>({
        valid: false,
        error: 'Paramètre "code" requis dans l\'URL.',
      }, { status: 400 });
    }

    // Re-use POST logic
    const mockRequest = new NextRequest('http://localhost:3000/api/validate-activation-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' },
    });

    return POST(mockRequest);
  } catch (error) {
    console.error('[validate-activation-code] Erreur GET:', error);
    return NextResponse.json<ValidationResponse>({
      valid: false,
      error: 'Erreur interne du serveur.',
    }, { status: 500 });
  }
}
