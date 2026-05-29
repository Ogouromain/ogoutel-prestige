// ============================================
// OGOUTEL_Prestige - Hook useHotel
// Gestion des données hôtel côté client
//
// Pour : admin_hotel, gerant, receptionniste
// Retourne : hotel, rooms, staff, stats
// Supabase Realtime pour mises à jour live
//
// Utilise useAuth pour obtenir le contexte utilisateur
// Compatible mode dégradé (sans Supabase)
// ============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Hotel, Chambre, PersonnelHotel, StatsDashboard, RoleUtilisateur } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseHotelReturn {
  /** Données de l'hôtel */
  hotel: Hotel | null;
  /** Liste des chambres */
  rooms: Chambre[];
  /** Liste du personnel */
  staff: PersonnelHotel[];
  /** Statistiques du dashboard */
  stats: StatsDashboard | null;
  /** Chargement initial */
  isLoading: boolean;
  /** Erreur */
  isError: boolean;
  /** Message d'erreur */
  errorMessage: string | null;
  /** Recharger toutes les données */
  reload: () => Promise<void>;
  /** Recharger uniquement les stats */
  reloadStats: () => Promise<void>;
  /** Recharger uniquement les chambres */
  reloadRooms: () => Promise<void>;
  /** Nombre de chambres par statut */
  chambresParStatut: Record<string, number>;
}

interface RealtimeChannel {
  unsubscribe: () => void;
}

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  channel: (name: string) => SupabaseRealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => void;
}

interface SupabaseQueryBuilder {
  select: (cols: string) => SupabaseQueryFilter;
}

interface SupabaseQueryFilter {
  eq: (col: string, val: unknown) => SupabaseQueryFilter & {
    single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  order: (col: string, opts?: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }>;
  gte: (col: string, val: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
}

interface SupabaseRealtimeChannel {
  on: (event: string, callback: () => void) => {
    subscribe: () => RealtimeChannel;
  };
}

// ─── Données de démo (mode dégradé) ───────────────────────────────────────

const DEMO_STATS: StatsDashboard = {
  chambres_total: 24,
  chambres_disponibles: 10,
  chambres_occupees: 12,
  chambres_maintenance: 1,
  reservations_en_cours: 8,
  reservations_aujourdhui: 3,
  revenus_mois: 4500000,
  revenus_annee: 52000000,
  taux_occupation: 50,
};

// ─── Hook principal ────────────────────────────────────────────────────────

export function useHotel(hotelId: string | null | undefined): UseHotelReturn {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Chambre[]>([]);
  const [staff, setStaff] = useState<PersonnelHotel[]>([]);
  const [stats, setStats] = useState<StatsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // ─── Initialisation du client ─────────────────────────────────────────
  useEffect(() => {
    async function initClient() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const client = createClient();
        setSupabaseClient(client as unknown as SupabaseClient);
      } catch {
        console.error('[useHotel] Impossible de charger Supabase.');
        // Mode dégradé
        setStats(DEMO_STATS);
        setIsLoading(false);
      }
    }
    initClient();
  }, []);

  // ─── Chargement de l'hôtel ─────────────────────────────────────────────
  const loadHotel = useCallback(async () => {
    if (!supabaseClient || !hotelId) return;

    try {
      const result = await supabaseClient
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();

      if (!result.error && result.data) {
        setHotel(result.data as unknown as Hotel);
      } else {
        setIsError(true);
        setErrorMessage('Hôtel non trouvé.');
      }
    } catch (error) {
      console.error('[useHotel] Erreur chargement hôtel:', error);
    }
  }, [supabaseClient, hotelId]);

  // ─── Chargement des chambres ───────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    if (!supabaseClient || !hotelId) return;

    try {
      const result = await supabaseClient
        .from('chambres')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('numero', { ascending: true });

      if (!result.error && result.data) {
        setRooms(result.data as unknown as Chambre[]);
      }
    } catch (error) {
      console.error('[useHotel] Erreur chargement chambres:', error);
    }
  }, [supabaseClient, hotelId]);

  // ─── Chargement du personnel ───────────────────────────────────────────
  const loadStaff = useCallback(async () => {
    if (!supabaseClient || !hotelId) return;

    try {
      const result = await supabaseClient
        .from('personnel_hotel')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: true });

      if (!result.error && result.data) {
        setStaff(result.data as unknown as PersonnelHotel[]);
      }
    } catch (error) {
      console.error('[useHotel] Erreur chargement staff:', error);
    }
  }, [supabaseClient, hotelId]);

  // ─── Chargement des stats ───────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!supabaseClient || !hotelId) {
      setStats(DEMO_STATS);
      return;
    }

    try {
      const result = await supabaseClient
        .from('v_stats_hotel')
        .select('*')
        .eq('hotel_id', hotelId);

      if (!result.error && result.data && (result.data as unknown[]).length > 0) {
        const row = (result.data as unknown[])[0] as Record<string, unknown>;
        setStats({
          chambres_total: Number(row.total_chambres) ?? 0,
          chambres_disponibles: Number(row.chambres_disponibles) ?? 0,
          chambres_occupees: Number(row.chambres_occupees) ?? 0,
          chambres_maintenance: Number(row.chambres_maintenance) ?? 0,
          reservations_en_cours: Number(row.reservations_actives) ?? 0,
          reservations_aujourdhui: 0,
          revenus_mois: Number(row.revenus_mois) ?? 0,
          revenus_annee: Number(row.revenus_annee) ?? 0,
          taux_occupation: Number(row.chambres_disponibles)
            ? Math.round(
                (Number(row.chambres_occupees) /
                  (Number(row.total_chambres) || 1)) *
                  100
              )
            : 0,
        });
      } else {
        // Fallback: calculer depuis les chambres
        setStats({
          chambres_total: rooms.length,
          chambres_disponibles: rooms.filter((r) => r.statut === 'disponible').length,
          chambres_occupees: rooms.filter((r) => r.statut === 'occupee').length,
          chambres_maintenance: rooms.filter((r) => r.statut === 'maintenance').length,
          reservations_en_cours: 0,
          reservations_aujourdhui: 0,
          revenus_mois: 0,
          revenus_annee: 0,
          taux_occupation: rooms.length
            ? Math.round(
                (rooms.filter((r) => r.statut === 'occupee').length /
                  rooms.length) *
                  100
              )
            : 0,
        });
      }
    } catch (error) {
      console.error('[useHotel] Erreur chargement stats:', error);
      setStats(DEMO_STATS);
    }
  }, [supabaseClient, hotelId, rooms]);

  // ─── Rechargement complet ───────────────────────────────────────────────
  const reload = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    await Promise.all([loadHotel(), loadRooms(), loadStaff()]);
    await loadStats();
    setIsLoading(false);
  }, [loadHotel, loadRooms, loadStaff, loadStats]);

  // ─── Rechargements partiels ───────────────────────────────────────────
  const reloadStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  const reloadRooms = useCallback(async () => {
    await loadRooms();
    await loadStats(); // Les stats dépendent des chambres
  }, [loadRooms, loadStats]);

  // ─── Chargement initial ────────────────────────────────────────────────
  useEffect(() => {
    if (supabaseClient && hotelId) {
      reload();
    } else if (!hotelId) {
      setIsLoading(false);
    }
  }, [supabaseClient, hotelId]);

  // ─── Supabase Realtime subscriptions ──────────────────────────────────
  useEffect(() => {
    if (!supabaseClient || !hotelId) return;

    // Canal chambres
    const chambresChannel = supabaseClient
      .channel(`chambres-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chambres',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          console.log('[useHotel] Changement chambres détecté (realtime)');
          loadRooms();
        }
      )
      .subscribe();

    // Canal réservations
    const reservationsChannel = supabaseClient
      .channel(`reservations-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          console.log('[useHotel] Changement réservations détecté (realtime)');
          loadStats();
        }
      )
      .subscribe();

    channelsRef.current = [chambresChannel, reservationsChannel];

    return () => {
      channelsRef.current.forEach((ch) => {
        try {
          supabaseClient.removeChannel(ch);
        } catch {
          // Channel déjà fermé
        }
      });
    };
  }, [supabaseClient, hotelId, loadRooms, loadStats]);

  // ─── Calcul : chambres par statut ──────────────────────────────────────
  const chambresParStatut = rooms.reduce<Record<string, number>>((acc, room) => {
    acc[room.statut] = (acc[room.statut] ?? 0) + 1;
    return acc;
  }, {});

  return {
    hotel,
    rooms,
    staff,
    stats,
    isLoading,
    isError,
    errorMessage,
    reload,
    reloadStats,
    reloadRooms,
    chambresParStatut,
  };
}
