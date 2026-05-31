// ============================================
// OGOUTEL_Prestige - Layout Principal
// Fichier : src/app/layout.tsx
// Description : Layout racine de l'application
// SaaS de Gestion Hôtelière en Côte d'Ivoire
// ============================================

import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import env from "@/lib/env";
import "./globals.css";

// ─── Polices Google Fonts ────────────────────────────────────────────────────
// Inter : police de texte principale (corps, boutons, labels)
// Playfair Display : police d'headings (titres, sous-titres)

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

// ─── Métadonnées SEO ─────────────────────────────────────────────────────────

const APP_NAME = env.APP_NAME;
const APP_URL = env.APP_URL;
const APP_DESCRIPTION =
  "Le SaaS N°1 de gestion hôtelière en Côte d'Ivoire. Réservations, chambres, facturation et statistiques — tout ce dont votre établissement a besoin.";

export const metadata: Metadata = {
  // Titre principal (affiché dans l'onglet du navigateur)
  title: {
    default: `${APP_NAME} - Gestion Hôtelière en Côte d'Ivoire`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,

  // Mots-clés pour le référencement
  keywords: [
    "OGOUTEL_Prestige",
    "gestion hôtelière",
    "SaaS hôtel",
    "logiciel hôtelier",
    "Côte d'Ivoire",
    "Abidjan",
    "réservation hôtel",
    "gestion des chambres",
    "facturation hôtel",
    "hôtel Afrique",
    "management hôtelier",
    "application hôtel",
  ],

  // Auteur de l'application
  authors: [
    {
      name: "OGOUTEL_Prestige",
      url: APP_URL,
    },
  ],

  // Créateur
  creator: "OGOUTEL_Prestige",

  // Langue par défaut
  alternates: {
    canonical: APP_URL,
  },

  // Robots d'indexation
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (partage sur réseaux sociaux)
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - Gestion Hôtelière en Côte d'Ivoire`,
    description: APP_DESCRIPTION,
  },

  // Twitter Card (partage sur Twitter/X)
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Gestion Hôtelière en Côte d'Ivoire`,
    description: APP_DESCRIPTION,
  },

  // Icônes
  icons: {
    icon: "/favicon.ico",
  },

  // Catégorie
  category: "business",
};

// ─── Viewport (responsive) ──────────────────────────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C8A97E",
};

// ─── Layout principal ────────────────────────────────────────────────────────

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Préchargement des polices pour optimiser le CLS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`
          ${inter.variable}
          ${playfairDisplay.variable}
          font-sans antialiased bg-background text-foreground transition-colors duration-200
        `}
      >
        {/* ─── ThemeProvider (dark/light mode) ─── */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {/* ─── Contenu principal de la page ─── */}
          <div className="min-h-screen flex flex-col bg-background">
            {children}
          </div>
        </ThemeProvider>

        {/* ─── Notifications react-hot-toast ─── */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#FFFFFF",
              color: "#1A1A1A",
              borderRadius: "0.75rem",
              border: "1px solid #E5E7EB",
              fontSize: "0.875rem",
              padding: "0.75rem 1rem",
              maxWidth: "420px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
