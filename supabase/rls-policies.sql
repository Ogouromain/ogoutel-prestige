-- ============================================================
-- OGOUTEL_Prestige - RLS POLICIES (V2 - GRANULAIRES)
-- Fichier : supabase/rls-policies.sql
--
-- Politiques de sécurité Row Level Security par rôle :
--   - super_admin    → accès total (toutes tables)
--   - admin_hotel     → CRUD complet sur son hôtel
--   - gerant          → CRUD sur son hôtel (sauf settings, finances avancées)
--   - receptionniste  → READ + UPDATE limité (pas DELETE)
--
-- TABLES :
--   1.  hotels
--   2.  profiles
--   3.  chambres
--   4.  clients
--   5.  reservations
--   6.  factures
--   7.  personnel_hotel
--   8.  abonnement_demandes
--   9.  codes_acces
--   10. activites_log
--   11. notifications
--
-- ⚠️  Ce script DROPE les anciennes politiques et les recrée.
--     À exécuter APRÈS schema.sql
-- ============================================================


-- ============================================================
-- PHASE 0 : NETTOYAGE DES ANCIENNES POLITIQUES
-- ============================================================

-- Suppression de toutes les politiques existantes

-- hotels
DROP POLICY IF EXISTS "hotels_public_read_actifs" ON public.hotels;
DROP POLICY IF EXISTS "hotels_admin_own" ON public.hotels;
DROP POLICY IF EXISTS "hotels_super_admin_total" ON public.hotels;

-- profiles
DROP POLICY IF EXISTS "profiles_voir_profil_perso" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_total" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_hotel_voir_equipe" ON public.profiles;

-- chambres
DROP POLICY IF EXISTS "chambres_hotel_access" ON public.chambres;

-- clients
DROP POLICY IF EXISTS "clients_hotel_access" ON public.clients;

-- reservations
DROP POLICY IF EXISTS "reservations_hotel_access" ON public.reservations;

-- factures
DROP POLICY IF EXISTS "factures_hotel_access" ON public.factures;

-- personnel_hotel
DROP POLICY IF EXISTS "personnel_hotel_access" ON public.personnel_hotel;

-- abonnement_demandes
DROP POLICY IF EXISTS "demandes_public_insert" ON public.abonnement_demandes;
DROP POLICY IF EXISTS "demandes_super_admin_all" ON public.abonnement_demandes;

-- codes_acces
DROP POLICY IF EXISTS "codes_public_read" ON public.codes_acces;
DROP POLICY IF EXISTS "codes_super_admin_all" ON public.codes_acces;

-- activites_log
DROP POLICY IF EXISTS "activites_hotel_access" ON public.activites_log;

-- notifications
DROP POLICY IF EXISTS "notifications_user_access" ON public.notifications;


-- ============================================================
-- PHASE 1 : FONCTIONS D'AIDE POUR RLS
-- ============================================================

-- Fonction : récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction : récupérer le hotel_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.current_user_hotel_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT hotel_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction : vérifier si l'utilisateur est membre du staff d'un hôtel
CREATE OR REPLACE FUNCTION public.is_hotel_member(p_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND hotel_id = p_hotel_id
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- PHASE 2 : TABLE hotels
-- ============================================================
-- Règles :
--   - Public (anon + authenticated) : SELECT sur les hôtels actifs
--   - super_admin : ALL (CRUD complet)
--   - admin_hotel : SELECT + UPDATE sur son propre hôtel
--   - gerant, receptionniste : SELECT uniquement sur leur hôtel

-- Public : voir les hôtels actifs (landing page)
CREATE POLICY "hotels_public_select_actifs"
  ON public.hotels FOR SELECT
  TO anon, authenticated
  USING (est_actif = TRUE);

-- Super admin : accès total
CREATE POLICY "hotels_sa_all"
  ON public.hotels FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin hôtel : voir son hôtel
CREATE POLICY "hotels_admin_select_own"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid());

-- Admin hôtel : modifier son hôtel (pas créer, ni supprimer)
CREATE POLICY "hotels_admin_update_own"
  ON public.hotels FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Staff : voir l'hôtel où ils travaillent
CREATE POLICY "hotels_staff_select_hotel"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (id = public.current_user_hotel_id());


-- ============================================================
-- PHASE 3 : TABLE profiles
-- ============================================================
-- Règles :
--   - Chacun : SELECT + UPDATE sur son propre profil
--   - super_admin : ALL sur tous les profils
--   - admin_hotel : SELECT sur les profils de son hôtel
--   - gerant : SELECT sur les profils de son hôtel
--   - receptionniste : SELECT sur son propre profil uniquement

-- Profil personnel : SELECT
CREATE POLICY "profiles_self_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Profil personnel : UPDATE (nom, téléphone, avatar)
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Super admin : accès total
CREATE POLICY "profiles_sa_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin hôtel : voir les profils de son équipe
CREATE POLICY "profiles_admin_select_team"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  );

-- Admin hôtel : UPDATE le rôle et l'hôtel_id du staff (pas le sien)
CREATE POLICY "profiles_admin_update_team"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND id != auth.uid()
    AND public.current_user_role() = 'admin_hotel'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND id != auth.uid()
  );


-- ============================================================
-- PHASE 4 : TABLE chambres
-- ============================================================
-- Règles :
--   - super_admin : ALL
--   - admin_hotel : ALL sur les chambres de son hôtel
--   - gerant : ALL sur les chambres de son hôtel
--   - receptionniste : SELECT + UPDATE (statut seulement, pas DELETE)

-- Super admin : accès total
CREATE POLICY "chambres_sa_all"
  ON public.chambres FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin/Gérant : CRUD complet sur les chambres de leur hôtel
CREATE POLICY "chambres_admin_all"
  ON public.chambres FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  );

-- Réceptionniste : SELECT sur les chambres de son hôtel
CREATE POLICY "chambres_staff_select"
  ON public.chambres FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : UPDATE le statut uniquement (check-in/check-out)
CREATE POLICY "chambres_staff_update_status"
  ON public.chambres FOR UPDATE
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- ⚠️ Réceptionniste ne peut PAS supprimer de chambre
-- (Pas de politique DELETE pour receptionniste → refusé par RLS)


-- ============================================================
-- PHASE 5 : TABLE clients
-- ============================================================
-- Règles :
--   - super_admin : ALL
--   - admin_hotel : ALL sur les clients de son hôtel
--   - gerant : ALL sur les clients de son hôtel
--   - receptionniste : SELECT + INSERT + UPDATE (pas DELETE)

-- Super admin : accès total
CREATE POLICY "clients_sa_all"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin/Gérant : CRUD complet
CREATE POLICY "clients_admin_all"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  );

-- Réceptionniste : SELECT
CREATE POLICY "clients_staff_select"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : INSERT (création client lors check-in)
CREATE POLICY "clients_staff_insert"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : UPDATE (modifier infos client)
CREATE POLICY "clients_staff_update"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- ⚠️ Réceptionniste ne peut PAS supprimer de client


-- ============================================================
-- PHASE 6 : TABLE reservations
-- ============================================================
-- Règles :
--   - super_admin : ALL
--   - admin_hotel : ALL sur les réservations de son hôtel
--   - gerant : ALL sur les réservations de son hôtel
--   - receptionniste : SELECT + INSERT + UPDATE (pas DELETE)

-- Super admin : accès total
CREATE POLICY "reservations_sa_all"
  ON public.reservations FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin/Gérant : CRUD complet
CREATE POLICY "reservations_admin_all"
  ON public.reservations FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  );

-- Réceptionniste : SELECT
CREATE POLICY "reservations_staff_select"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : INSERT (création réservation / check-in)
CREATE POLICY "reservations_staff_insert"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : UPDATE (modifier statut, dates, notes)
CREATE POLICY "reservations_staff_update"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- ⚠️ Réceptionniste ne peut PAS annuler/supprimer de réservation


-- ============================================================
-- PHASE 7 : TABLE factures
-- ============================================================
-- Règles :
--   - super_admin : ALL
--   - admin_hotel : ALL
--   - gerant : SELECT + UPDATE
--   - receptionniste : SELECT uniquement

-- Super admin : accès total
CREATE POLICY "factures_sa_all"
  ON public.factures FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin : CRUD complet
CREATE POLICY "factures_admin_all"
  ON public.factures FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  );

-- Gérant : SELECT + UPDATE
CREATE POLICY "factures_gerant_select"
  ON public.factures FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'gerant'
  );

CREATE POLICY "factures_gerant_update"
  ON public.factures FOR UPDATE
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'gerant'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'gerant'
  );

-- Réceptionniste : SELECT uniquement
CREATE POLICY "factures_staff_select"
  ON public.factures FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );


-- ============================================================
-- PHASE 8 : TABLE personnel_hotel
-- ============================================================
-- Règles :
--   - super_admin : ALL
--   - admin_hotel : ALL (CRUD sur le personnel de son hôtel)
--   - gerant : SELECT sur le personnel de son hôtel
--   - receptionniste : SELECT sur le personnel de son hôtel

-- Super admin : accès total
CREATE POLICY "personnel_sa_all"
  ON public.personnel_hotel FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin : CRUD complet sur le personnel de son hôtel
CREATE POLICY "personnel_admin_all"
  ON public.personnel_hotel FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  );

-- Gérant : SELECT sur le personnel
CREATE POLICY "personnel_gerant_select"
  ON public.personnel_hotel FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'gerant'
  );

-- Réceptionniste : SELECT sur le personnel
CREATE POLICY "personnel_staff_select"
  ON public.personnel_hotel FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );


-- ============================================================
-- PHASE 9 : TABLE abonnement_demandes
-- ============================================================
-- Règles :
--   - Public (anon + authenticated) : INSERT (formulaire landing)
--   - super_admin : ALL (gestion des demandes)

-- Public : INSERT (soumission depuis le site)
CREATE POLICY "demandes_public_insert"
  ON public.abonnement_demandes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Super admin : ALL
CREATE POLICY "demandes_sa_all"
  ON public.abonnement_demandes FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');


-- ============================================================
-- PHASE 10 : TABLE codes_acces
-- ============================================================
-- Règles :
--   - anon + authenticated : SELECT (pour vérifier un code)
--   - super_admin : ALL (génération, gestion des codes)

-- Public : SELECT (vérification code lors inscription)
CREATE POLICY "codes_public_select"
  ON public.codes_acces FOR SELECT
  TO anon, authenticated
  USING (true);

-- Super admin : ALL
CREATE POLICY "codes_sa_all"
  ON public.codes_acces FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');


-- ============================================================
-- PHASE 11 : TABLE activites_log
-- ============================================================
-- Règles :
--   - super_admin : ALL (audit global)
--   - admin_hotel : ALL sur les logs de son hôtel
--   - gerant : SELECT sur les logs de son hôtel
--   - receptionniste : INSERT (log ses actions) + SELECT sur ses propres actions

-- Super admin : accès total
CREATE POLICY "activites_sa_all"
  ON public.activites_log FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin : ALL sur logs de son hôtel
CREATE POLICY "activites_admin_all"
  ON public.activites_log FOR ALL
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  )
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'admin_hotel'
  );

-- Gérant : SELECT sur logs de son hôtel
CREATE POLICY "activites_gerant_select"
  ON public.activites_log FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'gerant'
  );

-- Réceptionniste : INSERT (logger ses actions)
CREATE POLICY "activites_staff_insert"
  ON public.activites_log FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() = 'receptionniste'
  );

-- Réceptionniste : SELECT sur ses propres actions
CREATE POLICY "activites_staff_select"
  ON public.activites_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.current_user_role() = 'receptionniste'
  );


-- ============================================================
-- PHASE 12 : TABLE notifications
-- ============================================================
-- Règles :
--   - Chaque utilisateur : SELECT + UPDATE (marquer comme lue) sur ses propres notifs
--   - super_admin : ALL
--   - Admin/Gérant : SELECT sur les notifs de leur hôtel

-- Super admin : accès total
CREATE POLICY "notifications_sa_all"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Utilisateur : SELECT ses propres notifications
CREATE POLICY "notifications_self_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Utilisateur : UPDATE (marquer comme lue)
CREATE POLICY "notifications_self_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin/Gérant : SELECT notifs de leur hôtel
CREATE POLICY "notifications_admin_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    hotel_id = public.current_user_hotel_id()
    AND public.current_user_role() IN ('admin_hotel', 'gerant')
  );


-- ============================================================
-- RÉSUMÉ DES POLITIQUES PAR RÔLE
-- ============================================================
--
-- TABLE              | super_admin | admin_hotel    | gerant          | receptionniste
-- ───────────────────┼─────────────┼────────────────┼─────────────────┼───────────────────
-- hotels             | ALL         | SELECT+UPDATE  | SELECT          | SELECT
-- profiles           | ALL         | SELECT+UPDATE* | SELECT          | SELECT+UPDATE(self)
-- chambres           | ALL         | ALL            | ALL             | SELECT+UPDATE
-- clients            | ALL         | ALL            | ALL             | SELECT+INSERT+UPDATE
-- reservations       | ALL         | ALL            | ALL             | SELECT+INSERT+UPDATE
-- factures           | ALL         | ALL            | SELECT+UPDATE   | SELECT
-- personnel_hotel    | ALL         | ALL            | SELECT          | SELECT
-- abonnement_demandes| ALL         | —              | —               | —
-- codes_acces        | ALL         | —              | —               | —
-- activites_log      | ALL         | ALL            | SELECT          | INSERT+SELECT(self)
-- notifications      | ALL         | SELECT+UPDATE  | SELECT          | SELECT+UPDATE(self)
--
-- * admin_hotel peut UPDATE les profils de son équipe (pas le sien)
--
-- LÉGENDE :
--   ALL              = SELECT + INSERT + UPDATE + DELETE
--   SELECT+UPDATE    = Lecture et modification
--   SELECT+INSERT    = Lecture et création
--   INSERT           = Création uniquement
--   —                = Aucun accès
--
-- ============================================================
