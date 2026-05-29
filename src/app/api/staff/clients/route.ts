// ============================================
// OGOUTEL_Prestige - API: Staff Clients
// GET  /api/staff/clients  - List/search clients
// POST /api/staff/clients  - Create client (for check-in flow)
// ============================================

import { NextResponse } from 'next/server';

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  {
    id: 'cl-01', nom: 'Koné', prenom: 'Ibrahim', telephone: '+2250711223344',
    email: 'ibrahim.kone@email.com', piece_identite_type: 'CNI',
    piece_identite_numero: 'CI-12345678', nationalite: 'Ivoirienne',
    ville_residence: 'Abidjan', notes: 'Client fidèle — préfère étage 1',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'cl-02', nom: 'Diallo', prenom: 'Aïcha', telephone: '+2250755667788',
    email: 'aicha.diallo@email.com', piece_identite_type: 'Passeport',
    piece_identite_numero: 'PS-98765432', nationalite: 'Ivoirienne',
    ville_residence: 'Bouaké', notes: null,
    created_at: '2025-02-10T08:00:00Z',
  },
  {
    id: 'cl-03', nom: 'Bamba', prenom: 'Moussa', telephone: '+2250799001122',
    email: 'moussa.bamba@email.com', piece_identite_type: 'CNI',
    piece_identite_numero: 'CI-55443322', nationalite: 'Malianne',
    ville_residence: 'Bamako', notes: 'Voyageur d\'affaires fréquent',
    created_at: '2025-03-05T08:00:00Z',
  },
  {
    id: 'cl-04', nom: 'Touré', prenom: 'Fatoumata', telephone: '+2250733445566',
    email: 'fatou.toure@email.com', piece_identite_type: 'Permis',
    piece_identite_numero: 'PM-11223344', nationalite: 'Ivoirienne',
    ville_residence: 'Abidjan', notes: null,
    created_at: '2025-03-20T08:00:00Z',
  },
  {
    id: 'cl-05', nom: 'Yao', prenom: 'Serge', telephone: '+2250777889900',
    email: 'serge.yao@email.com', piece_identite_type: 'CNI',
    piece_identite_numero: 'CI-99887766', nationalite: 'Ivoirienne',
    ville_residence: 'Yamoussoukro', notes: 'VIP — suite exécutive',
    created_at: '2025-04-01T08:00:00Z',
  },
  {
    id: 'cl-06', nom: 'Kouamé', prenom: 'Aminata', telephone: '+2250708090909',
    email: 'aminata.kouame@email.com', piece_identite_type: 'CNI',
    piece_identite_numero: 'CI-55667788', nationalite: 'Ivoirienne',
    ville_residence: 'Abidjan', notes: null,
    created_at: '2025-04-15T08:00:00Z',
  },
  {
    id: 'cl-07', nom: 'Ouattara', prenom: 'Drissa', telephone: '+2250712345678',
    email: 'drissa.ouattara@email.com', piece_identite_type: 'Passeport',
    piece_identite_numero: 'PS-44332211', nationalite: 'Burkinabè',
    ville_residence: 'Ouagadougou', notes: null,
    created_at: '2025-05-01T08:00:00Z',
  },
  {
    id: 'cl-08', nom: 'Coulibaly', prenom: 'Mariam', telephone: '+2250765432109',
    email: 'mariam.coulibaly@email.com', piece_identite_type: 'CNI',
    piece_identite_numero: 'CI-33221100', nationalite: 'Ivoirienne',
    ville_residence: 'San-Pédro', notes: null,
    created_at: '2025-05-10T08:00:00Z',
  },
];

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function dateDaysLater(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

const DEMO_RESERVATIONS_BY_CLIENT: Record<string, Array<{
  id: string; date_arrivee: string; date_depart: string; nombre_nuits: number;
  montant_total: number; statut: string; chambre: { numero: string; type: string };
}>> = {
  'cl-01': [
    { id: 'res-11', date_arrivee: dateDaysAgo(10), date_depart: dateDaysAgo(7), nombre_nuits: 3, montant_total: 150000, statut: 'checkout', chambre: { numero: '304', type: 'familiale' } },
    { id: 'res-01', date_arrivee: dateDaysAgo(4), date_depart: dateDaysAgo(0), nombre_nuits: 4, montant_total: 72000, statut: 'checkin', chambre: { numero: '102', type: 'simple' } },
  ],
  'cl-02': [
    { id: 'res-02', date_arrivee: dateDaysAgo(2), date_depart: dateDaysLater(3), nombre_nuits: 5, montant_total: 150000, statut: 'checkin', chambre: { numero: '103', type: 'double' } },
  ],
  'cl-05': [
    { id: 'res-03', date_arrivee: dateDaysAgo(1), date_depart: dateDaysLater(4), nombre_nuits: 5, montant_total: 300000, statut: 'checkin', chambre: { numero: '202', type: 'suite' } },
  ],
  'cl-08': [
    { id: 'res-05', date_arrivee: dateDaysAgo(3), date_depart: dateDaysLater(2), nombre_nuits: 5, montant_total: 475000, statut: 'checkin', chambre: { numero: '303', type: 'vip' } },
  ],
};

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const clientId = searchParams.get('client_id') || undefined;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      // Demo mode
      let filtered = [...DEMO_CLIENTS];
      if (search) {
        filtered = filtered.filter(
          (c) =>
            c.nom.toLowerCase().includes(search) ||
            c.prenom.toLowerCase().includes(search) ||
            c.telephone.includes(search) ||
            (c.piece_identite_numero || '').toLowerCase().includes(search)
        );
      }

      if (clientId) {
        filtered = filtered.filter((c) => c.id === clientId);
      }

      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit).map((c) => ({
        ...c,
        sejours: DEMO_RESERVATIONS_BY_CLIENT[c.id] || [],
      }));

      return NextResponse.json({
        success: true,
        data: { clients: paged, total, page, totalPages },
      });
    }

    // ── Auth ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('hotel_id').eq('id', user.id).single();
    if (!profile?.hotel_id) return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });

    // ── Build query ──
    let query = supabase
      .from('clients')
      .select('*, reservations:reservations!client_id(id, date_arrivee, date_depart, nombre_nuits, montant_total, statut, chambre:chambres!chambre_id(numero, type))', { count: 'exact' })
      .eq('hotel_id', profile.hotel_id)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('id', clientId);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
    const { data: clients, count } = await query;

    // Client-side search filter
    let filtered = clients ?? [];
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.nom.toLowerCase().includes(search) ||
          (c.prenom || '').toLowerCase().includes(search) ||
          (c.telephone || '').includes(search) ||
          (c.piece_identite_numero || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: { clients: filtered, total: count ?? filtered.length, page, totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)) },
    });
  } catch (error) {
    console.error('[staff/clients GET] Erreur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// ─── POST Handler — Create Client ────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, telephone, email, piece_identite_type, piece_identite_numero, nationalite } = body;

    if (!nom || !prenom || !telephone || !piece_identite_numero || !nationalite) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : nom, prenom, telephone, piece_identite_numero, nationalite.' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const newClient = {
        id: `cl-new-${Date.now()}`,
        hotel_id: 'hotel-demo',
        nom,
        prenom,
        telephone,
        email: email || null,
        piece_identite_type: piece_identite_type || null,
        piece_identite_numero,
        nationalite,
        ville_residence: null,
        notes: null,
        sejours: [],
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: newClient, message: 'Client créé (démo).' });
    }

    // ── Auth ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('hotel_id').eq('id', user.id).single();
    if (!profile?.hotel_id) return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });

    // Check if client already exists with same ID number
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('hotel_id', profile.hotel_id)
      .eq('piece_identite_numero', piece_identite_numero)
      .single();

    if (existing) {
      const { data: fullClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', existing.id)
        .single();
      return NextResponse.json({ success: true, data: fullClient, message: 'Client existant retrouvé.' });
    }

    // ── Insert ──
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        hotel_id: profile.hotel_id,
        nom,
        prenom,
        telephone,
        email: email || null,
        piece_identite_type: piece_identite_type || null,
        piece_identite_numero,
        nationalite,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `Erreur : ${error.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: client, message: 'Client créé avec succès.' });
  } catch (error) {
    console.error('[staff/clients POST] Erreur:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
