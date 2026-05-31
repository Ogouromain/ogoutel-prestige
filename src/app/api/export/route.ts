// ============================================
// OGOUTEL_Prestige - API: Export de données
// Fichier : app/api/export/route.ts
//
// GET /api/export?type=reservations&format=csv
// GET /api/export?type=clients&format=json
// GET /api/export?type=finances&format=csv&hotel_id=xxx
//
// - Retourne des données de démo si Supabase non configuré
// - CSV avec BOM UTF-8 pour compatibilité Excel
// - JSON structuré avec en-têtes français
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helpers';
import { checkRateLimit, getClientIp, RATE_LIMIT_EXPORT } from '@/lib/rate-limit';

// ─── Helpers ──────────────────────────────────────────────────────────────

function dateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMontant(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

function escapeCSV(valeur: string): string {
  if (!valeur) return '';
  return valeur.includes(',') || valeur.includes('"') || valeur.includes('\n')
    ? `"${valeur.replace(/"/g, '""')}"`
    : valeur;
}

// ─── Données de démo ──────────────────────────────────────────────────────

const DEMO_RESERVATIONS_CSV: Record<string, string | number>[] = [
  { ID: 'RES-2025-0001', Client: 'Ibrahim Koné', Chambre: '102', 'Arrivée': formatDateFR(dateDaysAgo(4)), 'Départ': formatDateFR(dateDaysAgo(0)), Nuits: 4, Montant: '72 000 FCFA', Statut: 'En cours' },
  { ID: 'RES-2025-0002', Client: 'Aïcha Diallo', Chambre: '103', 'Arrivée': formatDateFR(dateDaysAgo(2)), 'Départ': formatDateFR(dateDaysAgo(-3)), Nuits: 5, Montant: '150 000 FCFA', Statut: 'En cours' },
  { ID: 'RES-2025-0003', Client: 'Serge Yao', Chambre: '202', 'Arrivée': formatDateFR(dateDaysAgo(1)), 'Départ': formatDateFR(dateDaysAgo(-4)), Nuits: 5, Montant: '300 000 FCFA', Statut: 'En cours' },
  { ID: 'RES-2025-0004', Client: 'Fatoumata Touré', Chambre: '301', 'Arrivée': formatDateFR(dateDaysAgo(2)), 'Départ': formatDateFR(dateDaysAgo(0)), Nuits: 2, Montant: '64 000 FCFA', Statut: 'En cours' },
  { ID: 'RES-2025-0005', Client: 'Mariam Coulibaly', Chambre: '303', 'Arrivée': formatDateFR(dateDaysAgo(3)), 'Départ': formatDateFR(dateDaysAgo(-2)), Nuits: 5, Montant: '475 000 FCFA', Statut: 'En cours' },
  { ID: 'RES-2025-0006', Client: 'Aminata Kouamé', Chambre: '101', 'Arrivée': formatDateFR(dateDaysAgo(0)), 'Départ': formatDateFR(dateDaysAgo(-3)), Nuits: 3, Montant: '45 000 FCFA', Statut: 'Confirmée' },
  { ID: 'RES-2025-0007', Client: 'Drissa Ouattara', Chambre: '104', 'Arrivée': formatDateFR(dateDaysAgo(0)), 'Départ': formatDateFR(dateDaysAgo(-2)), Nuits: 2, Montant: '70 000 FCFA', Statut: 'Confirmée' },
  { ID: 'RES-2025-0008', Client: 'Moussa Bamba', Chambre: '203', 'Arrivée': formatDateFR(dateDaysAgo(0)), 'Départ': formatDateFR(dateDaysAgo(-5)), Nuits: 5, Montant: '425 000 FCFA', Statut: 'Confirmée' },
  { ID: 'RES-2025-0009', Client: 'Jean-Louis N\'Guessan', Chambre: '201', 'Arrivée': formatDateFR(dateDaysAgo(-1)), 'Départ': formatDateFR(dateDaysAgo(-4)), Nuits: 3, Montant: '165 000 FCFA', Statut: 'En attente' },
  { ID: 'RES-2025-0010', Client: 'Adama Traoré', Chambre: '302', 'Arrivée': formatDateFR(dateDaysAgo(-2)), 'Départ': formatDateFR(dateDaysAgo(-5)), Nuits: 3, Montant: '60 000 FCFA', Statut: 'En attente' },
  { ID: 'RES-2025-0011', Client: 'Ibrahim Koné', Chambre: '304', 'Arrivée': formatDateFR(dateDaysAgo(10)), 'Départ': formatDateFR(dateDaysAgo(7)), Nuits: 3, Montant: '150 000 FCFA', Statut: 'Terminée' },
  { ID: 'RES-2025-0012', Client: 'Moussa Bamba', Chambre: '104', 'Arrivée': formatDateFR(dateDaysAgo(15)), 'Départ': formatDateFR(dateDaysAgo(12)), Nuits: 3, Montant: '105 000 FCFA', Statut: 'Terminée' },
];

const DEMO_CLIENTS_CSV: Record<string, string | number>[] = [
  { Nom: 'Koné', Prénom: 'Ibrahim', Téléphone: '+225 07 11 22 33 44', Email: 'ibrahim.kone@email.com', Nationalité: 'Ivoirienne', Ville: 'Abidjan' },
  { Nom: 'Diallo', Prénom: 'Aïcha', Téléphone: '+225 07 55 66 77 88', Email: 'aicha.diallo@email.com', Nationalité: 'Ivoirienne', Ville: 'Bouaké' },
  { Nom: 'Bamba', Prénom: 'Moussa', Téléphone: '+225 07 99 00 11 22', Email: 'moussa.bamba@email.com', Nationalité: 'Malienne', Ville: 'Bamako' },
  { Nom: 'Touré', Prénom: 'Fatoumata', Téléphone: '+225 07 33 44 55 66', Email: 'fatou.toure@email.com', Nationalité: 'Ivoirienne', Ville: 'Abidjan' },
  { Nom: 'Yao', Prénom: 'Serge', Téléphone: '+225 07 77 88 99 00', Email: 'serge.yao@email.com', Nationalité: 'Ivoirienne', Ville: 'Yamoussoukro' },
  { Nom: 'Kouamé', Prénom: 'Aminata', Téléphone: '+225 07 08 09 09 09', Email: 'aminata.kouame@email.com', Nationalité: 'Ivoirienne', Ville: 'Abidjan' },
  { Nom: 'Ouattara', Prénom: 'Drissa', Téléphone: '+225 07 12 34 56 78', Email: 'drissa.ouattara@email.com', Nationalité: 'Burkinabè', Ville: 'Ouagadougou' },
  { Nom: 'Coulibaly', Prénom: 'Mariam', Téléphone: '+225 07 65 43 21 09', Email: 'mariam.coulibaly@email.com', Nationalité: 'Ivoirienne', Ville: 'Korhogo' },
  { Nom: 'N\'Guessan', Prénom: 'Jean-Louis', Téléphone: '+225 07 01 12 23 34', Email: 'jl.nguessan@email.com', Nationalité: 'Ivoirienne', Ville: 'San Pedro' },
  { Nom: 'Traoré', Prénom: 'Adama', Téléphone: '+225 07 44 55 66 77', Email: 'adama.traore@email.com', Nationalité: 'Malienne', Ville: 'Abidjan' },
];

const DEMO_FINANCES_CSV: Record<string, string | number>[] = [
  { Date: formatDateFR(dateDaysAgo(0)), Libellé: 'Paiement réservation RES-2025-0006', 'Montant HT': 38136, TVA: '18%', 'Montant TTC': '45 000 FCFA', 'Mode Paiement': 'Espèces', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(0)), Libellé: 'Paiement réservation RES-2025-0007', 'Montant HT': 59322, TVA: '18%', 'Montant TTC': '70 000 FCFA', 'Mode Paiement': 'Carte bancaire', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(1)), Libellé: 'Acompte réservation RES-2025-0008', 'Montant HT': 169492, TVA: '18%', 'Montant TTC': '200 000 FCFA', 'Mode Paiement': 'Mobile Money', Statut: 'Partiel' },
  { Date: formatDateFR(dateDaysAgo(2)), Libellé: 'Paiement réservation RES-2025-0004', 'Montant HT': 54237, TVA: '18%', 'Montant TTC': '64 000 FCFA', 'Mode Paiement': 'Espèces', Statut: 'Partiel' },
  { Date: formatDateFR(dateDaysAgo(2)), Libellé: 'Paiement réservation RES-2025-0002', 'Montant HT': 127119, TVA: '18%', 'Montant TTC': '150 000 FCFA', 'Mode Paiement': 'Virement', Statut: 'Partiel' },
  { Date: formatDateFR(dateDaysAgo(3)), Libellé: 'Paiement réservation RES-2025-0005', 'Montant HT': 402542, TVA: '18%', 'Montant TTC': '475 000 FCFA', 'Mode Paiement': 'Carte bancaire', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(4)), Libellé: 'Paiement réservation RES-2025-0001', 'Montant HT': 61017, TVA: '18%', 'Montant TTC': '72 000 FCFA', 'Mode Paiement': 'Espèces', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(7)), Libellé: 'Remboursement réservation RES-2025-0011', 'Montant HT': -127119, TVA: '18%', 'Montant TTC': '-150 000 FCFA', 'Mode Paiement': 'Virement', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(10)), Libellé: 'Facturation ménage exceptionnel', 'Montant HT': 25424, TVA: '18%', 'Montant TTC': '30 000 FCFA', 'Mode Paiement': 'Espèces', Statut: 'Payé' },
  { Date: formatDateFR(dateDaysAgo(12)), Libellé: 'Paiement réservation RES-2025-0012', 'Montant HT': 88983, TVA: '18%', 'Montant TTC': '105 000 FCFA', 'Mode Paiement': 'Mobile Money', Statut: 'Payé' },
];

// ─── Fonctions de génération CSV ──────────────────────────────────────────

function dataToCSV(rows: Record<string, string | number>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => escapeCSV(String(row[h] ?? ''))).join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

// ─── Types valides ──────────────────────────────────────────────────────

const VALID_TYPES = ['reservations', 'clients', 'finances'] as const;
const VALID_FORMATS = ['csv', 'json'] as const;

function isValidType(type: string): type is (typeof VALID_TYPES)[number] {
  return VALID_TYPES.includes(type as (typeof VALID_TYPES)[number]);
}

function isValidFormat(format: string): format is (typeof VALID_FORMATS)[number] {
  return VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number]);
}

// ─── Données par type ─────────────────────────────────────────────────────

function getDataByType(type: (typeof VALID_TYPES)[number]): Record<string, string | number>[] {
  switch (type) {
    case 'reservations':
      return DEMO_RESERVATIONS_CSV;
    case 'clients':
      return DEMO_CLIENTS_CSV;
    case 'finances':
      return DEMO_FINANCES_CSV;
  }
}

function getFilenameByType(type: (typeof VALID_TYPES)[number]): string {
  const date = new Date().toISOString().split('T')[0];
  switch (type) {
    case 'reservations':
      return `reservations_${date}`;
    case 'clients':
      return `clients_${date}`;
    case 'finances':
      return `finances_${date}`;
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_EXPORT);
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

    // ── Authentification ──
    const auth = await verifyApiAuth(request, ['admin_hotel', 'gerant', 'receptionniste', 'super_admin']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('type') || 'reservations';
    const rawFormat = searchParams.get('format') || 'csv';
    const hotelId = searchParams.get('hotel_id') || undefined;

    // Validation des paramètres
    if (!isValidType(rawType)) {
      return NextResponse.json(
        { success: false, error: `Type invalide. Types autorisés : ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!isValidFormat(rawFormat)) {
      return NextResponse.json(
        { success: false, error: `Format invalide. Formats autorisés : ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    // Tentative d'accès Supabase
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    let data: Record<string, unknown>[];

    // For super_admin, allow any hotel_id. For others, force their own hotel.
    const userHotelId = auth.profile.hotel_id;
    if (!userHotelId && auth.profile.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Aucun hôtel associé.' }, { status: 403 });
    }
    const finalHotelId = auth.profile.role === 'super_admin'
      ? (hotelId || userHotelId)
      : userHotelId;
    if (!finalHotelId) {
      // Return demo data if no hotel
      data = getDataByType(rawType) as Record<string, unknown>[];
    } else {
      data = await fetchFromSupabase(supabase, rawType, finalHotelId);
    }

    const filename = getFilenameByType(rawType);
    const timestamp = new Date().toISOString();

    // ── Réponse CSV ──
    if (rawFormat === 'csv') {
      const csv = dataToCSV(data as Record<string, string | number>[]);
      const bom = '\uFEFF';
      const csvWithBom = bom + csv;

      return new NextResponse(csvWithBom, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'Content-Length': Buffer.byteLength(csvWithBom, 'utf-8').toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // ── Réponse JSON ──
    return NextResponse.json(
      {
        success: true,
        meta: {
          type: rawType,
          format: rawFormat,
          filename: `${filename}.json`,
          exportDate: timestamp,
          count: data.length,
        },
        data,
      },
      {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[api/export GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// ─── Supabase fetching ───────────────────────────────────────────────────

async function fetchFromSupabase(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server')['createClient']>>,
  type: (typeof VALID_TYPES)[number],
  hotelId: string
): Promise<Record<string, unknown>[]> {
  try {
    switch (type) {
      case 'reservations': {
        const { data: rows, error } = await supabase
          .from('reservations')
          .select('id, client:clients(nom, prenom), chambre:chambres(numero), date_arrivee, date_depart, nombre_nuits, montant_total, statut')
          .eq('hotel_id', hotelId)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;

        return (rows ?? []).map((r: Record<string, unknown>) => {
          const client = r.client as { nom: string; prenom: string } | null;
          const chambre = r.chambre as { numero: string } | null;
          return {
            ID: r.id,
            Client: client ? `${client.prenom} ${client.nom}` : '—',
            Chambre: chambre?.numero ?? '—',
            'Arrivée': formatDateFR(String(r.date_arrivee ?? '')),
            'Départ': formatDateFR(String(r.date_depart ?? '')),
            Nuits: r.nombre_nuits ?? 0,
            Montant: formatMontant(Number(r.montant_total ?? 0)),
            Statut: formatStatutReservation(String(r.statut ?? '')),
          };
        });
      }

      case 'clients': {
        const { data: rows, error } = await supabase
          .from('clients')
          .select('nom, prenom, telephone, email, nationalite, ville')
          .eq('hotel_id', hotelId)
          .order('nom', { ascending: true })
          .limit(500);

        if (error) throw error;

        return (rows ?? []).map((r: Record<string, unknown>) => ({
          Nom: r.nom ?? '',
          Prénom: r.prenom ?? '',
          Téléphone: r.telephone ?? '',
          Email: r.email ?? '',
          Nationalité: r.nationalite ?? '',
          Ville: r.ville ?? '',
        }));
      }

      case 'finances': {
        const { data: rows, error } = await supabase
          .from('factures')
          .select('created_at, numero_facture, montant_ht, montant_tva, montant_ttc, mode_paiement, statut_paiement')
          .eq('hotel_id', hotelId)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;

        return (rows ?? []).map((r: Record<string, unknown>) => ({
          Date: formatDateFR(String(r.created_at ?? '')),
          Libellé: r.numero_facture ?? '',
          'Montant HT': formatMontant(Number(r.montant_ht ?? 0)),
          TVA: '18%',
          'Montant TTC': formatMontant(Number(r.montant_ttc ?? 0)),
          'Mode Paiement': formatModePaiement(String(r.mode_paiement ?? '')),
          Statut: formatStatutPaiement(String(r.statut_paiement ?? '')),
        }));
      }
    }
  } catch (error) {
    console.error('[api/export] Erreur Supabase, fallback démo:', error);
    return getDataByType(type) as Record<string, unknown>[];
  }

  return [];
}

// ─── Formatters ────────────────────────────────────────────────────────────

function formatStatutReservation(statut: string): string {
  const map: Record<string, string> = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    checkin: 'En cours',
    checkout: 'Terminée',
    annulee: 'Annulée',
  };
  return map[statut] ?? statut;
}

function formatModePaiement(mode: string): string {
  const map: Record<string, string> = {
    especes: 'Espèces',
    carte_bancaire: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    virement: 'Virement',
    cheque: 'Chèque',
  };
  return map[mode] ?? mode;
}

function formatStatutPaiement(statut: string): string {
  const map: Record<string, string> = {
    en_attente: 'En attente',
    partiel: 'Partiel',
    paye: 'Payé',
  };
  return map[statut] ?? statut;
}
