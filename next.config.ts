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
//   - allowedDevOrigins autorise le Preview Panel (iframe externe)
// ============================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Cross-Origin pour le Preview Panel ────────────────
  // Autorise le panneau de prévisualisation (iframe externe)
  // à charger les chunks JS/CSS depuis le dev server
  allowedDevOrigins: [
    "http://localhost:81",
    "https://space-z.ai",
  ],

  // ─── TypeScript ────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: true,
  },

  // ─── React ───────────────────────────────────────────────
  reactStrictMode: false,

  // ─── Images ───────────────────────────────────────────────
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

  // ─── Headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        // Aucun header restrictif sur les assets Next.js
        // pour permettre le chargement cross-origin depuis le Preview Panel
        source: "/_next/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "*",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          // Autoriser l'affichage dans les iframes du Preview Panel
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // ─── Redirections ─────────────────────────────────────────
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
