// ============================================
// OGOUTEL_Prestige - Hook useSubscription
// Vérification des limites d'abonnement côté client
//
// Retourne : plan, maxRooms, maxStaff, features
// Vérifie les limites avant actions (ajout chambre, staff)
// Affiche message si limite atteinte
//
// Utilise Supabase pour récupérer le plan de l'hôtel
// Compatible mode dégradé (sans Supabase)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Hotel, PlanId } from '@/types';
import { PLANS_ABONNEMENT } from '@/lib/constants';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionInfo {
  /** ID du plan actuel */
  planId: PlanId | null;
  /** Nom du plan */
  planNom: string;
  /** Prix mensuel en FCFA */
  planPrix: number;
  /** Nombre max de chambres */
  maxRooms: number;
  /** Nombre max de gérants */
  maxGerants: number;
  /** Nombre max de réceptionnistes */
  maxReceptionnistes: number;
  /** Nombre max total de staff */
  maxStaff: number;
  /** Fonctionnalités du plan */
  features: string[];
  /** Plan populaire */
  estPopulaire: boolean;
  /** Hôtel associé */
  hotel: Hotel | null;
  /** Jours restants avant expiration */
  joursRestants: number;
  /** Abonnement expiré */
  estExpire: boolean;
  /** Abonnement bientôt expiré (< 7 jours) */
  estExpirant: boolean;
  /** Hôtel actif */
  estActif: boolean;
  /** Chargement */
  isLoading: boolean;
}

interface LimitCheckResult {
  /** L'action est permise */
  allowed: boolean;
  /** Message d'erreur si non permis */
  message: string;
  /** Nombre actuel */
  current: number;
  /** Limite maximale */
  max: number;
}

interface UseSubscriptionReturn extends SubscriptionInfo {
  /** Vérifier si on peut ajouter une chambre */
  canAddRoom: (currentCount: number) => LimitCheckResult;
  /** Vérifier si on peut ajouter du staff */
  canAddStaff: (currentCount: number) => LimitCheckResult;
  /** Vérifier si une fonctionnalité est disponible */
  hasFeature: (featureName: string) => boolean;
  /** Afficher un toast si limite atteinte (retourne false si limité) */
  checkBeforeAddRoom: (currentCount: number) => boolean;
  /** Afficher un toast si limite staff atteinte (retourne false si limité) */
  checkBeforeAddStaff: (currentCount: number) => boolean;
  /** Recharger les données */
  reload: () => Promise<void>;
}

// ─── Données par défaut ────────────────────────────────────────────────────

const DEFAULT_INFO: SubscriptionInfo = {
  planId: null,
  planNom: '-',
  planPrix: 0,
  maxRooms: 20,
  maxGerants: 0,
  maxReceptionnistes: 1,
  maxStaff: 1,
  features: [],
  estPopulaire: false,
  hotel: null,
  joursRestants: 0,
  estExpire: false,
  estExpirant: false,
  estActif: true,
  isLoading: true,
};

// ─── Hook principal ────────────────────────────────────────────────────────

export function useSubscription(
  hotelId: string | null | undefined
): UseSubscriptionReturn {
  const [info, setInfo] = useState<SubscriptionInfo>(DEFAULT_INFO);
  const [supabaseClient, setSupabaseClient] = useState<unknown>(null);

  // ─── Initialisation ───────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        setSupabaseClient(createClient());
      } catch {
        console.error('[useSubscription] Supabase non disponible.');
        setInfo((prev) => ({ ...prev, isLoading: false }));
      }
    }
    init();
  }, []);

  // ─── Chargement des données d'abonnement ──────────────────────────────
  const loadSubscription = useCallback(async () => {
    if (!supabaseClient || !hotelId) {
      setInfo((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const supa = supabaseClient as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: unknown) => {
              single: () => Promise<{
                data: Record<string, unknown>;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };

      const { data, error } = await supa
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();

      if (error || !data) {
        console.error('[useSubscription] Erreur chargement:', error?.message);
        setInfo((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const hotel = data as unknown as Hotel;
      const planConfig = PLANS_ABONNEMENT[hotel.plan as PlanId];

      if (!planConfig) {
        setInfo((prev) => ({
          ...prev,
          hotel,
          estActif: hotel.est_actif,
          isLoading: false,
        }));
        return;
      }

      const now = new Date();
      const dateFin = new Date(hotel.date_fin_abonnement);
      const joursRestants = Math.ceil(
        (dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      setInfo({
        planId: hotel.plan as PlanId,
        planNom: planConfig.nom,
        planPrix: planConfig.prix,
        maxRooms: planConfig.limites.chambres,
        maxGerants: planConfig.limites.gerants,
        maxReceptionnistes: planConfig.limites.receptionnistes,
        maxStaff: planConfig.limites.gerants + planConfig.limites.receptionnistes,
        features: planConfig.fonctionnalites,
        estPopulaire: planConfig.populaire,
        hotel,
        joursRestants,
        estExpire: joursRestants < 0,
        estExpirant: joursRestants >= 0 && joursRestants <= 7,
        estActif: hotel.est_actif,
        isLoading: false,
      });
    } catch (error) {
      console.error('[useSubscription] Erreur:', error);
      setInfo((prev) => ({ ...prev, isLoading: false }));
    }
  }, [supabaseClient, hotelId]);

  // ─── Chargement initial ───────────────────────────────────────────────
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // ─── Vérification : peut ajouter chambre ───────────────────────────────
  const canAddRoom = useCallback(
    (currentCount: number): LimitCheckResult => {
      const max = info.maxRooms;
      const allowed = currentCount < max;
      return {
        allowed,
        message: allowed
          ? `Chambre ajoutable (${currentCount}/${max}).`
          : `Limite atteinte ! Maximum ${max} chambres. Passez à un plan supérieur.`,
        current: currentCount,
        max,
      };
    },
    [info.maxRooms]
  );

  // ─── Vérification : peut ajouter staff ────────────────────────────────
  const canAddStaff = useCallback(
    (currentCount: number): LimitCheckResult => {
      const max = info.maxStaff;
      const allowed = currentCount < max;
      return {
        allowed,
        message: allowed
          ? `Personnel ajoutable (${currentCount}/${max}).`
          : `Limite atteinte ! Maximum ${max} membres. Passez à un plan supérieur.`,
        current: currentCount,
        max,
      };
    },
    [info.maxStaff]
  );

  // ─── Toast + vérification avant ajout chambre ─────────────────────────
  const checkBeforeAddRoom = useCallback(
    (currentCount: number): boolean => {
      const check = canAddRoom(currentCount);
      if (!check.allowed) {
        toast.error(check.message, {
          duration: 5000,
          icon: '🚫',
        });
      }
      return check.allowed;
    },
    [canAddRoom]
  );

  // ─── Toast + vérification avant ajout staff ─────────────────────────────
  const checkBeforeAddStaff = useCallback(
    (currentCount: number): boolean => {
      const check = canAddStaff(currentCount);
      if (!check.allowed) {
        toast.error(check.message, {
          duration: 5000,
          icon: '🚫',
        });
      }
      return check.allowed;
    },
    [canAddStaff]
  );

  // ─── Vérification fonctionnalité ─────────────────────────────────────
  const hasFeature = useCallback(
    (featureName: string): boolean => {
      return info.features.some((f) =>
        f.toLowerCase().includes(featureName.toLowerCase())
      );
    },
    [info.features]
  );

  return {
    ...info,
    canAddRoom,
    canAddStaff,
    hasFeature,
    checkBeforeAddRoom,
    checkBeforeAddStaff,
    reload: loadSubscription,
  };
}
