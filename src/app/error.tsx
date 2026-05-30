'use client';

// ============================================
// OGOUTEL_Prestige - Page d'Erreur (Error Boundary)
// Affichée quand une erreur non gérée survient
// Page d'erreur globale pour les routes
// ============================================

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Building2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur côté client pour le debugging
    console.error('[ErrorBoundary] Erreur non gérée:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center">
              <Building2 className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
            </span>
          </div>
        </div>

        {/* Icône erreur */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </motion.div>

        {/* Titre */}
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          Une erreur est survenue
        </h1>

        {/* Description */}
        <p className="mb-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Une erreur inattendue s&apos;est produite lors du chargement de cette page.
          Nos équipes ont été notifiées.
        </p>

        {/* Détail technique (mode dev) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mx-auto mb-6 max-w-sm rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left">
            <p className="text-xs font-mono text-red-600 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-[10px] font-mono text-red-400">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="h-11 gap-2 bg-[#D4AF37] hover:bg-[#B8972E] text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>

          <Button asChild variant="outline" className="h-11 gap-2">
            <a href="/">
              <Home className="h-4 w-4" />
              Retour à l&apos;accueil
            </a>
          </Button>
        </div>

        {/* Support */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Le problème persiste ?{' '}
            <a
              href="https://wa.me/2250576103277?text=Bonjour, je rencontre une erreur sur OGOUTEL_Prestige."
              className="text-[#D4AF37] hover:text-[#B8972E] font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
