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
  { id: 'reservee', label: 'Réservée', color: 'bg-blue-500', textColor: 'text-blue-500' },
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
  { id: 'carte', label: 'Carte bancaire', icon: 'CreditCard' },
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

/** Retourne le libellé d'une catégorie de dépense */
export function getLibelleCategorieDepense(id: string): string {
  return CATEGORIES_DEPENSES.find((c) => c.id === id)?.label ?? id;
}

// ─── Application ─────────────────────────────────────────────────────────────

/** Nom de l'application (public) */
export const APP_NAME: string = process.env.NEXT_PUBLIC_APP_NAME ?? "OGOUTEL_Prestige";

/** URL de l'application */
export const APP_URL: string = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Email de l'administrateur */
export const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL ?? "omouitsi@gmail.com";

/** Numéro WhatsApp (format international, sans +) */
export const WHATSAPP_NUMBER: string = process.env.WHATSAPP_NUMBER ?? "2250576103277";

/** Lien WhatsApp direct */
export const WHATSAPP_LINK: string = process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? `https://wa.me/${WHATSAPP_NUMBER}`;

// ─── Abonnement & Sécurité ───────────────────────────────────────────────

/** Durée de validité du code d'activation (en jours) */
export const CODE_ACTIVATION_EXPIRATION_DAYS: number = parseInt(
  process.env.CODE_ACTIVATION_EXPIRATION_DAYS ?? "30",
  10
);

/** Délai avant suspension après expiration abonnement (en jours) */
export const ABONNEMENT_SUSPENSION_DELAY: number = parseInt(
  process.env.ABONNEMENT_SUSPENSION_DELAY ?? "7",
  10
);

/** Format du code d'activation OGT-XXXX-XXXX */
export const CODE_ACTIVATION_FORMAT = /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Caractères utilisés pour générer les codes d'activation */
export const CODE_ACTIVATION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ─── Pagination ────────────────────────────────────────────────────────────

/** Page par défaut pour la pagination */
export const PAGE_PAR_DEFAUT = 1;

/** Nombre d'éléments par page par défaut */
export const LIMITE_PAR_DEFAUT = 20;

/** Nombre maximum d'éléments par page */
export const LIMITE_MAX = 100;

// ─── Notifications ───────────────────────────────────────────────────────

/** Types de notifications avec libellés et icônes */
export const TYPES_NOTIFICATIONS = {
  reservation_nouvelle: { label: "Nouvelle réservation", icon: "CalendarPlus", color: "text-sky-500" },
  reservation_annulee: { label: "Réservation annulée", icon: "CalendarX", color: "text-red-500" },
  checkin: { label: "Check-in effectué", icon: "LogIn", color: "text-emerald-500" },
  checkout: { label: "Check-out effectué", icon: "LogOut", color: "text-gray-500" },
  facture_impayee: { label: "Facture impayée", icon: "Receipt", color: "text-amber-500" },
  abonnement_expiration: { label: "Abonnement expire bientôt", icon: "Clock", color: "text-orange-500" },
  personnel_ajoute: { label: "Nouveau personnel", icon: "UserPlus", color: "text-violet-500" },
  systeme: { label: "Notification système", icon: "Bell", color: "text-gray-500" },
} as const;

export type TypeNotification = keyof typeof TYPES_NOTIFICATIONS;

// ─── Equipements Chambres ───────────────────────────────────────────────

/** Liste des équipements disponibles pour les chambres */
export const EQUIPEMENTS_CHAMBRE = [
  { id: "climatisation", label: "Climatisation", icon: "Snowflake" },
  { id: "wifi", label: "WiFi", icon: "Wifi" },
  { id: "tv", label: "Télévision", icon: "Tv" },
  { id: "minibar", label: "Minibar", icon: "Wine" },
  { id: "coffre", label: "Coffre-fort", icon: "Lock" },
  { id: "baignoire", label: "Baignoire", icon: "Bath" },
  { id: "douche", label: "Douche", icon: "ShowerHead" },
  { id: "balcon", label: "Balcon", icon: "Building" },
  { id: "vue_mer", label: "Vue mer", icon: "Waves" },
  { id: "telephone_chambre", label: "Téléphone chambre", icon: "Phone" },
  { id: "seche_cheveux", label: "Sèche-cheveux", icon: "Wind" },
  { id: "machine_cafe", label: "Machine à café", icon: "Coffee" },
] as const;

export type EquipementChambre = (typeof EQUIPEMENTS_CHAMBRE)[number]["id"];

// ─── Catégories de dépenses ──────────────────────────────────────────────

export const CATEGORIES_DEPENSES = [
  { id: 'fournitures', label: 'Fournitures', icon: 'Package' },
  { id: 'entretien', label: 'Entretien & nettoyage', icon: 'Sparkles' },
  { id: 'alimentation', label: 'Alimentation & petit-déjeuner', icon: 'Coffee' },
  { id: 'energie', label: 'Énergie (électricité, eau)', icon: 'Zap' },
  { id: 'telecommunications', label: 'Télécommunications & Internet', icon: 'Wifi' },
  { id: 'maintenance', label: 'Maintenance & réparations', icon: 'Wrench' },
  { id: 'personnel', label: 'Salaires & charges personnel', icon: 'Users' },
  { id: 'marketing', label: 'Marketing & publicité', icon: 'Megaphone' },
  { id: 'assurance', label: 'Assurances', icon: 'Shield' },
  { id: 'loisir', label: 'Loisirs & équipements communs', icon: 'Gamepad2' },
  { id: 'transport', label: 'Transport & logistique', icon: 'Truck' },
  { id: 'linge', label: 'Linge & blanchisserie', icon: 'Shirt' },
  { id: 'taxes', label: 'Taxes & impôts', icon: 'Receipt' },
  { id: 'autre', label: 'Autre', icon: 'MoreHorizontal' },
] as const;

export type CategorieDepense = (typeof CATEGORIES_DEPENSES)[number]['id'];

// ─── Nationalités fréquentes en Côte d'Ivoire ────────────────────────────

export const NATIONALITES_CI = [
  'Ivoirienne',
  'Malianne',
  'Burkinabè',
  'Ghanéenne',
  'Guinéenne',
  'Sénégalaise',
  'Nigériane',
  'Camerounaise',
  'Liberienne',
  'Sierraléonaise',
  'Togolaise',
  'Béninoise',
  'Congolaise',
  'Congolaise (RDC)',
  'Française',
  'Américaine',
  'Britannique',
  'Allemande',
  'Belge',
  'Suisse',
  'Canadienne',
  'Chinoise',
  'Indienne',
  'Libanaise',
  'Marocaine',
  'Tunisienne',
  'Algérienne',
  'Comorienne',
  'Mauritanienne',
  'Autre',
] as const;

export type Nationalite = (typeof NATIONALITES_CI)[number];

// ─── Jours de la semaine (français) ──────────────────────────────────────

export const JOURS_SEMAINE = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

/** Abréviations des jours */
export const JOURS_SEMAINE_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

// ─── Couleurs du thème ─────────────────────────────────────────────────

/** Palette de couleurs OGOUTEL_Prestige */
export const COULEURS_THEME = {
  /** Or principal — branding, CTA, accents */
  gold: "#D4AF37",
  /** Or sombre — hover states */
  goldDark: "#C49E2E",
  /** Or clair — fonds subtils */
  goldLight: "#F5EED6",
  /** Vert Côte d'Ivoire — headers, accents secondaires */
  greenCI: "#1B4332",
  /** Vert clair — badges succès */
  greenCILight: "#D8F3DC",
  /** Orange — alertes, badges attention */
  orange: "#F77F00",
  /** Noir — texte principal */
  black: "#0A0A0A",
  /** Gris foncé — texte secondaire */
  grayDark: "#374151",
  /** Gris clair — fonds, bordures */
  grayLight: "#F3F4F6",
  /** Blanc — fonds cartes */
  white: "#FFFFFF",
  /** Fond page */
  background: "#F8F9FA",
} as const;
