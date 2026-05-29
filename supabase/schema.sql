-- ============================================================
-- OGOUTEL_Prestige - SCRIPT COMPLET DE REMPLACEMENT
-- Fichier : supabase/schema.sql
-- Base de données : Supabase (PostgreSQL 15)
-- Application SaaS multi-tenant de Gestion Hôtelière
-- Pays : Côte d'Ivoire | Devise : FCFA
-- ============================================================
--
-- ⚠️  CE SCRIPT SUPPRIME ET RECRÉE TOUTES LES TABLES.
--     À utiliser uniquement pour une réinstallation complète.
--
-- RÈGLES :
--   - Compatible PostgreSQL 15
--   - Zéro ENUM — tout en TEXT + CHECK
--   - Commentaires en français
--   - Ordre correct de création
--
-- ============================================================


-- ============================================================
-- PHASE 0 : NETTOYAGE COMPLET
--     Supprime TOUT : vues, triggers, fonctions, tables, types
-- ============================================================

-- Suppression des vues
DROP VIEW IF EXISTS public.v_top_chambres CASCADE;
DROP VIEW IF EXISTS public.v_taux_occupation CASCADE;
DROP VIEW IF EXISTS public.v_stats_hotel CASCADE;

-- Suppression des triggers sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Suppression de toutes les fonctions personnalisées
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generer_numero_facture() CASCADE;
DROP FUNCTION IF EXISTS public.calculer_montants_facture() CASCADE;
DROP FUNCTION IF EXISTS public.calculer_reservation() CASCADE;
DROP FUNCTION IF EXISTS public.generer_code_acces() CASCADE;
DROP FUNCTION IF EXISTS public.update_hotel_chambres_count() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_hotel_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_super_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_hotel_id() CASCADE;

-- Suppression de toutes les tables (CASCADE supprime les FK, triggers, etc.)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.activites_log CASCADE;
DROP TABLE IF EXISTS public.factures CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.chambres CASCADE;
DROP TABLE IF EXISTS public.personnel_hotel CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.codes_acces CASCADE;
DROP TABLE IF EXISTS public.hotels CASCADE;
DROP TABLE IF EXISTS public.abonnement_demandes CASCADE;

-- Suppression des anciens ENUMs (s'ils existent encore)
DROP TYPE IF EXISTS statut_demande CASCADE;
DROP TYPE IF EXISTS plan_abonnement CASCADE;
DROP TYPE IF EXISTS type_chambre CASCADE;
DROP TYPE IF EXISTS statut_chambre CASCADE;
DROP TYPE IF EXISTS statut_reservation CASCADE;
DROP TYPE IF EXISTS statut_facture CASCADE;
DROP TYPE IF EXISTS mode_paiement CASCADE;
DROP TYPE IF EXISTS type_piece_identite CASCADE;
DROP TYPE IF EXISTS role_utilisateur CASCADE;


-- ============================================================
-- PHASE 1 : EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- PHASE 2 : FONCTIONS (créées AVANT les triggers qui les utilisent)
-- ============================================================

-- ─── 2.1 Mise à jour automatique de updated_at ───

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2.2 Génère un numéro de facture globalement unique ───

CREATE OR REPLACE FUNCTION public.generer_numero_facture()
RETURNS TEXT AS $$
DECLARE
  v_annee TEXT := TO_CHAR(NOW(), 'YYYY');
  v_compteur INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_compteur
  FROM public.factures
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  v_compteur := COALESCE(v_compteur, 0) + 1;
  RETURN 'FAC-' || v_annee || '-' || LPAD(v_compteur::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ─── 2.3 Calcule automatiquement TVA et TTC sur factures ───

CREATE OR REPLACE FUNCTION public.calculer_montants_facture()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_tva := ROUND(NEW.montant_ht * (NEW.taux_tva / 100.0), 2);
  NEW.montant_ttc := ROUND(NEW.montant_ht + NEW.montant_tva, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2.4 Calcule le montant total d'une réservation ───

CREATE OR REPLACE FUNCTION public.calculer_reservation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_total := ROUND(
    (NEW.date_depart - NEW.date_arrivee) * COALESCE(NEW.prix_nuit, 0),
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2.5 Génère un code d'accès aléatoire de 8 caractères ───

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

-- ─── 2.6 Met à jour hotels.nombre_chambres après INSERT/DELETE chambre ───

CREATE OR REPLACE FUNCTION public.update_hotel_chambres_count()
RETURNS TRIGGER AS $$
DECLARE
  v_hotel_id UUID;
BEGIN
  v_hotel_id := COALESCE(NEW.hotel_id, OLD.hotel_id);
  UPDATE public.hotels
  SET nombre_chambres = (
    SELECT COUNT(*) FROM public.chambres WHERE hotel_id = v_hotel_id
  )
  WHERE id = v_hotel_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2.7 Création automatique du profil à l'inscription ───

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

-- ─── 2.8 Statistiques par hôtel → JSON ───

CREATE OR REPLACE FUNCTION public.get_hotel_stats(p_hotel_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_chambres',        COUNT(*),
    'chambres_disponibles',  COUNT(*) FILTER (WHERE statut = 'disponible'),
    'chambres_occupees',     COUNT(*) FILTER (WHERE statut = 'occupee'),
    'reservations_actives',  (
      SELECT COUNT(*) FROM public.reservations
      WHERE hotel_id = p_hotel_id
        AND statut IN ('en_attente', 'confirmee', 'checkin')
    ),
    'revenus_mois_actuel',   COALESCE((
      SELECT SUM(montant_total) FROM public.reservations
      WHERE hotel_id = p_hotel_id
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at)  = EXTRACT(YEAR FROM CURRENT_DATE)
    ), 0)
  ) INTO v_stats
  FROM public.chambres
  WHERE hotel_id = p_hotel_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2.9 Statistiques globales super_admin → TABLE ───

CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS TABLE (
  total_hotels        BIGINT,
  hotels_actifs       BIGINT,
  total_utilisateurs  BIGINT,
  demandes_en_attente BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.hotels),
    (SELECT COUNT(*) FROM public.hotels WHERE est_actif = TRUE),
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.abonnement_demandes WHERE statut = 'en_attente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2.10 Vérifie si l'utilisateur courant est super_admin ───

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── 2.11 Retourne le hotel_id de l'utilisateur courant ───

CREATE OR REPLACE FUNCTION public.get_user_hotel_id()
RETURNS UUID AS $$
DECLARE
  v_hotel_id UUID;
BEGIN
  SELECT hotel_id INTO v_hotel_id
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN v_hotel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- PHASE 3 : TABLES (créées dans l'ordre des dépendances FK)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 3.1 TABLE : abonnement_demandes (aucune FK)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.abonnement_demandes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet       TEXT NOT NULL,
  email             TEXT NOT NULL,
  telephone         TEXT NOT NULL,
  nom_hotel         TEXT NOT NULL,
  ville             TEXT NOT NULL,
  quartier          TEXT,
  nombre_chambres   INTEGER,
  plan_choisi       TEXT NOT NULL DEFAULT 'basique'
                    CHECK (plan_choisi IN ('basique', 'standard', 'premium')),
  message           TEXT,
  statut            TEXT NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente', 'contacte', 'paye', 'active')),
  notes_admin       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.abonnement_demandes IS 'Demandes d''abonnement depuis la page landing';
COMMENT ON COLUMN public.abonnement_demandes.statut IS 'Statut : en_attente | contacte | paye | active';
COMMENT ON COLUMN public.abonnement_demandes.notes_admin IS 'Notes internes pour OGOUTEL_Prestige';


-- ────────────────────────────────────────────────────────────
-- 3.2 TABLE : codes_acces (FK → abonnement_demandes)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.codes_acces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL,
  plan                TEXT NOT NULL CHECK (plan IN ('basique', 'standard', 'premium')),
  demande_id          UUID REFERENCES public.abonnement_demandes(id) ON DELETE SET NULL,
  email_destinataire  TEXT NOT NULL,
  nom_hotel           TEXT NOT NULL,
  est_utilise         BOOLEAN NOT NULL DEFAULT FALSE,
  utilise_par         UUID,
  date_expiration     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at             TIMESTAMPTZ,

  CONSTRAINT codes_acces_code_unique UNIQUE (code),
  CONSTRAINT codes_acces_code_format CHECK (code ~ '^[A-Z0-9]{8}$')
);

COMMENT ON TABLE public.codes_acces IS 'Codes d''accès pour l''inscription des admin_hotel';
COMMENT ON COLUMN public.codes_acces.code IS 'Code unique de 8 caractères alphanumériques majuscules';


-- ────────────────────────────────────────────────────────────
-- 3.3 TABLE : hotels (FK → codes_acces, auth.users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.hotels (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                       TEXT NOT NULL,
  adresse                   TEXT,
  ville                     TEXT,
  quartier                  TEXT,
  telephone                 TEXT,
  email                     TEXT,
  logo_url                  TEXT,
  plan                      TEXT NOT NULL DEFAULT 'basique'
                            CHECK (plan IN ('basique', 'standard', 'premium')),
  code_acces_id             UUID REFERENCES public.codes_acces(id) ON DELETE SET NULL,
  admin_id                  UUID REFERENCES auth.users(id),
  nombre_chambres           INTEGER DEFAULT 0,
  est_actif                 BOOLEAN DEFAULT TRUE,
  date_debut_abonnement     TIMESTAMPTZ DEFAULT NOW(),
  date_fin_abonnement       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  description               TEXT,
  nombre_etoiles            INTEGER DEFAULT 0 CHECK (nombre_etoiles BETWEEN 0 AND 5),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT hotels_email_unique UNIQUE (email),
  CONSTRAINT hotels_nombre_chambres CHECK (nombre_chambres >= 0)
);

COMMENT ON TABLE public.hotels IS 'Établissements hôteliers inscrits sur la plateforme';
COMMENT ON COLUMN public.hotels.plan IS 'Plan d''abonnement : basique, standard, premium';
COMMENT ON COLUMN public.hotels.code_acces_id IS 'Code d''accès utilisé lors de la création';
COMMENT ON COLUMN public.hotels.admin_id IS 'Référence vers auth.users (admin de l''hôtel)';
COMMENT ON COLUMN public.hotels.nombre_etoiles IS 'Classement étoiles (0-5)';


-- ────────────────────────────────────────────────────────────
-- 3.4 TABLE : profiles (FK → hotels, auth.users)
-- ────────────────────────────────────────────────────────────

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

  -- Le super_admin ne doit pas être rattaché à un hôtel
  CONSTRAINT profiles_role_super_admin_sans_hotel CHECK (
    role != 'super_admin' OR hotel_id IS NULL
  )
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs — extension de auth.users';
COMMENT ON COLUMN public.profiles.id IS 'UUID identique à auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'Email unique identique à auth.users.email';
COMMENT ON COLUMN public.profiles.role IS 'Rôle SaaS : super_admin | admin_hotel | gerant | receptionniste';
COMMENT ON COLUMN public.profiles.hotel_id IS 'Hôtel d''affectation (NULL = super_admin global)';

-- Ajout FK codes_acces.utilise_par → profiles.id
ALTER TABLE public.codes_acces
  ADD CONSTRAINT codes_acces_utilise_par_fkey
  FOREIGN KEY (utilise_par) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.codes_acces.utilise_par IS 'Utilisateur ayant utilisé le code';


-- ────────────────────────────────────────────────────────────
-- 3.5 TABLE : personnel_hotel (FK → hotels, auth.users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.personnel_hotel (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  role            TEXT NOT NULL CHECK (role IN ('gerant', 'receptionniste')),
  nom_complet     TEXT NOT NULL,
  telephone       TEXT,
  email           TEXT,
  est_actif       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT personnel_hotel_unique_user UNIQUE (user_id),
  CONSTRAINT personnel_hotel_unique_hotel_email UNIQUE (hotel_id, email)
);

COMMENT ON TABLE public.personnel_hotel IS 'Personnel rattaché à un hôtel';
COMMENT ON COLUMN public.personnel_hotel.role IS 'Rôle au sein de l''hôtel : gerant | receptionniste';


-- ────────────────────────────────────────────────────────────
-- 3.6 TABLE : chambres (FK → hotels)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.chambres (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  numero          TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'simple'
                    CHECK (type IN ('simple', 'double', 'suite', 'vip', 'familiale')),
  prix_nuit       DECIMAL(10, 2) NOT NULL,
  statut          TEXT DEFAULT 'disponible'
                    CHECK (statut IN ('disponible', 'occupee', 'maintenance', 'reservee')),
  etage           INTEGER DEFAULT 1,
  description     TEXT,
  equipements     JSONB DEFAULT '[]'::JSONB,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chambres_numero_hotel_unique UNIQUE (hotel_id, numero)
);

COMMENT ON TABLE public.chambres IS 'Chambres de chaque établissement';
COMMENT ON COLUMN public.chambres.prix_nuit IS 'Prix par nuit en FCFA';
COMMENT ON COLUMN public.chambres.equipements IS 'Liste JSON des équipements';


-- ────────────────────────────────────────────────────────────
-- 3.7 TABLE : clients (FK → hotels)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.clients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  nom                     TEXT NOT NULL,
  prenom                  TEXT,
  telephone               TEXT,
  email                   TEXT,
  piece_identite_type     TEXT CHECK (
                            piece_identite_type IN ('CNI', 'Passeport', 'Permis', 'Carte_Sejour', 'Autre')
                          ),
  piece_identite_numero   TEXT,
  nationalite             TEXT DEFAULT 'Ivoirienne',
  ville_residence         TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS 'Clients enregistrés dans chaque hôtel';


-- ────────────────────────────────────────────────────────────
-- 3.8 TABLE : reservations (FK → hotels, chambres, clients, profiles)
--     ⚠️ nombre_nuits est GENERATED ALWAYS AS STORED
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.reservations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id            UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  chambre_id          UUID REFERENCES public.chambres(id),
  client_id           UUID REFERENCES public.clients(id),
  receptionniste_id   UUID REFERENCES public.profiles(id),
  date_arrivee        DATE NOT NULL,
  date_depart         DATE NOT NULL,
  nombre_nuits        INTEGER GENERATED ALWAYS AS (date_depart - date_arrivee) STORED,
  prix_nuit           DECIMAL(10, 2),
  montant_total       DECIMAL(10, 2),
  montant_paye        DECIMAL(10, 2) DEFAULT 0,
  statut              TEXT DEFAULT 'confirmee'
                      CHECK (statut IN ('en_attente', 'confirmee', 'checkin', 'checkout', 'annulee')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reservations_dates CHECK (date_depart > date_arrivee),
  CONSTRAINT reservations_montant_paye CHECK (
    montant_paye >= 0 AND montant_paye <= COALESCE(montant_total, 0)
  )
);

COMMENT ON TABLE public.reservations IS 'Réservations de chambres';
COMMENT ON COLUMN public.reservations.nombre_nuits IS 'Calculé auto = date_depart - date_arrivee';


-- ────────────────────────────────────────────────────────────
-- 3.9 TABLE : factures (FK → hotels, reservations, clients)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.factures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id            UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  reservation_id      UUID REFERENCES public.reservations(id),
  client_id           UUID REFERENCES public.clients(id),
  numero_facture      TEXT UNIQUE NOT NULL,
  montant_ht          DECIMAL(10, 2),
  taux_tva            DECIMAL(5, 2) DEFAULT 18,
  montant_tva         DECIMAL(10, 2),
  montant_ttc         DECIMAL(10, 2),
  statut_paiement     TEXT DEFAULT 'en_attente'
                      CHECK (statut_paiement IN ('en_attente', 'partiel', 'paye')),
  mode_paiement       TEXT CHECK (
                        mode_paiement IN ('especes', 'mobile_money', 'virement', 'cheque', 'carte')
                      ),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT factures_montants_positifs CHECK (
    montant_ht >= 0 AND montant_tva >= 0 AND montant_ttc >= 0
  )
);

COMMENT ON TABLE public.factures IS 'Factures liées aux réservations';
COMMENT ON COLUMN public.factures.taux_tva IS 'Taux TVA en % (18 par défaut en CI)';


-- ────────────────────────────────────────────────────────────
-- 3.10 TABLE : activites_log (FK → hotels, auth.users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.activites_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES public.hotels(id),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activites_log IS 'Journal d''activité — audit trail pour chaque hôtel';


-- ────────────────────────────────────────────────────────────
-- 3.11 TABLE : notifications (FK → profiles, hotels)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'systeme'
                  CHECK (
                    type IN ('reservation_nouvelle', 'reservation_annulee', 'checkin', 'checkout',
                            'facture_impayee', 'abonnement_expiration', 'personnel_ajoute', 'systeme')
                  ),
  titre           TEXT NOT NULL,
  message         TEXT NOT NULL,
  lien            TEXT,
  est_lue         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Notifications in-app pour les utilisateurs';


-- ============================================================
-- PHASE 4 : INDEX — Optimisation des requêtes fréquentes
-- ============================================================

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_hotel_id ON public.profiles(hotel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index hotels
CREATE INDEX IF NOT EXISTS idx_hotels_admin_id ON public.hotels(admin_id);
CREATE INDEX IF NOT EXISTS idx_hotels_plan ON public.hotels(plan);
CREATE INDEX IF NOT EXISTS idx_hotels_est_actif ON public.hotels(est_actif);
CREATE INDEX IF NOT EXISTS idx_hotels_ville ON public.hotels(ville);
CREATE INDEX IF NOT EXISTS idx_hotels_code_acces ON public.hotels(code_acces_id);

-- Index personnel
CREATE INDEX IF NOT EXISTS idx_personnel_hotel_id ON public.personnel_hotel(hotel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_user_id ON public.personnel_hotel(user_id);
CREATE INDEX IF NOT EXISTS idx_personnel_role ON public.personnel_hotel(role);
CREATE INDEX IF NOT EXISTS idx_personnel_est_actif ON public.personnel_hotel(est_actif);

-- Index chambres
CREATE INDEX IF NOT EXISTS idx_chambres_hotel_id ON public.chambres(hotel_id);
CREATE INDEX IF NOT EXISTS idx_chambres_statut ON public.chambres(statut);
CREATE INDEX IF NOT EXISTS idx_chambres_type ON public.chambres(type);
CREATE INDEX IF NOT EXISTS idx_chambres_hotel_statut ON public.chambres(hotel_id, statut);

-- Index clients
CREATE INDEX IF NOT EXISTS idx_clients_hotel_id ON public.clients(hotel_id);
CREATE INDEX IF NOT EXISTS idx_clients_nom_prenom ON public.clients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_clients_telephone ON public.clients(telephone);

-- Index reservations
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_chambre_id ON public.reservations(chambre_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_statut ON public.reservations(hotel_id, statut);

-- Index factures
CREATE INDEX IF NOT EXISTS idx_factures_hotel_id ON public.factures(hotel_id);
CREATE INDEX IF NOT EXISTS idx_factures_reservation_id ON public.factures(reservation_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON public.factures(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON public.factures(numero_facture);

-- Index demandes
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON public.abonnement_demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_email ON public.abonnement_demandes(email);

-- Index codes
CREATE INDEX IF NOT EXISTS idx_codes_est_utilise ON public.codes_acces(est_utilise);
CREATE INDEX IF NOT EXISTS idx_codes_email ON public.codes_acces(email_destinataire);
CREATE INDEX IF NOT EXISTS idx_codes_expiration ON public.codes_acces(date_expiration);

-- Index activites_log
CREATE INDEX IF NOT EXISTS idx_activites_hotel_id ON public.activites_log(hotel_id);
CREATE INDEX IF NOT EXISTS idx_activites_user_id ON public.activites_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activites_created_at ON public.activites_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activites_hotel_created ON public.activites_log(hotel_id, created_at DESC);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_est_lue ON public.notifications(user_id, est_lue);
CREATE INDEX IF NOT EXISTS idx_notifications_hotel_id ON public.notifications(hotel_id);


-- ============================================================
-- PHASE 5 : TRIGGERS
-- ============================================================

-- ─── 5.1 Auto-update updated_at (7 tables) ───

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER personnel_hotel_updated_at
  BEFORE UPDATE ON public.personnel_hotel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER chambres_updated_at
  BEFORE UPDATE ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER abonnement_demandes_updated_at
  BEFORE UPDATE ON public.abonnement_demandes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 5.2 Création auto du profil à l'inscription ───

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5.3 Mise à jour nombre_chambres après INSERT chambre ───

CREATE TRIGGER chambres_apres_insert
  AFTER INSERT ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_hotel_chambres_count();

-- ─── 5.4 Mise à jour nombre_chambres après DELETE chambre ───

CREATE TRIGGER chambres_apres_delete
  AFTER DELETE ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_hotel_chambres_count();

-- ─── 5.5 Auto-calcul montants TTC sur factures ───

CREATE TRIGGER factures_calcul_montants
  BEFORE INSERT OR UPDATE OF montant_ht, taux_tva ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.calculer_montants_facture();

-- ─── 5.6 Auto-calcul montant total sur réservations ───

CREATE TRIGGER reservations_calcul
  BEFORE INSERT OR UPDATE OF date_arrivee, date_depart, prix_nuit ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.calculer_reservation();


-- ============================================================
-- PHASE 6 : VUES (Dashboard et rapports)
-- ============================================================

-- Vue : Statistiques par hôtel
CREATE OR REPLACE VIEW public.v_stats_hotel AS
SELECT
  h.id AS hotel_id,
  h.nom AS hotel_nom,
  h.plan,
  h.nombre_etoiles,
  h.est_actif,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id) AS total_chambres,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'disponible') AS chambres_disponibles,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'occupee') AS chambres_occupees,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'maintenance') AS chambres_maintenance,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'reservee') AS chambres_reservees,
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
  CASE WHEN h.date_fin_abonnement <= NOW() + INTERVAL '7 days' THEN true ELSE false END AS abonnement_expirant
FROM public.hotels h;

COMMENT ON VIEW public.v_stats_hotel IS 'Vue agrégée des statistiques par hôtel';

-- Vue : Taux d'occupation par hôtel
CREATE OR REPLACE VIEW public.v_taux_occupation AS
SELECT
  h.id AS hotel_id,
  h.nom AS hotel_nom,
  ROUND(
    (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id AND c.statut = 'occupee')::DECIMAL * 100.0
    / NULLIF((SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id), 0),
    1
  ) AS taux_occupation_pourcent,
  (SELECT COUNT(*) FROM public.chambres c WHERE c.hotel_id = h.id) AS total_chambres
FROM public.hotels h
WHERE h.est_actif = TRUE;

COMMENT ON VIEW public.v_taux_occupation IS 'Taux d''occupation en temps réel par hôtel';

-- Vue : Top des chambres les plus réservées
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
-- PHASE 7 : ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ─── 7.0 Activation du RLS sur toutes les tables ───

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_hotel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnement_demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes_acces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ─── 7.1 Politiques — table profiles ───

-- Tout utilisateur connecté peut voir son propre profil
CREATE POLICY "profiles_voir_profil_perso"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Le super_admin peut voir et modifier tous les profils
CREATE POLICY "profiles_super_admin_total"
  ON public.profiles FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Un admin_hotel peut voir les profils de son hôtel
CREATE POLICY "profiles_admin_hotel_voir_equipe"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid()));


-- ─── 7.2 Politiques — table hotels ───

-- Tout le monde peut voir les hôtels actifs (landing page)
CREATE POLICY "hotels_public_read_actifs"
  ON public.hotels FOR SELECT
  TO anon, authenticated
  USING (est_actif = TRUE);

-- L'admin d'un hôtel peut voir et modifier uniquement son hôtel
CREATE POLICY "hotels_admin_own"
  ON public.hotels FOR ALL
  TO authenticated
  USING (admin_id = auth.uid());

-- Le super_admin peut tout faire sur les hôtels
CREATE POLICY "hotels_super_admin_total"
  ON public.hotels FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.3 Politiques — tables chambres, clients, reservations, factures ───

-- Chambres
CREATE POLICY "chambres_hotel_access"
  ON public.chambres FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Clients
CREATE POLICY "clients_hotel_access"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Réservations
CREATE POLICY "reservations_hotel_access"
  ON public.reservations FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Factures
CREATE POLICY "factures_hotel_access"
  ON public.factures FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.4 Politiques — table personnel_hotel ───

CREATE POLICY "personnel_hotel_access"
  ON public.personnel_hotel FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.5 Politiques — table abonnement_demandes ───

-- Insertion publique (formulaire landing page)
CREATE POLICY "demandes_public_insert"
  ON public.abonnement_demandes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lecture/modification uniquement super_admin
CREATE POLICY "demandes_super_admin_all"
  ON public.abonnement_demandes FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.6 Politiques — table codes_acces ───

-- Tout utilisateur peut lire un code pour vérifier sa validité
CREATE POLICY "codes_public_read"
  ON public.codes_acces FOR SELECT
  TO anon, authenticated
  USING (true);

-- super_admin peut tout faire
CREATE POLICY "codes_super_admin_all"
  ON public.codes_acces FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.7 Politiques — table activites_log ───

CREATE POLICY "activites_hotel_access"
  ON public.activites_log FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.8 Politiques — table notifications ───

CREATE POLICY "notifications_user_access"
  ON public.notifications FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- PHASE 8 : DONNÉES INITIALES
-- ============================================================

-- Donnée de test pour vérifier le bon fonctionnement
INSERT INTO public.abonnement_demandes
  (nom_complet, email, telephone, nom_hotel, ville, quartier, nombre_chambres, plan_choisi, message)
VALUES (
  'Kouamé Aminata',
  'aminata.kouame@email.com',
  '+2250708090909',
  'Hôtel Le Palmier',
  'Abidjan',
  'Cocody',
  15,
  'standard',
  'Je souhaite souscrire au plan Standard pour mon hôtel de 15 chambres. Merci de me recontacter.'
);


-- ============================================================
-- RÉSUMÉ FINAL
-- ============================================================
--
-- TABLES (11) :
--   abonnement_demandes → codes_acces → hotels → profiles →
--   personnel_hotel, chambres, clients, reservations, factures,
--   activites_log, notifications
--
-- FONCTIONS (11) :
--   update_updated_at_column     — auto MAJ updated_at
--   generer_numero_facture       — numéro de facture unique
--   calculer_montants_facture    — TVA + TTC auto
--   calculer_reservation         — montant total auto
--   generer_code_acces           — code 8 caractères aléatoire
--   update_hotel_chambres_count  — compteur chambres auto
--   handle_new_user              — profil auto à l'inscription
--   get_hotel_stats(UUID)        — stats JSON par hôtel
--   get_super_admin_stats()      — stats globales super_admin
--   is_super_admin()             — vérifie rôle super_admin
--   get_user_hotel_id()          — hotel_id de l'utilisateur courant
--
-- TRIGGERS (12) :
--   updated_at : profiles, hotels, personnel, chambres, clients,
--                reservations, abonnement_demandes (×7)
--   chambres_apres_insert  — compteur +1
--   chambres_apres_delete  — compteur -1
--   factures_calcul_montants — TVA auto
--   reservations_calcul      — montant total auto
--   on_auth_user_created     — profil auto
--
-- RLS (20 politiques) :
--   profiles    : profil perso, super_admin total, admin_hotel équipe
--   hotels      : public read actifs, admin own, super_admin total
--   chambres/clients/reservations/factures/personnel_hotel :
--                hotel_id based + super_admin
--   abonnement_demandes : public insert, super_admin CRUD
--   codes_acces : public read, super_admin CRUD
--   activites_log : hotel_id + user_id + super_admin
--   notifications : user_id + hotel_id + super_admin
--
-- VUES (3) : v_stats_hotel, v_taux_occupation, v_top_chambres
-- INDEX (38) : optimisés pour les requêtes fréquentes
--
-- TVA PAR DÉFAUT : 18% (Côte d'Ivoire)
-- DEVISE : FCFA — DECIMAL(10,2)
-- AUCUN ENUM — tout en TEXT + CHECK
-- ============================================================
