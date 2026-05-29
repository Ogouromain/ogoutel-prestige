// ============================================
// OGOUTEL_Prestige - API: Super Admin CSV Export
// Fichier : app/api/super-admin/export/route.ts
//
// GET /api/super-admin/export?type=hotels|subscriptions|codes
// - Exports data as CSV with appropriate headers
// - Uses Supabase admin client (bypasses RLS)
// - Falls back to demo data if Supabase unconfigured
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If field contains comma, quote, or newline, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: unknown[]): string {
  return values.map(escapeCsvField).join(',');
}

function buildCsvResponse(csvContent: string, filename: string): NextResponse {
  // Add UTF-8 BOM for proper Excel display of accented characters
  const bom = '\uFEFF';
  return new NextResponse(bom + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// ─── Export Hotels ───────────────────────────────────────────────────────────

async function exportHotels(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createAdminClient>>): Promise<string> {
  const headers = [
    'ID', 'Nom', 'Adresse', 'Ville', 'Quartier', 'Téléphone', 'Email',
    'Plan', 'Nombre Chambres', 'Étoiles', 'Actif',
    'Date Début Abonnement', 'Date Fin Abonnement', 'Date Création',
  ];

  if (!supabase) {
    // Demo data
    const rows = [
      ['demo-h1', 'Hôtel Le Palmier', '01 Rue du Commerce, Cocody', 'Abidjan', 'Cocody', '+2250708090909', 'contact@lepalmier.ci', 'standard', '15', '3', 'Oui', '2024-11-01', '2025-02-01', '2024-11-01'],
      ['demo-h2', 'Hôtel Émeraude', '25 Blvd de France, Plateau', 'Abidjan', 'Plateau', '+2250712345678', 'info@emeraude-hotel.ci', 'premium', '42', '4', 'Oui', '2024-12-01', '2025-03-01', '2024-12-01'],
      ['demo-h3', 'Résidence La Paix', '10 Av. de la Liberté', 'Korhogo', 'Centre-Ville', '+2250765432109', 'lapaix.residence@email.com', 'basique', '8', '2', 'Oui', '2024-12-15', '2025-01-15', '2024-12-15'],
      ['demo-h4', 'Hôtel Le Phénix', '5 Rue des Savanes', 'Man', 'Quartier France', '+2250798765432', 'phoenix.hotel@email.com', 'standard', '22', '3', 'Oui', '2025-01-01', '2025-02-15', '2025-01-01'],
      ['demo-h5', 'Auberge du Soleil', '03 Rue du Marché', 'Gagnoa', 'Marché Central', '+2250723456789', 'soleil.auberge@email.com', 'basique', '10', '1', 'Non', '2024-09-01', '2024-12-01', '2024-09-01'],
      ['demo-h6', 'Hôtel Le Baobab', '18 Blvd Vridi', 'San-Pédro', 'Vridi', '+2250744556677', 'baobab.hotel@email.com', 'standard', '18', '3', 'Oui', '2025-01-10', '2025-02-20', '2025-01-10'],
    ];
    return buildCsvRow(headers) + '\n' + rows.map((r) => buildCsvRow(r)).join('\n');
  }

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (hotels ?? []).map((h) =>
    buildCsvRow([
      h.id,
      h.nom,
      h.adresse,
      h.ville,
      h.quartier,
      h.telephone,
      h.email,
      h.plan,
      h.nombre_chambres,
      h.nombre_etoiles,
      h.est_actif ? 'Oui' : 'Non',
      h.date_debut_abonnement ? new Date(h.date_debut_abonnement).toLocaleDateString('fr-FR') : '',
      h.date_fin_abonnement ? new Date(h.date_fin_abonnement).toLocaleDateString('fr-FR') : '',
      h.created_at ? new Date(h.created_at).toLocaleDateString('fr-FR') : '',
    ])
  );

  return buildCsvRow(headers) + '\n' + rows.join('\n');
}

// ─── Export Subscriptions ────────────────────────────────────────────────────

async function exportSubscriptions(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createAdminClient>>): Promise<string> {
  const headers = [
    'ID', 'Nom Complet', 'Email', 'Téléphone', 'Nom Hôtel', 'Ville',
    'Quartier', 'Nombre Chambres', 'Plan Choisi', 'Statut',
    'Notes Admin', 'Date Création', 'Date Mise à jour',
  ];

  if (!supabase) {
    // Demo data
    const rows = [
      ['demo-d1', 'Koné Ibrahim', 'ibrahim.kone@email.com', '+2250711223344', 'Hôtel Le Baobab', 'Abidjan', 'Cocody', '15', 'standard', 'En attente', '', '2025-01-19', '2025-01-19'],
      ['demo-d2', 'Diallo Aïcha', 'aicha.diallo@email.com', '+2250755667788', 'Résidence Palm Beach', 'San-Pédro', 'Vridi', '28', 'premium', 'En attente', '', '2025-01-18', '2025-01-18'],
      ['demo-d3', 'Bamba Moussa', 'moussa.bamba@email.com', '+2250799001122', 'Hôtel Étoile du Nord', 'Bouaké', 'Centre-Ville', '12', 'basique', 'Contacté', 'Appelé le 15/01', '2025-01-15', '2025-01-18'],
      ['demo-d4', 'Touré Fatoumata', 'fatou.toure@email.com', '+2250733445566', 'Auberge du Lagon', 'Daloa', 'Quartier Commerce', '10', 'standard', 'Payé', 'Paiement reçu', '2025-01-10', '2025-01-17'],
      ['demo-d5', 'Yao Serge', 'serge.yao@email.com', '+2250777889900', 'Hôtel Le Cocotier', 'Yamoussoukro', 'Quartier Résidentiel', '20', 'premium', 'Actif', 'Hôtel en production', '2024-12-26', '2025-01-13'],
      ['demo-d6', 'Koffi Ama', 'ama.koffi@email.com', '+2250700112233', "Hôtel L'Étoile d'Or", 'Abengourou', 'Centre-Ville', '6', 'basique', 'En attente', '', '2025-01-20', '2025-01-20'],
      ['demo-d7', 'Coulibaly Drissa', 'drissa.coulibaly@email.com', '+2250755660011', 'Hôtel Le Morne', 'Divo', 'Zone Portuaire', '14', 'standard', 'En attente', '', '2025-01-17', '2025-01-17'],
    ];
    return buildCsvRow(headers) + '\n' + rows.map((r) => buildCsvRow(r)).join('\n');
  }

  const { data: demandes } = await supabase
    .from('abonnement_demandes')
    .select('*')
    .order('created_at', { ascending: false });

  const statutLabels: Record<string, string> = {
    en_attente: 'En attente',
    contacte: 'Contacté',
    paye: 'Payé',
    active: 'Actif',
  };

  const rows = (demandes ?? []).map((d) =>
    buildCsvRow([
      d.id,
      d.nom_complet,
      d.email,
      d.telephone,
      d.nom_hotel,
      d.ville,
      d.quartier,
      d.nombre_chambres,
      d.plan_choisi,
      statutLabels[d.statut] ?? d.statut,
      d.notes_admin,
      d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '',
      d.updated_at ? new Date(d.updated_at).toLocaleDateString('fr-FR') : '',
    ])
  );

  return buildCsvRow(headers) + '\n' + rows.join('\n');
}

// ─── Export Codes ──────────────────────────────────────────────────────────────

async function exportCodes(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createAdminClient>>): Promise<string> {
  const headers = [
    'ID', 'Code', 'Plan', 'Email Destinataire', 'Nom Hôtel',
    'Utilisé', 'Utilisé Par', 'Date Expiration', 'Date Création', 'Date Utilisation',
  ];

  if (!supabase) {
    // Demo data
    const rows = [
      ['demo-c1', 'OGT-K7NF-3PXW', 'standard', 'fatou.toure@email.com', 'Auberge du Lagon', 'Non', '', new Date(Date.now() + 86400000 * 20).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 3).toLocaleDateString('fr-FR'), ''],
      ['demo-c2', 'OGT-8HJM-QR2E', 'premium', 'serge.yao@email.com', 'Hôtel Le Cocotier', 'Oui', 'user-5', new Date(Date.now() + 86400000 * 10).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 10).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 7).toLocaleDateString('fr-FR')],
      ['demo-c3', 'OGT-B3KS-7VNM', 'basique', 'ama.koffi@email.com', "Hôtel L'Étoile d'Or", 'Non', '', new Date(Date.now() + 86400000 * 25).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 5).toLocaleDateString('fr-FR'), ''],
      ['demo-c4', 'OGT-6PFT-4YH9', 'standard', 'dramane.ouattara@email.com', 'Hôtel Le Baobab', 'Oui', 'user-6', new Date(Date.now() - 86400000 * 5).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 35).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 34).toLocaleDateString('fr-FR')],
      ['demo-c5', 'OGT-R2NJ-8CXP', 'premium', 'aicha.diallo@email.com', 'Résidence Palm Beach', 'Non', '', new Date(Date.now() + 86400000 * 15).toLocaleDateString('fr-FR'), new Date(Date.now() - 86400000 * 1).toLocaleDateString('fr-FR'), ''],
    ];
    return buildCsvRow(headers) + '\n' + rows.map((r) => buildCsvRow(r)).join('\n');
  }

  const { data: codes } = await supabase
    .from('codes_acces')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (codes ?? []).map((c) =>
    buildCsvRow([
      c.id,
      c.code,
      c.plan,
      c.email_destinataire,
      c.nom_hotel,
      c.est_utilise ? 'Oui' : 'Non',
      c.utilise_par ?? '',
      c.date_expiration ? new Date(c.date_expiration).toLocaleDateString('fr-FR') : '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
      c.used_at ? new Date(c.used_at).toLocaleDateString('fr-FR') : '',
    ])
  );

  return buildCsvRow(headers) + '\n' + rows.join('\n');
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? '';

    const validTypes = ['hotels', 'subscriptions', 'codes'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Type d'export invalide. Valeurs : ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Dynamic import — handles missing env vars gracefully
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    let csvContent: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'hotels':
        csvContent = await exportHotels(supabase);
        filename = `ogoutel_hotels_${timestamp}.csv`;
        break;
      case 'subscriptions':
        csvContent = await exportSubscriptions(supabase);
        filename = `ogoutel_abonnements_${timestamp}.csv`;
        break;
      case 'codes':
        csvContent = await exportCodes(supabase);
        filename = `ogoutel_codes_acces_${timestamp}.csv`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Type non supporté.' },
          { status: 400 }
        );
    }

    return buildCsvResponse(csvContent, filename);
  } catch (error) {
    console.error('[super-admin/export GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
