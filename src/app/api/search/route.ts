// ============================================
// OGOUTEL_Prestige - API: Recherche Globale
// GET  /api/search?q=...&type=...
// ============================================

import { NextResponse } from 'next/server';

// ─── Rate Limiter (in-memory) ───────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;       // max requests per window
const RATE_LIMIT_WINDOW = 60_000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  return false;
}

// Nettoyage périodique (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ─── Demo Data ──────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  { id: 'cl-01', nom: 'Kouassi', prenom: 'Jean', telephone: '+225 07 56 10 32 77', email: 'jean.kouassi@email.com' },
  { id: 'cl-02', nom: 'Koné', prenom: 'Ibrahim', telephone: '+225 07 11 22 33 44', email: 'ibrahim.kone@email.com' },
  { id: 'cl-03', nom: 'Diallo', prenom: 'Aïcha', telephone: '+225 07 55 66 77 88', email: 'aicha.diallo@email.com' },
  { id: 'cl-04', nom: 'Bamba', prenom: 'Moussa', telephone: '+225 07 99 00 11 22', email: 'moussa.bamba@email.com' },
  { id: 'cl-05', nom: 'Touré', prenom: 'Fatoumata', telephone: '+225 07 33 44 55 66', email: 'fatou.toure@email.com' },
  { id: 'cl-06', nom: 'Yao', prenom: 'Serge', telephone: '+225 07 77 88 99 00', email: 'serge.yao@email.com' },
  { id: 'cl-07', nom: 'Ouattara', prenom: 'Drissa', telephone: '+225 07 12 34 56 78', email: 'drissa.ouattara@email.com' },
  { id: 'cl-08', nom: 'Coulibaly', prenom: 'Mariam', telephone: '+225 07 65 43 21 09', email: 'mariam.coulibaly@email.com' },
  { id: 'cl-09', nom: 'Kouamé', prenom: 'Aminata', telephone: '+225 07 08 09 09 09', email: 'aminata.kouame@email.com' },
  { id: 'cl-10', nom: 'Traoré', prenom: 'Adama', telephone: '+225 07 44 33 22 11', email: 'adama.traore@email.com' },
];

const DEMO_CHAMBRES = [
  { id: 'ch-01', numero: '101', type: 'simple', statut: 'disponible', prix_nuit: 15000, etage: 1 },
  { id: 'ch-02', numero: '102', type: 'simple', statut: 'occupee', prix_nuit: 15000, etage: 1 },
  { id: 'ch-03', numero: '103', type: 'double', statut: 'disponible', prix_nuit: 25000, etage: 1 },
  { id: 'ch-04', numero: '104', type: 'double', statut: 'occupee', prix_nuit: 25000, etage: 1 },
  { id: 'ch-05', numero: '201', type: 'suite', statut: 'disponible', prix_nuit: 60000, etage: 2 },
  { id: 'ch-06', numero: '202', type: 'suite', statut: 'occupee', prix_nuit: 60000, etage: 2 },
  { id: 'ch-07', numero: '203', type: 'double', statut: 'maintenance', prix_nuit: 25000, etage: 2 },
  { id: 'ch-08', numero: '301', type: 'familiale', statut: 'disponible', prix_nuit: 45000, etage: 3 },
  { id: 'ch-09', numero: '302', type: 'vip', statut: 'occupee', prix_nuit: 95000, etage: 3 },
  { id: 'ch-10', numero: '303', type: 'vip', statut: 'disponible', prix_nuit: 95000, etage: 3 },
];

const DEMO_RESERVATIONS = [
  { id: 'res-01', client_nom: 'Kouassi Jean', chambre_numero: '102', date_arrivee: '2025-01-15', date_depart: '2025-01-19', statut: 'confirmee' },
  { id: 'res-02', client_nom: 'Diallo Aïcha', chambre_numero: '103', date_arrivee: '2025-01-20', date_depart: '2025-01-25', statut: 'confirmee' },
  { id: 'res-03', client_nom: 'Yao Serge', chambre_numero: '202', date_arrivee: '2025-01-18', date_depart: '2025-01-22', statut: 'en_attente' },
  { id: 'res-04', client_nom: 'Touré Fatoumata', chambre_numero: '301', date_arrivee: '2025-01-22', date_depart: '2025-01-27', statut: 'annulee' },
  { id: 'res-05', client_nom: 'Koné Ibrahim', chambre_numero: '104', date_arrivee: '2025-01-10', date_depart: '2025-01-14', statut: 'checkout' },
  { id: 'res-06', client_nom: 'Ouattara Drissa', chambre_numero: '201', date_arrivee: '2025-01-25', date_depart: '2025-01-28', statut: 'confirmee' },
  { id: 'res-07', client_nom: 'Coulibaly Mariam', chambre_numero: '302', date_arrivee: '2025-01-12', date_depart: '2025-01-17', statut: 'checkin' },
  { id: 'res-08', client_nom: 'Bamba Moussa', chambre_numero: '101', date_arrivee: '2025-02-01', date_depart: '2025-02-05', statut: 'en_attente' },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function searchClients(q: string) {
  return DEMO_CLIENTS
    .filter((c) =>
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      c.email.toLowerCase().includes(q)
    )
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      type: 'client' as const,
    }));
}

function searchChambres(q: string) {
  return DEMO_CHAMBRES
    .filter((ch) =>
      ch.numero.includes(q) ||
      ch.type.toLowerCase().includes(q) ||
      ch.statut.toLowerCase().includes(q)
    )
    .slice(0, 8)
    .map((ch) => ({
      id: ch.id,
      numero: ch.numero,
      type: ch.type,
      statut: ch.statut,
      prix_nuit: ch.prix_nuit,
      type_result: 'chambre' as const,
    }));
}

function searchReservations(q: string) {
  return DEMO_RESERVATIONS
    .filter((r) =>
      r.id.toLowerCase().includes(q) ||
      r.client_nom.toLowerCase().includes(q) ||
      r.chambre_numero.includes(q) ||
      r.statut.toLowerCase().includes(q)
    )
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      client_nom: r.client_nom,
      chambre_numero: r.chambre_numero,
      date_arrivee: r.date_arrivee,
      statut: r.statut,
      type_result: 'reservation' as const,
    }));
}

// ─── GET Handler ────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // Rate limiting par IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const type = searchParams.get('type'); // "clients" | "chambres" | "reservations"

    // Validation du terme de recherche
    if (q.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Le terme de recherche doit contenir au moins 2 caractères.' },
        { status: 400 }
      );
    }

    // Validation du type
    if (type && !['clients', 'chambres', 'reservations'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type invalide. Valeurs acceptées : clients, chambres, reservations.' },
        { status: 400 }
      );
    }

    // ── Tentative Supabase ──────────────────────────────────────────────
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    if (supabase) {
      // ── Auth ──
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Non authentifié.' },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('hotel_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hotel_id) {
        return NextResponse.json(
          { success: false, error: 'Aucun hôtel associé.' },
          { status: 403 }
        );
      }

      const hotelId = profile.hotel_id;
      const results: {
        clients: Array<{ id: string; nom: string; prenom: string; telephone: string; type: string }>;
        chambres: Array<{ id: string; numero: string; type: string; statut: string; prix_nuit: number; type_result: string }>;
        reservations: Array<{ id: string; client_nom: string; chambre_numero: string; date_arrivee: string; statut: string; type_result: string }>;
      } = { clients: [], chambres: [], reservations: [] };

      // Recherche clients
      if (!type || type === 'clients') {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, nom, prenom, telephone')
          .eq('hotel_id', hotelId)
          .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(8);

        if (clients) {
          results.clients = clients.map((c) => ({
            id: c.id,
            nom: c.nom,
            prenom: c.prenom || '',
            telephone: c.telephone || '',
            type: 'client',
          }));
        }
      }

      // Recherche chambres
      if (!type || type === 'chambres') {
        const { data: chambres } = await supabase
          .from('chambres')
          .select('id, numero, type, statut, prix_nuit')
          .eq('hotel_id', hotelId)
          .or(`numero.ilike.%${q}%,type.ilike.%${q}%`)
          .limit(8);

        if (chambres) {
          results.chambres = chambres.map((ch) => ({
            id: ch.id,
            numero: ch.numero,
            type: ch.type,
            statut: ch.statut,
            prix_nuit: ch.prix_nuit || 0,
            type_result: 'chambre',
          }));
        }
      }

      // Recherche réservations
      if (!type || type === 'reservations') {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('id, client_nom, chambre_numero, date_arrivee, statut')
          .eq('hotel_id', hotelId)
          .or(`id.ilike.%${q}%,client_nom.ilike.%${q}%,chambre_numero.ilike.%${q}%`)
          .limit(8);

        if (reservations) {
          results.reservations = reservations.map((r) => ({
            id: r.id,
            client_nom: r.client_nom || '',
            chambre_numero: r.chambre_numero || '',
            date_arrivee: r.date_arrivee || '',
            statut: r.statut,
            type_result: 'reservation',
          }));
        }
      }

      const total = results.clients.length + results.chambres.length + results.reservations.length;

      return NextResponse.json({
        success: true,
        data: { ...results, total },
      });
    }

    // ── Mode Démo (Supabase non configuré) ─────────────────────────────
    const results: {
      clients: Array<{ id: string; nom: string; prenom: string; telephone: string; type: string }>;
      chambres: Array<{ id: string; numero: string; type: string; statut: string; prix_nuit: number; type_result: string }>;
      reservations: Array<{ id: string; client_nom: string; chambre_numero: string; date_arrivee: string; statut: string; type_result: string }>;
    } = { clients: [], chambres: [], reservations: [] };

    if (!type || type === 'clients') {
      results.clients = searchClients(q);
    }
    if (!type || type === 'chambres') {
      results.chambres = searchChambres(q);
    }
    if (!type || type === 'reservations') {
      results.reservations = searchReservations(q);
    }

    const total = results.clients.length + results.chambres.length + results.reservations.length;

    return NextResponse.json({
      success: true,
      data: { ...results, total },
    });
  } catch (error) {
    console.error('[search GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
