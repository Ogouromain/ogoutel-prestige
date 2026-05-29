# 🏨 OGOUTEL_Prestige

> Le SaaS N°1 de gestion hôtelière en Côte d'Ivoire

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com)

---

## 🎯 Présentation

OGOUTEL_Prestige est une plateforme SaaS multi-tenant de gestion hôtelière conçue pour le marché ivoirien. Elle permet aux hôteliers de gérer leurs réservations, chambres, clients, facturation et personnel depuis un seul tableau de bord.

### Fonctionnalités principales

- 📊 **Tableau de bord intelligent** — Statistiques en temps réel (taux d'occupation, revenus, etc.)
- 🛏️ **Gestion des chambres** — Visualisation du statut (disponible, occupée, maintenance, réservée)
- 📅 **Réservations** — Création, suivi, check-in / check-out en quelques clics
- 👥 **Gestion des clients** — Fiches complètes avec pièces d'identité
- 💰 **Facturation** — Factures automatiques, TVA, multi-modes de paiement (Mobile Money, espèces, etc.)
- 👔 **Gestion du personnel** — Comptes réceptionnistes et gérants avec permissions différenciées
- 🔔 **Notifications temps réel** — Alertes Supabase Realtime
- 📈 **Rapports et export** — Statistiques, CSV, données financières

### 3 Plans d'abonnement

| Plan | Prix | Chambres | Staff |
|------|------|----------|-------|
| Basique | 25 000 FCFA/mois | 20 | 1 admin + 1 réceptionniste |
| Standard | 50 000 FCFA/mois | 50 | 1 admin + 1 gérant + 3 réceptionnistes |
| Premium | 95 000 FCFA/mois | ∞ | 1 admin + 3 gérants + 10 réceptionnistes |

---

## 🚀 Installation

### Prérequis

- Node.js 18+ ou Bun
- Un compte Supabase (gratuit)
- Un compte Resend (pour les emails)

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
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (⚠️ secrète) | Dashboard → Settings → API |
| `RESEND_API_KEY` | Clé API Resend | resend.com/api-keys |
| `RESEND_FROM_EMAIL` | Email expéditeur vérifié | Resend → Domains |
| `ADMIN_EMAIL` | Email de l'admin | Votre email |
| `DATABASE_URL` | URL base de données locale | Auto-configuré |

### 4. Initialiser la base de données

```bash
# Appliquer le schéma Supabase (SQL)
# Ouvrir Supabase Dashboard → SQL Editor → Coller le contenu de supabase/schema.sql

# Appliquer les politiques RLS
# Coller le contenu de supabase/rls-policies.sql

# Si vous utilisez Prisma (local dev)
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
src/
├── app/
│   ├── (public)/          # Landing page (sans auth)
│   │   └── page.tsx       # Page d'accueil
│   ├── (auth)/            # Pages d'authentification
│   │   ├── login/         # Connexion
│   │   └── register/      # Inscription
│   ├── (dashboard)/       # Dashboards protégés
│   │   ├── super-admin/   # Super administrateur
│   │   ├── admin/         # Admin d'hôtel
│   │   └── staff/         # Réceptionniste / Gérant
│   ├── suspended/         # Page abonnement suspendu
│   ├── not-found.tsx      # Page 404
│   ├── error.tsx          # Page d'erreur
│   ├── loading.tsx        # Page de chargement
│   └── api/               # API Routes
│       ├── admin/         # API admin hôtel
│       ├── staff/         # API réceptionniste
│       ├── super-admin/   # API super admin
│       ├── send-*/        # Emails (Resend)
│       └── generate-*/    # Codes d'activation
├── components/
│   ├── ui/                # Composants réutilisables
│   ├── shared/            # Composants partagés
│   ├── landing/           # Composants landing page
│   ├── hotel/             # Composants site hôtel public
│   ├── admin/             # Composants dashboard admin
│   ├── staff/             # Composants dashboard staff
│   ├── super-admin/       # Composants dashboard super admin
│   └── auth/              # Composants authentification
├── hooks/                 # React hooks globaux
├── lib/
│   ├── supabase/          # Clients Supabase
│   ├── hooks/             # React hooks (useAuth, useHotel, useSubscription)
│   ├── constants.ts       # Constantes globales
│   ├── utils.ts           # Fonctions utilitaires
│   ├── resend.ts          # Configuration email
│   ├── auth-helpers.ts    # Helpers serveur
│   └── db.ts              # Client Prisma
├── types/
│   └── index.ts           # Types & interfaces
└── middleware.ts           # Middleware de sécurité
supabase/
├── schema.sql             # Schéma de la base
└── rls-policies.sql       # Politiques RLS
prisma/
└── schema.prisma          # Schéma Prisma (local)
```

---

## 🛡️ Sécurité

### 4 Rôles

| Rôle | Dashboard | Permissions |
|------|-----------|------------|
| `super_admin` | /super-admin | Accès complet, tous les hôtels |
| `admin_hotel` | /admin | CRUD complet sur son hôtel |
| `gerant` | /staff | Lecture + Update, pas de suppression |
| `receptionniste` | /staff | Check-in/out, clients, réservations |

### Middleware

- Protection des routes par rôle
- Vérification du statut hôtel (actif/expiré)
- Redirection automatique vers /suspended si abonnement expiré (>7 jours)
- Headers de sécurité (X-Role, X-User-Id)
- Mode dégradé si Supabase non configuré

### Row Level Security (RLS)

- 40+ politiques granulaires sur 11 tables
- Isolation des données par `hotel_id`
- Le réceptionniste ne peut PAS supprimer ni accéder aux finances

---

## 🛠️ Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.1 (Turbopack) | Framework full-stack |
| TypeScript | 5 | Typage strict |
| TailwindCSS | 4 | Styles utilitaires |
| shadcn/ui | New York | Composants UI |
| Supabase | PostgreSQL 15 | Auth + BDD + Realtime |
| Zod | v4 | Validation |
| react-hook-form | 7 | Formulaires |
| Resend | 6 | Emails transactionnels |
| recharts | 2 | Graphiques |
| framer-motion | 12 | Animations |
| Zustand | 5 | State management client |
| TanStack Query | 5 | Server state |
| TanStack Table | 8 | DataTable avancé |
| Prisma | 6 | ORM (local SQLite) |

---

## 📧 Contact & Support

- 📧 **Email** : omouitsi@gmail.com
- 💬 **WhatsApp** : [+225 0576103277](https://wa.me/2250576103277)
- 🌍 **Pays** : Côte d'Ivoire 🇨🇮

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © 2025 OGOUTEL_Prestige.
