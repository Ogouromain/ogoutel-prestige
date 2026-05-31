// ============================================
// OGOUTEL_Prestige - Hook useAuth
// Gestion de l'authentification côté client
//
// Retourne : user, profile, role, isLoading, isError
// Fonctions : signIn(email, password), signOut(), refreshSession()
//
// Utilise Supabase Auth + table profiles
// Auto-redirect selon rôle après connexion
// Compatible mode dégradé (sans Supabase)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Profile, RoleUtilisateur } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SupabaseUser {
  id: string;
  email: string | null;
  created_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

interface UseAuthReturn {
  /** Utilisateur Supabase Auth (basique) */
  user: SupabaseUser | null;
  /** Profil complet depuis la table profiles */
  profile: Profile | null;
  /** Rôle de l'utilisateur (null si non configuré) */
  role: RoleUtilisateur | null;
  /** Chargement initial en cours */
  isLoading: boolean;
  /** Erreur lors du chargement */
  isError: boolean;
  /** Message d'erreur */
  errorMessage: string | null;
  /** L'utilisateur est connecté */
  isAuthenticated: boolean;
  /** Connexion avec email + mot de passe */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Déconnexion */
  signOut: () => Promise<void>;
  /** Forcer le rafraîchissement de la session */
  refreshSession: () => Promise<void>;
}

/** Association rôle → dashboard par défaut */
const ROLE_DASHBOARD: Record<RoleUtilisateur, string> = {
  super_admin: '/super-admin',
  admin_hotel: '/admin',
  gerant: '/staff',
  receptionniste: '/staff',
};

/** Messages d'erreur Supabase en français */
const FRENCH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': 'Email non confirmé. Vérifiez votre boîte de réception.',
  'Too many requests': 'Trop de tentatives. Attendez quelques instants.',
  'Network request failed': 'Erreur réseau. Vérifiez votre connexion.',
  'Invalid email': 'Adresse email invalide.',
  'Password should be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caractères.',
};

function translateError(message: string): string {
  for (const [key, value] of Object.entries(FRENCH_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return message;
}

// ─── Hook principal ────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<RoleUtilisateur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnTypeOf<typeof importBrowserClient> | null>(null);

  // ─── Initialisation du client Supabase ─────────────────────────────────
  useEffect(() => {
    async function initClient() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const client = createClient();
        setSupabaseClient(client);
      } catch {
        console.error('[useAuth] Impossible de charger le client Supabase.');
        setIsLoading(false);
      }
    }
    initClient();
  }, []);

  // ─── Chargement initial de la session ───────────────────────────────────
  const loadSession = useCallback(async () => {
    if (!supabaseClient) return;

    try {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);

      // 1. Récupérer la session
      const {
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setRole(null);
        return;
      }

      setUser(authUser as unknown as SupabaseUser);

      // 2. Récupérer le profil
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('[useAuth] Erreur profil:', profileError.message);
        setIsError(true);
        setErrorMessage('Impossible de charger le profil.');
        return;
      }

      if (profileData) {
        setProfile(profileData as unknown as Profile);
        setRole(profileData.role as RoleUtilisateur);
      }
    } catch (error) {
      console.error('[useAuth] Erreur chargement session:', error);
      setIsError(true);
      setErrorMessage('Erreur lors du chargement de la session.');
    } finally {
      setIsLoading(false);
    }
  }, [supabaseClient]);

  // Charger la session quand le client est prêt
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ─── Écoute des changements d'auth ──────────────────────────────────────
  useEffect(() => {
    if (!supabaseClient) return;

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event) => {
      console.log('[useAuth] Événement auth:', event);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Recharger le profil après sign in
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, loadSession]);

  // ─── Fonction signIn ────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!supabaseClient) {
        toast.error("Service d'authentification indisponible.");
        return false;
      }

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          toast.error(translateError(error.message));
          return false;
        }

        // Récupérer le profil pour la redirection
        if (data.user) {
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('role, full_name, is_active, hotel_id')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            // Profil inactif
            if (!profileData.is_active) {
              toast.error('Votre compte a été désactivé.');
              await supabaseClient.auth.signOut();
              return false;
            }

            // Redirection par rôle
            const roleData = profileData.role as RoleUtilisateur;
            const dashboardPath = ROLE_DASHBOARD[roleData] ?? '/';
            toast.success(`Bienvenue ${profileData.full_name ?? ''} !`);
            router.push(dashboardPath);
            router.refresh();
            return true;
          }
        }

        toast.success('Connexion réussie !');
        return true;
      } catch (error) {
        console.error('[useAuth] Erreur signIn:', error);
        toast.error('Erreur de connexion. Réessayez.');
        return false;
      }
    },
    [supabaseClient, router]
  );

  // ─── Fonction signOut ──────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!supabaseClient) {
      toast.error("Service indisponible.");
      return;
    }

    try {
      await supabaseClient.auth.signOut();
      setUser(null);
      setProfile(null);
      setRole(null);
      toast.success('Déconnexion réussie.');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('[useAuth] Erreur signOut:', error);
      toast.error('Erreur lors de la déconnexion.');
    }
  }, [supabaseClient, router]);

  // ─── Fonction refreshSession ───────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    if (!supabaseClient) return;

    try {
      await supabaseClient.auth.refreshSession();
      await loadSession();
    } catch (error) {
      console.error('[useAuth] Erreur refreshSession:', error);
    }
  }, [supabaseClient, loadSession]);

  return {
    user,
    profile,
    role,
    isLoading,
    isError,
    errorMessage,
    isAuthenticated: !!user,
    signIn,
    signOut,
    refreshSession,
  };
}

// ─── Type helper pour le import dynamique ────────────────────────────────────

type ReturnTypeOf<T> = T extends (...args: unknown[]) => Promise<infer R> ? R : never;
function importBrowserClient() {
  return import('@/lib/supabase/client').then((m) => m.createClient());
}
