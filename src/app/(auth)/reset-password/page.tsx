'use client';

// ============================================
// OGOUTEL_Prestige - Reset Password Page
// Fichier : app/(auth)/reset-password/page.tsx
//
// Page de réinitialisation du mot de passe.
// Utilise useSearchParams — nécessite un Suspense boundary.
// Appelle supabase.auth.updateUser({ password }).
// ============================================

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  ArrowLeft,
  Shield,
  Star,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// ─── Messages d'erreur Supabase en français ───────────────────────────────────

const FRENCH_ERRORS: Record<string, string> = {
  'same password': 'Le nouveau mot de passe doit être différent de l\'ancien.',
  'password should be at least': 'Le mot de passe doit contenir au moins 8 caractères.',
  'Too many requests': 'Trop de tentatives. Veuillez attendre quelques instants.',
  'Network request failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
  'session not found': 'La session a expiré. Veuillez demander un nouveau lien de réinitialisation.',
  'Invalid token': 'Le lien de réinitialisation est invalide ou a expiré.',
};

function getFrenchError(message: string): string {
  for (const [key, value] of Object.entries(FRENCH_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

// ─── Composant interne (avec useSearchParams) ──────────────────────────────────

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});

  // ── Vérifier le paramètre d'erreur ──
  const urlError = searchParams.get('error');

  // ── Validation locale ──
  function validate(): boolean {
    const errors: { password?: string; confirm?: string } = {};

    if (newPassword.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    if (!newPassword) {
      errors.password = 'Le mot de passe est requis.';
    }

    if (!confirmPassword) {
      errors.confirm = 'Veuillez confirmer votre mot de passe.';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Les mots de passe ne correspondent pas.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Soumission du formulaire ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

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

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(getFrenchError(error.message));
        setIsLoading(false);
        return;
      }

      toast.success('Mot de passe mis à jour avec succès.');

      // Rediriger vers la connexion après 2 secondes
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('[ResetPassword] Erreur:', error);
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
              Nouveau mot de<br />
              <span className="text-[#D4AF37]">passe</span>
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              Choisissez un mot de passe fort et sécurisé pour protéger
              votre compte OGOUTEL_Prestige.
            </p>

            <Separator className="bg-white/20 mb-10 max-w-xs" />

            {/* Features */}
            <div className="space-y-5">
              {[
                { icon: Lock, text: 'Minimum 8 caractères requis' },
                { icon: Shield, text: 'Chiffrement sécurisé de bout en bout' },
                { icon: Star, text: 'Accès restauré immédiatement' },
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
                <Lock className="w-7 h-7 text-[#D4AF37]" />
              </div>
              <CardTitle className="text-2xl font-heading font-bold text-[#0A0A0A]">
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Choisissez votre nouveau mot de passe.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {/* ─── Message d'erreur URL ─── */}
              {urlError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Erreur :</span>{' '}
                    {urlError === 'session_expired'
                      ? 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.'
                      : urlError === 'invalid_token'
                        ? 'Le lien de réinitialisation est invalide. Veuillez demander un nouveau lien.'
                        : urlError}
                  </p>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-red-600 hover:text-red-800 font-medium mt-1 inline-block"
                  >
                    Demander un nouveau lien
                  </Link>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-[#0A0A0A]">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min. 8 caractères"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        // Effacer l'erreur de validation quand l'utilisateur tape
                        if (validationErrors.password) {
                          setValidationErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-red-500" role="alert">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-[#0A0A0A]">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmez le mot de passe"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        // Effacer l'erreur de validation quand l'utilisateur tape
                        if (validationErrors.confirm) {
                          setValidationErrors((prev) => ({ ...prev, confirm: undefined }));
                        }
                      }}
                      className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.confirm && (
                    <p className="text-sm text-red-500" role="alert">{validationErrors.confirm}</p>
                  )}
                </div>

                {/* Indicateur de sécurité du mot de passe */}
                {newPassword.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength =
                          newPassword.length >= 8 &&
                          /[a-z]/.test(newPassword) &&
                          /[A-Z]/.test(newPassword) &&
                          /\d/.test(newPassword) &&
                          /[^a-zA-Z0-9]/.test(newPassword)
                            ? 4
                            : newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /\d/.test(newPassword)
                              ? 3
                              : newPassword.length >= 8 && (/[a-z]/.test(newPassword) || /[A-Z]/.test(newPassword)) && /\d/.test(newPassword)
                                ? 2
                                : newPassword.length >= 8
                                  ? 1
                                  : 0;
                        const colors = [
                          'bg-gray-200',
                          'bg-red-400',
                          'bg-amber-400',
                          'bg-yellow-400',
                          'bg-green-500',
                        ];
                        return (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              level <= strength ? colors[strength] : 'bg-gray-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {newPassword.length < 8
                        ? 'Minimum 8 caractères requis'
                        : newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword)
                          ? 'Force : Très forte'
                          : newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /\d/.test(newPassword)
                            ? 'Force : Forte'
                            : newPassword.length >= 8 && (/[a-z]/.test(newPassword) || /[A-Z]/.test(newPassword)) && /\d/.test(newPassword)
                              ? 'Force : Moyenne'
                              : 'Force : Faible'}
                    </p>
                  </div>
                )}

                {/* Bouton réinitialiser */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Réinitialiser le mot de passe
                    </>
                  )}
                </Button>
              </form>

              {/* Retour à la connexion */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-[#D4AF37] hover:text-[#B8972E] font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 inline-block" />
                  Retour à la connexion
                </Link>
              </div>
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

// ─── Composant fallback pour Suspense ─────────────────────────────────────────

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen">
      {/* Placeholder côté gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]" />
      {/* Placeholder côté droit */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <Card className="border-0 shadow-xl shadow-black/5 w-full max-w-md">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page export (avec Suspense boundary) ──────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
