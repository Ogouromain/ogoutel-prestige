'use client';

// ============================================
// OGOUTEL_Prestige - useFetchWithRetry
// Hook de récupération de données avec retry automatique
// Retry exponentiel pour les erreurs réseau temporaires
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseFetchWithRetryOptions<T> {
  /** URL de l'API à interroger */
  url: string;
  /** Nombre maximal de tentatives (défaut : 3) */
  maxRetries?: number;
  /** Délai initial entre les tentatives en ms (défaut : 1000) */
  initialDelay?: number;
  /** Facteur multiplicateur du délai (défaut : 2) */
  backoffFactor?: number;
  /** Délai de cache en ms (défaut : 30000 = 30s) */
  cacheDuration?: number;
  /** Activer/désactiver la requête automatique (défaut : true) */
  enabled?: boolean;
  /** Message d'erreur par défaut en français */
  errorMessage?: string;
  /** Callback de succès */
  onSuccess?: (data: T) => void;
  /** Callback d'erreur (après tous les retries) */
  onError?: (error: string) => void;
}

interface UseFetchWithRetryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  /** Nombre de tentatives effectuées */
  retryCount: number;
  /** Forcer un nouvel appel (ignore le cache) */
  refetch: () => Promise<void>;
}

// ─── Cache simple en mémoire ────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCachedData<T>(key: string, duration: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > duration) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useFetchWithRetry<T = unknown>(
  options: UseFetchWithRetryOptions<T>
): UseFetchWithRetryResult<T> {
  const {
    url,
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    cacheDuration = 30000,
    enabled = true,
    errorMessage = 'Erreur de connexion au serveur',
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Nettoyage au démontage
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!url || !enabled) return;

    // Vérifier le cache (sauf si forceRefresh)
    if (!forceRefresh) {
      const cached = getCachedData<T>(url, cacheDuration);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        setIsError(false);
        setError(null);
        return;
      }
    }

    // Annuler la requête précédente
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    let attempt = 0;
    let lastError = '';

    while (attempt < maxRetries) {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          lastError = `Erreur serveur (${res.status})`;
          attempt++;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, initialDelay * Math.pow(backoffFactor, attempt - 1)));
          }
          continue;
        }

        const json = await res.json();
        if (!mountedRef.current) return;

        if (json.success !== false) {
          const result = json.data ?? json;
          setData(result);
          setCachedData(url, result);
          setIsLoading(false);
          setIsError(false);
          setError(null);
          setRetryCount(attempt);
          onSuccess?.(result);
          return;
        } else {
          lastError = json.message || json.error || 'Erreur inconnue';
          attempt++;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, initialDelay * Math.pow(backoffFactor, attempt - 1)));
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        lastError = errorMessage;
        attempt++;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, initialDelay * Math.pow(backoffFactor, attempt - 1)));
        }
      }
    }

    // Tous les retries ont échoué
    if (!mountedRef.current) return;
    setData(null);
    setIsLoading(false);
    setIsError(true);
    setError(lastError);
    setRetryCount(attempt);
    onError?.(lastError);
  }, [url, enabled, maxRetries, initialDelay, backoffFactor, cacheDuration, errorMessage, onSuccess, onError]);

  // Charger les données automatiquement
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, isLoading, isError, error, retryCount, refetch };
}
