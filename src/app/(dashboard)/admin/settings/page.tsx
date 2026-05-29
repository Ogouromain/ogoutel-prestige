'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Building2,
  Star,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Shield,
  Save,
  Crown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PLANS_ABONNEMENT, formaterPrix } from '@/lib/constants';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HotelData {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  telephone: string;
  email: string;
  description: string;
  nombre_etoiles: number;
}

interface PlanInfo {
  id: string;
  nom: string;
  prix: number;
  fonctionnalites: string[];
  limites: {
    chambres: number;
    gerants: number;
    receptionnistes: number;
    admins: number;
  };
}

interface Abonnement {
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface SettingsData {
  hotel: HotelData;
  plan_info: PlanInfo;
  abonnement: Abonnement;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPlanBadgeClass(planId: string): string {
  const classes: Record<string, string> = {
    basique: 'bg-gray-100 text-gray-700 border-gray-200',
    standard: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    premium: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30',
  };
  return classes[planId] ?? 'bg-gray-100 text-gray-700';
}

function getStars(count: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={cn(
        'size-4',
        i < count ? 'fill-[#D4AF37] text-[#D4AF37]' : 'fill-gray-200 text-gray-200'
      )}
    />
  ));
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Hotel form state
  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    quartier: '',
    telephone: '',
    email: '',
    description: '',
    nombre_etoiles: 3,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.hotel) {
          setForm({
            nom: json.data.hotel.nom ?? '',
            adresse: json.data.hotel.adresse ?? '',
            ville: json.data.hotel.ville ?? '',
            quartier: json.data.hotel.quartier ?? '',
            telephone: json.data.hotel.telephone ?? '',
            email: json.data.hotel.email ?? '',
            description: json.data.hotel.description ?? '',
            nombre_etoiles: json.data.hotel.nombre_etoiles ?? 3,
          });
        }
      } else {
        toast.error('Erreur de chargement des paramètres');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Save hotel info ──────────────────────────────────────────────────────
  const handleSaveHotelInfo = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Informations mises à jour avec succès');
        fetchData();
      } else {
        toast.error(json.message || 'Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  }, [form, fetchData]);

  // ── Change password ──────────────────────────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Mot de passe modifié avec succès');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(json.message || 'Erreur lors du changement de mot de passe');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  }, [passwordForm]);

  if (isLoading) return <PageSkeleton />;
  if (!data) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-gray-400">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  const hotel = data.hotel;
  const planInfo = data.plan_info;
  const abonnement = data.abonnement;
  const daysRemaining = abonnement?.date_fin ? getDaysRemaining(abonnement.date_fin) : 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 14;
  const isExpired = daysRemaining <= 0;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Mon Hôtel
          </h1>
          <p className="text-sm text-gray-500">
            Paramètres et informations de votre établissement
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      {/* ── Hotel overview card ──────────────────────────────────────────────── */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex size-16 items-center justify-center rounded-xl bg-[#D4AF37]/10 shrink-0">
              <Building2 className="size-8 text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#0A0A0A]">
                  {hotel.nom || 'Mon Hôtel'}
                </h2>
                <Badge variant="outline" className={cn('text-xs', getPlanBadgeClass(planInfo?.id))}>
                  <Crown className="size-3 mr-1" />
                  {planInfo?.nom || 'Basique'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {getStars(hotel.nombre_etoiles ?? 3)}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {hotel.adresse && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="size-3.5" />
                    <span>{hotel.adresse}{hotel.quartier ? `, ${hotel.quartier}` : ''}{hotel.ville ? ` — ${hotel.ville}` : ''}</span>
                  </div>
                )}
                {hotel.telephone && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Phone className="size-3.5" />
                    <span>{hotel.telephone}</span>
                  </div>
                )}
                {hotel.email && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Mail className="size-3.5" />
                    <span>{hotel.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription info */}
          {abonnement && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="size-4 text-gray-400" />
                  <span className="text-gray-500">
                    Abonnement : <span className="font-medium text-[#0A0A0A]">{formaterPrix(planInfo?.prix ?? 0)}/mois</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="size-3.5" />
                    <span>
                      {abonnement.date_debut ? formatDate(abonnement.date_debut) : '—'} →{' '}
                      {abonnement.date_fin ? formatDate(abonnement.date_fin) : '—'}
                    </span>
                  </div>
                  {isExpired ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                      <AlertTriangle className="size-3" />
                      Expiré
                    </Badge>
                  ) : isExpiringSoon ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                      <AlertTriangle className="size-3" />
                      Expire dans {daysRemaining} jours
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs gap-1">
                      <CheckCircle2 className="size-3" />
                      {daysRemaining} jours restants
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="informations" className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="informations" className="gap-1.5 text-sm">
            <Building2 className="size-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="abonnement" className="gap-1.5 text-sm">
            <CreditCard className="size-4" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="securite" className="gap-1.5 text-sm">
            <Shield className="size-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Informations ──────────────────────────────────────────────── */}
        <TabsContent value="informations">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                Modifier les informations
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Mettez à jour les informations de votre établissement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-nom">Nom de l&apos;hôtel</Label>
                  <Input
                    id="hotel-nom"
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    placeholder="Nom de l'hôtel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-email">Email</Label>
                  <Input
                    id="hotel-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contact@hotel.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-telephone">Téléphone</Label>
                  <Input
                    id="hotel-telephone"
                    value={form.telephone}
                    onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                    placeholder="+225 07 00 00 00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-ville">Ville</Label>
                  <Input
                    id="hotel-ville"
                    value={form.ville}
                    onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))}
                    placeholder="Abidjan"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hotel-adresse">Adresse</Label>
                  <Input
                    id="hotel-adresse"
                    value={form.adresse}
                    onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-quartier">Quartier</Label>
                  <Input
                    id="hotel-quartier"
                    value={form.quartier}
                    onChange={(e) => setForm((p) => ({ ...p, quartier: e.target.value }))}
                    placeholder="Cocody"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-etoiles">Nombre d&apos;étoiles</Label>
                  <Select
                    value={String(form.nombre_etoiles)}
                    onValueChange={(v) => setForm((p) => ({ ...p, nombre_etoiles: parseInt(v) }))}
                  >
                    <SelectTrigger id="hotel-etoiles">
                      <SelectValue placeholder="Étoiles" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: n }).map((_, i) => (
                              <Star key={i} className="size-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                            ))}
                            <span className="ml-1">{n} étoile{n > 1 ? 's' : ''}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hotel-description">Description</Label>
                  <Textarea
                    id="hotel-description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description de votre établissement..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveHotelInfo}
                  disabled={isSaving}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Abonnement ────────────────────────────────────────────────── */}
        <TabsContent value="abonnement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current plan */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Plan actuel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                    <Crown className="size-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#0A0A0A]">{planInfo?.nom || 'Basique'}</p>
                    <p className="text-sm text-gray-500">{formaterPrix(planInfo?.prix ?? 0)}/mois</p>
                  </div>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A] mb-2">Fonctionnalités incluses</p>
                  <ul className="space-y-1.5">
                    {(planInfo?.fonctionnalites ?? []).map((feat: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Limits */}
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A] mb-2">Limites du plan</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-lg font-bold text-[#0A0A0A]">
                        {planInfo?.limites?.chambres ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">Chambres</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-lg font-bold text-[#0A0A0A]">
                        {planInfo?.limites?.gerants ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">Gérants</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-lg font-bold text-[#0A0A0A]">
                        {planInfo?.limites?.receptionnistes ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">Réceptionnistes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available plans */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Autres plans disponibles
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Changez de plan pour débloquer plus de fonctionnalités.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.values(PLANS_ABONNEMENT)
                  .filter((plan) => plan.id !== planInfo?.id)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-gray-200 p-4 hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'flex size-8 items-center justify-center rounded-lg',
                              plan.id === 'premium'
                                ? 'bg-[#D4AF37]/10'
                                : plan.id === 'standard'
                                  ? 'bg-emerald-50'
                                  : 'bg-gray-100'
                            )}
                          >
                            <Crown
                              className={cn(
                                'size-4',
                                plan.id === 'premium'
                                  ? 'text-[#D4AF37]'
                                  : plan.id === 'standard'
                                    ? 'text-emerald-500'
                                    : 'text-gray-500'
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0A0A0A]">{plan.nom}</p>
                            <p className="text-xs text-gray-500">{formaterPrix(plan.prix)}/mois</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          Évoluer
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{plan.description}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Sécurité ──────────────────────────────────────────────────── */}
        <TabsContent value="securite">
          <Card className="rounded-xl border-0 shadow-sm max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                Changer le mot de passe
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Modifiez le mot de passe de votre compte administrateur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
