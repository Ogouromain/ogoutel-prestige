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

// ─── Formatage Téléphone ────────────────────────────────────────────────────

/** Formate un numéro téléphone CI : "002250756103277" → "+225 07 56 10 32 77" */
export function formatPhone(telephone: string): string {
  const cleaned = telephone.replace(/[\s.()-]/g, "");
  // Supprime le préfixe international
  const withoutPrefix = cleaned.replace(/^(\+225|00225)/, "");
  if (withoutPrefix.length === 10) {
    return `+225 ${withoutPrefix.slice(0, 2)} ${withoutPrefix.slice(2, 4)} ${withoutPrefix.slice(4, 6)} ${withoutPrefix.slice(6, 8)} ${withoutPrefix.slice(8, 10)}`;
  }
  // Retourne tel quel si le format n'est pas reconnu
  return telephone;
}

// ─── Plan Features ───────────────────────────────────────────────────────────

/** Retourne les fonctionnalités d'un plan d'abonnement */
export function getPlanFeatures(planId: string): string[] {
  const planObj = PLANS_ABONNEMENT[planId as PlanId];
  return planObj?.fonctionnalites ?? [];
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

// ─── Génération Codes ──────────────────────────────────────────────────────

/** Génère un code d'activation OGT-XXXX-XXXX */
export function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `OGT-${segment()}-${segment()}`;
}

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

// ─── Emails & Contact ──────────────────────────────────────────────────

/** Email de l'administrateur */
export const ADMIN_EMAIL = "omouitsi@gmail.com";

/** Numéro WhatsApp format international */
export const WHATSAPP_NUMBER = "2250576103277";

/** Lien WhatsApp direct */
export const WHATSAPP_LINK = "https://wa.me/2250576103277";

/** Génère un lien WhatsApp avec un message pré-rempli */
export function genererLienWhatsApp(message: string): string {
  const encoded = encodeURIComponent(message);
  return `${WHATSAPP_LINK}?text=${encoded}`;
}

// ─── Sécurité & Tokens ──────────────────────────────────────────────────

/** Masque une partie d'une chaîne : "OGT-AB12-CD34" → "OGT-****-****" */
export function masquerPartie(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) return value;
  const debut = value.substring(0, visibleChars);
  const fin = value.substring(value.length - visibleChars);
  const milieu = "*".repeat(Math.max(4, value.length - visibleChars * 2));
  return `${debut}${milieu}${fin}`;
}

/** Génère un slug à partir d'un texte : "Hotel Le Palmier" → "hotel-le-palmier" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Génère un identifiant court (6 caractères alphanumériques) */
export function genererIdCourt(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/** Vérifie si un objet est un UUID valide */
export function estUUID(value: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(value);
}

// ─── Durée & Temps ────────────────────────────────────────────────────

/** Formate une durée en jours/heures : "3j 5h" */
export function formaterDuree(jours: number): string {
  if (jours <= 0) return "0j";
  if (jours < 1) {
    const heures = Math.round(jours * 24);
    return `${heures}h`;
  }
  return `${jours}j`;
}

/** Calcule le temps écoulé depuis une date : "il y a 5 min" */
export function tempsEcoule(date: string): string {
  try {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHeure = Math.floor(diffMin / 60);
    const diffJour = Math.floor(diffHeure / 24);

    if (diffSec < 60) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHeure < 24) return `il y a ${diffHeure}h`;
    if (diffJour < 7) return `il y a ${diffJour}j`;
    if (diffJour < 30) return `il y a ${Math.floor(diffJour / 7)} sem`;
    return formatDateCourt(date);
  } catch {
    return date;
  }
}

/** Vérifie si une date est dans le passé */
export function estDansLePasse(date: string): boolean {
  try {
    return new Date(date).getTime() < Date.now();
  } catch {
    return false;
  }
}

/** Vérifie si une date est dans les N prochains jours */
export function estProche(date: string, joursMax: number = 7): boolean {
  try {
    const target = new Date(date).getTime();
    const now = Date.now();
    const diff = target - now;
    return diff > 0 && diff <= joursMax * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ─── Tableaux & Données ──────────────────────────────────────────────────

/** Groupe un tableau par une clé */
export function grouperPar<T>(
  tableau: T[],
  cle: keyof T
): Record<string, T[]> {
  return tableau.reduce((acc, item) => {
    const valeur = String(item[cle]);
    if (!acc[valeur]) acc[valeur] = [];
    acc[valeur].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/** Trie un tableau d'objets par une clé */
export function trierPar<T>(
  tableau: T[],
  cle: keyof T,
  ordre: "asc" | "desc" = "asc"
): T[] {
  return [...tableau].sort((a, b) => {
    const valA = a[cle];
    const valB = b[cle];
    if (valA < valB) return ordre === "asc" ? -1 : 1;
    if (valA > valB) return ordre === "asc" ? 1 : -1;
    return 0;
  });
}

/** Supprime les doublons d'un tableau par une clé */
export function dedupliquerPar<T>(tableau: T[], cle: keyof T): T[] {
  const vu = new Set<string>();
  return tableau.filter((item) => {
    const valeur = String(item[cle]);
    if (vu.has(valeur)) return false;
    vu.add(valeur);
    return true;
  });
}

/** Retourne un élément aléatoire d'un tableau */
export function aleatoire<T>(tableau: T[]): T | undefined {
  if (!tableau.length) return undefined;
  return tableau[Math.floor(Math.random() * tableau.length)];
}

/** Exporte un tableau au format CSV */
export function exporterCSV(
  donnees: Record<string, unknown>[],
  nomsColonnes?: string[]
): string {
  if (!donnees.length) return "";
  const colonnes = nomsColonnes ?? Object.keys(donnees[0]);
  const lignes = donnees.map((row) =>
    colonnes
      .map((col) => {
        const valeur = String(row[col] ?? "");
        return valeur.includes(",") || valeur.includes('"')
          ? `"${valeur.replace(/"/g, '""')}"`
          : valeur;
      })
      .join(",")
  );
  return [colonnes.join(","), ...lignes].join("\n");
}

/** Déclenche un téléchargement de fichier dans le navigateur */
export function telechargerFichier(contenu: string, nomFichier: string, type: string = "text/csv"): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomFichier;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
