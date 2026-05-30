// ============================================
// OGOUTEL_Prestige - Auth Layout
// Fichier : app/(auth)/layout.tsx
//
// Layout partagé pour les pages d'authentification
// (login, register, forgot-password, reset-password)
// ============================================

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — OGOUTEL_Prestige',
  description: 'Connectez-vous ou créez votre compte OGOUTEL_Prestige',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
