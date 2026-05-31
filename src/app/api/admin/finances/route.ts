// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Finances
// Fichier : app/api/admin/finances/route.ts
//
// GET  /api/admin/finances  - Financial overview
// POST /api/admin/finances  - Record expense
//
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 1).toISOString();
  return { start, end };
}

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_FACTURES_MOIS = [
  {
    id: 'fac-f-01', hotel_id: 'hotel-demo', reservation_id: 'res-01', client_id: 'cl-01',
    numero_facture: 'FAC-2025-000142', montant_ht: 60932, taux_tva: 18,
    montant_tva: 10968, montant_ttc: 71900, statut_paiement: 'paye',
    mode_paiement: 'especes', notes: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-02', hotel_id: 'hotel-demo', reservation_id: 'res-02', client_id: 'cl-02',
    numero_facture: 'FAC-2025-000143', montant_ht: 126610, taux_tva: 18,
    montant_tva: 22790, montant_ttc: 149400, statut_paiement: 'partiel',
    mode_paiement: 'mobile_money', notes: 'Solde à payer au checkout',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-03', hotel_id: 'hotel-demo', reservation_id: 'res-03', client_id: 'cl-05',
    numero_facture: 'FAC-2025-000144', montant_ht: 127119, taux_tva: 18,
    montant_tva: 22881, montant_ttc: 150000, statut_paiement: 'paye',
    mode_paiement: 'carte', notes: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-04', hotel_id: 'hotel-demo', reservation_id: 'res-05', client_id: 'cl-08',
    numero_facture: 'FAC-2025-000140', montant_ht: 402542, taux_tva: 18,
    montant_tva: 72458, montant_ttc: 475000, statut_paiement: 'paye',
    mode_paiement: 'virement', notes: 'VIP — paiement par virement bancaire',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-05', hotel_id: 'hotel-demo', reservation_id: 'res-11', client_id: 'cl-01',
    numero_facture: 'FAC-2025-000135', montant_ht: 127119, taux_tva: 18,
    montant_tva: 22881, montant_ttc: 150000, statut_paiement: 'paye',
    mode_paiement: 'especes', notes: null,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-06', hotel_id: 'hotel-demo', reservation_id: 'res-12', client_id: 'cl-03',
    numero_facture: 'FAC-2025-000136', montant_ht: 88983, taux_tva: 18,
    montant_tva: 16017, montant_ttc: 105000, statut_paiement: 'paye',
    mode_paiement: 'mobile_money', notes: null,
    created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-07', hotel_id: 'hotel-demo', reservation_id: 'res-13', client_id: 'cl-07',
    numero_facture: 'FAC-2025-000137', montant_ht: 50847, taux_tva: 18,
    montant_tva: 9153, montant_ttc: 60000, statut_paiement: 'paye',
    mode_paiement: 'especes', notes: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'fac-f-08', hotel_id: 'hotel-demo', reservation_id: 'res-04', client_id: 'cl-04',
    numero_facture: 'FAC-2025-000145', montant_ht: 27119, taux_tva: 18,
    montant_tva: 4881, montant_ttc: 32000, statut_paiement: 'en_attente',
    mode_paiement: null, notes: 'Facture à régler au départ',
    created_at: new Date().toISOString(),
  },
];

const DEMO_DEPENSES = [
  {
    id: 'dep-01', categorie: 'Fournitures', description: 'Produits d\'entretien et ménage',
    montant: 85000, date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: 'Linge de lit, savon, désinfectant',
  },
  {
    id: 'dep-02', categorie: 'Énergie', description: 'Facture d\'électricité CIE',
    montant: 275000, date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: 'Mois en cours',
  },
  {
    id: 'dep-03', categorie: 'Alimentation', description: 'Approvisionnement petit-déjeuner',
    montant: 120000, date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: 'Fruits, pain, confiture, café, thé',
  },
  {
    id: 'dep-04', categorie: 'Maintenance', description: 'Réparation climatisation chambre 204',
    montant: 45000, date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    notes: 'Remplacement compresseur unité 204',
  },
  {
    id: 'dep-05', categorie: 'Personnel', description: 'Salaires personnel du mois',
    montant: 650000, date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    notes: '4 membres du personnel',
  },
  {
    id: 'dep-06', categorie: 'Marketing', description: 'Publicité Facebook et Instagram',
    montant: 35000, date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    notes: 'Campagne promotionnelle été',
  },
];

function buildDemoFinances() {
  const revenus = {
    total: DEMO_FACTURES_MOIS.reduce((s, f) => s + (f.montant_ttc || 0), 0),
    liste: DEMO_FACTURES_MOIS,
  };

  const depenses = {
    total: DEMO_DEPENSES.reduce((s, d) => s + d.montant, 0),
    liste: DEMO_DEPENSES,
  };

  const par_mode = { especes: 0, mobile_money: 0, virement: 0, cheque: 0, carte: 0 };
  for (const f of DEMO_FACTURES_MOIS) {
    if (f.mode_paiement && f.mode_paiement in par_mode) {
      (par_mode as Record<string, number>)[f.mode_paiement] += f.montant_ttc;
    }
  }

  const par_type: Record<string, { count: number; revenue: number }> = {
    simple: { count: 2, revenue: 71900 + 32000 },
    double: { count: 3, revenue: 149400 + 60000 + 32000 },
    suite: { count: 1, revenue: 150000 },
    vip: { count: 2, revenue: 475000 + 200000 },
    familiale: { count: 1, revenue: 150000 },
  };

  return {
    revenus,
    depenses,
    benefice_net: revenus.total - depenses.total,
    taux_occupation: 67,
    moyenne_prix_nuit: 42500,
    total_factures: DEMO_FACTURES_MOIS.length,
    factures_impayees: DEMO_FACTURES_MOIS.filter(f => f.statut_paiement === 'en_attente' || f.statut_paiement === 'partiel').length,
    par_mode_paiement: par_mode,
    reservations_par_statut: {
      en_attente: 2,
      confirmee: 3,
      checkin: 5,
      checkout: 3,
      annulee: 2,
    },
    par_type_chambre: par_type,
  };
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode') || 'mois';
    const mois = parseInt(searchParams.get('mois') || String(new Date().getMonth() + 1));
    const annee = parseInt(searchParams.get('annee') || String(new Date().getFullYear()));

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      return NextResponse.json({ success: true, data: buildDemoFinances() });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Date range ──
    let startDate: string;
    let endDate: string;

    if (periode === 'annee') {
      startDate = new Date(annee, 0, 1).toISOString();
      endDate = new Date(annee + 1, 0, 1).toISOString();
    } else {
      const range = getMonthRange(annee, mois);
      startDate = range.start;
      endDate = range.end;
    }

    // ── Parallel queries ──
    const [
      facturesRes,
      chambresRes,
      depensesRes,
      allReservationsRes,
      chambresTypesRes,
    ] = await Promise.all([
      // Factures
      supabase
        .from('factures')
        .select('*')
        .eq('hotel_id', hotelId)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false }),

      // Chambres (for taux occupation)
      supabase
        .from('chambres')
        .select('id, statut, type, prix_nuit')
        .eq('hotel_id', hotelId),

      // Depenses (stored in activites_log as action='depense')
      supabase
        .from('activites_log')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('action', 'depense')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false }),

      // All reservations for status breakdown
      supabase
        .from('reservations')
        .select('statut')
        .eq('hotel_id', hotelId)
        .gte('created_at', startDate)
        .lt('created_at', endDate),

      // Chambres by type for revenue breakdown
      supabase
        .from('chambres')
        .select('id, type, prix_nuit')
        .eq('hotel_id', hotelId),
    ]);

    // ── Process factures ──
    const factures = facturesRes.data ?? [];
    const revenusTotal = factures.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0);

    const par_mode: Record<string, number> = {
      especes: 0, mobile_money: 0, virement: 0, cheque: 0, carte: 0,
    };
    for (const f of factures) {
      if (f.mode_paiement && f.mode_paiement in par_mode) {
        par_mode[f.mode_paiement] += Number(f.montant_ttc) || 0;
      }
    }

    const facturesImpayees = factures.filter(f => f.statut_paiement === 'en_attente' || f.statut_paiement === 'partiel').length;

    // ── Process depenses ──
    const depensesList = (depensesRes.data ?? []).map(d => ({
      id: d.id,
      categorie: (d.details as Record<string, unknown>)?.categorie ?? 'Autre',
      description: (d.details as Record<string, unknown>)?.description ?? 'Dépense enregistrée',
      montant: Number((d.details as Record<string, unknown>)?.montant) || 0,
      date: d.created_at.split('T')[0],
      notes: (d.details as Record<string, unknown>)?.notes ?? null,
    }));
    const depensesTotal = depensesList.reduce((s, d) => s + d.montant, 0);

    // ── Taux occupation ──
    const chambres = chambresRes.data ?? [];
    const totalChambres = chambres.length;
    const chambresOccupees = chambres.filter(c => c.statut === 'occupee').length;
    const taux_occupation = totalChambres > 0
      ? Math.round((chambresOccupees / totalChambres) * 100)
      : 0;

    // ── Moyenne prix nuit ──
    const moyenne_prix_nuit = chambres.length > 0
      ? Math.round(chambres.reduce((s, c) => s + Number(c.prix_nuit), 0) / chambres.length)
      : 0;

    // ── Reservations par statut ──
    const reservations = allReservationsRes.data ?? [];
    const reservations_par_statut: Record<string, number> = {
      en_attente: 0, confirmee: 0, checkin: 0, checkout: 0, annulee: 0,
    };
    for (const r of reservations) {
      if (r.statut in reservations_par_statut) {
        reservations_par_statut[r.statut]++;
      }
    }

    // ── Par type chambre (approximation from factures + chambre data) ──
    const par_type_chambre: Record<string, { count: number; revenue: number }> = {
      simple: { count: 0, revenue: 0 },
      double: { count: 0, revenue: 0 },
      suite: { count: 0, revenue: 0 },
      vip: { count: 0, revenue: 0 },
      familiale: { count: 0, revenue: 0 },
    };
    for (const c of (chambresTypesRes.data ?? [])) {
      if (c.type in par_type_chambre) {
        par_type_chambre[c.type].count++;
        par_type_chambre[c.type].revenue += Number(c.prix_nuit) || 0;
      }
    }

    const data = {
      revenus: { total: revenusTotal, liste: factures },
      depenses: { total: depensesTotal, liste: depensesList },
      benefice_net: revenusTotal - depensesTotal,
      taux_occupation,
      moyenne_prix_nuit,
      total_factures: factures.length,
      factures_impayees,
      par_mode_paiement: par_mode,
      reservations_par_statut,
      par_type_chambre,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/finances GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── POST Handler (Record expense) ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categorie, description, montant, date, notes } = body;

    if (!categorie || !description || !montant || !date) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : categorie, description, montant, date.' },
        { status: 400 }
      );
    }

    if (Number(montant) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant doit être supérieur à 0.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      const depense = {
        id: `dep-new-${Date.now()}`,
        categorie,
        description,
        montant: Number(montant),
        date,
        notes: notes ?? null,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: depense, message: 'Dépense enregistrée (démo).' });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Store in activites_log ──
    const { error } = await supabase
      .from('activites_log')
      .insert({
        hotel_id: hotelId,
        user_id: user.id,
        action: 'depense',
        details: {
          categorie,
          description,
          montant: Number(montant),
          date,
          notes: notes ?? null,
        },
      });

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de l'enregistrement : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Dépense enregistrée avec succès.' });
  } catch (error) {
    console.error('[admin/finances POST] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
