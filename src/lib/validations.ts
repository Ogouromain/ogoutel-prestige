// ============================================
// OGOUTEL_Prestige - Schémas de Validation (Zod v4)
// Centralisation de toutes les validations
// ⚠️ Utilise Zod v4 : import depuis 'zod/v4'
// ============================================

import { z } from 'zod/v4';
import type {
  TypeChambre,
  PlanId,
  ModePaiement,
  PieceIdentite,
} from '@/lib/constants';

// ─── Listes de valeurs autorisées ──────────────────────────────────────────────

/** Types de chambres autorisés */
export const TYPES_CHAMBRES_LIST = [
  'simple',
  'double',
  'suite',
  'vip',
  'familiale',
] as const;

/** Plans d'abonnement autorisés */
export const PLANS_ABONNEMENT_LIST = ['basique', 'standard', 'premium'] as const;

/** Modes de paiement autorisés */
export const MODES_PAIEMENT_LIST = [
  'especes',
  'mobile_money',
  'virement',
  'cheque',
  'carte',
] as const;

/** Pièces d'identité autorisées */
export const PIECES_IDENTITE_LIST = [
  'CNI',
  'Passeport',
  'Permis',
  'Carte_Sejour',
  'Autre',
] as const;

// ─── Règles réutilisables ──────────────────────────────────────────────────────

/** Mot de passe : min 8 caractères, au moins une majuscule, une minuscule et un chiffre */
const passwordRule = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

/** Format téléphone Côte d'Ivoire : +225 XX XX XX XX */
const telephoneRule = z
  .string()
  .regex(
    /^\+225\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/,
    "Le téléphone doit être au format +225 XX XX XX XX"
  );

/** Format code d'accès OGT-XXXX-XXXX */
const codeAccesRule = z
  .string()
  .regex(
    /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    "Le code d'accès doit être au format OGT-XXXX-XXXX"
  );

/** Adresse e-mail valide */
const emailRule = z.email("L'adresse e-mail n'est pas valide");

/** Montant positif */
const montantPositif = z.number().positive('Le montant doit être strictement positif');

// ─── 1. Login ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

// ─── 2. Inscription ──────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    code_acces: codeAccesRule,
    nom_complet: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
    email: emailRule,
    telephone: telephoneRule,
    password: passwordRule,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

// ─── 3. Contact / Abonnement ──────────────────────────────────────────────────

export const contactSubscriptionSchema = z.object({
  nom_complet: z
    .string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: emailRule,
  telephone: telephoneRule,
  nom_hotel: z
    .string()
    .min(2, "Le nom de l'hôtel doit contenir au moins 2 caractères"),
  ville: z.string().min(2, 'La ville doit être spécifiée'),
  quartier: z.string().min(2, 'Le quartier doit être spécifié'),
  nombre_chambres: z
    .number({ error: 'Le nombre de chambres est requis' })
    .int('Le nombre de chambres doit être un entier')
    .positive('Le nombre de chambres doit être positif'),
  plan_choisi: z.enum(PLANS_ABONNEMENT_LIST, {
    error: 'Le plan choisi doit être basique, standard ou premium',
  }),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

// ─── 4. Chambre ───────────────────────────────────────────────────────────────

export const chambreSchema = z.object({
  numero: z.string().min(1, 'Le numéro de chambre est requis'),
  type: z.enum(TYPES_CHAMBRES_LIST, {
    error: "Le type de chambre doit être simple, double, suite, vip ou familiale",
  }),
  prix_nuit: z
    .number({ error: 'Le prix par nuit est requis' })
    .positive('Le prix par nuit doit être positif'),
  etage: z
    .number({ error: "L'étage est requis" })
    .int("L'étage doit être un entier")
    .min(0, "L'étage ne peut pas être négatif"),
  description: z.string().optional(),
  equipements: z.array(z.string()).default([]),
});

// ─── 5. Réservation ────────────────────────────────────────────────────────────

export const reservationSchema = z
  .object({
    chambre_id: z.string().min(1, "L'identifiant de la chambre est requis"),
    client_id: z.string().min(1, "L'identifiant du client est requis"),
    date_arrivee: z.string().min(1, "La date d'arrivée est requise"),
    date_depart: z.string().min(1, "La date de départ est requise"),
    prix_nuit: z
      .number({ error: 'Le prix par nuit est requis' })
      .positive('Le prix par nuit doit être positif'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const arrivee = new Date(data.date_arrivee);
      const depart = new Date(data.date_depart);
      return depart > arrivee;
    },
    {
      message: "La date de départ doit être postérieure à la date d'arrivée",
      path: ['date_depart'],
    }
  );

// ─── 6. Client ─────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().optional(),
  telephone: telephoneRule.or(z.literal('')).optional(),
  email: emailRule.or(z.literal('')).optional(),
  piece_identite_type: z.enum(PIECES_IDENTITE_LIST, {
    error: 'Le type de pièce d\'identité doit être CNI, Passeport, Permis, Carte_Sejour ou Autre',
  }).optional(),
  piece_identite_numero: z.string().optional(),
  nationality: z.string().min(1, 'La nationalité est requise'),
  ville_residence: z.string().optional(),
});

// ─── 6b. Check-in ────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  reservation_id: z.string().min(1, "L'identifiant de la réservation est requis"),
  chambre_id: z.string().min(1, "L'identifiant de la chambre est requis"),
  client_id: z.string().min(1, "L'identifiant du client est requis"),
  date_arrivee: z.string().min(1, "La date d'arrivée est requise"),
  date_depart: z.string().min(1, "La date de départ est requise"),
  nombre_nuits: z
    .number({ error: 'Le nombre de nuits est requis' })
    .int('Le nombre de nuits doit être un entier')
    .min(1, 'Le nombre de nuits doit être au moins 1'),
  prix_nuit: z
    .number({ error: 'Le prix par nuit est requis' })
    .positive('Le prix par nuit doit être positif'),
  notes: z.string().optional(),
});

// ─── 7. Facture ──────────────────────────────────────────────────────────────

export const factureSchema = z.object({
  reservation_id: z.string().min(1, "L'identifiant de la réservation est requis"),
  montant_ht: z
    .number({ error: 'Le montant hors taxes est requis' })
    .positive('Le montant hors taxes doit être positif'),
  taux_tva: z
    .number({ error: 'Le taux de TVA est requis' })
    .min(0, 'Le taux de TVA ne peut pas être négatif')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100 %'),
  mode_paiement: z.enum(MODES_PAIEMENT_LIST, {
    error: 'Le mode de paiement doit être especes, mobile_money, virement, cheque ou carte',
  }),
});

// ─── 7b. Dépenses / Charges ─────────────────────────────────────────────────

export const addExpenseSchema = z.object({
  libelle: z.string().min(2, "Le libellé de la dépense est requis"),
  montant: z
    .number({ error: 'Le montant est requis' })
    .positive('Le montant doit être strictement positif'),
  categorie: z.string().min(1, 'La catégorie est requise'),
  date_depense: z.string().min(1, "La date de la dépense est requise"),
  description: z.string().optional(),
  mode_paiement: z.enum(MODES_PAIEMENT_LIST, {
    error: 'Le mode de paiement doit être especes, mobile_money, virement, cheque ou carte',
  }).optional(),
  fournisseur: z.string().optional(),
});

// ─── 8. Personnel ─────────────────────────────────────────────────────────────

export const personnelSchema = z.object({
  nom_complet: z
    .string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: emailRule.or(z.literal('')).optional(),
  telephone: telephoneRule.or(z.literal('')).optional(),
  role: z.enum(['gerant', 'receptionniste'] as const, {
    error: "Le rôle doit être gérant ou réceptionniste",
  }),
});

// ─── 8b. Abonnement (landing page) ───────────────────────────────────────────

export const subscriptionFormSchema = contactSubscriptionSchema;

// ─── 9. Code d'accès ──────────────────────────────────────────────────────────

export const activationCodeSchema = z.object({
  code: codeAccesRule,
});

// ─── 10. Pagination ──────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int('La page doit être un entier').positive('La page doit être positive').default(1),
  limite: z.coerce
    .number()
    .int('La limite doit être un entier')
    .positive('La limite doit être positive')
    .max(100, 'La limite ne peut pas dépasser 100')
    .default(20),
});

// ─── Types inférés ────────────────────────────────────────────────────────────

/** Type d'entrée du formulaire de connexion */
export type LoginInput = z.input<typeof loginSchema>;
/** Type de sortie validée du formulaire de connexion */
export type LoginOutput = z.output<typeof loginSchema>;

/** Type d'entrée du formulaire d'inscription */
export type RegisterInput = z.input<typeof registerSchema>;
/** Type de sortie validée du formulaire d'inscription */
export type RegisterOutput = z.output<typeof registerSchema>;

/** Type d'entrée du formulaire de contact/abonnement */
export type ContactSubscriptionInput = z.input<typeof contactSubscriptionSchema>;
/** Type de sortie validée du formulaire de contact/abonnement */
export type ContactSubscriptionOutput = z.output<typeof contactSubscriptionSchema>;

/** Type d'entrée du formulaire de chambre */
export type ChambreInput = z.input<typeof chambreSchema>;
/** Type de sortie validée du formulaire de chambre */
export type ChambreOutput = z.output<typeof chambreSchema>;

/** Type d'entrée du formulaire de réservation */
export type ReservationInput = z.input<typeof reservationSchema>;
/** Type de sortie validée du formulaire de réservation */
export type ReservationOutput = z.output<typeof reservationSchema>;

/** Type d'entrée du formulaire client */
export type ClientInput = z.input<typeof clientSchema>;
/** Type de sortie validée du formulaire client */
export type ClientOutput = z.output<typeof clientSchema>;

/** Type d'entrée du formulaire de facture */
export type FactureInput = z.input<typeof factureSchema>;
/** Type de sortie validée du formulaire de facture */
export type FactureOutput = z.output<typeof factureSchema>;

/** Type d'entrée du formulaire personnel */
export type PersonnelInput = z.input<typeof personnelSchema>;
/** Type de sortie validée du formulaire personnel */
export type PersonnelOutput = z.output<typeof personnelSchema>;

/** Type d'entrée du formulaire check-in */
export type CheckInInput = z.input<typeof checkInSchema>;
/** Type de sortie validée du formulaire check-in */
export type CheckInOutput = z.output<typeof checkInSchema>;

/** Type d'entrée du formulaire dépense */
export type AddExpenseInput = z.input<typeof addExpenseSchema>;
/** Type de sortie validée du formulaire dépense */
export type AddExpenseOutput = z.output<typeof addExpenseSchema>;

/** Type d'entrée du code d'activation */
export type ActivationCodeInput = z.input<typeof activationCodeSchema>;
/** Type de sortie validée du code d'activation */
export type ActivationCodeOutput = z.output<typeof activationCodeSchema>;

/** Type d'entrée de la pagination */
export type PaginationInput = z.input<typeof paginationSchema>;
/** Type de sortie validée de la pagination */
export type PaginationOutput = z.output<typeof paginationSchema>;
