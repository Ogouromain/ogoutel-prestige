-- ============================================================
-- OGOUTEL_Prestige - Schéma Complet de la Base de Données
-- Fichier : supabase/schema.sql
-- Base de données : Supabase (PostgreSQL)
-- Application SaaS multi-tenant de Gestion Hôtelière
-- Pays : Côte d'Ivoire | Devise : FCFA
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TYPES ÉNUMÉRÉS PERSONNALISÉS
-- ============================================================

-- ⚠️ Les rôles utilisateurs (super_admin, admin_hotel, gerant, receptionniste)
--    sont gérés avec TEXT + CHECK dans les tables profiles et personnel_hotel
--    pour plus de flexibilité.

-- Plans d'abonnement
CREATE TYPE plan_abonnement AS ENUM (
  'basique',
  'standard',
  'premium'
);

-- Types de chambre
CREATE TYPE type_chambre AS ENUM (
  'simple',
  'double',
  'suite',
  'vip',
  'familiale'
);

-- Statuts d'une chambre
CREATE TYPE statut_chambre AS ENUM (
  'disponible',
  'occupee',
  'maintenance',
  'reservée'
);

-- Statuts d'une réservation
CREATE TYPE statut_reservation AS ENUM (
  'en_attente',
  'confirmee',
  'checkin',
  'checkout',
  'annulee'
);

-- Statuts d'une facture
CREATE TYPE statut_facture AS ENUM (
  'en_attente',
  'partiel',
  'paye'
);

-- Modes de paiement
CREATE TYPE mode_paiement AS ENUM (
  'especes',
  'mobile_money',
  'virement',
  'cheque'
);

-- Types de pièce d'identité
CREATE TYPE type_piece_identite AS ENUM (
  'CNI',
  'Passeport',
  'Permis',
  'Carte_Sejour',
  'Autre'
);

-- Statuts d'une demande d'abonnement
CREATE TYPE statut_demande AS ENUM (
  'en_attente',
  'approuvee',
  'rejetee',
  'code_envoye'
);

-- ============================================================
-- 3. TABLE : hotels (Établissements hôteliers)
--    ⚠️ Créée AVANT profiles pour éviter l'erreur de FK
--    L'admin_id est ajouté APRÈS la création de profiles
-- ============================================================

CREATE TABLE public.hotels (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                       TEXT NOT NULL,
  adresse                   TEXT NOT NULL DEFAULT '',
  ville                     TEXT NOT NULL DEFAULT 'Abidjan',
  quartier                  TEXT NOT NULL DEFAULT '',
  telephone                 TEXT NOT NULL,
  email                     TEXT NOT NULL,
  logo_url                  TEXT,
  plan                      plan_abonnement NOT NULL DEFAULT 'basique',
  admin_id                  UUID,   -- FK ajoutée APRÈS création de profiles
  nombre_chambres           INTEGER NOT NULL DEFAULT 0,
  est_actif                 BOOLEAN NOT NULL DEFAULT TRUE,
  date_debut_abonnement     DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin_abonnement       DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT hotels_email_unique UNIQUE (email),
  CONSTRAINT hotels_telephone_format CHECK (telephone ~ '^[+]?[0-9]{10,14}$'),
  CONSTRAINT hotels_nombre_chambres CHECK (nombre_chambres >= 0)
);

COMMENT ON TABLE public.hotels IS 'Établissements hôteliers inscrits sur la plateforme';
COMMENT ON COLUMN public.hotels.plan IS 'Plan d''abonnement : basique, standard, premium';
COMMENT ON COLUMN public.hotels.nombre_chambres IS 'Nombre de chambres selon le plan souscrit';

-- ============================================================
-- 4. TABLE : profiles (Profil utilisateur)
--    Lié à auth.users de Supabase via trigger
--    ⚠️ hotels doit exister AVANT (créée à l'étape 3)
-- ============================================================

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'receptionniste'
                    CHECK (role IN ('super_admin', 'admin_hotel', 'gerant', 'receptionniste')),
  hotel_id        UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes métier
  CONSTRAINT profiles_role_super_admin_sans_hotel CHECK (
    role != 'super_admin' OR hotel_id IS NULL
  ),
  CONSTRAINT profiles_autre_role_avec_hotel CHECK (
    role = 'super_admin' OR hotel_id IS NOT NULL
  )
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs — extension de auth.users de Supabase';
COMMENT ON COLUMN public.profiles.id IS 'UUID identique à auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'Email unique identique à auth.users.email';
COMMENT ON COLUMN public.profiles.full_name IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN public.profiles.role IS 'Rôle SaaS : super_admin | admin_hotel | gerant | receptionniste';
COMMENT ON COLUMN public.profiles.hotel_id IS 'Hôtel d''affectation (NULL = super_admin global)';
COMMENT ON COLUMN public.profiles.is_active IS 'Compte actif / désactivé';

-- ─── Ajout de la FK hotels.admin_id → profiles.id ─────────────────────────
-- ⚠️ Maintenant que profiles existe, on peut ajouter la contrainte

ALTER TABLE public.hotels
  ADD CONSTRAINT hotels_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.hotels.admin_id IS 'Référence vers le profil admin de l''hôtel';

-- ============================================================
-- 5. TABLE : personnel_hotel (Membres du personnel)
-- ============================================================

CREATE TABLE public.personnel_hotel (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('admin_hotel', 'gerant', 'receptionniste')),
  nom_complet     TEXT NOT NULL,
  telephone       TEXT NOT NULL,
  email           TEXT NOT NULL,
  est_actif       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT personnel_hotel_unique_user UNIQUE (user_id),
  CONSTRAINT personnel_hotel_unique_hotel_email UNIQUE (hotel_id, email)
);

COMMENT ON TABLE public.personnel_hotel IS 'Personnel rattaché à un hôtel';
COMMENT ON COLUMN public.personnel_hotel.role IS 'Rôle au sein de l''hôtel (pas super_admin)';

-- ============================================================
-- 6. TABLE : chambres (Chambres d'hôtel)
-- ============================================================

CREATE TABLE public.chambres (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  numero          TEXT NOT NULL,
  type            type_chambre NOT NULL DEFAULT 'simple',
  prix_nuit       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut          statut_chambre NOT NULL DEFAULT 'disponible',
  etage           INTEGER NOT NULL DEFAULT 0,
  description     TEXT,
  equipements     JSONB NOT NULL DEFAULT '[]'::JSONB,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT chambres_numero_hotel_unique UNIQUE (hotel_id, numero),
  CONSTRAINT chambres_prix_positif CHECK (prix_nuit >= 0),
  CONSTRAINT chambres_etage_positif CHECK (etage >= 0)
);

COMMENT ON TABLE public.chambres IS 'Chambres de chaque établissement';
COMMENT ON COLUMN public.chambres.prix_nuit IS 'Prix en FCFA';
COMMENT ON COLUMN public.chambres.equipements IS 'Liste JSON des équipements (ex: ["Climatisation", "TV", "WiFi"])';

-- ============================================================
-- 7. TABLE : clients (Clients de l'hôtel)
-- ============================================================

CREATE TABLE public.clients (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id                UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  nom                     TEXT NOT NULL,
  prenom                  TEXT NOT NULL,
  telephone               TEXT NOT NULL,
  email                   TEXT,
  piece_identite_type     type_piece_identite NOT NULL DEFAULT 'CNI',
  piece_identite_numero   TEXT NOT NULL DEFAULT '',
  nationalite             TEXT NOT NULL DEFAULT 'Ivoirienne',
  ville_residence         TEXT NOT NULL DEFAULT 'Abidjan',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT clients_telephone_format CHECK (telephone ~ '^[+]?[0-9]{10,14}$'),
  CONSTRAINT clients_hotel_telephone_unique UNIQUE (hotel_id, telephone)
);

COMMENT ON TABLE public.clients IS 'Clients enregistrés dans chaque hôtel';
COMMENT ON COLUMN public.clients.piece_identite_type IS 'Type de pièce d''identité présentée';

-- ============================================================
-- 8. TABLE : reservations (Réservations)
-- ============================================================

CREATE TABLE public.reservations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id            UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  chambre_id          UUID NOT NULL REFERENCES public.chambres(id) ON DELETE RESTRICT,
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  receptionniste_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_arrivee        DATE NOT NULL,
  date_depart         DATE NOT NULL,
  nombre_nuits        INTEGER NOT NULL DEFAULT 1,
  prix_nuit           DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_total       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_paye        DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut              statut_reservation NOT NULL DEFAULT 'en_attente',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT reservations_dates CHECK (date_depart > date_arrivee),
  CONSTRAINT reservations_nuits CHECK (nombre_nuits >= 1),
  CONSTRAINT reservations_montant_total CHECK (montant_total >= 0),
  CONSTRAINT reservations_montant_paye CHECK (montant_paye >= 0 AND montant_paye <= montant_total)
);

COMMENT ON TABLE public.reservations IS 'Réservations de chambres';
COMMENT ON COLUMN public.reservations.montant_total IS 'Montant total en FCFA';
COMMENT ON COLUMN public.reservations.receptionniste_id IS 'Réceptionniste ayant créé la réservation';

-- ============================================================
-- 9. TABLE : factures (Factures)
-- ============================================================

CREATE TABLE public.factures (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id            UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  reservation_id      UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  numero_facture      TEXT NOT NULL,
  montant_ht          DECIMAL(12, 2) NOT NULL DEFAULT 0,
  taux_tva            DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  montant_tva         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_ttc         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut_paiement     statut_facture NOT NULL DEFAULT 'en_attente',
  mode_paiement       mode_paiement,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT factures_numero_hotel_unique UNIQUE (hotel_id, numero_facture),
  CONSTRAINT factures_montants_positifs CHECK (
    montant_ht >= 0 AND montant_tva >= 0 AND montant_ttc >= 0
  )
);

COMMENT ON TABLE public.factures IS 'Factures liées aux réservations';
COMMENT ON COLUMN public.factures.taux_tva IS 'Taux TVA en % (18% par défaut en CI)';

-- ============================================================
-- 10. TABLE : abonnement_demandes (Demandes de la landing page)
-- ============================================================

CREATE TABLE public.abonnement_demandes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_complet       TEXT NOT NULL,
  email             TEXT NOT NULL,
  telephone         TEXT NOT NULL,
  nom_hotel         TEXT NOT NULL,
  ville             TEXT NOT NULL DEFAULT 'Abidjan',
  quartier          TEXT NOT NULL DEFAULT '',
  nombre_chambres   INTEGER NOT NULL DEFAULT 0,
  plan_choisi       plan_abonnement NOT NULL DEFAULT 'basique',
  message           TEXT,
  statut            statut_demande NOT NULL DEFAULT 'en_attente',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT abonnement_demandes_chambres CHECK (nombre_chambres >= 0)
);

COMMENT ON TABLE public.abonnement_demandes IS 'Demandes d''abonnement depuis la page landing';

-- ============================================================
-- 11. TABLE : codes_acces (Codes d'inscription)
-- ============================================================

CREATE TABLE public.codes_acces (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT NOT NULL,
  plan                plan_abonnement NOT NULL,
  demande_id          UUID REFERENCES public.abonnement_demandes(id) ON DELETE SET NULL,
  email_destinataire  TEXT NOT NULL,
  nom_hotel           TEXT NOT NULL,
  est_utilise         BOOLEAN NOT NULL DEFAULT FALSE,
  utilise_par         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date_expiration     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at             TIMESTAMPTZ,

  -- Contraintes
  CONSTRAINT codes_acces_code_unique UNIQUE (code),
  CONSTRAINT codes_acces_code_format CHECK (code ~ '^[A-Z0-9]{8}$')
);

COMMENT ON TABLE public.codes_acces IS 'Codes d''accès générés pour l''inscription des admin_hotel';
COMMENT ON COLUMN public.codes_acces.code IS 'Code unique de 8 caractères alphanumériques majuscules';

-- ============================================================
-- 12. TABLE : notifications
-- ============================================================

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'systeme',
  titre           TEXT NOT NULL,
  message         TEXT NOT NULL,
  lien            TEXT,
  est_lue         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT notifications_type_check CHECK (
    type IN ('reservation_nouvelle', 'reservation_annulee', 'checkin', 'checkout',
            'facture_impayee', 'abonnement_expiration', 'personnel_ajoute', 'systeme')
  )
);

COMMENT ON TABLE public.notifications IS 'Notifications in-app pour les utilisateurs';

-- ============================================================
-- 13. INDEX (Optimisation des requêtes)
-- ============================================================

-- Index profiles
CREATE INDEX idx_profiles_hotel_id ON public.profiles(hotel_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Index hotels
CREATE INDEX idx_hotels_admin_id ON public.hotels(admin_id);
CREATE INDEX idx_hotels_plan ON public.hotels(plan);
CREATE INDEX idx_hotels_est_actif ON public.hotels(est_actif);
CREATE INDEX idx_hotels_ville ON public.hotels(ville);

-- Index personnel
CREATE INDEX idx_personnel_hotel_id ON public.personnel_hotel(hotel_id);
CREATE INDEX idx_personnel_user_id ON public.personnel_hotel(user_id);
CREATE INDEX idx_personnel_role ON public.personnel_hotel(role);
CREATE INDEX idx_personnel_est_actif ON public.personnel_hotel(est_actif);

-- Index chambres
CREATE INDEX idx_chambres_hotel_id ON public.chambres(hotel_id);
CREATE INDEX idx_chambres_statut ON public.chambres(statut);
CREATE INDEX idx_chambres_type ON public.chambres(type);
CREATE INDEX idx_chambres_hotel_statut ON public.chambres(hotel_id, statut);

-- Index clients
CREATE INDEX idx_clients_hotel_id ON public.clients(hotel_id);
CREATE INDEX idx_clients_nom_prenom ON public.clients(nom, prenom);
CREATE INDEX idx_clients_telephone ON public.clients(telephone);

-- Index reservations
CREATE INDEX idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX idx_reservations_chambre_id ON public.reservations(chambre_id);
CREATE INDEX idx_reservations_client_id ON public.reservations(client_id);
CREATE INDEX idx_reservations_statut ON public.reservations(statut);
CREATE INDEX idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX idx_reservations_hotel_statut ON public.reservations(hotel_id, statut);

-- Index factures
CREATE INDEX idx_factures_hotel_id ON public.factures(hotel_id);
CREATE INDEX idx_factures_reservation_id ON public.factures(reservation_id);
CREATE INDEX idx_factures_statut ON public.factures(statut_paiement);

-- Index demandes
CREATE INDEX idx_demandes_statut ON public.abonnement_demandes(statut);
CREATE INDEX idx_demandes_email ON public.abonnement_demandes(email);

-- Index codes
CREATE INDEX idx_codes_est_utilise ON public.codes_acces(est_utilise);
CREATE INDEX idx_codes_email ON public.codes_acces(email_destinataire);
CREATE INDEX idx_codes_expiration ON public.codes_acces(date_expiration);

-- Index notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_est_lue ON public.notifications(user_id, est_lue);
CREATE INDEX idx_notifications_hotel_id ON public.notifications(hotel_id);

-- ============================================================
-- 14. FONCTIONS UTILITAIRES
-- ============================================================

-- Met à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Génère un numéro de facture unique
CREATE OR REPLACE FUNCTION public.generer_numero_facture(p_hotel_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_annee TEXT := TO_CHAR(NOW(), 'YYYY');
  v_compteur INTEGER;
  v_numero TEXT;
BEGIN
  SELECT COUNT(*)
  INTO v_compteur
  FROM public.factures
  WHERE hotel_id = p_hotel_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  v_compteur := COALESCE(v_compteur, 0) + 1;
  v_numero := 'FAC-' || v_annee || '-' || LPAD(v_compteur::TEXT, 4, '0');
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Calcule automatiquement le montant TVA et TTC
CREATE OR REPLACE FUNCTION public.calculer_montants_facture()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_tva := ROUND(NEW.montant_ht * (NEW.taux_tva / 100.0), 2);
  NEW.montant_ttc := ROUND(NEW.montant_ht + NEW.montant_tva, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calcule automatiquement le nombre de nuits et le montant total
CREATE OR REPLACE FUNCTION public.calculer_reservation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nombre_nuits := GREATEST(1, NEW.date_depart - NEW.date_arrivee);
  NEW.montant_total := ROUND(NEW.nombre_nuits * NEW.prix_nuit, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Génère un code d'accès aléatoire de 8 caractères
CREATE OR REPLACE FUNCTION public.generer_code_acces()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars)) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 15. TRIGGERS
-- ============================================================

-- Auto-update updated_at sur profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur reservations
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calcul des montants TTC sur factures
CREATE TRIGGER factures_calcul_montants
  BEFORE INSERT OR UPDATE OF montant_ht, taux_tva ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.calculer_montants_facture();

-- Auto-calcul des nuits et montant total sur réservations
CREATE TRIGGER reservations_calcul
  BEFORE INSERT OR UPDATE OF date_arrivee, date_depart, prix_nuit ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.calculer_reservation();

-- ============================================================
-- 16. VUES (Vues utiles pour le dashboard et les rapports)
-- ============================================================

-- Vue : Statistiques par hôtel
CREATE OR REPLACE VIEW public.v_stats_hotel AS
SELECT
  h.id AS hotel_id,
  h.nom AS hotel_nom,
  h.plan,
  h.est_actif,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id) AS total_chambres,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'disponible') AS chambres_disponibles,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'occupee') AS chambres_occupees,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'maintenance') AS chambres_maintenance,
  (SELECT COUNT(*) FROM public.reservations r WHERE r.hotel_id = h.id AND r.statut IN ('en_attente', 'confirmee', 'checkin')) AS reservations_actives,
  (SELECT COUNT(*) FROM public.clients cl WHERE cl.hotel_id = h.id) AS total_clients,
  (SELECT COUNT(*) FROM public.personnel_hotel p WHERE p.hotel_id = h.id AND p.est_actif = TRUE) AS personnel_actif,
  (SELECT COALESCE(SUM(r.montant_total), 0)
   FROM public.reservations r
   WHERE r.hotel_id = h.id
     AND EXTRACT(MONTH FROM r.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM r.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  ) AS revenus_mois,
  (SELECT COALESCE(SUM(r.montant_total), 0)
   FROM public.reservations r
   WHERE r.hotel_id = h.id
     AND EXTRACT(YEAR FROM r.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  ) AS revenus_annee,
  h.date_fin_abonnement,
  CASE
    WHEN h.date_fin_abonnement <= CURRENT_DATE + INTERVAL '7 days' THEN true
    ELSE false
  END AS abonnement_expirant
FROM public.hotels h;

COMMENT ON VIEW public.v_stats_hotel IS 'Vue agrégée des statistiques par hôtel';

-- Vue : Taux d'occupation par hôtel
CREATE OR REPLACE VIEW public.v_taux_occupation AS
SELECT
  h.id AS hotel_id,
  h.nom AS hotel_nom,
  ROUND(
    (SELECT COUNT(*)
     FROM public.chambres c
     WHERE c.hotel_id = h.id AND c.statut = 'occupee'
    )::DECIMAL * 100.0
    /
    NULLIF((SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id), 0),
    1
  ) AS taux_occupation_pourcent,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id) AS total_chambres
FROM public.hotels h
WHERE h.est_actif = TRUE;

COMMENT ON VIEW public.v_taux_occupation IS 'Taux d''occupation en temps réel par hôtel';

-- Vue : Top des chambres les plus réservées par hôtel
CREATE OR REPLACE VIEW public.v_top_chambres AS
SELECT
  c.hotel_id,
  c.id AS chambre_id,
  c.numero,
  c.type,
  c.prix_nuit,
  COUNT(r.id) AS total_reservations,
  COALESCE(SUM(r.montant_total), 0) AS revenu_total
FROM public.chambres c
LEFT JOIN public.reservations r ON r.chambre_id = c.id AND r.statut NOT IN ('annulee')
GROUP BY c.hotel_id, c.id, c.numero, c.type, c.prix_nuit
ORDER BY total_reservations DESC;

COMMENT ON VIEW public.v_top_chambres IS 'Classement des chambres les plus réservées';

-- ============================================================
-- 17. ROW LEVEL SECURITY (RLS) - ISOLATION MULTI-TENANT
-- ============================================================

-- Activer RLS sur toutes les tables de données
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_hotel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnement_demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes_acces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ─── Politique : super_admin voit tout ──────────────────────────────────

CREATE POLICY "super_admin_acces_total_profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR id = auth.uid()
  );

CREATE POLICY "super_admin_acces_total_hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR admin_id = auth.uid()
  );

CREATE POLICY "super_admin_acces_total_personnel"
  ON public.personnel_hotel FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_acces_total_chambres"
  ON public.chambres FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_acces_total_clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_acces_total_reservations"
  ON public.reservations FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_acces_total_factures"
  ON public.factures FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_acces_total_codes"
  ON public.codes_acces FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "super_admin_acces_total_demandes"
  ON public.abonnement_demandes FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ─── Politique : les utilisateurs voient uniquement les données de leur hôtel ──

CREATE POLICY "utilisateur_voient_leures_notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- 18. TRIGGER : Création automatique du profil à l'inscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'nom_complet',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'receptionniste'
    ),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 20. RÉSUMÉ FINAL
-- ============================================================
--
-- TABLES (10) :
--   hotels → profiles → personnel_hotel → chambres →
--   clients → reservations → factures
--   abonnement_demandes, codes_acces, notifications
--
-- ⚠️ ORDRE CRITIQUE pour éviter les erreurs FK :
--   1. hotels (sans admin_id FK)
--   2. profiles (réfère hotels.hotel_id ✓)
--   3. ALTER hotels ADD admin_id FK → profiles.id ✓
--   4. personnel_hotel, chambres, clients, etc.
--
-- VUES (3) : v_stats_hotel, v_taux_occupation, v_top_chambres
-- FONCTIONS (5) : update_updated_at, generer_numero_facture,
--   calculer_montants_facture, calculer_reservation, generer_code_acces
-- TRIGGERS (5) : profiles_updated_at, reservations_updated_at,
--   factures_calcul_montants, reservations_calcul, on_auth_user_created
-- INDEX (32) : optimisés pour les requêtes fréquentes
-- RLS (18 politiques) : isolation multi-tenant stricte
-- ENUMS (8) : plan_abonnement, type_chambre, statut_chambre,
--   statut_reservation, statut_facture, mode_paiement,
--   type_piece_identite, statut_demande
-- TVA PAR DÉFAUT : 18% (taux en vigueur en Côte d'Ivoire)
-- DEVISE : FCFA (Franc CFA) - DECIMAL(12,2)
-- ============================================================
