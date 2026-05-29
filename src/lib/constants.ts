// ============================================
// OGOUTEL_Prestige - Constantes de l'application
// Application SaaS de Gestion Hôtelière
// ============================================

// ─── Plans d'abonnement ───────────────────────────────────────────────────────

export const PLANS_ABONNEMENT = {
  basique: {
    id: 'basique',
    nom: 'Basique',
    prix: 25000,
    devise: 'FCFA',
    description: 'Idéal pour les petites structures hôtelières.',
    limites: {
      admins: 1,
      gerants: 0,
      receptionnistes: 1,
      chambres: 20,
    },
    fonctionnalites: [
      'Gestion des réservations',
      'Gestion des chambres',
      'Check-in / Check-out',
      'Facturation de base',
      'Tableau de bord',
      'Support par email',
    ],
    populaire: false,
  },
  standard: {
    id: 'standard',
    nom: 'Standard',
    prix: 50000,
    devise: 'FCFA',
    description: 'Pour les hôtels de taille moyenne en croissance.',
    limites: {
      admins: 1,
      gerants: 1,
      receptionnistes: 3,
      chambres: 50,
    },
    fonctionnalites: [
      'Tout du plan Basique, plus :',
      'Gestion des gérants',
      'Rapports et statistiques',
      'Gestion des clients fidèles',
      'Notifications en temps réel',
      'Export PDF des factures',
      'Support prioritaire WhatsApp',
    ],
    populaire: true,
  },
  premium: {
    id: 'premium',
    nom: 'Premium',
    prix: 95000,
    devise: 'FCFA',
    description: 'Solution complète pour les grands établissements.',
    limites: {
      admins: 1,
      gerants: 3,
      receptionnistes: 10,
      chambres: 999, // illimité
    },
    fonctionnalites: [
      'Tout du plan Standard, plus :',
      'Chambres illimitées',
      'Multi-établissements',
      'API accès développeur',
      'Intégration paiement mobile money',
      'Module comptabilité avancé',
      'Support dédié 24/7',
      'Formation personnalisée',
      'Marque blanche (logo personnalisé)',
    ],
    populaire: false,
  },
} as const;

export type PlanId = keyof typeof PLANS_ABONNEMENT;

// ─── Types de chambres ────────────────────────────────────────────────────────

export const TYPES_CHAMBRES = [
  { id: 'simple', label: 'Simple', description: 'Chambre individuelle' },
  { id: 'double', label: 'Double', description: 'Chambre double avec lit double' },
  { id: 'suite', label: 'Suite', description: 'Suite avec salon séparé' },
  { id: 'vip', label: 'VIP', description: 'Chambre premium haut de gamme' },
  { id: 'familiale', label: 'Familiale', description: 'Chambre pour famille' },
] as const;

export type TypeChambre = (typeof TYPES_CHAMBRES)[number]['id'];

// ─── Statuts de chambre ──────────────────────────────────────────────────────

export const STATUTS_CHAMBRE = [
  { id: 'disponible', label: 'Disponible', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  { id: 'occupee', label: 'Occupée', color: 'bg-red-500', textColor: 'text-red-500' },
  { id: 'maintenance', label: 'Maintenance', color: 'bg-amber-500', textColor: 'text-amber-500' },
  { id: 'reservée', label: 'Réservée', color: 'bg-blue-500', textColor: 'text-blue-500' },
] as const;

export type StatutChambre = (typeof STATUTS_CHAMBRE)[number]['id'];

// ─── Statuts de réservation ──────────────────────────────────────────────────

export const STATUTS_RESERVATION = [
  { id: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'confirmee', label: 'Confirmée', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'checkin', label: 'Check-in', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'checkout', label: 'Check-out', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-800 border-red-200' },
] as const;

export type StatutReservation = (typeof STATUTS_RESERVATION)[number]['id'];

// ─── Statuts de facture ──────────────────────────────────────────────────────

export const STATUTS_FACTURE = [
  { id: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'partiel', label: 'Partiel', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'paye', label: 'Payé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
] as const;

export type StatutFacture = (typeof STATUTS_FACTURE)[number]['id'];

// ─── Modes de paiement ──────────────────────────────────────────────────────

export const MODES_PAIEMENT = [
  { id: 'especes', label: 'Espèces', icon: 'Banknote' },
  { id: 'mobile_money', label: 'Mobile Money', icon: 'Smartphone' },
  { id: 'virement', label: 'Virement bancaire', icon: 'Building' },
  { id: 'cheque', label: 'Chèque', icon: 'FileText' },
] as const;

export type ModePaiement = (typeof MODES_PAIEMENT)[number]['id'];

// ─── Villes de Côte d'Ivoire ─────────────────────────────────────────────────

export const VILLES_CI = [
  'Abidjan',
  'Bouaké',
  'Yamoussoukro',
  'Korhogo',
  'San-Pédro',
  'Daloa',
  'Man',
  'Gagnoa',
  'Abengourou',
  'Divo',
] as const;

export type VilleCI = (typeof VILLES_CI)[number];

// ─── Pièces d'identité ───────────────────────────────────────────────────────

export const PIECES_IDENTITE = [
  { id: 'CNI', label: 'Carte Nationale d\'Identité' },
  { id: 'Passeport', label: 'Passeport' },
  { id: 'Permis', label: 'Permis de conduire' },
  { id: 'Carte_Sejour', label: 'Carte de séjour' },
  { id: 'Autre', label: 'Autre' },
] as const;

export type PieceIdentite = (typeof PIECES_IDENTITE)[number]['id'];

// ─── Rôles utilisateurs ──────────────────────────────────────────────────────

export const ROLES = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Administrateur',
    description: 'Propriétaire du SaaS OGOUTEL_Prestige',
    niveau: 0,
  },
  admin_hotel: {
    id: 'admin_hotel',
    label: 'Administrateur d\'hôtel',
    description: 'Propriétaire / gérant principal de l\'établissement',
    niveau: 1,
  },
  gerant: {
    id: 'gerant',
    label: 'Gérant',
    description: 'Gérant de département ou adjoint',
    niveau: 2,
  },
  receptionniste: {
    id: 'receptionniste',
    label: 'Réceptionniste',
    description: 'Personnel de réception et accueil',
    niveau: 3,
  },
} as const;

export type RoleUtilisateur = keyof typeof ROLES;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne le libellé d'un type de chambre */
export function getLibelleTypeChambre(id: TypeChambre): string {
  return TYPES_CHAMBRES.find((t) => t.id === id)?.label ?? id;
}

/** Retourne le libellé d'un statut de chambre */
export function getLibelleStatutChambre(id: StatutChambre): string {
  return STATUTS_CHAMBRE.find((s) => s.id === id)?.label ?? id;
}

/** Retourne le libellé d'un statut de réservation */
export function getLibelleStatutReservation(id: StatutReservation): string {
  return STATUTS_RESERVATION.find((s) => s.id === id)?.label ?? id;
}

/** Retourne le libellé d'un statut de facture */
export function getLibelleStatutFacture(id: StatutFacture): string {
  return STATUTS_FACTURE.find((s) => s.id === id)?.label ?? id;
}

/** Retourne le libellé d'un mode de paiement */
export function getLibelleModePaiement(id: ModePaiement): string {
  return MODES_PAIEMENT.find((m) => m.id === id)?.label ?? id;
}

/** Retourne le libellé d'une pièce d'identité */
export function getLibellePieceIdentite(id: PieceIdentite): string {
  return PIECES_IDENTITE.find((p) => p.id === id)?.label ?? id;
}

/** Formate un prix en FCFA */
export function formaterPrix(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

/** Vérifie si un rôle a accès à un niveau minimum */
export function aAccesNiveau(roleActuel: RoleUtilisateur, niveauMin: number): boolean {
  return ROLES[roleActuel].niveau <= niveauMin;
}

// ─── Statuts de demande d'abonnement ──────────────────────────────────────

export const STATUTS_DEMANDE = [
  { id: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'contacte', label: 'Contacté', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'paye', label: 'Payé', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'active', label: 'Actif', color: 'bg-purple-100 text-purple-800 border-purple-200' },
] as const;

export type StatutDemande = (typeof STATUTS_DEMANDE)[number]['id'];

/** Retourne le libellé d'un statut de demande */
export function getLibelleStatutDemande(id: StatutDemande): string {
  return STATUTS_DEMANDE.find((s) => s.id === id)?.label ?? id;
}
