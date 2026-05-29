# 🏨 OGOUTEL_Prestige

> Le SaaS N°1 de gestion hôtelière en Côte d'Ivoire

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com)
[![Zod](https://img.shields.io/badge/Zod-v4-orange)](https://zod.dev)

---

## 🎯 Présentation

OGOUTEL_Prestige est une plateforme SaaS multi-tenant de gestion hôtelière conçue spécifiquement pour le marché ivoirien. Elle permet aux hôteliers de gérer leurs réservations, chambres, clients, facturation et personnel depuis un seul tableau de bord intelligent.

### Fonctionnalités principales

- 📊 **Tableau de bord intelligent** — Statistiques en temps réel (taux d'occupation, revenus, réservations du jour)
- 🛏️ **Gestion des chambres** — Visualisation du statut (disponible, occupée, maintenance, réservée) avec grille interactive
- 📅 **Réservations** — Création, suivi, check-in / check-out en quelques clics
- 👥 **Gestion des clients** — Fiches complètes avec pièces d'identité, nationalités CI
- 💰 **Facturation & Finances** — Factures automatiques, TVA, dépenses, multi-modes de paiement (Mobile Money, espèces, virement, chèque, carte)
- 👔 **Gestion du personnel** — Comptes réceptionnistes et gérants avec permissions différenciées
- 🔔 **Notifications temps réel** — Alertes Supabase Realtime
- 📈 **Rapports et export** — Statistiques, CSV, données financières, taux d'occupation
- 🔒 **Code d'activation OGT-XXXX-XXXX** — Système d'onboarding sécurisé
- 💬 **WhatsApp intégré** — Support direct via WhatsApp

### 3 Plans d'abonnement

| Plan | Prix | Chambres | Staff | Fonctionnalités clés |
|------|------|----------|-------|----------------------|
| **Basique** | 25 000 FCFA/mois | 20 | 1 admin + 1 réceptionniste | Réservations, chambres, check-in/out, facturation de base |
| **Standard** | 50 000 FCFA/mois | 50 | 1 admin + 1 gérant + 3 réceptionnistes | + Gérants, rapports, clients fidèles, export PDF, support WhatsApp |
| **Premium** | 95 000 FCFA/mois | ∞ | 1 admin + 3 gérants + 10 réceptionnistes | + Multi-établissements, API, Mobile Money, comptabilité avancée, support 24/7 |

---

## 🚀 Installation

### Prérequis

- **Node.js 18+** ou **Bun** (recommandé)
- Un compte **Supabase** (gratuit) — [supabase.com](https://supabase.com)
- Un compte **Resend** (pour les emails) — [resend.com](https://resend.com)

### 1. Cloner le projet

```bash
git clone https://github.com/your-org/ogoutel-prestige.git
cd ogoutel-prestige
```

### 2. Installer les dépendances

```bash
bun install
```

### 3. Configuration des variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec vos clés :

| Variable | Description | Où trouver |
|----------|-------------|-----------|
| `NEXT_PUBLIC_APP_NAME` | Nom de l'application | OGOUTEL_Prestige |
| `NEXT_PUBLIC_APP_URL` | URL publique | http://localhost:3000 |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (⚠️ secrète) | Dashboard → Settings → API |
| `RESEND_API_KEY` | Clé API Resend | resend.com/api-keys |
| `RESEND_FROM_EMAIL` | Email expéditeur vérifié | Resend → Domains |
| `ADMIN_EMAIL` | Email de l'admin | omouitsi@gmail.com |
| `WHATSAPP_NUMBER` | Numéro WhatsApp CI | +2250576103277 |
| `NEXT_PUBLIC_WHATSAPP_LINK` | Lien WhatsApp direct | https://wa.me/2250576103277 |
| `DATABASE_URL` | URL base de données locale | file:./db/custom.db |
| `CODE_ACTIVATION_EXPIRATION_DAYS` | Validité code activation (jours) | 30 |
| `ABONNEMENT_SUSPENSION_DELAY` | Délai avant suspension (jours) | 7 |

### 4. Initialiser la base de données

```bash
# 1. Schéma Supabase (SQL)
# Ouvrir Supabase Dashboard → SQL Editor → Coller supabase/schema.sql
# Ce fichier crée : 11 tables, 12 triggers, 20 RLS policies, 11 fonctions

# 2. Politiques RLS granulaires
# Coller supabase/rls-policies.sql
# 40+ politiques sur 11 tables par rôle

# 3. Si vous utilisez Prisma (local dev)
bun run db:push
```

### 5. Lancer le serveur de développement

```bash
bun run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📁 Structure du projet

```
ogoutel-prestige/
├── .env.local                 # Variables d'environnement (local, ⚠️ gitignore)
├── .env.example               # Template pour GitHub (sans valeurs)
├── next.config.ts             # Configuration Next.js 16
├── package.json               # Dépendances et scripts
├── README.md                  # Ce fichier
│
├── src/
│   ├── app/
│   │   ├── (public)/         # Landing page (sans auth)
│   │   │   ├── layout.tsx     # Layout public
│   │   │   └── page.tsx       # Page d'accueil marketing
│   │   ├── (auth)/           # Pages d'authentification
│   │   │   ├── layout.tsx     # Layout auth
│   │   │   ├── login/         # Connexion
│   │   │   └── register/      # Inscription (avec code d'activation)
│   │   ├── (dashboard)/       # Dashboards protégés (middleware)
│   │   │   ├── super-admin/  # Super administrateur (propriétaire SaaS)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx   # Tableau de bord
│   │   │   │   ├── hotels/   # Gestion hôtels
│   │   │   │   ├── subscriptions/ # Demandes d'abonnement
│   │   │   │   └── activation-codes/ # Codes d'activation
│   │   │   ├── admin/        # Admin d'hôtel
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx   # Tableau de bord
│   │   │   │   ├── rooms/    # Gestion chambres
│   │   │   │   ├── reservations/ # Réservations
│   │   │   │   ├── staff/     # Gestion personnel
│   │   │   │   ├── finances/  # Finances & facturation
│   │   │   │   ├── reports/   # Rapports & statistiques
│   │   │   │   └── settings/  # Paramètres hôtel
│   │   │   └── staff/        # Réceptionniste / Gérant
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx   # Tableau de bord
│   │   │       ├── checkin/   # Check-in
│   │   │       ├── checkout/  # Check-out
│   │   │       ├── rooms/     # État des chambres
│   │   │       └── clients/   # Gestion clients
│   │   ├── suspended/         # Page abonnement suspendu
│   │   ├── not-found.tsx      # Page 404
│   │   ├── error.tsx          # Page d'erreur
│   │   ├── loading.tsx        # Page de chargement
│   │   ├── globals.css        # Styles globaux Tailwind
│   │   └── api/               # API Routes
│   │       ├── admin/         # API admin hôtel (stats, rooms, reservations, staff, finances, settings)
│   │       ├── staff/         # API réceptionniste (checkin, checkout, clients, stats)
│   │       ├── super-admin/   # API super admin (stats, hotels, subscriptions, codes, export)
│   │       ├── send-subscription-email/ # Email d'abonnement
│   │       ├── generate-activation-code/ # Génération code OGT
│   │       ├── validate-activation-code/ # Validation code
│   │       ├── register-user/ # Inscription utilisateur
│   │       ├── send-contact/  # Email contact
│   │       ├── contact/       # Contact landing
│   │       ├── bookings/      # Réservations
│   │       ├── rooms/         # Chambres publiques
│   │       ├── testimonials/  # Témoignages
│   │       └── webhooks/      # Webhooks Resend
│   │
│   ├── components/
│   │   ├── ui/                # Composants shadcn/ui + utilitaires
│   │   │   ├── button.tsx, card.tsx, dialog.tsx, etc.
│   │   │   ├── DataTable.tsx   # Table avancée (TanStack Table)
│   │   │   ├── StatsCard.tsx   # Carte statistique
│   │   │   ├── PageHeader.tsx  # En-tête de page
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── SuccessMessage.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Notifications.tsx
│   │   ├── shared/            # Composants partagés
│   │   ├── landing/           # Landing page (Hero, Features, Pricing, etc.)
│   │   ├── hotel/             # Site hôtel public
│   │   ├── admin/             # Dashboard admin hôtel
│   │   ├── staff/             # Dashboard réceptionniste
│   │   ├── super-admin/       # Dashboard super admin
│   │   └── auth/              # Formulaires authentification
│   │
│   ├── hooks/                 # React hooks globaux
│   │   ├── use-mobile.ts      # Détection mobile
│   │   └── use-toast.ts      # Toast notifications
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Client Supabase navigateur
│   │   │   ├── server.ts      # Client Supabase serveur
│   │   │   └── middleware.ts  # Logique middleware
│   │   ├── hooks/
│   │   │   ├── useAuth.ts     # Hook authentification
│   │   │   ├── useHotel.ts    # Hook données hôtel (Realtime)
│   │   │   └── useSubscription.ts # Hook abonnement & limites
│   │   ├── constants.ts       # Constantes globales (plans, types, villes, nationalités, etc.)
│   │   ├── utils.ts           # Fonctions utilitaires (formatCFA, formatDate, formatPhone, etc.)
│   │   ├── validations.ts     # Schémas Zod v4 (login, register, chambre, réservation, etc.)
│   │   ├── resend.ts          # Configuration email Resend
│   │   ├── auth-helpers.ts    # Helpers serveur (vérification rôles, limites)
│   │   └── db.ts              # Client Prisma (local SQLite)
│   │
│   ├── types/
│   │   └── index.ts           # Types & interfaces TypeScript
│   │
│   └── middleware.ts           # Middleware de sécurité (route protection)
│
├── supabase/
│   ├── schema.sql             # Schéma complet (11 tables, triggers, fonctions)
│   └── rls-policies.sql      # Politiques RLS (40+ politiques par rôle)
│
├── prisma/
│   └── schema.prisma          # Schéma Prisma (local SQLite)
│
└── db/
    └── custom.db              # Base SQLite locale (auto-générée)
```

---

## 🛡️ Architecture des Rôles

### 4 Niveaux de permissions

```
┌─────────────────────────────────────────────────────┐
│  super_admin (niveau 0)                              │
│  ├─ Accès complet à TOUS les hôtels                  │
│  ├─ Gestion des codes d'activation                   │
│  ├─ Validation des demandes d'abonnement             │
│  ├─ Export de données                                │
│  └─ Dashboard : /super-admin                         │
├─────────────────────────────────────────────────────┤
│  admin_hotel (niveau 1)                              │
│  ├─ CRUD complet sur SON hôtel                       │
│  ├─ Gestion : chambres, réservations, clients        │
│  ├─ Finances, facturation, dépenses                  │
│  ├─ Gestion du personnel (gerants, réceptionnistes)  │
│  ├─ Paramètres de l'hôtel                            │
│  └─ Dashboard : /admin                              │
├─────────────────────────────────────────────────────┤
│  gerant (niveau 2)                                  │
│  ├─ Lecture + Modification sur SON hôtel              │
│  ├─ PAS de suppression                               │
│  ├─ Accès : check-in/out, clients, chambres          │
│  └─ Dashboard : /staff                              │
├─────────────────────────────────────────────────────┤
│  receptionniste (niveau 3)                           │
│  ├─ Check-in / Check-out                             │
│  ├─ Gestion clients                                  │
│  ├─ Création réservations                            │
│  ├─ PAS d'accès aux finances                         │
│  └─ Dashboard : /staff                              │
└─────────────────────────────────────────────────────┘
```

### Middleware & Sécurité

- **Protection des routes** par rôle (middleware.ts)
- **Vérification du statut hôtel** (actif / expiré / suspendu)
- **Redirection automatique** vers `/suspended` si abonnement expiré (> 7 jours)
- **Headers de sécurité** : X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Mode dégradé** si Supabase non configuré (données de démonstration)
- **Row Level Security (RLS)** : 40+ politiques sur 11 tables, isolation par `hotel_id`

---

## 🗄️ Base de données (11 tables)

| Table | Description |
|-------|-------------|
| `profils` | Profils utilisateurs (rôles, hôtel associé) |
| `hotels` | Établissements (plan, étoiles, dates d'abonnement) |
| `chambres` | Chambres (type, prix, étage, équipements, statut) |
| `clients` | Clients de l'hôtel (identité, nationalité, contact) |
| `reservations` | Réservations (dates, nuits, montant, statut) |
| `paiements` | Paiements & factures (TVA, mode, statut) |
| `employes` | Personnel d'hôtel (gérants, réceptionnistes) |
| `taches` | Tâches assignées au personnel |
| `codes_acces` | Codes d'activation OGT-XXXX-XXXX |
| `abonnement_demandes` | Demandes d'abonnement depuis la landing |
| `historique_activites` | Journal d'audit / activités |

---

## 🔧 Fichiers de configuration

### `src/lib/constants.ts` — Constantes globales

- `PLANS_ABONNEMENT` — Plans Basique / Standard / Premium (prix, limites, fonctionnalités)
- `TYPES_CHAMBRES` — Simple, Double, Suite, VIP, Familiale
- `STATUTS_CHAMBRE` — Disponible, Occupée, Maintenance, Réservée
- `STATUTS_RESERVATION` — En attente, Confirmée, Check-in, Check-out, Annulée
- `STATUTS_FACTURE` — En attente, Partiel, Payé
- `MODES_PAIEMENT` — Espèces, Mobile Money, Virement, Chèque, Carte
- `VILLES_CI` — 10 villes principales (Abidjan, Bouaké, Yamoussoukro, etc.)
- `PIECES_IDENTITE` — CNI, Passeport, Permis, Carte de séjour, Autre
- `ROLES` — super_admin, admin_hotel, gerant, receptionniste
- `CATEGORIES_DEPENSES` — 14 catégories (fournitures, entretien, alimentation, etc.)
- `NATIONALITES_CI` — 30 nationalités fréquentes en CI
- `EQUIPEMENTS_CHAMBRE` — 12 équipements (climatisation, WiFi, TV, etc.)
- `COULEURS_THEME` — Palette OGOUTEL (or #D4AF37, vert CI #1B4332, etc.)

### `src/lib/utils.ts` — Fonctions utilitaires

| Fonction | Description | Exemple |
|----------|-------------|---------|
| `cn()` | Fusion classes Tailwind | `cn("px-4", condition && "bg-red")` |
| `formatCFA(amount)` | Formate en FCFA | `45000` → `"45 000 FCFA"` |
| `formatDate(date)` | Date en français | `"2025-01-15"` → `"15 janvier 2025"` |
| `formatDateCourt(date)` | Date courte | `"2025-01-15"` → `"15/01/2025"` |
| `formatPhone(phone)` | Téléphone CI formaté | `"002250756103277"` → `"+225 07 56 10 32 77"` |
| `formatDateHeure(date)` | Date + heure | → `"15/01/2025 à 14:30"` |
| `calculerNuits(checkIn, checkOut)` | Nombre de nuits | `2` |
| `getPlanFeatures(planId)` | Fonctionnalités d'un plan | `["Réservations", "Chambres", ...]` |
| `getCouleurStatutChambre(status)` | Couleur badge chambre | `{ bg, text, dot }` |
| `generateActivationCode()` | Code OGT-XXXX-XXXX | `"OGT-A3B2-X9Y1"` |
| `getInitiales(nom)` | Initiales | `"Kouassi Jean"` → `"KJ"` |
| `tronquer(texte, max)` | Tronque texte | `"Un long texte..."` |
| `genererNumeroFacture()` | Numéro facture | `"FAC-2025-0001"` |
| `genererNumeroReservation()` | Numéro réservation | `"RES-2025-0001"` |
| `tempsEcoule(date)` | Temps relatif | `"il y a 5 min"` |
| `exporterCSV(data)` | Export CSV | `string` |
| `telechargerFichier(content, name)` | Téléchargement navigateur | `void` |

### `src/lib/validations.ts` — Schémas Zod v4

| Schéma | Description |
|-------|-------------|
| `loginSchema` | Connexion (email + password) |
| `registerSchema` | Inscription (code + nom + email + téléphone + password + confirmation) |
| `subscriptionFormSchema` | Demande d'abonnement (landing page) |
| `chambreSchema` | Ajout / modification chambre |
| `reservationSchema` | Création réservation (dates validées) |
| `clientSchema` | Fiche client (identité, nationalité) |
| `factureSchema` | Facture (TVA, mode paiement) |
| `checkInSchema` | Enregistrement check-in |
| `addExpenseSchema` | Ajout dépense (catégorie, montant, date) |
| `personnelSchema` | Ajout personnel (gérant / réceptionniste) |
| `activationCodeSchema` | Validation code OGT-XXXX-XXXX |
| `paginationSchema` | Paramètres pagination (page, limite) |

### `src/lib/resend.ts` — Emails transactionnels

- `getResendClient()` — Client Resend (dynamic import, null si non configuré)
- `envoyerEmailAdmin(options)` — Email vers l'administrateur
- `envoyerEmailClient(options)` — Email vers un client

---

## 🎨 Design System

### Palette de couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| **Or** | `#D4AF37` | Branding principal, CTA, accents |
| **Or sombre** | `#C49E2E` | Hover states |
| **Or clair** | `#F5EED6` | Fonds subtils |
| **Vert CI** | `#1B4332` | Headers, accents secondaires |
| **Orange** | `#F77F00` | Alertes, badges attention |
| **Noir** | `#0A0A0A` | Texte principal |

### Typographie

- **Playfair Display** — Titres (serif élégant)
- **Inter** — Corps de texte (sans-serif lisible)

### Composants

- **shadcn/ui** (style New York) — Base de tous les composants
- **Lucide React** — Icônes
- **Framer Motion** — Animations et transitions
- **Recharts** — Graphiques et visualisations

---

## 🛠️ Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 16.1 (Turbopack) | Framework full-stack App Router |
| **TypeScript** | 5 | Typage strict |
| **TailwindCSS** | 4 | Styles utilitaires |
| **shadcn/ui** | New York | Composants UI |
| **Supabase** | PostgreSQL 15 | Auth + BDD + Realtime |
| **Zod** | v4 (`zod/v4`) | Validation formulaires & API |
| **react-hook-form** | 7 | Gestion formulaires |
| **Resend** | 6 | Emails transactionnels |
| **recharts** | 2 | Graphiques & visualisations |
| **framer-motion** | 12 | Animations |
| **Zustand** | 5 | State management client |
| **TanStack Query** | 5 | Server state |
| **TanStack Table** | 8 | DataTable avancé |
| **react-hot-toast** | 2 | Notifications toast |
| **Prisma** | 6 | ORM (local SQLite) |
| **date-fns** | 4 | Formatage dates (locale fr) |
| **Lucide React** | — | Icônes |
| **Bun** | — | Runtime JavaScript |

---

## 🚀 Déploiement

### Vercel (recommandé)

```bash
# 1. Installer Vercel CLI
bun add -g vercel

# 2. Déployer
vercel

# 3. Variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
# ... etc.
```

### Production (standalone)

```bash
# Build
bun run build

# Start (production)
NODE_ENV=production bun .next/standalone/server.js
```

### Docker (optionnel)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install
COPY . .
RUN bun run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", ".next/standalone/server.js"]
```

---

## 📧 Contact & Support

- 📧 **Email** : omouitsi@gmail.com
- 💬 **WhatsApp** : [+225 0576103277](https://wa.me/2250576103277)
- 🌍 **Pays** : Côte d'Ivoire 🇨🇮

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © 2025 OGOUTEL_Prestige.
