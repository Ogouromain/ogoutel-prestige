-- ============================================================
-- OGOUTEL_Prestige - Schéma Complet de la Base de Données
-- Fichier : supabase/schema.sql
-- Base de données : Supabase (PostgreSQL 15)
-- Application SaaS multi-tenant de Gestion Hôtelière
-- Pays : Côte d'Ivoire | Devise : FCFA
-- ============================================================
--
-- RÈGLES :
--   - Compatible PostgreSQL 15
--   - Idempotent (IF NOT EXISTS / OR REPLACE partout)
--   - Commentaires en français
--   - Zéro ENUM — tout en TEXT + CHECK
--
-- ORDRE DE CRÉATION (dépendances FK respectées) :
--   1. abonnement_demandes  (aucune FK)
--   2. codes_acces          (FK → abonnement_demandes)
--   3. hotels               (FK → codes_acces, auth.users)
--   4. profiles             (FK → hotels, auth.users)
--   5. ALTER codes_acces    (FK utilise_par → profiles)
--   6. personnel_hotel      (FK → hotels, auth.users)
--   7. chambres             (FK → hotels)
--   8. clients              (FK → hotels)
--   9. reservations         (FK → hotels, chambres, clients, profiles)
--  10. factures             (FK → hotels, reservations, clients)
--  11. activites_log        (FK → hotels, auth.users)
--  12. notifications        (FK → profiles, hotels)
-- ============================================================


-- ============================================================
-- 0. NETTOYAGE (décommenter pour une réinstallation propre)
-- ============================================================
-- ⚠️ Décommenter les lignes ci-dessous SEULEMENT pour tout
--    recréer de zéro. Sinon, laisser commenté pour exécution
--    idempotente (les CREATE IF NOT EXISTS ignoreront ce qui existe).

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
*/


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. TABLES — Création dans l'ordre des dépendances FK
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 2.1 TABLE : abonnement_demandes (PARTIE 3 — Landing page)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.abonnement_demandes (
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
-- 2.2 TABLE : codes_acces
--     Créé AVANT hotels (hotels.code_acces_id le référence)
--     FK utilise_par ajoutée APRÈS profiles (via ALTER TABLE)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.codes_acces (
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
-- 2.3 TABLE : hotels (PARTIE 5)
--     admin_id → auth.users (pas de dépendance circulaire)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hotels (
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
-- 2.4 TABLE : profiles
--     Extension de auth.users — lié via trigger (PARTIE 12)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
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
  -- ⚠️ Pas de contrainte hotel_id NOT NULL car le trigger
  --    handle_new_user() crée le profil AVANT l'affectation
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs — extension de auth.users';
COMMENT ON COLUMN public.profiles.id IS 'UUID identique à auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'Email unique identique à auth.users.email';
COMMENT ON COLUMN public.profiles.role IS 'Rôle SaaS : super_admin | admin_hotel | gerant | receptionniste';
COMMENT ON COLUMN public.profiles.hotel_id IS 'Hôtel d''affectation (NULL = super_admin global)';


-- ─── FK codes_acces.utilise_par → profiles.id (idempotent) ──

DO $$ BEGIN
  ALTER TABLE public.codes_acces
    ADD CONSTRAINT codes_acces_utilise_par_fkey
    FOREIGN KEY (utilise_par) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.codes_acces.utilise_par IS 'Utilisateur ayant utilisé le code';


-- ────────────────────────────────────────────────────────────
-- 2.5 TABLE : personnel_hotel (PARTIE 10)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personnel_hotel (
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
-- 2.6 TABLE : chambres (PARTIE 6)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chambres (
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
-- 2.7 TABLE : clients (PARTIE 7)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clients (
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
-- 2.8 TABLE : reservations (PARTIE 8)
--     ⚠️ nombre_nuits est GENERATED ALWAYS AS STORED
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reservations (
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
-- 2.9 TABLE : factures (PARTIE 9)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.factures (
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
-- 2.10 TABLE : activites_log (PARTIE 11)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activites_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES public.hotels(id),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activites_log IS 'Journal d''activité — audit trail pour chaque hôtel';


-- ────────────────────────────────────────────────────────────
-- 2.11 TABLE : notifications
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
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
-- 3. INDEX — Optimisation des requêtes fréquentes
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
-- 4. FONCTIONS UTILITAIRES (PARTIE 14)
-- ============================================================

-- ─── 4.1 Mise à jour automatique de updated_at (PARTIE 12.1) ───

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 4.2 Génère un numéro de facture globalement unique ───

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

-- ─── 4.3 Calcule automatiquement TVA et TTC sur factures ───

CREATE OR REPLACE FUNCTION public.calculer_montants_facture()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_tva := ROUND(NEW.montant_ht * (NEW.taux_tva / 100.0), 2);
  NEW.montant_ttc := ROUND(NEW.montant_ht + NEW.montant_tva, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 4.4 Calcule le montant total d'une réservation ───
--      ⚠️ nombre_nuits est GENERATED STORED → on ne la touche pas

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

-- ─── 4.5 Génère un code d'accès aléatoire de 8 caractères ───

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

-- ─── 4.6 Met à jour hotels.nombre_chambres après INSERT/DELETE chambre (PARTIE 12.3-12.4) ───

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

-- ─── 4.7 Création automatique du profil (PARTIE 12.2) ───

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

-- ─── 4.8 get_hotel_stats(hotel_uuid) → JSON (PARTIE 14.1) ───

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

-- ─── 4.9 get_super_admin_stats() → TABLE (PARTIE 14.2) ───

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

-- ─── 4.10 is_super_admin() → BOOLEAN (PARTIE 14.3) ───

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── 4.11 get_user_hotel_id() → UUID (PARTIE 14.4) ───

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
-- 5. TRIGGERS (PARTIE 12)
--    Pattern idempotent : DROP IF EXISTS + CREATE
-- ============================================================

-- ─── 5.1 Auto-update updated_at sur toutes les tables (PARTIE 12.1) ───

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS hotels_updated_at ON public.hotels;
CREATE TRIGGER hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS personnel_hotel_updated_at ON public.personnel_hotel;
CREATE TRIGGER personnel_hotel_updated_at
  BEFORE UPDATE ON public.personnel_hotel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS chambres_updated_at ON public.chambres;
CREATE TRIGGER chambres_updated_at
  BEFORE UPDATE ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS reservations_updated_at ON public.reservations;
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS abonnement_demandes_updated_at ON public.abonnement_demandes;
CREATE TRIGGER abonnement_demandes_updated_at
  BEFORE UPDATE ON public.abonnement_demandes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 5.2 Création auto du profil à l'inscription (PARTIE 12.2) ───

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5.3 Mise à jour nombre_chambres après INSERT chambre (PARTIE 12.3) ───

DROP TRIGGER IF EXISTS chambres_apres_insert ON public.chambres;
CREATE TRIGGER chambres_apres_insert
  AFTER INSERT ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_hotel_chambres_count();

-- ─── 5.4 Mise à jour nombre_chambres après DELETE chambre (PARTIE 12.4) ───

DROP TRIGGER IF EXISTS chambres_apres_delete ON public.chambres;
CREATE TRIGGER chambres_apres_delete
  AFTER DELETE ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_hotel_chambres_count();

-- ─── 5.5 Auto-calcul montants TTC sur factures ───

DROP TRIGGER IF EXISTS factures_calcul_montants ON public.factures;
CREATE TRIGGER factures_calcul_montants
  BEFORE INSERT OR UPDATE OF montant_ht, taux_tva ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.calculer_montants_facture();

-- ─── 5.6 Auto-calcul montant total sur réservations ───
--      ⚠️ Ne modifie PAS nombre_nuits (colonne GENERATED)

DROP TRIGGER IF EXISTS reservations_calcul ON public.reservations;
CREATE TRIGGER reservations_calcul
  BEFORE INSERT OR UPDATE OF date_arrivee, date_depart, prix_nuit ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.calculer_reservation();


-- ============================================================
-- 6. VUES (Dashboard et rapports)
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
-- 7. ROW LEVEL SECURITY — PARTIE 13
--    Active RLS sur TOUTES les tables
--    Pattern idempotent : DROP POLICY IF EXISTS + CREATE POLICY
-- ============================================================

-- ─── 7.0 Activation du RLS ─────────────────────────────────

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


-- ─── 7.1 Politiques — table profiles ────────────────────────

-- Tout utilisateur connecté peut voir son propre profil
DROP POLICY IF EXISTS "profiles_voir_profil_perso" ON public.profiles;
CREATE POLICY "profiles_voir_profil_perso"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Le super_admin peut voir et modifier tous les profils
DROP POLICY IF EXISTS "profiles_super_admin_total" ON public.profiles;
CREATE POLICY "profiles_super_admin_total"
  ON public.profiles FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Un admin_hotel peut voir les profils de son hôtel
DROP POLICY IF EXISTS "profiles_admin_hotel_voir_equipe" ON public.profiles;
CREATE POLICY "profiles_admin_hotel_voir_equipe"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid()));


-- ─── 7.2 Politiques — table hotels ─────────────────────────

-- Tout le monde peut voir les hôtels actifs (landing page)
DROP POLICY IF EXISTS "hotels_public_read_actifs" ON public.hotels;
CREATE POLICY "hotels_public_read_actifs"
  ON public.hotels FOR SELECT
  TO anon, authenticated
  USING (est_actif = TRUE);

-- L'admin d'un hôtel peut voir et modifier uniquement son hôtel
DROP POLICY IF EXISTS "hotels_admin_own" ON public.hotels;
CREATE POLICY "hotels_admin_own"
  ON public.hotels FOR ALL
  TO authenticated
  USING (admin_id = auth.uid());

-- Le super_admin peut tout faire sur les hôtels
DROP POLICY IF EXISTS "hotels_super_admin_total" ON public.hotels;
CREATE POLICY "hotels_super_admin_total"
  ON public.hotels FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.3 Politiques — tables chambres, clients, reservations, factures ───
--    Règle : accès basé sur hotel_id du profil de l'utilisateur
--    Le super_admin peut tout voir

-- Chambres
DROP POLICY IF EXISTS "chambres_hotel_access" ON public.chambres;
CREATE POLICY "chambres_hotel_access"
  ON public.chambres FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Clients
DROP POLICY IF EXISTS "clients_hotel_access" ON public.clients;
CREATE POLICY "clients_hotel_access"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Réservations
DROP POLICY IF EXISTS "reservations_hotel_access" ON public.reservations;
CREATE POLICY "reservations_hotel_access"
  ON public.reservations FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Factures
DROP POLICY IF EXISTS "factures_hotel_access" ON public.factures;
CREATE POLICY "factures_hotel_access"
  ON public.factures FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.4 Politiques — table personnel_hotel ────────────────

DROP POLICY IF EXISTS "personnel_hotel_access" ON public.personnel_hotel;
CREATE POLICY "personnel_hotel_access"
  ON public.personnel_hotel FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.5 Politiques — table abonnement_demandes ────────────
--    Insertion publique (formulaire landing page)
--    Lecture/modification uniquement pour le super_admin

-- Insertion publique (anon + authenticated)
DROP POLICY IF EXISTS "demandes_public_insert" ON public.abonnement_demandes;
CREATE POLICY "demandes_public_insert"
  ON public.abonnement_demandes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lecture/modification uniquement super_admin
DROP POLICY IF EXISTS "demandes_super_admin_all" ON public.abonnement_demandes;
CREATE POLICY "demandes_super_admin_all"
  ON public.abonnement_demandes FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.6 Politiques — table codes_acces ────────────────────
--    Tout utilisateur peut lire un code pour vérifier sa validité
--    super_admin peut tout faire

DROP POLICY IF EXISTS "codes_public_read" ON public.codes_acces;
CREATE POLICY "codes_public_read"
  ON public.codes_acces FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "codes_super_admin_all" ON public.codes_acces;
CREATE POLICY "codes_super_admin_all"
  ON public.codes_acces FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');


-- ─── 7.7 Politiques — table activites_log ──────────────────

DROP POLICY IF EXISTS "activites_hotel_access" ON public.activites_log;
CREATE POLICY "activites_hotel_access"
  ON public.activites_log FOR ALL
  TO authenticated
  USING (
    hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );


-- ─── 7.8 Politiques — table notifications ──────────────────

DROP POLICY IF EXISTS "notifications_user_access" ON public.notifications;
CREATE POLICY "notifications_user_access"
  ON public.notifications FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR hotel_id = (SELECT hotel_id FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- 8. DONNÉES INITIALES (PARTIE 15)
--    Insert idempotent — ne s'exécute que si les données n'existent pas
-- ============================================================

-- Donnée de test pour vérifier que la table abonnement_demandes fonctionne
INSERT INTO public.abonnement_demandes
  (nom_complet, email, telephone, nom_hotel, ville, quartier, nombre_chambres, plan_choisi, message)
SELECT
  'Kouamé Aminata',
  'aminata.kouame@email.com',
  '+2250708090909',
  'Hôtel Le Palmier',
  'Abidjan',
  'Cocody',
  15,
  'standard',
  'Je souhaite souscrire au plan Standard pour mon hôtel de 15 chambres. Merci de me recontacter.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.abonnement_demandes
  WHERE email = 'aminata.kouame@email.com'
);


-- ============================================================
-- 9. RÉSUMÉ FINAL
-- ============================================================
--
-- TABLES (12) :
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
--   chambres_apres_insert  — compteur +1 (PARTIE 12.3)
--   chambres_apres_delete  — compteur -1 (PARTIE 12.4)
--   factures_calcul_montants — TVA auto
--   reservations_calcul      — montant total auto
--   on_auth_user_created     — profil auto (PARTIE 12.2)
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
-- DONNÉES INITIALES : 1 demande de test (abonnement_demandes)
--
-- IDEMPOTENT : ✅ CREATE IF NOT EXISTS, CREATE OR REPLACE,
--   DROP TRIGGER/POLICY IF EXISTS + CREATE, INSERT WHERE NOT EXISTS
--
-- TVA PAR DÉFAUT : 18% (Côte d'Ivoire)
-- DEVISE : FCFA — DECIMAL(10,2)
-- AUCUN ENUM — tout en TEXT + CHECK
-- ============================================================
