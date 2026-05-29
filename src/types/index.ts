// ============================================
// OGOUTEL_Prestige - Types & Interfaces
// Application SaaS de Gestion Hôtelière
// ============================================

import type {
  PlanId,
  TypeChambre,
  StatutChambre,
  StatutReservation,
  StatutFacture,
  ModePaiement,
  PieceIdentite,
  RoleUtilisateur,
  VilleCI,
} from '@/lib/constants';

// ─── Utilisateur & Authentification ──────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: RoleUtilisateur;
  hotel_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
  profile: Profile | null;
}

// ─── Hôtel ───────────────────────────────────────────────────────────────────

export interface Hotel {
  id: string;
  nom: string;
  adresse: string;
  ville: VilleCI;
  quartier: string;
  telephone: string;
  email: string;
  logo_url: string | null;
  plan: PlanId;
  admin_id: string;
  nombre_chambres: number;
  est_actif: boolean;
  date_debut_abonnement: string;
  date_fin_abonnement: string;
  created_at: string;
}

/** Hôtel avec infos de l'administrateur */
export interface HotelWithAdmin extends Hotel {
  admin?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

// ─── Chambre ─────────────────────────────────────────────────────────────────

export interface Chambre {
  id: string;
  hotel_id: string;
  numero: string;
  type: TypeChambre;
  prix_nuit: number;
  statut: StatutChambre;
  etage: number;
  description: string | null;
  equipements: string[]; // JSON array
  photo_url: string | null;
  created_at: string;
}

/** Chambre avec relations */
export interface ChambreWithReservations extends Chambre {
  reservations?: Reservation[];
  hotel?: {
    id: string;
    nom: string;
  };
}

// ─── Client ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  hotel_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  piece_identite_type: PieceIdentite;
  piece_identite_numero: string;
  nationalite: string;
  ville_residence: string;
  created_at: string;
}

/** Client avec ses réservations */
export interface ClientWithReservations extends Client {
  reservations?: Reservation[];
}

/** Nom complet calculé */
export type ClientNomComplet = Pick<Client, 'nom' | 'prenom'>;

// ─── Réservation ────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  hotel_id: string;
  chambre_id: string;
  client_id: string;
  receptionniste_id: string | null;
  date_arrivee: string;
  date_depart: string;
  nombre_nuits: number;
  prix_nuit: number;
  montant_total: number;
  montant_paye: number;
  statut: StatutReservation;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Réservation avec relations */
export interface ReservationWithRelations extends Reservation {
  chambre?: Chambre;
  client?: Client;
  receptionniste?: {
    id: string;
    full_name: string;
  };
  factures?: Facture[];
}

// ─── Facture ────────────────────────────────────────────────────────────────

export interface Facture {
  id: string;
  hotel_id: string;
  reservation_id: string;
  client_id: string;
  numero_facture: string;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  montant_ttc: number;
  statut_paiement: StatutFacture;
  mode_paiement: ModePaiement;
  created_at: string;
}

/** Facture avec relations */
export interface FactureWithRelations extends Facture {
  reservation?: Reservation;
  client?: Client;
}

// ─── Personnel d'hôtel ──────────────────────────────────────────────────────

export interface PersonnelHotel {
  id: string;
  hotel_id: string;
  user_id: string;
  role: Exclude<RoleUtilisateur, 'super_admin'>; // admin_hotel | gerant | receptionniste
  nom_complet: string;
  telephone: string;
  email: string;
  est_actif: boolean;
  created_by: string;
  created_at: string;
}

/** Personnel avec infos utilisateur */
export interface PersonnelHotelWithUser extends PersonnelHotel {
  user?: {
    id: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

// ─── Demande d'abonnement (landing page) ────────────────────────────────────

export type StatutDemande = 'en_attente' | 'contacte' | 'paye' | 'active';

export interface AbonnementDemande {
  id: string;
  nom_complet: string;
  email: string;
  telephone: string;
  nom_hotel: string;
  ville: string;
  quartier: string | null;
  nombre_chambres: number | null;
  plan_choisi: 'basique' | 'standard' | 'premium';
  message: string | null;
  statut: StatutDemande;
  notes_admin: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Code d'accès ───────────────────────────────────────────────────────────

export interface CodeAcces {
  id: string;
  code: string;
  plan: PlanId;
  demande_id: string | null;
  email_destinataire: string;
  nom_hotel: string;
  est_utilise: boolean;
  utilise_par: string | null;
  date_expiration: string;
  created_at: string;
  used_at: string | null;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type TypeNotification =
  | 'reservation_nouvelle'
  | 'reservation_annulee'
  | 'checkin'
  | 'checkout'
  | 'facture_impayee'
  | 'abonnement_expiration'
  | 'personnel_ajoute'
  | 'systeme';

export interface Notification {
  id: string;
  user_id: string;
  hotel_id: string | null;
  type: TypeNotification;
  titre: string;
  message: string;
  lien?: string | null;
  est_lue: boolean;
  created_at: string;
}

// ─── Dashboard / Statistiques ───────────────────────────────────────────────

export interface StatsDashboard {
  chambres_total: number;
  chambres_disponibles: number;
  chambres_occupees: number;
  chambres_maintenance: number;
  reservations_en_cours: number;
  reservations_aujourdhui: number;
  revenus_mois: number;
  revenus_annee: number;
  taux_occupation: number;
}

export interface RevenuJournalier {
  date: string;
  montant: number;
}

export interface TopChambre {
  chambre: Chambre;
  nombre_reservations: number;
  revenu_total: number;
}

// ─── Formulaires ────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  code_acces: string;
  nom_complet: string;
  email: string;
  telephone: string;
  password: string;
  confirm_password: string;
}

export interface ContactFormData {
  nom_complet: string;
  email: string;
  telephone: string;
  nom_hotel: string;
  ville: string;
  quartier: string;
  nombre_chambres: number;
  plan_choisi: 'basique' | 'standard' | 'premium';
  message: string;
}

export interface ChambreFormData {
  numero: string;
  type: TypeChambre;
  prix_nuit: number;
  etage: number;
  description?: string;
  equipements: string[];
}

export interface ReservationFormData {
  chambre_id: string;
  client_id: string;
  date_arrivee: string;
  date_depart: string;
  nombre_nuits: number;
  prix_nuit: number;
  montant_total: number;
  notes?: string;
}

export interface ClientFormData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  piece_identite_type: PieceIdentite;
  piece_identite_numero: string;
  nationalite: string;
  ville_residence: string;
}

export interface FactureFormData {
  reservation_id: string;
  montant_ht: number;
  taux_tva: number;
  mode_paiement: ModePaiement;
}

export interface PersonnelFormData {
  nom_complet: string;
  email: string;
  telephone: string;
  role: Exclude<RoleUtilisateur, 'super_admin'>;
}

// ─── Pagination & Filtres ────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limite: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limite: number;
  total_pages: number;
}

export interface FiltresReservation {
  statut?: StatutReservation;
  date_debut?: string;
  date_fin?: string;
  chambre_id?: string;
  client_id?: string;
}

export interface FiltresChambre {
  type?: TypeChambre;
  statut?: StatutChambre;
  etage?: number;
  prix_min?: number;
  prix_max?: number;
}

// ─── API Responses ──────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
