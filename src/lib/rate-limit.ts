// ============================================
// OGOUTEL_Prestige - Rate Limiter (In-Memory)
// Protection anti-brute force pour API publiques
//
// Utilise un Map in-memory avec nettoyage automatique.
// Pour la production, envisager Redis ou Upstash.
// ============================================

// ─── Types ──────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Nombre max de requêtes dans la fenêtre */
  maxRequests: number;
  /** Fenêtre de temps en secondes */
  windowSeconds: number;
}

// ─── Store ─────────────────────────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>();

// Nettoyage automatique toutes les 60 secondes
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      }
    }, 60_000);
    // Ne pas bloquer le processus
    if (cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }
}

// ─── Presets ────────────────────────────────────────────────────────────────

/** Formulaires publics (contact, abonnement) */
export const RATE_LIMIT_FORM: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 300, // 5 requêtes / 5 minutes
};

/** Validation code d'activation (anti-brute force) */
export const RATE_LIMIT_CODE: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 300, // 10 tentatives / 5 minutes
};

/** Inscription utilisateur */
export const RATE_LIMIT_REGISTER: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 900, // 3 tentatives / 15 minutes
};

/** Login */
export const RATE_LIMIT_LOGIN: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 300, // 10 tentatives / 5 minutes
};

/** Création de réservation (endpoint bookings) */
export const RATE_LIMIT_BOOKING: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60, // 10 requêtes / minute
};

/** Lecture publique (rooms, testimonials) */
export const RATE_LIMIT_PUBLIC_READ: RateLimitConfig = {
  maxRequests: 30,
  windowSeconds: 60, // 30 requêtes / minute
};

/** Export de données (authentifié) */
export const RATE_LIMIT_EXPORT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60, // 10 requêtes / minute
};

// ─── Fonction principale ────────────────────────────────────────────────────

/**
 * Vérifie si une IP a dépassé la limite de requêtes.
 * @param ip - Adresse IP du client
 * @param config - Configuration de rate limiting
 * @returns `{ allowed: boolean, remaining: number, resetAt: Date }`
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: Date } {
  ensureCleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = store.get(ip);

  // Pas d'entrée ou fenêtre expirée → créer nouvelle entrée
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(ip, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(resetAt),
    };
  }

  // Fenêtre active → incrémenter
  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

// ─── Helper pour API routes ─────────────────────────────────────────────────

/**
 * Extrait l'IP du client depuis les headers Next.js.
 * Tente X-Forwarded-For, X-Real-IP, puis fallback.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}
