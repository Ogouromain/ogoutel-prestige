// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Reservations
// Fichier : app/api/admin/reservations/route.ts
//
// GET  /api/admin/reservations           - Paginated list with relations
// POST /api/admin/reservations           - Create reservation
// PUT  /api/admin/reservations           - Update reservation (status or details)
//
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function dateDaysLater(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  { id: 'cl-01', nom: 'Koné', prenom: 'Ibrahim', telephone: '+2250711223344', email: 'ibrahim.kone@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-02', nom: 'Diallo', prenom: 'Aïcha', telephone: '+2250755667788', email: 'aicha.diallo@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-03', nom: 'Bamba', prenom: 'Moussa', telephone: '+2250799001122', email: 'moussa.bamba@email.com', nationalite: 'Malianne' },
  { id: 'cl-04', nom: 'Touré', prenom: 'Fatoumata', telephone: '+2250733445566', email: 'fatou.toure@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-05', nom: 'Yao', prenom: 'Serge', telephone: '+2250777889900', email: 'serge.yao@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-06', nom: 'Kouamé', prenom: 'Aminata', telephone: '+2250708090909', email: 'aminata.kouame@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-07', nom: 'Ouattara', prenom: 'Drissa', telephone: '+2250712345678', email: 'drissa.ouattara@email.com', nationalite: 'Burkinabè' },
  { id: 'cl-08', nom: 'Coulibaly', prenom: 'Mariam', telephone: '+2250765432109', email: 'mariam.coulibaly@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-09', nom: 'N\'Guessan', prenom: 'Jean-Louis', telephone: '+2250701122334', email: 'jl.nguessan@email.com', nationalite: 'Ivoirienne' },
  { id: 'cl-10', nom: 'Traoré', prenom: 'Adama', telephone: '+2250744556677', email: 'adama.traore@email.com', nationalite: 'Malienne' },
];

const DEMO_CHAMBRES = [
  { id: 'ch-01', numero: '101', type: 'simple', prix_nuit: 15000, statut: 'disponible' },
  { id: 'ch-02', numero: '102', type: 'simple', prix_nuit: 18000, statut: 'occupee' },
  { id: 'ch-03', numero: '103', type: 'double', prix_nuit: 30000, statut: 'occupee' },
  { id: 'ch-04', numero: '104', type: 'double', prix_nuit: 35000, statut: 'disponible' },
  { id: 'ch-05', numero: '201', type: 'suite', prix_nuit: 55000, statut: 'reservee' },
  { id: 'ch-06', numero: '202', type: 'suite', prix_nuit: 60000, statut: 'occupee' },
  { id: 'ch-07', numero: '203', type: 'vip', prix_nuit: 85000, statut: 'disponible' },
  { id: 'ch-08', numero: '204', type: 'familiale', prix_nuit: 45000, statut: 'maintenance' },
  { id: 'ch-09', numero: '301', type: 'double', prix_nuit: 32000, statut: 'occupee' },
  { id: 'ch-10', numero: '302', type: 'simple', prix_nuit: 20000, statut: 'reservee' },
  { id: 'ch-11', numero: '303', type: 'vip', prix_nuit: 95000, statut: 'occupee' },
  { id: 'ch-12', numero: '304', type: 'familiale', prix_nuit: 50000, statut: 'disponible' },
];

function makeDemoFactures(reservationId: string, montant: number) {
  return [
    {
      id: `fac-${reservationId}`,
      hotel_id: 'hotel-demo',
      reservation_id: reservationId,
      client_id: null,
      numero_facture: `FAC-2025-${String(Math.floor(Math.random() * 9999)).padStart(6, '0')}`,
      montant_ht: Math.round(montant / 1.18),
      taux_tva: 18,
      montant_tva: Math.round(montant - montant / 1.18),
      montant_ttc: montant,
      statut_paiement: 'paye' as const,
      mode_paiement: 'especes' as const,
      notes: null,
      created_at: new Date().toISOString(),
    },
  ];
}

const DEMO_RESERVATIONS = [
  {
    id: 'res-01', hotel_id: 'hotel-demo', chambre_id: 'ch-02', client_id: 'cl-01',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(4), date_depart: dateDaysAgo(0),
    nombre_nuits: 4, prix_nuit: 18000, montant_total: 72000, montant_paye: 72000,
    statut: 'checkin',
    notes: 'Client fidèle — préférence étage 1',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    client: DEMO_CLIENTS[0], chambre: DEMO_CHAMBRES[1], factures: makeDemoFactures('res-01', 72000),
  },
  {
    id: 'res-02', hotel_id: 'hotel-demo', chambre_id: 'ch-03', client_id: 'cl-02',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(2), date_depart: dateDaysLater(3),
    nombre_nuits: 5, prix_nuit: 30000, montant_total: 150000, montant_paye: 75000,
    statut: 'checkin',
    notes: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    client: DEMO_CLIENTS[1], chambre: DEMO_CHAMBRES[2], factures: makeDemoFactures('res-02', 75000),
  },
  {
    id: 'res-03', hotel_id: 'hotel-demo', chambre_id: 'ch-06', client_id: 'cl-05',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(1), date_depart: dateDaysLater(4),
    nombre_nuits: 5, prix_nuit: 60000, montant_total: 300000, montant_paye: 150000,
    statut: 'checkin',
    notes: 'Suite exécutive demandée par le client',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    client: DEMO_CLIENTS[4], chambre: DEMO_CHAMBRES[5], factures: makeDemoFactures('res-03', 150000),
  },
  {
    id: 'res-04', hotel_id: 'hotel-demo', chambre_id: 'ch-09', client_id: 'cl-04',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(2), date_depart: dateDaysAgo(0),
    nombre_nuits: 2, prix_nuit: 32000, montant_total: 64000, montant_paye: 32000,
    statut: 'checkin',
    notes: 'Facture à compléter au départ',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    client: DEMO_CLIENTS[3], chambre: DEMO_CHAMBRES[8], factures: makeDemoFactures('res-04', 32000),
  },
  {
    id: 'res-05', hotel_id: 'hotel-demo', chambre_id: 'ch-11', client_id: 'cl-08',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(3), date_depart: dateDaysLater(2),
    nombre_nuits: 5, prix_nuit: 95000, montant_total: 475000, montant_paye: 475000,
    statut: 'checkin',
    notes: 'VIP — jacuzzi et concierge dédié',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    client: DEMO_CLIENTS[7], chambre: DEMO_CHAMBRES[10], factures: makeDemoFactures('res-05', 475000),
  },
  {
    id: 'res-06', hotel_id: 'hotel-demo', chambre_id: 'ch-01', client_id: 'cl-06',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(0), date_depart: dateDaysLater(3),
    nombre_nuits: 3, prix_nuit: 15000, montant_total: 45000, montant_paye: 45000,
    statut: 'confirmee',
    notes: 'Arrivée prévue en début d\'après-midi',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    client: DEMO_CLIENTS[5], chambre: DEMO_CHAMBRES[0], factures: makeDemoFactures('res-06', 45000),
  },
  {
    id: 'res-07', hotel_id: 'hotel-demo', chambre_id: 'ch-04', client_id: 'cl-07',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(0), date_depart: dateDaysLater(2),
    nombre_nuits: 2, prix_nuit: 35000, montant_total: 70000, montant_paye: 35000,
    statut: 'confirmee',
    notes: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    client: DEMO_CLIENTS[6], chambre: DEMO_CHAMBRES[3], factures: makeDemoFactures('res-07', 35000),
  },
  {
    id: 'res-08', hotel_id: 'hotel-demo', chambre_id: 'ch-07', client_id: 'cl-03',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(0), date_depart: dateDaysLater(5),
    nombre_nuits: 5, prix_nuit: 85000, montant_total: 425000, montant_paye: 200000,
    statut: 'confirmee',
    notes: 'Client VIP — préparer fruits de bienvenue',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    client: DEMO_CLIENTS[2], chambre: DEMO_CHAMBRES[6], factures: makeDemoFactures('res-08', 200000),
  },
  {
    id: 'res-09', hotel_id: 'hotel-demo', chambre_id: 'ch-05', client_id: 'cl-09',
    receptionniste_id: null,
    date_arrivee: dateDaysLater(1), date_depart: dateDaysLater(4),
    nombre_nuits: 3, prix_nuit: 55000, montant_total: 165000, montant_paye: 0,
    statut: 'en_attente',
    notes: 'En attente de confirmation par le client',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    client: DEMO_CLIENTS[8], chambre: DEMO_CHAMBRES[4], factures: [],
  },
  {
    id: 'res-10', hotel_id: 'hotel-demo', chambre_id: 'ch-10', client_id: 'cl-10',
    receptionniste_id: null,
    date_arrivee: dateDaysLater(2), date_depart: dateDaysLater(5),
    nombre_nuits: 3, prix_nuit: 20000, montant_total: 60000, montant_paye: 0,
    statut: 'en_attente',
    notes: 'Demande via le site web',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    client: DEMO_CLIENTS[9], chambre: DEMO_CHAMBRES[9], factures: [],
  },
  {
    id: 'res-11', hotel_id: 'hotel-demo', chambre_id: 'ch-12', client_id: 'cl-01',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(10), date_depart: dateDaysAgo(7),
    nombre_nuits: 3, prix_nuit: 50000, montant_total: 150000, montant_paye: 150000,
    statut: 'checkout',
    notes: null,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    client: DEMO_CLIENTS[0], chambre: DEMO_CHAMBRES[11], factures: makeDemoFactures('res-11', 150000),
  },
  {
    id: 'res-12', hotel_id: 'hotel-demo', chambre_id: 'ch-04', client_id: 'cl-03',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(15), date_depart: dateDaysAgo(12),
    nombre_nuits: 3, prix_nuit: 35000, montant_total: 105000, montant_paye: 105000,
    statut: 'checkout',
    notes: 'Séjour agréable',
    created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    client: DEMO_CLIENTS[2], chambre: DEMO_CHAMBRES[3], factures: makeDemoFactures('res-12', 105000),
  },
  {
    id: 'res-13', hotel_id: 'hotel-demo', chambre_id: 'ch-03', client_id: 'cl-07',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(8), date_depart: dateDaysAgo(6),
    nombre_nuits: 2, prix_nuit: 30000, montant_total: 60000, montant_paye: 60000,
    statut: 'checkout',
    notes: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    client: DEMO_CLIENTS[6], chambre: DEMO_CHAMBRES[2], factures: makeDemoFactures('res-13', 60000),
  },
  {
    id: 'res-14', hotel_id: 'hotel-demo', chambre_id: 'ch-01', client_id: 'cl-04',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(5), date_depart: dateDaysAgo(3),
    nombre_nuits: 2, prix_nuit: 15000, montant_total: 30000, montant_paye: 0,
    statut: 'annulee',
    notes: 'Annulation par le client — raisons personnelles',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    client: DEMO_CLIENTS[3], chambre: DEMO_CHAMBRES[0], factures: [],
  },
  {
    id: 'res-15', hotel_id: 'hotel-demo', chambre_id: 'ch-05', client_id: 'cl-05',
    receptionniste_id: null,
    date_arrivee: dateDaysAgo(12), date_depart: dateDaysAgo(9),
    nombre_nuits: 3, prix_nuit: 55000, montant_total: 165000, montant_paye: 0,
    statut: 'annulee',
    notes: 'Non présenté — no-show',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    client: DEMO_CLIENTS[4], chambre: DEMO_CHAMBRES[4], factures: [],
  },
];

// ─── Allowed status transitions ──────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['checkin', 'annulee'],
  checkin: ['checkout', 'annulee'],
  checkout: [],
  annulee: [],
};

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statut = searchParams.get('statut') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;
    const search = searchParams.get('search')?.toLowerCase() || undefined;

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      // Demo filtering
      let filtered = [...DEMO_RESERVATIONS];
      if (statut) filtered = filtered.filter(r => r.statut === statut);
      if (dateFrom) filtered = filtered.filter(r => r.date_arrivee >= dateFrom);
      if (dateTo) filtered = filtered.filter(r => r.date_depart <= dateTo);
      if (search) filtered = filtered.filter(r =>
        (r.client.prenom + ' ' + r.client.nom).toLowerCase().includes(search) ||
        r.client.nom.toLowerCase().includes(search) ||
        r.client.prenom.toLowerCase().includes(search)
      );

      // Sort by date descending
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: { reservations: paged, total, page, totalPages },
      });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Build query ──
    let query = supabase
      .from('reservations')
      .select('*, client:clients(id, nom, prenom, telephone, email, nationalite), chambre:chambres(id, numero, type, prix_nuit, statut), factures:factures(*)', { count: 'exact' })
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (statut) query = query.eq('statut', statut);
    if (dateFrom) query = query.gte('date_arrivee', dateFrom);
    if (dateTo) query = query.lte('date_depart', dateTo);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: reservations, count } = await query;

    // ── Client-side search (post-filter) ──
    let filtered = reservations ?? [];
    if (search) {
      filtered = filtered.filter(r => {
        const client = r.client as { nom: string; prenom: string } | null;
        if (!client) return false;
        return (
          (client.prenom + ' ' + client.nom).toLowerCase().includes(search) ||
          client.nom.toLowerCase().includes(search) ||
          client.prenom.toLowerCase().includes(search)
        );
      });
    }

    const total = count ?? filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: { reservations: filtered, total, page, totalPages },
    });
  } catch (error) {
    console.error('[admin/reservations GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── POST Handler ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, chambre_id, date_arrivee, date_depart, prix_nuit, montant_paye, mode_paiement, notes } = body;

    if (!client_id || !chambre_id || !date_arrivee || !date_depart) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : client_id, chambre_id, date_arrivee, date_depart.' },
        { status: 400 }
      );
    }

    if (new Date(date_depart) <= new Date(date_arrivee)) {
      return NextResponse.json(
        { success: false, error: 'La date de départ doit être postérieure à la date d\'arrivée.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      const nights = Math.ceil((new Date(date_depart).getTime() - new Date(date_arrivee).getTime()) / 86400000);
      const unitPrice = prix_nuit || 30000;
      const total = nights * unitPrice;
      const payed = montant_paye || 0;

      const newRes = {
        id: `res-new-${Date.now()}`,
        hotel_id: 'hotel-demo',
        chambre_id, client_id,
        receptionniste_id: null,
        date_arrivee, date_depart,
        nombre_nuits: nights,
        prix_nuit: unitPrice,
        montant_total: total,
        montant_paye: payed,
        statut: 'en_attente',
        notes: notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: DEMO_CLIENTS.find(c => c.id === client_id) ?? DEMO_CLIENTS[0],
        chambre: DEMO_CHAMBRES.find(c => c.id === chambre_id) ?? DEMO_CHAMBRES[0],
        factures: payed > 0 ? makeDemoFactures(`res-new-${Date.now()}`, payed) : [],
      };

      return NextResponse.json({ success: true, data: newRes, message: 'Réservation créée (démo).' });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Get chambre price if not provided ──
    let unitPrice = prix_nuit ? Number(prix_nuit) : null;
    if (!unitPrice) {
      const { data: chambre } = await supabase
        .from('chambres')
        .select('prix_nuit')
        .eq('id', chambre_id)
        .single();
      unitPrice = chambre ? Number(chambre.prix_nuit) : 0;
    }

    // ── Insert reservation ──
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        chambre_id,
        client_id,
        receptionniste_id: user.id,
        date_arrivee,
        date_depart,
        prix_nuit: unitPrice,
        montant_paye: montant_paye ? Number(montant_paye) : 0,
        statut: 'en_attente',
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la création : ${error.message}` },
        { status: 400 }
      );
    }

    // ── Optionally create facture if montant_paye > 0 ──
    if (montant_paye && Number(montant_paye) > 0) {
      const totalCalc = (new Date(date_depart).getTime() - new Date(date_arrivee).getTime()) / 86400000 * unitPrice;
      await supabase.from('factures').insert({
        hotel_id: hotelId,
        reservation_id: reservation.id,
        client_id,
        montant_ht: Math.round(totalCalc / 1.18),
        taux_tva: 18,
        statut_paiement: totalCalc <= Number(montant_paye) ? 'paye' : 'partiel',
        mode_paiement: mode_paiement ?? null,
      });
    }

    return NextResponse.json({ success: true, data: reservation, message: 'Réservation créée avec succès.' });
  } catch (error) {
    console.error('[admin/reservations POST] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── PUT Handler ─────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { reservationId, statut, date_arrivee, date_depart, chambre_id, notes, montant_paye } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'reservationId requis.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient, createAdminClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    if (!client) {
      const res = DEMO_RESERVATIONS.find(r => r.id === reservationId);
      if (!res) {
        return NextResponse.json({ success: false, error: 'Réservation non trouvée (démo).' }, { status: 404 });
      }

      // Status transition
      if (statut) {
        const currentStatut = res.statut;
        const allowed = ALLOWED_TRANSITIONS[currentStatut] ?? [];
        if (!allowed.includes(statut)) {
          return NextResponse.json(
            { success: false, error: `Transition invalide : ${currentStatut} → ${statut}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}` },
            { status: 400 }
          );
        }
        res.statut = statut;
      }

      if (date_arrivee) res.date_arrivee = date_arrivee;
      if (date_depart) res.date_depart = date_depart;
      if (notes !== undefined) res.notes = notes;
      if (montant_paye !== undefined) res.montant_paye = montant_paye;

      // Recalculate
      if (date_arrivee || date_depart) {
        const nights = Math.ceil((new Date(res.date_depart).getTime() - new Date(res.date_arrivee).getTime()) / 86400000);
        res.nombre_nuits = nights;
        res.montant_total = (res.prix_nuit ?? 0) * nights;
      }

      res.updated_at = new Date().toISOString();

      return NextResponse.json({ success: true, data: res, message: 'Réservation mise à jour (démo).' });
    }

    // ── Auth check ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;
    const hotelId = profile.hotel_id;

    const supabase = await createAdminClient();

    // ── Status update logic ──
    if (statut) {
      // Validate transition
      const { data: currentRes } = await supabase
        .from('reservations')
        .select('statut, chambre_id')
        .eq('id', reservationId)
        .single();

      if (!currentRes) {
        return NextResponse.json({ success: false, error: 'Réservation non trouvée.' }, { status: 404 });
      }

      const allowed = ALLOWED_TRANSITIONS[currentRes.statut] ?? [];
      if (!allowed.includes(statut)) {
        return NextResponse.json(
          { success: false, error: `Transition invalide : ${currentRes.statut} → ${statut}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}` },
          { status: 400 }
        );
      }

      // Update reservation status
      const { data: updated, error } = await supabase
        .from('reservations')
        .update({ statut })
        .eq('id', reservationId)
        .eq('hotel_id', hotelId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      // Side effects on chambre statut
      if (statut === 'checkin' && currentRes.chambre_id) {
        await supabase.from('chambres').update({ statut: 'occupee' }).eq('id', currentRes.chambre_id);
      }
      if (statut === 'checkout' && currentRes.chambre_id) {
        await supabase.from('chambres').update({ statut: 'disponible' }).eq('id', currentRes.chambre_id);
      }

      return NextResponse.json({ success: true, data: updated, message: 'Statut de réservation mis à jour.' });
    }

    // ── General update logic ──
    const updates: Record<string, unknown> = {};
    if (date_arrivee) updates.date_arrivee = date_arrivee;
    if (date_depart) updates.date_depart = date_depart;
    if (notes !== undefined) updates.notes = notes;
    if (montant_paye !== undefined) updates.montant_paye = Number(montant_paye);
    if (chambre_id) updates.chambre_id = chambre_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun champ à mettre à jour.' },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', reservationId)
      .eq('hotel_id', hotelId)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { success: false, error: error?.message ?? 'Réservation non trouvée.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated, message: 'Réservation mise à jour avec succès.' });
  } catch (error) {
    console.error('[admin/reservations PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
