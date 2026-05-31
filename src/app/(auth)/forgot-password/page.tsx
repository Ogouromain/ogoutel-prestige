'use client';

// ============================================
// OGOUTEL_Prestige - Forgot Password Page
// Fichier : app/(auth)/forgot-password/page.tsx
//
// Page de demande de réinitialisation de mot de passe.
// Envoie un lien de réinitialisation via Supabase Auth.
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Mail,
  Loader2,
  Building2,
  ArrowLeft,
  Shield,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// ─── Messages d'erreur Supabase en français ───────────────────────────────────

const FRENCH_ERRORS: Record<string, string> = {
  'user not found': 'Aucun compte trouvé avec cette adresse email.',
  'Invalid email': 'Adresse email invalide.',
  'Too many requests': 'Trop de tentatives. Veuillez attendre quelques instants.',
  'Network request failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
};

function getFrenchError(message: string): string {
  for (const [key, value] of Object.entries(FRENCH_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ── Soumission du formulaire ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Veuillez entrer votre adresse email.');
      return;
    }

    setIsLoading(true);

    try {
      // Dynamic import pour éviter le crash quand Supabase n'est pas configuré
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (!supabase) {
        toast.error('Service indisponible.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        toast.error(getFrenchError(error.message));
        setIsLoading(false);
        return;
      }

      toast.success('Un email de réinitialisation a été envoyé.');
      setIsSubmitted(true);
    } catch (error) {
      console.error('[ForgotPassword] Erreur:', error);
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Rendu ──
  return (
    <div className="flex min-h-screen">
      {/* ─── Côté gauche : Image + Branding (desktop) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332]">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
                </h1>
              </div>
            </div>

            {/* Titre */}
            <h2 className="font-heading text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Récupérez votre<br />
              <span className="text-[#D4AF37]">Accès</span>
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              Pas d&apos;inquiétude, cela arrive. Entrez votre email et nous vous
              enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <Separator className="bg-white/20 mb-10 max-w-xs" />

            {/* Features */}
            <div className="space-y-5">
              {[
                { icon: Mail, text: 'Email de récupération instantané' },
                { icon: Shield, text: 'Processus sécurisé et chiffré' },
                { icon: Star, text: 'Assistance disponible si besoin' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <span className="text-white/90">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Copyright */}
          <p className="absolute bottom-8 text-white/50 text-sm">
            &copy; {new Date().getFullYear()} OGOUTEL_Prestige. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* ─── Côté droit : Formulaire ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#0A0A0A]">
              OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
            </h1>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-3">
                <Mail className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <CardTitle className="text-2xl font-heading font-bold text-[#0A0A0A]">
                Mot de passe oublié ?
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {isSubmitted ? (
                /* ─── État de succès ─── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#1B4332]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0A0A0A]">
                      Email envoyé avec succès !
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Si un compte existe avec <span className="font-medium text-[#0A0A0A]">{email}</span>,
                      vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                    </p>
                  </div>
                  <div className="bg-[#1B4332]/5 rounded-lg p-3 text-sm text-[#1B4332]/70">
                    <p className="flex items-start gap-2">
                      <span className="text-lg leading-none">💡</span>
                      <span>
                        Vérifiez votre dossier spam si vous ne voyez pas l&apos;email
                        dans votre boîte de réception.
                      </span>
                    </p>
                  </div>

                  {/* Retour à la connexion */}
                  <div className="pt-2">
                    <Button asChild className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25">
                      <Link href="/login">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à la connexion
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* ─── Formulaire ─── */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-[#0A0A0A]">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      autoComplete="email"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                      required
                    />
                  </div>

                  {/* Bouton envoyer */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer le lien
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Retour à la connexion (formulaire uniquement) */}
              {!isSubmitted && (
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-[#D4AF37] hover:text-[#B8972E] font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1 inline-block" />
                    Retour à la connexion
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retour landing */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-[#0A0A0A] transition-colors"
            >
              &larr; Retour à l&apos;accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
