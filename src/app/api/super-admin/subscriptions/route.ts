// ============================================
// OGOUTEL_Prestige - API: Super Admin Subscriptions
// Fichier : app/api/super-admin/subscriptions/route.ts
//
// GET  /api/super-admin/subscriptions — Paginated subscription requests
// PUT  /api/super-admin/subscriptions — Update subscription status
// POST /api/super-admin/subscriptions — Generate activation code for a paid subscription
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';
import { sanitizeSearchParam } from '@/lib/sanitize-search';
import env from '@/lib/env';

// ─── Allowed status transitions ──────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  en_attente: ['contacte'],
  contacte: ['paye', 'en_attente'],
  paye: ['active', 'en_attente'],
  active: ['en_attente'],
};

// ─── Code generator (OGT-XXXX-XXXX) ──────────────────────────────────────────

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (): string =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OGT-${segment()}-${segment()}`;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_DEMANDES = [
  {
    id: 'demo-d1',
    nom_complet: 'Koné Ibrahim',
    email: 'ibrahim.kone@email.com',
    telephone: '+2250711223344',
    nom_hotel: 'Hôtel Le Baobab',
    ville: 'Abidjan',
    quartier: 'Cocody',
    nombre_chambres: 15,
    plan_choisi: 'standard',
    message: 'Intéressé par votre solution de gestion hôtelière.',
    statut: 'en_attente',
    notes_admin: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'demo-d2',
    nom_complet: 'Diallo Aïcha',
    email: 'aicha.diallo@email.com',
    telephone: '+2250755667788',
    nom_hotel: 'Résidence Palm Beach',
    ville: 'San-Pédro',
    quartier: 'Vridi',
    nombre_chambres: 28,
    plan_choisi: 'premium',
    message: 'Nous avons besoin d\'une solution complète pour notre établissement de 28 chambres.',
    statut: 'en_attente',
    notes_admin: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-d3',
    nom_complet: 'Bamba Moussa',
    email: 'moussa.bamba@email.com',
    telephone: '+2250799001122',
    nom_hotel: 'Hôtel Étoile du Nord',
    ville: 'Bouaké',
    quartier: 'Centre-Ville',
    nombre_chambres: 12,
    plan_choisi: 'basique',
    message: 'Petite structure, plan basique devrait suffire.',
    statut: 'contacte',
    notes_admin: 'Appelé le 15/01 — très intéressé, envisage upgrade Standard',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-d4',
    nom_complet: 'Touré Fatoumata',
    email: 'fatou.toure@email.com',
    telephone: '+2250733445566',
    nom_hotel: 'Auberge du Lagon',
    ville: 'Daloa',
    quartier: 'Quartier Commerce',
    nombre_chambres: 10,
    plan_choisi: 'standard',
    message: 'Recherche solution avec gestion des réservations et facturation.',
    statut: 'paye',
    notes_admin: 'Paiement reçu via Mobile Money. Code envoyé.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-d5',
    nom_complet: 'Yao Serge',
    email: 'serge.yao@email.com',
    telephone: '+2250777889900',
    nom_hotel: 'Hôtel Le Cocotier',
    ville: 'Yamoussoukro',
    quartier: 'Quartier Résidentiel',
    nombre_chambres: 20,
    plan_choisi: 'premium',
    message: 'Besoin de la gestion multi-établissements.',
    statut: 'active',
    notes_admin: 'Complètement activé. Hôtel en production.',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'demo-d6',
    nom_complet: 'Koffi Ama',
    email: 'ama.koffi@email.com',
    telephone: '+2250700112233',
    nom_hotel: 'Hôtel L\'Étoile d\'Or',
    ville: 'Abengourou',
    quartier: 'Centre-Ville',
    nombre_chambres: 6,
    plan_choisi: 'basique',
    message: 'Début d\'activité, besoin d\'un outil simple.',
    statut: 'en_attente',
    notes_admin: null,
    created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
  {
    id: 'demo-d7',
    nom_complet: 'Coulibaly Drissa',
    email: 'drissa.coulibaly@email.com',
    telephone: '+2250755660011',
    nom_hotel: 'Hôtel Le Morne',
    ville: 'Divo',
    quartier: 'Zone Portuaire',
    nombre_chambres: 14,
    plan_choisi: 'standard',
    message: 'Actuellement sur Excel, besoin de digitaliser.',
    statut: 'en_attente',
    notes_admin: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const statut = searchParams.get('statut') ?? '';
    const plan = searchParams.get('plan') ?? '';
    const search = searchParams.get('search') ?? '';
    const dateFrom = searchParams.get('date_from') ?? '';
    const dateTo = searchParams.get('date_to') ?? '';

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    if (!supabase) {
      // Return demo data when Supabase is not configured
      let filtered = [...DEMO_DEMANDES];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.nom_complet.toLowerCase().includes(s) ||
            d.email.toLowerCase().includes(s) ||
            d.nom_hotel.toLowerCase().includes(s)
        );
      }
      if (statut && ['en_attente', 'contacte', 'paye', 'active'].includes(statut)) {
        filtered = filtered.filter((d) => d.statut === statut);
      }
      if (plan && ['basique', 'standard', 'premium'].includes(plan)) {
        filtered = filtered.filter((d) => d.plan_choisi === plan);
      }
      if (dateFrom) {
        filtered = filtered.filter((d) => d.created_at >= dateFrom);
      }
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setDate(toEnd.getDate() + 1);
        filtered = filtered.filter((d) => d.created_at < toEnd.toISOString());
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const demandes = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: { demandes, total, page, totalPages },
      });
    }

    // Build query
    let query = supabase
      .from('abonnement_demandes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (statut && ['en_attente', 'contacte', 'paye', 'active'].includes(statut)) {
      query = query.eq('statut', statut);
    }
    if (plan && ['basique', 'standard', 'premium'].includes(plan)) {
      query = query.eq('plan_choisi', plan);
    }
    if (search) {
      const safeSearch = sanitizeSearchParam(search);
      query = query.or(`nom_complet.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,nom_hotel.ilike.%${safeSearch}%`);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, count } = await query;
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: { demandes: data ?? [], total, page, totalPages },
    });
  } catch (error) {
    console.error('[super-admin/subscriptions GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── PUT Handler: Update subscription status ──────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { demandeId, statut, notes_admin } = body;

    if (!demandeId || !statut) {
      return NextResponse.json(
        { success: false, error: 'demandeId et statut sont obligatoires.' },
        { status: 400 }
      );
    }

    if (!['en_attente', 'contacte', 'paye', 'active'].includes(statut)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide. Valeurs : en_attente, contacte, paye, active.' },
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

    // Check current status for transition validation
    const { data: current, error: fetchError } = await supabase
      .from('abonnement_demandes')
      .select('statut')
      .eq('id', demandeId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, error: 'Demande introuvable.' },
        { status: 404 }
      );
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[current.statut] ?? [];
    if (!allowed.includes(statut)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transition non autorisée : ${current.statut} → ${statut}. Transitions permises : ${allowed.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Perform update
    const updateData: Record<string, unknown> = {
      statut,
      updated_at: new Date().toISOString(),
    };
    if (notes_admin !== undefined) {
      updateData.notes_admin = notes_admin;
    }

    const { error } = await supabase
      .from('abonnement_demandes')
      .update(updateData)
      .eq('id', demandeId);

    if (error) {
      console.error('[super-admin/subscriptions PUT] Erreur update:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du statut.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Statut mis à jour : ${current.statut} → ${statut}.`,
    });
  } catch (error) {
    console.error('[super-admin/subscriptions PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── POST Handler: Generate activation code for a subscription ────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request, ['super_admin']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { demandeId, email_destinataire } = body;

    if (!demandeId) {
      return NextResponse.json(
        { success: false, error: 'demandeId est obligatoire.' },
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

    // Fetch the subscription request
    const { data: demande, error: fetchError } = await supabase
      .from('abonnement_demandes')
      .select('*')
      .eq('id', demandeId)
      .single();

    if (fetchError || !demande) {
      return NextResponse.json(
        { success: false, error: 'Demande d\'abonnement introuvable.' },
        { status: 404 }
      );
    }

    if (!['contacte', 'paye'].includes(demande.statut)) {
      return NextResponse.json(
        { success: false, error: 'La demande doit être au statut "contacte" ou "paye" pour générer un code.' },
        { status: 400 }
      );
    }

    // Generate activation code
    const code = generateActivationCode();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Insert code into codes_acces
    const { error: insertError } = await supabase.from('codes_acces').insert({
      code,
      plan: demande.plan_choisi,
      demande_id: demandeId,
      email_destinataire: email_destinataire || demande.email,
      nom_hotel: demande.nom_hotel,
      est_utilise: false,
      date_expiration: expirationDate.toISOString(),
    });

    if (insertError) {
      console.error('[super-admin/subscriptions POST] Erreur insertion code:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'enregistrement du code d\'activation.' },
        { status: 500 }
      );
    }

    // Update demande statut to 'paye'
    await supabase
      .from('abonnement_demandes')
      .update({
        statut: 'paye',
        notes_admin: (demande.notes_admin ? demande.notes_admin + '\n' : '') + `Code généré: ${code}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', demandeId);

    // Send email via Resend if configured
    const hasResend = !!env.RESEND_API_KEY;
    if (hasResend && (email_destinataire || demande.email)) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'OGOUTEL_Prestige <onboarding@resend.dev>',
          to: email_destinataire || demande.email,
          subject: `🎉 Votre code d'activation OGOUTEL_Prestige — ${demande.nom_hotel}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1B4332;">Félicitations ${demande.nom_complet.split(' ')[0]} !</h1>
              <p>Votre hôtel <strong>${demande.nom_hotel}</strong> a été approuvé.</p>
              <div style="background: #0A0A0A; color: #D4AF37; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; border: 2px solid #D4AF37;">
                <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 2px;">VOTRE CODE D'ACTIVATION</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 4px;">${code}</p>
              </div>
              <p>Plan : <strong>${demande.plan_choisi}</strong></p>
              <p>Expire le : <strong>${expirationDate.toLocaleDateString('fr-FR')}</strong></p>
              <a href="${env.APP_URL}/register?code=${code}"
                 style="display: inline-block; padding: 14px 32px; background: #D4AF37; color: #0A0A0A; text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 16px;">
                Créer mon compte
              </a>
            </div>
          `,
        });
        console.log(`[super-admin/subscriptions POST] Email envoyé à ${email_destinataire || demande.email}`);
      } catch (emailErr) {
        console.error('[super-admin/subscriptions POST] Erreur envoi email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Code d\'activation généré avec succès !',
      data: {
        code,
        plan: demande.plan_choisi,
        email_destinataire: email_destinataire || demande.email,
        nom_hotel: demande.nom_hotel,
        date_expiration: expirationDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('[super-admin/subscriptions POST] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
