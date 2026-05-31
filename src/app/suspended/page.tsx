// ============================================
// OGOUTEL_Prestige - Page Abonnement Suspendu
// Route : /suspended
// Affichée quand l'abonnement d'un hôtel est expiré
// ou suspendu. Redirigé par le middleware.
// ============================================

'use client';

import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ADMIN_EMAIL, WHATSAPP_NUMBER, WHATSAPP_LINK } from '@/lib/constants';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] via-[#1a1a2e] to-[#0A0A0A] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8 sm:p-10 text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center">
                  <Building2 className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-xl font-bold text-[#0A0A0A]">
                  OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
                </span>
              </div>
            </div>

            {/* Illustration triste */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  className="text-red-400"
                >
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                  <path d="M16 18L24 14L32 18V28L24 32L16 28V18Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                  <path d="M16 18L24 22L32 18" stroke="currentColor" strokeWidth="2" />
                  <path d="M24 22V32" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </motion.div>

            {/* Titre */}
            <h1 className="mb-3 text-2xl font-bold text-[#0A0A0A]">
              Votre abonnement est suspendu
            </h1>

            {/* Message */}
            <p className="mb-8 text-sm leading-relaxed text-gray-500 max-w-sm mx-auto">
              Votre abonnement OGOUTEL_Prestige a expiré ou a été suspendu.
              Veuillez contacter notre support pour renouveler votre abonnement
              et retrouver l&apos;accès à votre espace de gestion.
            </p>

            {/* Contact Cards */}
            <div className="mb-8 space-y-3">
              {/* Email */}
              <a
                href={`mailto:${ADMIN_EMAIL}?subject=Renouvellement abonnement OGOUTEL_Prestige`}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition-all hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10 flex-shrink-0">
                  <Mail className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A]">Email Support</p>
                  <p className="text-xs text-gray-400">{ADMIN_EMAIL}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={`${WHATSAPP_LINK}?text=Bonjour, je souhaite renouveler mon abonnement OGOUTEL_Prestige.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                  <Phone className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A]">WhatsApp</p>
                  <p className="text-xs text-gray-400">+{WHATSAPP_NUMBER}</p>
                </div>
              </a>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white h-11">
                <a
                  href={`mailto:${ADMIN_EMAIL}?subject=Renouvellement abonnement OGOUTEL_Prestige`}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contacter le support
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 h-11"
              >
                <a
                  href={`${WHATSAPP_LINK}?text=Bonjour, je souhaite renouveler mon abonnement OGOUTEL_Prestige.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            </div>

            {/* Déconnexion */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Besoin de vous déconnecter ?{' '}
                <a
                  href="/login"
                  className="text-[#D4AF37] hover:text-[#B8972E] font-medium"
                >
                  Aller à la connexion
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Copyright */}
        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} OGOUTEL_Prestige. Tous droits réservés.
        </p>
      </motion.div>
    </div>
  );
}
