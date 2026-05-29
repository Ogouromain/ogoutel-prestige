import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { PLANS_ABONNEMENT, STATUTS_CHAMBRE } from "@/lib/constants";
import type { PlanId, StatutChambre } from "@/lib/constants";

// ─── Classes Tailwind ────────────────────────────────────────────────────────

/** Fusionne intelligemment des classes Tailwind (clsx + tailwind-merge) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatage Monétaire ─────────────────────────────────────────────────────

/** Formate un nombre en FCFA : 45000 → "45 000 FCFA" */
export function formatCFA(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
}

// ─── Formatage Dates ─────────────────────────────────────────────────────────

/** Formate une date en français long : "2025-01-15" → "15 janvier 2025" */
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "d MMMM yyyy", { locale: fr });
  } catch {
    return date;
  }
}

/** Formate une date en français court : "2025-01-15" → "15/01/2025" */
export function formatDateCourt(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
}

/** Formate une date avec heure : "2025-01-15T14:30:00" → "15/01/2025 à 14:30" */
export function formatDateHeure(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy à HH:mm", { locale: fr });
  } catch {
    return date;
  }
}

/** Formate un horaire : "2025-01-15T14:30:00" → "14h30" */
export function formatHeure(date: string): string {
  try {
    return format(parseISO(date), "HH'h'mm");
  } catch {
    return date;
  }
}

// ─── Calculs Réservation ─────────────────────────────────────────────────────

/** Calcule le nombre de nuits entre deux dates */
export function calculerNuits(dateArrivee: string, dateDepart: string): number {
  try {
    const nuits = differenceInDays(parseISO(dateDepart), parseISO(dateArrivee));
    return Math.max(0, nuits);
  } catch {
    return 0;
  }
}

/** Calcule le montant total d'une réservation */
export function calculerMontantTotal(prixNuit: number, nombreNuits: number): number {
  return prixNuit * Math.max(0, nombreNuits);
}

// ─── Génération Numéros ──────────────────────────────────────────────────────

/** Génère un numéro de facture : FAC-2025-0001 */
let compteurFacture = 0;

export function genererNumeroFacture(): string {
  const annee = new Date().getFullYear();
  compteurFacture += 1;
  const numero = String(compteurFacture).padStart(4, "0");
  return `FAC-${annee}-${numero}`;
}

/** Génère un numéro de réservation : RES-2025-0001 */
let compteurReservation = 0;

export function genererNumeroReservation(): string {
  const annee = new Date().getFullYear();
  compteurReservation += 1;
  const numero = String(compteurReservation).padStart(4, "0");
  return `RES-${annee}-${numero}`;
}

// ─── Texte & Noms ────────────────────────────────────────────────────────────

/** Retourne les initiales d'un nom : "Kouassi Jean" → "KJ" */
export function getInitiales(nom: string): string {
  if (!nom || !nom.trim()) return "?";
  const parties = nom.trim().split(/\s+/);
  if (parties.length === 1) {
    return parties[0].substring(0, 2).toUpperCase();
  }
  return (parties[0][0] + parties[parties.length - 1][0]).toUpperCase();
}

/** Met en majuscule la première lettre : "abidjan" → "Abidjan" */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Tronque un texte : "Un long texte..." → "Un long..." */
export function tronquer(texte: string, longueurMax: number): string {
  if (!texte || texte.length <= longueurMax) return texte || "";
  return texte.substring(0, longueurMax).trimEnd() + "...";
}

// ─── Statuts & Couleurs ──────────────────────────────────────────────────────

/** Retourne les classes Tailwind pour le badge d'un statut de chambre */
export function getCouleurStatutChambre(statut: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const trouve = STATUTS_CHAMBRE.find((s) => s.id === statut);
  return {
    bg: trouve?.color ?? "bg-gray-100",
    text: trouve?.textColor ?? "text-gray-800",
    dot: trouve?.color ?? "bg-gray-500",
  };
}

/** Retourne le label et le prix formaté d'un plan d'abonnement */
export function getPlanLabel(plan: string): string {
  const planObj = PLANS_ABONNEMENT[plan as PlanId];
  if (!planObj) return plan;
  return `${planObj.nom} — ${formatCFA(planObj.prix)}/mois`;
}

/** Retourne le nom du plan uniquement */
export function getPlanNom(plan: string): string {
  const planObj = PLANS_ABONNEMENT[plan as PlanId];
  return planObj?.nom ?? plan;
}

/** Retourne la couleur du statut de réservation */
export function getCouleurStatutReservation(statut: string): string {
  const couleurs: Record<string, string> = {
    en_attente: "bg-amber-100 text-amber-800 border-amber-200",
    confirmee: "bg-emerald-100 text-emerald-800 border-emerald-200",
    checkin: "bg-sky-100 text-sky-800 border-sky-200",
    checkout: "bg-gray-100 text-gray-800 border-gray-200",
    annulee: "bg-red-100 text-red-800 border-red-200",
  };
  return couleurs[statut] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

/** Retourne la couleur du statut de facture */
export function getCouleurStatutFacture(statut: string): string {
  const couleurs: Record<string, string> = {
    en_attente: "bg-amber-100 text-amber-800 border-amber-200",
    partiel: "bg-orange-100 text-orange-800 border-orange-200",
    paye: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return couleurs[statut] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

/** Retourne la couleur du statut de demande d'abonnement */
export function getCouleurStatutDemande(statut: string): string {
  const couleurs: Record<string, string> = {
    en_attente: "bg-amber-100 text-amber-800 border-amber-200",
    approuvee: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejetee: "bg-red-100 text-red-800 border-red-200",
    code_envoye: "bg-sky-100 text-sky-800 border-sky-200",
  };
  return couleurs[statut] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

// ─── Validation & Sécurité ──────────────────────────────────────────────────

/** Valide le format d'un numéro de téléphone CI (+225 XX XX XX XX) */
export function validerTelephone(telephone: string): boolean {
  const cleaned = telephone.replace(/[\s.-]/g, "");
  const regex = /^(\+225|00225)?[0-9]{10}$/;
  return regex.test(cleaned);
}

/** Valide le format d'un email */
export function validerEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/** Génère un code aléatoire de N chiffres */
export function genererCode(n: number = 6): string {
  const chiffres = "0123456789";
  let code = "";
  for (let i = 0; i < n; i++) {
    code += chiffres[Math.floor(Math.random() * chiffres.length)];
  }
  return code;
}

// ─── Données & Pagination ────────────────────────────────────────────────────

/** Retourne le nombre total de pages */
export function getTotalPages(total: number, limite: number): number {
  return Math.ceil(total / limite);
}

/** Calcule l'offset pour la pagination SQL */
export function getOffset(page: number, limite: number): number {
  return (page - 1) * limite;
}

/** Retourne le libellé d'un élément par son id dans un tableau */
export function getLibelleParId(
  tableau: ReadonlyArray<{ id: string; label: string }>,
  id: string
): string {
  return tableau.find((item) => item.id === id)?.label ?? id;
}

// ─── Débogage ───────────────────────────────────────────────────────────────

/** Log formaté pour le développement */
export function logDev(label: string, data: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n🔍 [${label}]`);
    console.log(data);
    console.log("");
  }
}
