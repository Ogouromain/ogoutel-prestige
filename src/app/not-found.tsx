// ============================================
// OGOUTEL_Prestige - Page 404 (Not Found)
// Page personnalisée quand une route n'existe pas
// Bouton retour adapté au rôle
// ============================================

'use client';

import { motion } from 'framer-motion';
import { Home, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
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
            <span className="text-xl font-bold text-[#0A0A0A]">
              OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
            </span>
          </div>
        </div>

        {/* Illustration 404 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="relative mb-8">
            <span className="text-[120px] sm:text-[150px] font-bold leading-none text-gray-100 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <span className="text-3xl">🔍</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Titre */}
        <h1 className="mb-3 text-2xl font-bold text-[#0A0A0A]">
          Page introuvable
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
          Vérifiez l&apos;URL ou retournez à votre espace.
        </p>

        {/* Boutons de retour */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="outline"
            className="h-11 gap-2"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
          >
            <button>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </Button>

          <Button asChild className="h-11 gap-2 bg-[#D4AF37] hover:bg-[#B8972E] text-white">
            <Link href="/">
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 gap-2"
          >
            <Link href="/login">
              Connexion
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
