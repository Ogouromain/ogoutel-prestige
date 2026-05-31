'use client';

// ============================================
// OGOUTEL_Prestige - Login Form Component
// Fichier : components/auth/LoginForm.tsx
//
// Formulaire de connexion avec :
// - Split screen (image hôtel + branding | formulaire)
// - Supabase Auth signInWithPassword
// - Récupération du rôle depuis 'profiles'
// - Redirection par rôle
// - Messages d'erreur en français
// ============================================

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Building2,
  Shield,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Messages d'erreur Supabase en français ───────────────────────────────────

const FRENCH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': 'Votre email n\'a pas été confirmé. Vérifiez votre boîte de réception.',
  'Too many requests': 'Trop de tentatives. Veuillez attendre quelques instants.',
  'Network request failed': 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
  'Failed to fetch': 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
  'fetch failed': 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
  'Invalid email': 'Adresse email invalide.',
  'Password should be at least': 'Le mot de passe est trop court.',
  'User not found': 'Aucun compte trouvé avec cet email.',
  'Invalid API key': 'Erreur de configuration. Contactez le support.',
  'CORS': 'Erreur de configuration. Contactez le support.',
  'URL': 'Erreur de configuration. Contactez le support.',
  'timeout': 'Délai d\'attente dépassé. Réessayez.',
  'sign in': 'Erreur lors de la connexion. Réessayez.',
};

function getFrenchError(message: string): string {
  // Loguer l\'erreur brute pour le debugging (visible dans Vercel Function Logs)
  console.error('[LoginForm] Erreur Supabase brute:', message);
  console.error('[LoginForm] Stack:', new Error().stack);
  
  if (!message) {
    return 'Erreur de connexion. Veuillez réessayer.';
  }
  
  for (const [key, value] of Object.entries(FRENCH_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Si le message n'est pas reconnu, l'afficher directement pour debugging
  return `Erreur : ${message}`;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // ── Soumission du formulaire ──
  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      // Dynamic import pour éviter le crash quand Supabase n'est pas configuré
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (!supabase) {
        toast.error('Service d\'authentification indisponible. Contactez le support.');
        setIsLoading(false);
        return;
      }

      // 1. Connexion Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (authError) {
        console.error('[LoginForm] Détails erreur auth:', JSON.stringify({
          message: authError.message,
          status: authError.status,
          name: authError.name,
          code: (authError as Record<string, unknown>).code,
        }));
        toast.error(getFrenchError(authError.message));
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2. Récupérer le profil pour obtenir le rôle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, hotel_id, full_name, is_active')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('[LoginForm] Erreur récupération profil:', profileError);
        toast.error('Profil non trouvé. Veuillez contacter le support.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // 3. Vérifier que le profil est actif
      const isActive = profile.is_active !== false;
      if (!isActive) {
        toast.error('Votre compte a été désactivé. Contactez le support.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // 4. Rediriger selon le rôle
      const roleRedirects: Record<string, string> = {
        super_admin: '/super-admin',
        admin_hotel: '/admin',
        gerant: '/staff',
        receptionniste: '/staff',
      };

      const redirectPath = roleRedirects[profile.role] ?? '/';
      const redirectFromUrl = searchParams.get('redirect');

      // Si une redirect URL est spécifiée, valider qu'elle est bien une route interne
      let finalRedirect = redirectPath;
      if (redirectFromUrl) {
        const isInternal = redirectFromUrl.startsWith('/') && 
          !redirectFromUrl.startsWith('//') && 
          !redirectFromUrl.includes(':');
        if (isInternal) {
          finalRedirect = redirectFromUrl;
        }
      }

      toast.success(`Bienvenue ${profile.full_name ?? ''} !`);

      router.push(finalRedirect);
      router.refresh();
    } catch (error) {
      console.error('[LoginForm] Exception:', error);
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(getFrenchError(msg));
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
              La Gestion Hôtelière<br />
              <span className="text-[#D4AF37]">Intelligente</span>
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              Gérez vos réservations, chambres et revenus depuis un seul tableau de bord.
              La solution complète pour les hôtels de Côte d&apos;Ivoire.
            </p>

            <Separator className="bg-white/20 mb-10 max-w-xs" />

            {/* Features */}
            <div className="space-y-5">
              {[
                { icon: Shield, text: 'Sécurité avancée pour vos données' },
                { icon: Building2, text: 'Gestion multi-établissements' },
                { icon: Star, text: 'Support dédié 24h/24' },
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
              <CardTitle className="text-2xl font-heading font-bold text-[#0A0A0A]">
                Bienvenue sur OGOUTEL_Prestige
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Connectez-vous à votre tableau de bord
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500" role="alert">{errors.email.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-[#0A0A0A]">
                      Mot de passe
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#D4AF37] hover:text-[#B8972E] font-medium transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500" role="alert">{errors.password.message}</p>
                  )}
                </div>

                {/* Bouton connexion */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              {/* Séparateur */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-muted-foreground uppercase tracking-wider">
                      ou
                    </span>
                  </div>
                </div>
              </div>

              {/* Lien inscription */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous n&apos;avez pas de compte ?{' '}
                  <Link
                    href="/register"
                    className="text-[#D4AF37] hover:text-[#B8972E] font-semibold transition-colors"
                  >
                    Créer un compte avec un code
                  </Link>
                </p>
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
