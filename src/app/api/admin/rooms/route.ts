// ============================================
// OGOUTEL_Prestige - API: Hotel Admin Rooms
// Fichier : app/api/admin/rooms/route.ts
//
// GET    /api/admin/rooms    - Paginated rooms list
// POST   /api/admin/rooms    - Create room
// PUT    /api/admin/rooms    - Update room
// DELETE /api/admin/rooms    - Delete room
//
// - Uses Supabase server client (respects RLS hotel_id)
// - Falls back to rich demo data if Supabase unconfigured
// ============================================

import { NextResponse } from 'next/server';
import { PLANS_ABONNEMENT } from '@/lib/constants';

// ─── Demo data ────────────────────────────────────────────────────────────

const DEMO_CHAMBRES = [
  {
    id: 'ch-01', hotel_id: 'hotel-demo', numero: '101', type: 'simple',
    prix_nuit: 15000, statut: 'disponible', etage: 1,
    description: 'Chambre simple calme avec vue sur le jardin tropical.',
    equipements: ['Climatisation', 'TV Écran plat', 'Wi-Fi gratuit', 'Minibar'],
    photo_url: '/hotel/room-standard.png',
    created_at: '2025-01-15T08:00:00Z', updated_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'ch-02', hotel_id: 'hotel-demo', numero: '102', type: 'simple',
    prix_nuit: 18000, statut: 'occupee', etage: 1,
    description: 'Chambre simple rénovée avec salle de bain moderne.',
    equipements: ['Climatisation', 'TV Écran plat', 'Wi-Fi gratuit', 'Coffre-fort'],
    photo_url: '/hotel/room-standard.png',
    created_at: '2025-01-15T08:00:00Z', updated_at: '2025-06-10T14:30:00Z',
  },
  {
    id: 'ch-03', hotel_id: 'hotel-demo', numero: '103', type: 'double',
    prix_nuit: 30000, statut: 'occupee', etage: 1,
    description: 'Chambre double spacieuse avec lit king size.',
    equipements: ['Climatisation', 'TV 55"', 'Wi-Fi gratuit', 'Minibar', 'Coffre-fort', 'Bureau'],
    photo_url: '/hotel/room-deluxe.png',
    created_at: '2025-01-15T08:00:00Z', updated_at: '2025-06-12T09:00:00Z',
  },
  {
    id: 'ch-04', hotel_id: 'hotel-demo', numero: '104', type: 'double',
    prix_nuit: 35000, statut: 'disponible', etage: 1,
    description: 'Chambre double avec balcon et vue piscine.',
    equipements: ['Climatisation', 'TV 55"', 'Wi-Fi gratuit', 'Minibar', 'Terrasse', 'Machine à café'],
    photo_url: '/hotel/room-deluxe.png',
    created_at: '2025-01-15T08:00:00Z', updated_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'ch-05', hotel_id: 'hotel-demo', numero: '201', type: 'suite',
    prix_nuit: 55000, statut: 'reservee', etage: 2,
    description: 'Suite junior avec salon séparé et coin bureau.',
    equipements: ['Climatisation', 'TV 65"', 'Wi-Fi gratuit', 'Minibar premium', 'Salon', 'Bureau', 'Coffre-fort', 'Peignoir'],
    photo_url: '/hotel/room-suite.png',
    created_at: '2025-02-01T08:00:00Z', updated_at: '2025-06-13T16:00:00Z',
  },
  {
    id: 'ch-06', hotel_id: 'hotel-demo', numero: '202', type: 'suite',
    prix_nuit: 60000, statut: 'occupee', etage: 2,
    description: 'Suite exécutive avec vue panoramique sur Abidjan.',
    equipements: ['Climatisation', 'TV 65"', 'Wi-Fi gratuit', 'Minibar premium', 'Salon', 'Bureau', 'Coffre-fort', 'Room service 24h'],
    photo_url: '/hotel/room-suite.png',
    created_at: '2025-02-01T08:00:00Z', updated_at: '2025-06-08T11:00:00Z',
  },
  {
    id: 'ch-07', hotel_id: 'hotel-demo', numero: '203', type: 'vip',
    prix_nuit: 85000, statut: 'disponible', etage: 2,
    description: 'Chambre VIP haut de gamme avec jacuzzi privatif.',
    equipements: ['Climatisation', 'TV 75"', 'Wi-Fi gratuit', 'Minibar premium', 'Jacuzzi', 'Salon', 'Bureau', 'Coffre-fort', 'Concierge dédié'],
    photo_url: '/hotel/room-suite.png',
    created_at: '2025-02-01T08:00:00Z', updated_at: '2025-05-20T10:00:00Z',
  },
  {
    id: 'ch-08', hotel_id: 'hotel-demo', numero: '204', type: 'familiale',
    prix_nuit: 45000, statut: 'maintenance', etage: 2,
    description: 'Chambre familiale avec deux lits et espace enfant.',
    equipements: ['Climatisation', 'TV 55"', 'Wi-Fi gratuit', 'Minibar', 'Lits jumeaux + lit bébé'],
    photo_url: '/hotel/room-deluxe.png',
    created_at: '2025-02-15T08:00:00Z', updated_at: '2025-06-14T08:00:00Z',
  },
  {
    id: 'ch-09', hotel_id: 'hotel-demo', numero: '301', type: 'double',
    prix_nuit: 32000, statut: 'occupee', etage: 3,
    description: 'Chambre double au dernier étage avec vue mer.',
    equipements: ['Climatisation', 'TV 55"', 'Wi-Fi gratuit', 'Minibar', 'Balcon vue mer'],
    photo_url: '/hotel/room-deluxe.png',
    created_at: '2025-03-01T08:00:00Z', updated_at: '2025-06-11T07:00:00Z',
  },
  {
    id: 'ch-10', hotel_id: 'hotel-demo', numero: '302', type: 'simple',
    prix_nuit: 20000, statut: 'reservee', etage: 3,
    description: 'Chambre simple économique au 3ème étage.',
    equipements: ['Climatisation', 'TV Écran plat', 'Wi-Fi gratuit'],
    photo_url: '/hotel/room-standard.png',
    created_at: '2025-03-01T08:00:00Z', updated_at: '2025-06-13T18:00:00Z',
  },
  {
    id: 'ch-11', hotel_id: 'hotel-demo', numero: '303', type: 'vip',
    prix_nuit: 95000, statut: 'occupee', etage: 3,
    description: 'Penthouse VIP avec terrasse panoramique privée.',
    equipements: ['Climatisation', 'TV 75"', 'Wi-Fi gratuit', 'Minibar champagne', 'Terrasse privée', 'Salon', 'Bureau', 'Coffre-fort', 'Concierge dédié', 'Transport aéroport'],
    photo_url: '/hotel/room-suite.png',
    created_at: '2025-03-15T08:00:00Z', updated_at: '2025-06-09T15:00:00Z',
  },
  {
    id: 'ch-12', hotel_id: 'hotel-demo', numero: '304', type: 'familiale',
    prix_nuit: 50000, statut: 'disponible', etage: 3,
    description: 'Chambre familiale spacieuse avec coin jeux enfants.',
    equipements: ['Climatisation', 'TV 55"', 'Wi-Fi gratuit', 'Minibar', 'Espace jeux', 'Coin lecture'],
    photo_url: '/hotel/room-deluxe.png',
    created_at: '2025-03-15T08:00:00Z', updated_at: '2025-01-15T08:00:00Z',
  },
];

// Demo current reservations for occupied rooms
const DEMO_CURRENT_RESERVATIONS: Record<string, {
  id: string; client_id: string; date_arrivee: string; date_depart: string;
  statut: string;
  client: { nom: string; prenom: string; telephone: string };
}> = {
  'ch-02': {
    id: 'res-cur-1', client_id: 'cl-01',
    date_arrivee: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    date_depart: new Date().toISOString().split('T')[0],
    statut: 'checkin',
    client: { nom: 'Koné', prenom: 'Ibrahim', telephone: '+2250711223344' },
  },
  'ch-03': {
    id: 'res-cur-2', client_id: 'cl-02',
    date_arrivee: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    date_depart: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    statut: 'checkin',
    client: { nom: 'Diallo', prenom: 'Aïcha', telephone: '+2250755667788' },
  },
  'ch-06': {
    id: 'res-cur-3', client_id: 'cl-05',
    date_arrivee: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    date_depart: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    statut: 'checkin',
    client: { nom: 'Yao', prenom: 'Serge', telephone: '+2250777889900' },
  },
  'ch-09': {
    id: 'res-cur-4', client_id: 'cl-04',
    date_arrivee: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    date_depart: new Date().toISOString().split('T')[0],
    statut: 'checkin',
    client: { nom: 'Touré', prenom: 'Fatoumata', telephone: '+2250733445566' },
  },
  'ch-11': {
    id: 'res-cur-5', client_id: 'cl-08',
    date_arrivee: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    date_depart: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    statut: 'checkin',
    client: { nom: 'Coulibaly', prenom: 'Mariam', telephone: '+2250765432109' },
  },
};

function filterDemoChambres(
  statut?: string,
  type?: string,
  etage?: string,
  search?: string,
): typeof DEMO_CHAMBRES {
  let filtered = [...DEMO_CHAMBRES];
  if (statut) filtered = filtered.filter(c => c.statut === statut);
  if (type) filtered = filtered.filter(c => c.type === type);
  if (etage) filtered = filtered.filter(c => c.etage === parseInt(etage));
  if (search) filtered = filtered.filter(c => c.numero.includes(search));
  return filtered;
}

function paginateDemoChambres(
  chambres: typeof DEMO_CHAMBRES,
  page: number,
  limit: number,
) {
  const total = chambres.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paged = chambres.slice(start, start + limit).map(c => ({
    ...c,
    current_reservation: c.statut === 'occupee' ? DEMO_CURRENT_RESERVATIONS[c.id] ?? null : null,
  }));
  return { chambres: paged, total, page, totalPages };
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statut = searchParams.get('statut') || undefined;
    const type = searchParams.get('type') || undefined;
    const etage = searchParams.get('etage') || undefined;
    const search = searchParams.get('search') || undefined;

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const filtered = filterDemoChambres(statut, type, etage, search);
      const result = paginateDemoChambres(filtered, page, limit);
      return NextResponse.json({ success: true, data: result });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }

    // ── Build query ──
    let query = supabase
      .from('chambres')
      .select('*', { count: 'exact' })
      .eq('hotel_id', profile.hotel_id)
      .order('etage')
      .order('numero');

    if (statut) query = query.eq('statut', statut);

    if (type) query = query.eq('type', type);
    if (etage) query = query.eq('etage', parseInt(etage));
    if (search) query = query.ilike('numero', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: chambres, count } = await query;

    // ── Fetch current reservations for occupied rooms ──
    const chambreIds = (chambres ?? [])
      .filter(c => c.statut === 'occupee')
      .map(c => c.id);

    let currentReservations: Record<string, unknown> = {};
    if (chambreIds.length > 0) {
      const { data: activeRes } = await supabase
        .from('reservations')
        .select('id, chambre_id, client_id, date_arrivee, date_depart, statut, client:clients!client_id(nom, prenom, telephone)')
        .eq('hotel_id', profile.hotel_id)
        .in('chambre_id', chambreIds)
        .eq('statut', 'checkin');

      for (const res of (activeRes ?? [])) {
        currentReservations[res.chambre_id] = res;
      }
    }

    const chambresWithRes = (chambres ?? []).map(c => ({
      ...c,
      current_reservation: currentReservations[c.id] ?? null,
    }));

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: { chambres: chambresWithRes, total, page, totalPages },
    });
  } catch (error) {
    console.error('[admin/rooms GET] Erreur:', error);
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
    const { numero, type, prix_nuit, etage, description, equipements } = body;

    if (!numero || !type || !prix_nuit || etage === undefined) {
      return NextResponse.json(
        { success: false, error: 'Champs requis : numero, type, prix_nuit, etage.' },
        { status: 400 }
      );
    }

    const validTypes = ['simple', 'double', 'suite', 'vip', 'familiale'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Type invalide. Valeurs autorisées : ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (Number(prix_nuit) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le prix par nuit doit être supérieur à 0.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const newChambre = {
        id: `ch-new-${Date.now()}`,
        hotel_id: 'hotel-demo',
        numero, type, prix_nuit: Number(prix_nuit), statut: 'disponible',
        etage: Number(etage),
        description: description ?? null,
        equipements: equipements ?? [],
        photo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: newChambre, message: 'Chambre créée (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }

    // ── Check plan limits ──
    const { data: hotel } = await supabase
      .from('hotels')
      .select('plan, nombre_chambres')
      .eq('id', profile.hotel_id)
      .single();

    if (hotel) {
      const planInfo = PLANS_ABONNEMENT[hotel.plan as keyof typeof PLANS_ABONNEMENT];
      if (planInfo && hotel.nombre_chambres >= planInfo.limites.chambres) {
        return NextResponse.json(
          { success: false, error: `Limite du plan ${planInfo.nom} atteinte (${planInfo.limites.chambres} chambres). Veuillez mettre à niveau votre abonnement.` },
          { status: 400 }
        );
      }
    }

    // ── Insert ──
    const { data: chambre, error } = await supabase
      .from('chambres')
      .insert({
        hotel_id: profile.hotel_id,
        numero,
        type,
        prix_nuit: Number(prix_nuit),
        statut: 'disponible',
        etage: Number(etage),
        description: description ?? null,
        equipements: equipements ?? [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la création : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: chambre, message: 'Chambre créée avec succès.' });
  } catch (error) {
    console.error('[admin/rooms POST] Erreur:', error);
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
    const { id, chambreId, statut, prix_nuit, description, equipements, etage } = body;
    const roomId = chambreId || id;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'chambreId requis.' },
        { status: 400 }
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = {};
    if (statut !== undefined) updates.statut = statut;
    if (prix_nuit !== undefined) updates.prix_nuit = Number(prix_nuit);
    if (description !== undefined) updates.description = description;
    if (equipements !== undefined) updates.equipements = equipements;
    if (etage !== undefined) updates.etage = Number(etage);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun champ à mettre à jour.' },
        { status: 400 }
      );
    }

    // Validate statut
    if (statut && !['disponible', 'occupee', 'maintenance', 'reservee'].includes(statut)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const chambre = DEMO_CHAMBRES.find(c => c.id === roomId);
      if (!chambre) {
        return NextResponse.json({ success: false, error: 'Chambre non trouvée (démo).' }, { status: 404 });
      }
      const updated = { ...chambre, ...updates, updated_at: new Date().toISOString() };
      return NextResponse.json({ success: true, data: updated, message: 'Chambre mise à jour (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('hotel_id')
      .eq('id', user.id)
      .single();

    if (!profile?.hotel_id) {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }

    // ── Update ──
    const { data: chambre, error } = await supabase
      .from('chambres')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();

    if (error || !chambre) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la mise à jour : ${error?.message ?? 'Chambre non trouvée'}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: chambre, message: 'Chambre mise à jour avec succès.' });
  } catch (error) {
    console.error('[admin/rooms PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── DELETE Handler ──────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { chambreId } = body;

    if (!chambreId) {
      return NextResponse.json(
        { success: false, error: 'chambreId requis.' },
        { status: 400 }
      );
    }

    // Dynamic import
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (!supabase) {
      const chambre = DEMO_CHAMBRES.find(c => c.id === chambreId);
      if (!chambre) {
        return NextResponse.json({ success: false, error: 'Chambre non trouvée (démo).' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Chambre supprimée (démo).' });
    }

    // ── Auth check ──
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    // ── Check for active reservations ──
    const { data: activeRes, count } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('chambre_id', chambreId)
      .in('statut', ['confirmee', 'checkin']);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer cette chambre : elle a des réservations actives.' },
        { status: 400 }
      );
    }

    // ── Delete ──
    const { error } = await supabase
      .from('chambres')
      .delete()
      .eq('id', chambreId);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erreur lors de la suppression : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Chambre supprimée avec succès.' });
  } catch (error) {
    console.error('[admin/rooms DELETE] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
