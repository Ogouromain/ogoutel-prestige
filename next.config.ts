// ============================================
// OGOUTEL_Prestige - Configuration Next.js 16
// Framework : Next.js 16.1 (Turbopack)
//
// NOTES IMPORTANTES :
//   - ⚠️ NE PAS utiliser output: "standalone" en développement
//     (provoque un crash silencieux du dev server avec Turbopack)
//   - Les images distantes (Supabase Storage) sont autorisées
//   - Turbopack est activé par défaut en dev (Next.js 16)
//   - Middleware est deprecated dans Next.js 16 (utilise proxy.ts)
// ============================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── TypeScript ────────────────────────────────────────────
  // Ignore les erreurs TS au build (utile en dev avec des dépendances tierces)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ─── React ───────────────────────────────────────────────
  // Désactivé pour éviter les double-renders en dev
  reactStrictMode: false,

  // ─── Images ───────────────────────────────────────────────
  // Autorise les images depuis Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // ─── Headers de sécurité ───────────────────────────────────
  // Ajoute des headers de sécurité à toutes les réponses
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // ─── Redirections ─────────────────────────────────────────
  // Redirections utiles pour l'application
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
