-- ============================================================
-- OGOUTEL_Prestige - Schéma Complet de la Base de Données
-- Fichier : supabase/schema.sql
-- Base de données : Supabase (PostgreSQL)
-- Application SaaS multi-tenant de Gestion Hôtelière
-- Pays : Côte d'Ivoire | Devise : FCFA
-- ============================================================
--
-- PRINCIPE : Tous les statuts/roles/types utilisent TEXT + CHECK
--            (pas d'ENUM) pour plus de flexibilité.
--
-- ORDRE DE CRÉATION (respect strict des dépendances FK) :
--   1. abonnement_demandes  (aucune FK)
--   2. codes_acces          (FK → abonnement_demandes)
--   3. hotels               (FK → codes_acces, auth.users)
--   4. profiles             (FK → hotels, auth.users)
--   5. ALTER codes_acces    (ajout FK utilise_par → profiles)
--   6. personnel_hotel      (FK → hotels, auth.users)
--   7. chambres             (FK → hotels)
--   8. clients              (FK → hotels)
--   9. reservations         (FK → hotels, chambres, clients, profiles)
--  10. factures             (FK → hotels, reservations, clients)
--  11. activites_log        (FK → hotels, auth.users)
--  12. notifications        (FK → profiles, hotels)
-- ============================================================


-- ============================================================
-- 0. NETTOYAGE (optionnel — décommenter pour réinstallation)
-- ============================================================

-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.activites_log CASCADE;
-- DROP TABLE IF EXISTS public.factures CASCADE;
-- DROP TABLE IF EXISTS public.reservations CASCADE;
-- DROP TABLE IF EXISTS public.clients CASCADE;
-- DROP TABLE IF EXISTS public.chambres CASCADE;
-- DROP TABLE IF EXISTS public.personnel_hotel CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.codes_acces CASCADE;
-- DROP TABLE IF EXISTS public.hotels CASCADE;
-- DROP TABLE IF EXISTS public.abonnement_demandes CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- DROP VIEW IF EXISTS public.v_stats_hotel CASCADE;
-- DROP VIEW IF EXISTS public.v_taux_occupation CASCADE;
-- DROP VIEW IF EXISTS public.v_top_chambres CASCADE;
-- DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS public.generer_numero_facture() CASCADE;
-- DROP FUNCTION IF EXISTS public.generer_numero_facture(UUID) CASCADE;
-- DROP FUNCTION IF EXISTS public.calculer_montants_facture() CASCADE;
-- DROP FUNCTION IF EXISTS public.calculer_reservation() CASCADE;
-- DROP FUNCTION IF EXISTS public.generer_code_acces() CASCADE;
-- DROP TYPE IF EXISTS plan_abonnement CASCADE;
-- DROP TYPE IF EXISTS type_chambre CASCADE;
-- DROP TYPE IF EXISTS statut_chambre CASCADE;
-- DROP TYPE IF EXISTS statut_reservation CASCADE;
-- DROP TYPE IF EXISTS statut_facture CASCADE;
-- DROP TYPE IF EXISTS mode_paiement CASCADE;
-- DROP TYPE IF EXISTS type_piece_identite CASCADE;
-- DROP TYPE IF EXISTS statut_demande CASCADE;


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. TABLE : abonnement_demandes (PARTIE 3 - Landing page)
-- ============================================================

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


-- ============================================================
-- 3. TABLE : codes_acces
--    ⚠️ créé avant hotels car hotels.code_acces_id le référence
--    ⚠️ utilise_par FK ajouté APRÈS profiles (ALTER TABLE)
-- ============================================================

CREATE TABLE public.codes_acces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL,
  plan                TEXT NOT NULL CHECK (plan IN ('basique', 'standard', 'premium')),
  demande_id          UUID REFERENCES public.abonnement_demandes(id) ON DELETE SET NULL,
  email_destinataire  TEXT NOT NULL,
  nom_hotel           TEXT NOT NULL,
  est_utilise         BOOLEAN NOT NULL DEFAULT FALSE,
  utilise_par         UUID,   -- FK ajoutée APRÈS création de profiles
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
-- 4. TABLE : hotels (PARTIE 5)
--    admin_id → auth.users (pas de dépendance circulaire)
--    code_acces_id → codes_acces
-- ============================================================

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

  -- Contraintes
  CONSTRAINT hotels_email_unique UNIQUE (email),
  CONSTRAINT hotels_nombre_chambres CHECK (nombre_chambres >= 0)
);

COMMENT ON TABLE public.hotels IS 'Établissements hôteliers inscrits sur la plateforme';
COMMENT ON COLUMN public.hotels.plan IS 'Plan d''abonnement : basique, standard, premium';
COMMENT ON COLUMN public.hotels.code_acces_id IS 'Code d''accès utilisé lors de la création';
COMMENT ON COLUMN public.hotels.admin_id IS 'Référence vers auth.users (admin de l''hôtel)';
COMMENT ON COLUMN public.hotels.nombre_etoiles IS 'Classement étoiles (0-5)';


-- ============================================================
-- 5. TABLE : profiles (Profil utilisateur)
--    Lié à auth.users de Supabase via trigger
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
  )
  -- ⚠️ Pas de contrainte hotel_id NOT NULL car le trigger
  --    handle_new_user() crée le profil AVANT l'affectation à un hôtel
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs — extension de auth.users de Supabase';
COMMENT ON COLUMN public.profiles.id IS 'UUID identique à auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'Email unique identique à auth.users.email';
COMMENT ON COLUMN public.profiles.role IS 'Rôle SaaS : super_admin | admin_hotel | gerant | receptionniste';
COMMENT ON COLUMN public.profiles.hotel_id IS 'Hôtel d''affectation (NULL = super_admin global)';


-- ─── Ajout FK codes_acces.utilise_par → profiles.id ───────────────────────

ALTER TABLE public.codes_acces
  ADD CONSTRAINT codes_acces_utilise_par_fkey
  FOREIGN KEY (utilise_par) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.codes_acces.utilise_par IS 'Utilisateur ayant utilisé le code';


-- ============================================================
-- 6. TABLE : personnel_hotel (PARTIE 10)
-- ============================================================

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

  -- Contraintes
  CONSTRAINT personnel_hotel_unique_user UNIQUE (user_id),
  CONSTRAINT personnel_hotel_unique_hotel_email UNIQUE (hotel_id, email)
);

COMMENT ON TABLE public.personnel_hotel IS 'Personnel rattaché à un hôtel';
COMMENT ON COLUMN public.personnel_hotel.role IS 'Rôle au sein de l''hôtel : gerant | receptionniste';


-- ============================================================
-- 7. TABLE : chambres (PARTIE 6)
-- ============================================================

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

  -- Contraintes
  CONSTRAINT chambres_numero_hotel_unique UNIQUE (hotel_id, numero)
);

COMMENT ON TABLE public.chambres IS 'Chambres de chaque établissement';
COMMENT ON COLUMN public.chambres.prix_nuit IS 'Prix par nuit en FCFA';
COMMENT ON COLUMN public.chambres.equipements IS 'Liste JSON des équipements (ex: ["Climatisation", "TV", "WiFi"])';


-- ============================================================
-- 8. TABLE : clients (PARTIE 7)
-- ============================================================

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
COMMENT ON COLUMN public.clients.piece_identite_type IS 'Type de pièce d''identité présentée';


-- ============================================================
-- 9. TABLE : reservations (PARTIE 8)
--    ⚠️ nombre_nuits est une colonne GÉNÉRÉE (STORED)
-- ============================================================

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

  -- Contraintes
  CONSTRAINT reservations_dates CHECK (date_depart > date_arrivee),
  CONSTRAINT reservations_montant_paye CHECK (
    montant_paye >= 0 AND montant_paye <= COALESCE(montant_total, 0)
  )
);

COMMENT ON TABLE public.reservations IS 'Réservations de chambres';
COMMENT ON COLUMN public.reservations.nombre_nuits IS 'Calculé automatiquement = date_depart - date_arrivee';
COMMENT ON COLUMN public.reservations.montant_total IS 'Montant total en FCFA';


-- ============================================================
-- 10. TABLE : factures (PARTIE 9)
-- ============================================================

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

  -- Contraintes
  CONSTRAINT factures_montants_positifs CHECK (
    montant_ht >= 0 AND montant_tva >= 0 AND montant_ttc >= 0
  )
);

COMMENT ON TABLE public.factures IS 'Factures liées aux réservations';
COMMENT ON COLUMN public.factures.taux_tva IS 'Taux TVA en % (18 par défaut en CI)';
COMMENT ON COLUMN public.factures.numero_facture IS 'Numéro de facture globalement unique';


-- ============================================================
-- 11. TABLE : activites_log (PARTIE 11)
-- ============================================================

CREATE TABLE public.activites_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES public.hotels(id),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activites_log IS 'Journal d''activité — audit trail pour chaque hôtel';


-- ============================================================
-- 12. TABLE : notifications
-- ============================================================

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
CREATE INDEX idx_hotels_code_acces ON public.hotels(code_acces_id);

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
CREATE INDEX idx_factures_numero ON public.factures(numero_facture);

-- Index demandes
CREATE INDEX idx_demandes_statut ON public.abonnement_demandes(statut);
CREATE INDEX idx_demandes_email ON public.abonnement_demandes(email);

-- Index codes
CREATE INDEX idx_codes_est_utilise ON public.codes_acces(est_utilise);
CREATE INDEX idx_codes_email ON public.codes_acces(email_destinataire);
CREATE INDEX idx_codes_expiration ON public.codes_acces(date_expiration);

-- Index activites_log
CREATE INDEX idx_activites_hotel_id ON public.activites_log(hotel_id);
CREATE INDEX idx_activites_user_id ON public.activites_log(user_id);
CREATE INDEX idx_activites_created_at ON public.activites_log(created_at);
CREATE INDEX idx_activites_hotel_created ON public.activites_log(hotel_id, created_at DESC);

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

-- Génère un numéro de facture globalement unique
CREATE OR REPLACE FUNCTION public.generer_numero_facture()
RETURNS TEXT AS $$
DECLARE
  v_annee TEXT := TO_CHAR(NOW(), 'YYYY');
  v_compteur INTEGER;
  v_numero TEXT;
BEGIN
  SELECT COUNT(*)
  INTO v_compteur
  FROM public.factures
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  v_compteur := COALESCE(v_compteur, 0) + 1;
  v_numero := 'FAC-' || v_annee || '-' || LPAD(v_compteur::TEXT, 6, '0');
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

-- Calcule automatiquement le montant total de la réservation
-- ⚠️ nombre_nuits est GENERATED STORED → on ne peut pas la modifier
--    On recalcule l'expression directement pour montant_total
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

-- Auto-update updated_at sur hotels
CREATE TRIGGER hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur personnel_hotel
CREATE TRIGGER personnel_hotel_updated_at
  BEFORE UPDATE ON public.personnel_hotel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur chambres
CREATE TRIGGER chambres_updated_at
  BEFORE UPDATE ON public.chambres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur clients
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur reservations
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at sur abonnement_demandes
CREATE TRIGGER abonnement_demandes_updated_at
  BEFORE UPDATE ON public.abonnement_demandes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calcul des montants TTC sur factures
CREATE TRIGGER factures_calcul_montants
  BEFORE INSERT OR UPDATE OF montant_ht, taux_tva ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.calculer_montants_facture();

-- Auto-calcul du montant total sur réservations
-- ⚠️ ne modifie PAS nombre_nuits (colonne GENERATED)
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
  CASE
    WHEN h.date_fin_abonnement <= NOW() + INTERVAL '7 days' THEN true
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
ALTER TABLE public.activites_log ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "super_admin_acces_total_activites"
  ON public.activites_log FOR ALL
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

CREATE POLICY "utilisateur_voient_leures_activites"
  ON public.activites_log FOR ALL
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
-- 19. RÉSUMÉ FINAL
-- ============================================================
--
-- TABLES (12) :
--   abonnement_demandes → codes_acces → hotels → profiles →
--   personnel_hotel, chambres, clients, reservations, factures,
--   activites_log, notifications
--
-- ⚠️ ORDRE CRITIQUE pour éviter les erreurs FK :
--   1. abonnement_demandes (aucune FK)
--   2. codes_acces (FK → abonnement_demandes)
--   3. hotels (FK → codes_acces, auth.users)
--   4. profiles (FK → hotels, auth.users)
--   5. ALTER codes_acces ADD utilise_par → profiles
--   6+. personnel_hotel, chambres, clients, etc.
--
-- COLONNES GÉNÉRÉES :
--   reservations.nombre_nuits = GENERATED ALWAYS AS (date_depart - date_arrivee) STORED
--
-- TEXT + CHECK (aucun ENUM) :
--   profiles.role : super_admin, admin_hotel, gerant, receptionniste
--   hotels.plan : basique, standard, premium
--   chambres.type : simple, double, suite, vip, familiale
--   chambres.statut : disponible, occupee, maintenance, reservee
--   reservations.statut : en_attente, confirmee, checkin, checkout, annulee
--   factures.statut_paiement : en_attente, partiel, paye
--   factures.mode_paiement : especes, mobile_money, virement, cheque, carte
--   clients.piece_identite_type : CNI, Passeport, Permis, Carte_Sejour, Autre
--   personnel_hotel.role : gerant, receptionniste
--   abonnement_demandes.plan_choisi : basique, standard, premium
--   abonnement_demandes.statut : en_attente, contacte, paye, active
--   notifications.type : reservation_nouvelle, ..., systeme
--
-- VUES (3) : v_stats_hotel, v_taux_occupation, v_top_chambres
-- FONCTIONS (5) : update_updated_at, generer_numero_facture,
--   calculer_montants_facture, calculer_reservation, generer_code_acces
-- TRIGGERS (9) : profiles, hotels, personnel, chambres, clients,
--   reservations, abonnement_demandes, factures, on_auth_user_created
-- INDEX (38) : optimisés pour les requêtes fréquentes
-- RLS (20 politiques) : isolation multi-tenant stricte
-- TVA PAR DÉFAUT : 18% (taux en vigueur en Côte d'Ivoire)
-- DEVISE : FCFA (Franc CFA) - DECIMAL(10,2)
-- ============================================================
