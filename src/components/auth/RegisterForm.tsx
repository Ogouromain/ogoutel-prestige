'use client';

// ============================================
// OGOUTEL_Prestige - Register Form Component
// Fichier : components/auth/RegisterForm.tsx
//
// Formulaire d'inscription multi-étapes :
//   Étape 1 : Validation du code d'activation
//   Étape 2 : Création du compte (prénom, nom, email, téléphone, mot de passe, nom hôtel)
//
// Logique :
//   1. Valider code via /api/validate-activation-code
//   2. Afficher plan + hôtel préenregistré
//   3. Inscrire via /api/register-user
//   4. Connecter automatiquement
//   5. Rediriger vers /dashboard
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  CheckCircle2,
  KeyRound,
  UserPlus,
  Crown,
  Star,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const codeValidationSchema = z.object({
  code: z
    .string()
    .min(1, 'Le code d\'activation est requis.')
    .refine(
      (val) => /^OGT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(val.trim().toUpperCase()),
      'Format invalide. Utilisez le format OGT-XXXX-XXXX.'
    ),
});

type CodeValidationData = z.infer<typeof codeValidationSchema>;

const registrationSchema = z
  .object({
    prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères.'),
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
    email: z.email('Adresse email invalide.'),
    telephone: z.string().min(8, 'Le numéro de téléphone est invalide.'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.'
      ),
    confirm_password: z.string().min(1, 'Veuillez confirmer votre mot de passe.'),
    nom_hotel: z.string().min(2, 'Le nom de l\'hôtel est requis.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  });

type RegistrationData = z.infer<typeof registrationSchema>;

// ─── Interface pour les données du code validé ─────────────────────────────────

interface ValidatedCode {
  plan_id: string;
  plan_name: string;
  hotel_name: string;
  expires_at: string;
}

// ─── Plan features pour l'affichage ─────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  basique: [
    'Gestion des réservations',
    'Gestion des chambres',
    'Check-in / Check-out',
    'Facturation de base',
    'Tableau de bord',
    'Support par email',
  ],
  standard: [
    'Tout du plan Basique',
    'Gestion des gérants',
    'Rapports et statistiques',
    'Notifications temps réel',
    'Export PDF factures',
    'Support WhatsApp prioritaire',
  ],
  premium: [
    'Tout du plan Standard',
    'Chambres illimitées',
    'Multi-établissements',
    'API développeur',
    'Paiement Mobile Money',
    'Support dédié 24/7',
  ],
};

// ─── Animations ────────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [validatedCode, setValidatedCode] = useState<ValidatedCode | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // ── Formulaire code ──
  const codeForm = useForm<CodeValidationData>({
    resolver: zodResolver(codeValidationSchema),
    defaultValues: { code: '' },
  });

  // ── Formulaire inscription ──
  const registerForm = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      password: '',
      confirm_password: '',
      nom_hotel: '',
    },
  });

  // ── Valider le code d'activation ──
  async function onValidateCode(data: CodeValidationData) {
    setIsCodeLoading(true);
    setCodeError(null);

    try {
      const normalizedCode = data.code.trim().toUpperCase();

      const response = await fetch('/api/validate-activation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const result = await response.json();

      if (!result.valid) {
        setCodeError(result.error || 'Code invalide.');
        toast.error(result.error || 'Code d\'activation invalide.');
        return;
      }

      // Code valide !
      setValidatedCode({
        plan_id: result.plan_id,
        plan_name: result.plan_name,
        hotel_name: result.hotel_name,
        expires_at: result.expires_at,
      });

      // Pré-remplir le nom de l'hôtel
      registerForm.setValue('nom_hotel', result.hotel_name || '');

      toast.success('Code validé ! Complétez votre inscription.');

      // Passer à l'étape 2
      setDirection(1);
      setTimeout(() => setCurrentStep(2), 100);
    } catch (error) {
      console.error('[RegisterForm] Erreur validation code:', error);
      setCodeError('Erreur de connexion. Veuillez réessayer.');
      toast.error('Erreur de connexion au serveur.');
    } finally {
      setIsCodeLoading(false);
    }
  }

  // ── Inscription ──
  async function onRegister(data: RegistrationData) {
    if (!validatedCode) return;

    setIsRegisterLoading(true);

    try {
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeForm.getValues('code').trim().toUpperCase(),
          prenom: data.prenom.trim(),
          nom: data.nom.trim(),
          email: data.email.trim().toLowerCase(),
          telephone: data.telephone.trim(),
          password: data.password,
          nom_hotel: data.nom_hotel.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de l\'inscription.');
        return;
      }

      toast.success(result.message || 'Compte créé avec succès !');

      // Connecter automatiquement l'utilisateur
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (supabase) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });

        if (signInError) {
          console.error('[RegisterForm] Erreur auto-login:', signInError);
          // Rediriger vers login si l'auto-connexion échoue
          toast('Votre compte a été créé. Connectez-vous maintenant.', { icon: '🔑' });
          router.push('/login');
          return;
        }
      }

      // Rediriger vers le dashboard admin
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('[RegisterForm] Erreur inscription:', error);
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsRegisterLoading(false);
    }
  }

  // ── Retour à l'étape 1 ──
  function goBack() {
    setDirection(-1);
    setCurrentStep(1);
    setValidatedCode(null);
    setCodeError(null);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

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

            <h2 className="font-heading text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Créez votre<br />
              <span className="text-[#D4AF37]">Espace Hôtel</span>
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              Votre code d&apos;activation vous donne accès à toutes les fonctionnalités
              de gestion hôtelière pendant 30 jours.
            </p>

            <Separator className="bg-white/20 mb-10 max-w-xs" />

            {/* Features */}
            <div className="space-y-5">
              {[
                { icon: Crown, text: 'Plans adaptés à chaque taille d\'hôtel' },
                { icon: Shield, text: 'Données sécurisées et sauvegardées' },
                { icon: Star, text: 'Formation et support inclus' },
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

          <p className="absolute bottom-8 text-white/50 text-sm">
            &copy; {new Date().getFullYear()} OGOUTEL_Prestige. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* ─── Côté droit : Formulaires multi-étapes ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F8F9FA] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8"
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

          {/* ─── Indicateur de progression ─── */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep >= 1
                    ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > 1 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  '1'
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  currentStep >= 1 ? 'text-[#0A0A0A]' : 'text-gray-400'
                }`}
              >
                Code d&apos;activation
              </span>
            </div>

            <div
              className={`h-0.5 w-12 transition-colors duration-500 ${
                currentStep > 1 ? 'bg-[#D4AF37]' : 'bg-gray-200'
              }`}
            />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep >= 2
                    ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  currentStep >= 2 ? 'text-[#0A0A0A]' : 'text-gray-400'
                }`}
              >
                Votre compte
              </span>
            </div>
          </div>

          {/* ─── Étape 1 : Validation du code ─── */}
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Card className="border-0 shadow-xl shadow-black/5">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-3">
                      <KeyRound className="w-7 h-7 text-[#D4AF37]" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-[#0A0A0A]">
                      Code d&apos;activation
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Entrez votre code d&apos;activation pour commencer
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <form onSubmit={codeForm.handleSubmit(onValidateCode)} className="space-y-5">
                      {/* Code d'activation */}
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-[#0A0A0A]">
                          Code d&apos;activation
                        </Label>
                        <Input
                          id="code"
                          placeholder="OGT-XXXX-XXXX"
                          autoComplete="off"
                          disabled={isCodeLoading}
                          className="h-12 text-center text-lg font-mono tracking-widest bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 uppercase"
                          {...codeForm.register('code')}
                        />
                        {codeForm.formState.errors.code && (
                          <p className="text-sm text-red-500" role="alert">
                            {codeForm.formState.errors.code.message}
                          </p>
                        )}
                        {codeError && !codeForm.formState.errors.code && (
                          <p className="text-sm text-red-500" role="alert">{codeError}</p>
                        )}
                      </div>

                      {/* Info */}
                      <div className="bg-[#1B4332]/5 rounded-lg p-3 text-sm text-[#1B4332]/70">
                        <p className="flex items-start gap-2">
                          <span className="text-lg leading-none">💡</span>
                          <span>
                            Le code vous a été envoyé par email par l&apos;équipe OGOUTEL_Prestige.
                            Contactez-nous si vous ne l&apos;avez pas reçu.
                          </span>
                        </p>
                      </div>

                      {/* Bouton valider */}
                      <Button
                        type="submit"
                        disabled={isCodeLoading}
                        className="w-full h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                      >
                        {isCodeLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Vérification en cours...
                          </>
                        ) : (
                          <>
                            Valider le code
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Lien connexion */}
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Vous avez déjà un compte ?{' '}
                        <Link
                          href="/login"
                          className="text-[#D4AF37] hover:text-[#B8972E] font-semibold transition-colors"
                        >
                          Se connecter
                        </Link>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ─── Étape 2 : Informations du compte ─── */}
            {currentStep === 2 && validatedCode && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Card className="border-0 shadow-xl shadow-black/5">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-3">
                      <UserPlus className="w-7 h-7 text-[#D4AF37]" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-[#0A0A0A]">
                      Créer votre compte
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Complétez vos informations pour finaliser l&apos;inscription
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4">
                    {/* Résumé du code validé */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-[#1B4332]/5 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0A0A0A]">
                            Code validé avec succès
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Plan :{' '}
                            <span className="font-semibold text-[#1B4332]">
                              {validatedCode.plan_name}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Hôtel :{' '}
                            <span className="font-semibold text-[#0A0A0A]">
                              {validatedCode.hotel_name}
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-auto bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 flex-shrink-0"
                        >
                          {validatedCode.plan_name}
                        </Badge>
                      </div>

                      {/* Fonctionnalités du plan */}
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Fonctionnalités incluses :
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(PLAN_FEATURES[validatedCode.plan_id] || []).slice(0, 4).map((feature) => (
                            <span
                              key={feature}
                              className="text-xs bg-white/60 text-[#1B4332] px-2 py-0.5 rounded-full border border-[#1B4332]/10"
                            >
                              {feature}
                            </span>
                          ))}
                          {(PLAN_FEATURES[validatedCode.plan_id] || []).length > 4 && (
                            <span className="text-xs bg-white/60 text-muted-foreground px-2 py-0.5 rounded-full">
                              +{(PLAN_FEATURES[validatedCode.plan_id] || []).length - 4} autres
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      {/* Nom et Prénom */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="prenom" className="text-sm font-medium">
                            Prénom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="prenom"
                            placeholder="Jean"
                            autoComplete="given-name"
                            disabled={isRegisterLoading}
                            className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                            {...registerForm.register('prenom')}
                          />
                          {registerForm.formState.errors.prenom && (
                            <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.prenom.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nom" className="text-sm font-medium">
                            Nom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nom"
                            placeholder="Dupont"
                            autoComplete="family-name"
                            disabled={isRegisterLoading}
                            className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                            {...registerForm.register('nom')}
                          />
                          {registerForm.formState.errors.nom && (
                            <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.nom.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Email et Téléphone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-email" className="text-sm font-medium">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="jean@email.com"
                            autoComplete="email"
                            disabled={isRegisterLoading}
                            className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                            {...registerForm.register('email')}
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="telephone" className="text-sm font-medium">
                            Téléphone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="telephone"
                            type="tel"
                            placeholder="+225 07 XX XX XX"
                            autoComplete="tel"
                            disabled={isRegisterLoading}
                            className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                            {...registerForm.register('telephone')}
                          />
                          {registerForm.formState.errors.telephone && (
                            <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.telephone.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Mot de passe */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-password" className="text-sm font-medium">
                            Mot de passe <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="reg-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min. 8 caractères"
                              autoComplete="new-password"
                              disabled={isRegisterLoading}
                              className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 pr-9"
                              {...registerForm.register('password')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {registerForm.formState.errors.password && (
                            <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="confirm_password" className="text-sm font-medium">
                            Confirmer <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm_password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirmez"
                              autoComplete="new-password"
                              disabled={isRegisterLoading}
                              className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 pr-9"
                              {...registerForm.register('confirm_password')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                            >
                              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {registerForm.formState.errors.confirm_password && (
                            <p className="text-xs text-red-500" role="alert">
                              {registerForm.formState.errors.confirm_password.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Nom de l'hôtel */}
                      <div className="space-y-1.5">
                        <Label htmlFor="nom_hotel" className="text-sm font-medium">
                          Nom de l&apos;hôtel <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nom_hotel"
                          placeholder="Ex: Hôtel Le Prestige"
                          disabled={isRegisterLoading}
                          className="h-11 bg-white border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                          {...registerForm.register('nom_hotel')}
                        />
                        {registerForm.formState.errors.nom_hotel && (
                          <p className="text-xs text-red-500" role="alert">{registerForm.formState.errors.nom_hotel.message}</p>
                        )}
                      </div>

                      {/* Boutons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBack}
                          disabled={isRegisterLoading}
                          className="flex-shrink-0 h-11 border-gray-200 hover:bg-gray-50"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1.5" />
                          Retour
                        </Button>
                        <Button
                          type="submit"
                          disabled={isRegisterLoading}
                          className="flex-1 h-11 bg-[#D4AF37] hover:bg-[#B8972E] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                        >
                          {isRegisterLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Création en cours...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Créer mon compte
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

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
