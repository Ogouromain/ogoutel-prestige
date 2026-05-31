// ============================================
// OGOUTEL_Prestige - API: Super Admin Activation Codes
// Fichier : app/api/super-admin/codes/route.ts
//
// GET    /api/super-admin/codes — Paginated activation codes
// POST   /api/super-admin/codes — Generate new activation code
// DELETE /api/super-admin/codes — Revoke a code
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';
import env from '@/lib/env';

// ─── Code generator (OGT-XXXX-XXXX) ──────────────────────────────────────────
// Uses non-ambiguous characters (no O/0, I/1, L)

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (): string =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OGT-${segment()}-${segment()}`;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_CODES = [
  {
    id: 'demo-c1',
    code: 'OGT-K7NF-3PXW',
    plan: 'standard',
    demande_id: 'demo-d4',
    email_destinataire: 'fatou.toure@email.com',
    nom_hotel: 'Auberge du Lagon',
    est_utilise: false,
    utilise_par: null,
    date_expiration: new Date(Date.now() + 86400000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    used_at: null,
    demande: { nom_complet: 'Touré Fatoumata', nom_hotel: 'Auberge du Lagon' },
  },
  {
    id: 'demo-c2',
    code: 'OGT-8HJM-QR2E',
    plan: 'premium',
    demande_id: 'demo-d5',
    email_destinataire: 'serge.yao@email.com',
    nom_hotel: 'Hôtel Le Cocotier',
    est_utilise: true,
    utilise_par: 'user-5',
    date_expiration: new Date(Date.now() + 86400000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    used_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    demande: { nom_complet: 'Yao Serge', nom_hotel: 'Hôtel Le Cocotier' },
  },
  {
    id: 'demo-c3',
    code: 'OGT-B3KS-7VNM',
    plan: 'basique',
    demande_id: null,
    email_destinataire: 'ama.koffi@email.com',
    nom_hotel: 'Hôtel L\'Étoile d\'Or',
    est_utilise: false,
    utilise_par: null,
    date_expiration: new Date(Date.now() + 86400000 * 25).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    used_at: null,
    demande: null,
  },
  {
    id: 'demo-c4',
    code: 'OGT-6PFT-4YH9',
    plan: 'standard',
    demande_id: 'demo-h6',
    email_destinataire: 'dramane.ouattara@email.com',
    nom_hotel: 'Hôtel Le Baobab',
    est_utilise: true,
    utilise_par: 'user-6',
    date_expiration: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
    used_at: new Date(Date.now() - 86400000 * 34).toISOString(),
    demande: { nom_complet: 'Ouattara Dramane', nom_hotel: 'Hôtel Le Baobab' },
  },
  {
    id: 'demo-c5',
    code: 'OGT-R2NJ-8CXP',
    plan: 'premium',
    demande_id: 'demo-d2',
    email_destinataire: 'aicha.diallo@email.com',
    nom_hotel: 'Résidence Palm Beach',
    est_utilise: false,
    utilise_par: null,
    date_expiration: new Date(Date.now() + 86400000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    used_at: null,
    demande: { nom_complet: 'Diallo Aïcha', nom_hotel: 'Résidence Palm Beach' },
  },
  {
    id: 'demo-c6',
    code: 'OGT-5TFK-9WL2',
    plan: 'basique',
    demande_id: null,
    email_destinataire: 'test@example.com',
    nom_hotel: 'Hôtel Test',
    est_utilise: false,
    utilise_par: null,
    date_expiration: new Date(Date.now() - 86400000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    used_at: null,
    demande: null,
  },
];

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Auth verification (defense-in-depth) ──
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const statut = searchParams.get('statut') ?? '';
    const search = searchParams.get('search') ?? '';

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Return demo data when Supabase is not configured
      let filtered = [...DEMO_CODES];

      if (search) {
        const s = search.toUpperCase();
        filtered = filtered.filter(
          (c) =>
            c.code.includes(s) ||
            c.email_destinataire.toLowerCase().includes(search.toLowerCase()) ||
            c.nom_hotel.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (statut === 'utilise') {
        filtered = filtered.filter((c) => c.est_utilise);
      } else if (statut === 'non_utilise') {
        filtered = filtered.filter((c) => !c.est_utilise);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const codes = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: { codes, total, page, totalPages },
      });
    }

    // Build query with join to abonnement_demandes for context
    let query = supabase
      .from('codes_acces')
      .select('*, abonnement_demandes!codes_acces_demande_id_fkey(nom_complet, nom_hotel)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (statut === 'utilise') {
      query = query.eq('est_utilise', true);
    } else if (statut === 'non_utilise') {
      query = query.eq('est_utilise', false);
    }
    if (search) {
      const s = search.toUpperCase();
      query = query.or(`code.ilike.%${s}%,email_destinataire.ilike.%${search.toLowerCase()}%,nom_hotel.ilike.%${search.toLowerCase()}%`);
    }

    const { data, count } = await query;
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Rename demande relation for clarity
    const codes = (data ?? []).map((c) => ({
      ...c,
      demande: c.abonnement_demandes ?? null,
      abonnement_demandes: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { codes, total, page, totalPages },
    });
  } catch (error) {
    console.error('[super-admin/codes GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── POST Handler: Generate new activation code ───────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth verification (defense-in-depth) ──
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { demande_id, plan, email_destinataire, nom_hotel } = body;

    if (!plan || !email_destinataire || !nom_hotel) {
      return NextResponse.json(
        { success: false, error: 'plan, email_destinataire et nom_hotel sont obligatoires.' },
        { status: 400 }
      );
    }

    if (!['basique', 'standard', 'premium'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide. Choisissez : basique, standard ou premium.' },
        { status: 400 }
      );
    }

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Demo response when Supabase is not configured
      const code = generateActivationCode();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      return NextResponse.json({
        success: true,
        message: 'Code d\'activation généré (mode démo).',
        data: {
          code: {
            id: `demo-${Date.now()}`,
            code,
            plan,
            demande_id: demande_id ?? null,
            email_destinataire,
            nom_hotel,
            est_utilise: false,
            utilise_par: null,
            date_expiration: expirationDate.toISOString(),
            created_at: new Date().toISOString(),
            used_at: null,
          },
        },
      });
    }

    // Generate code
    const code = generateActivationCode();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Insert code
    const { data: insertedCode, error: insertError } = await supabase
      .from('codes_acces')
      .insert({
        code,
        plan,
        demande_id: demande_id ?? null,
        email_destinataire,
        nom_hotel,
        est_utilise: false,
        date_expiration: expirationDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[super-admin/codes POST] Erreur insertion:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'enregistrement du code d\'activation.' },
        { status: 500 }
      );
    }

    // Send email via Resend if configured
    const hasResend = !!env.RESEND_API_KEY;
    if (hasResend) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
          to: email_destinataire,
          subject: `🎉 Votre code d'activation OGOUTEL_Prestige — ${nom_hotel}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1B4332;">Félicitations !</h1>
              <p>Votre hôtel <strong>${nom_hotel}</strong> a été approuvé sur OGOUTEL_Prestige.</p>
              <div style="background: #0A0A0A; color: #D4AF37; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; border: 2px solid #D4AF37;">
                <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 2px;">VOTRE CODE D'ACTIVATION</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 4px;">${code}</p>
              </div>
              <p>Plan : <strong>${plan}</strong></p>
              <p>Expire le : <strong>${expirationDate.toLocaleDateString('fr-FR')}</strong></p>
              <a href="${env.APP_URL}/register?code=${code}"
                 style="display: inline-block; padding: 14px 32px; background: #D4AF37; color: #0A0A0A; text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 16px;">
                Créer mon compte
              </a>
            </div>
          `,
        });
        console.log(`[super-admin/codes POST] Email envoyé à ${email_destinataire}`);
      } catch (emailErr) {
        console.error('[super-admin/codes POST] Erreur envoi email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Code d\'activation généré avec succès !',
      data: { code: insertedCode },
    });
  } catch (error) {
    console.error('[super-admin/codes POST] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── DELETE Handler: Revoke a code ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    // ── Auth verification (defense-in-depth) ──
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { codeId } = body;

    if (!codeId) {
      return NextResponse.json(
        { success: false, error: 'codeId est obligatoire.' },
        { status: 400 }
      );
    }

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase n\'est pas configuré.' },
        { status: 503 }
      );
    }

    // Check if code is already used
    const { data: existingCode, error: fetchError } = await supabase
      .from('codes_acces')
      .select('id, est_utilise')
      .eq('id', codeId)
      .single();

    if (fetchError || !existingCode) {
      return NextResponse.json(
        { success: false, error: 'Code d\'activation introuvable.' },
        { status: 404 }
      );
    }

    if (existingCode.est_utilise) {
      return NextResponse.json(
        { success: false, error: 'Impossible de révoquer un code déjà utilisé.' },
        { status: 400 }
      );
    }

    // Delete the code
    const { error } = await supabase
      .from('codes_acces')
      .delete()
      .eq('id', codeId);

    if (error) {
      console.error('[super-admin/codes DELETE] Erreur suppression:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la révocation du code.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code d\'activation révoqué avec succès.',
    });
  } catch (error) {
    console.error('[super-admin/codes DELETE] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
