'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Eye,
  Pencil,
  Power,
  RefreshCw,
  Building2,
  LayoutGrid,
  List,
  Users,
  Shield,
  HeadphonesIcon,
  ChevronDown,
  AlertTriangle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authFetch } from '@/lib/api-fetch';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  nom_complet: string;
  email: string;
  telephone: string;
  role: string;
  statut: string;
  created_at: string;
}

interface Limites {
  gerants: { actuel: number; max: number };
  receptionnistes: { actuel: number; max: number };
}

interface StaffManagerProps {
  personnel: StaffMember[];
  isLoading: boolean;
  limites: Limites;
  onRefresh: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getRoleBadge(role: string) {
  if (role === 'gerant') {
    return (
      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
        <Shield className="size-3 mr-1" />
        Gérant
      </Badge>
    );
  }
  return (
    <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-xs">
      <HeadphonesIcon className="size-3 mr-1" />
      Réceptionniste
    </Badge>
  );
}

function getStatutBadge(statut: string) {
  if (statut === 'actif') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        Actif
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
      Inactif
    </Badge>
  );
}

// ─── Staff Card ─────────────────────────────────────────────────────────────────

function StaffCard({
  member,
  onView,
  onEdit,
  onToggleStatut,
}: {
  member: StaffMember;
  onView: () => void;
  onEdit: () => void;
  onToggleStatut: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-11">
              <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] font-semibold text-sm">
                {member.nom_complet ? getInitials(member.nom_complet) : (
                  <Building2 className="size-4" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                  {member.nom_complet || '—'}
                </p>
                {getRoleBadge(member.role)}
                {getStatutBadge(member.statut)}
              </div>

              <p className="mt-1 text-xs text-gray-500 truncate">{member.email}</p>
              <p className="text-xs text-gray-400 truncate">{member.telephone || '—'}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Ajouté le {formatDate(member.created_at)}
              </p>

              <div className="mt-3 flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onView}
                  className="h-7 px-2 text-xs text-gray-500 hover:text-[#1B4332]"
                >
                  <Eye className="size-3.5 mr-1" />
                  Voir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-7 px-2 text-xs text-gray-500 hover:text-[#D4AF37]"
                >
                  <Pencil className="size-3.5 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleStatut}
                  className={cn(
                    'h-7 px-2 text-xs hover:text-white',
                    member.statut === 'actif'
                      ? 'text-gray-500 hover:bg-red-500'
                      : 'text-gray-500 hover:bg-emerald-500'
                  )}
                >
                  <Power className="size-3.5 mr-1" />
                  {member.statut === 'actif' ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Staff Row (list view) ─────────────────────────────────────────────────────

function StaffRow({
  member,
  onView,
  onEdit,
  onToggleStatut,
}: {
  member: StaffMember;
  onView: () => void;
  onEdit: () => void;
  onToggleStatut: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="rounded-xl border-0 shadow-sm mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] font-semibold text-xs">
                {member.nom_complet ? getInitials(member.nom_complet) : (
                  <Building2 className="size-3.5" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-1 sm:gap-3 items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0A0A0A] truncate">
                  {member.nom_complet || '—'}
                </p>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {getRoleBadge(member.role)}
                {getStatutBadge(member.statut)}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onView} className="size-7 text-gray-400 hover:text-[#1B4332]">
                  <Eye className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onEdit} className="size-7 text-gray-400 hover:text-[#D4AF37]">
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleStatut}
                  className={cn(
                    'size-7 hover:text-white',
                    member.statut === 'actif'
                      ? 'text-gray-400 hover:bg-red-500'
                      : 'text-gray-400 hover:bg-emerald-500'
                  )}
                >
                  <Power className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Form Dialog ───────────────────────────────────────────────────────────────

interface FormData {
  nom_complet: string;
  email: string;
  telephone: string;
  role: string;
}

function StaffFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
  isSubmitting,
  limites,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: FormData | null;
  title: string;
  isSubmitting: boolean;
  limites: Limites;
}) {
  const [form, setForm] = useState<FormData>({
    nom_complet: '',
    email: '',
    telephone: '',
    role: 'receptionniste',
  });

  const handleOpen = useCallback(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        nom_complet: '',
        email: '',
        telephone: '',
        role: 'receptionniste',
      });
    }
  }, [initialData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.nom_complet.trim() || !form.email.trim()) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      onSubmit(form);
    },
    [form, onSubmit]
  );

  const isGerantLimitReached = !initialData && limites.gerants.actuel >= limites.gerants.max;
  const isRecepLimitReached = !initialData && limites.receptionnistes.actuel >= limites.receptionnistes.max;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A0A0A]">{title}</DialogTitle>
          <DialogDescription>
            {!initialData
              ? 'Remplissez les informations pour ajouter un nouveau membre.'
              : 'Modifiez les informations du membre.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom_complet">Nom complet *</Label>
            <Input
              id="nom_complet"
              placeholder="Jean Dupont"
              value={form.nom_complet}
              onChange={(e) => setForm((p) => ({ ...p, nom_complet: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@hotel.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              placeholder="+225 07 00 00 00"
              value={form.telephone}
              onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gerant" disabled={isGerantLimitReached}>
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-purple-500" />
                    <span>Gérant</span>
                    {isGerantLimitReached && (
                      <span className="text-xs text-red-500">(limite atteinte)</span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="receptionniste" disabled={isRecepLimitReached}>
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="size-3.5 text-sky-500" />
                    <span>Réceptionniste</span>
                    {isRecepLimitReached && (
                      <span className="text-xs text-red-500">(limite atteinte)</span>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
            >
              {isSubmitting ? (
                <RefreshCw className="size-4 animate-spin mr-2" />
              ) : null}
              {!initialData ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Dialog ────────────────────────────────────────────────────────────────

function StaffViewDialog({
  member,
  open,
  onClose,
}: {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A0A0A]">Détails du membre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-14">
              <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] font-semibold text-lg">
                {member.nom_complet ? getInitials(member.nom_complet) : (
                  <Building2 className="size-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-[#0A0A0A]">{member.nom_complet}</p>
              <div className="flex items-center gap-2 mt-1">
                {getRoleBadge(member.role)}
                {getStatutBadge(member.statut)}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-[#0A0A0A] font-medium">{member.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Téléphone</span>
              <span className="text-[#0A0A0A] font-medium">{member.telephone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ajouté le</span>
              <span className="text-[#0A0A0A] font-medium">{formatDate(member.created_at)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function StaffManager({
  personnel,
  isLoading,
  limites,
  onRefresh,
}: StaffManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGerantFull = limites.gerants.actuel >= limites.gerants.max;
  const isRecepFull = limites.receptionnistes.actuel >= limites.receptionnistes.max;
  const isLimitReached = isGerantFull && isRecepFull;

  const handleAdd = useCallback(
    async (data: FormData) => {
      setIsSubmitting(true);
      try {
        const res = await authFetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Membre ajouté avec succès');
          setAddOpen(false);
          onRefresh();
        } else {
          toast.error(json.message || 'Erreur lors de l\'ajout');
        }
      } catch {
        toast.error('Erreur de connexion');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onRefresh]
  );

  const handleEdit = useCallback(
    async (data: FormData) => {
      if (!selectedMember) return;
      setIsSubmitting(true);
      try {
        const res = await authFetch('/api/admin/staff', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedMember.id, ...data }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Membre modifié avec succès');
          setEditOpen(false);
          onRefresh();
        } else {
          toast.error(json.message || 'Erreur lors de la modification');
        }
      } catch {
        toast.error('Erreur de connexion');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedMember, onRefresh]
  );

  const handleToggleStatut = useCallback(
    async (member: StaffMember) => {
      const newStatut = member.statut === 'actif' ? 'inactif' : 'actif';
      const action = newStatut === 'actif' ? 'activer' : 'désactiver';
      try {
        const res = await authFetch('/api/admin/staff', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: member.id, statut: newStatut }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Membre ${action} avec succès`);
          onRefresh();
        } else {
          toast.error(json.message || `Erreur lors de l'${action}`);
        }
      } catch {
        toast.error('Erreur de connexion');
      }
    },
    [onRefresh]
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Plan limits indicator ──────────────────────────────────────────────── */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-[#F77F00]" />
            <p className="text-sm font-medium text-[#0A0A0A]">
              Limites du plan
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Shield className="size-3.5 text-purple-500" />
                  <span className="text-gray-600">Gérants</span>
                </div>
                <span className={cn('font-medium', isGerantFull && 'text-red-500')}>
                  {limites.gerants.actuel}/{limites.gerants.max}
                </span>
              </div>
              <Progress
                value={(limites.gerants.actuel / limites.gerants.max) * 100}
                className={cn('h-2', isGerantFull && '[&>div]:bg-red-500')}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <HeadphonesIcon className="size-3.5 text-sky-500" />
                  <span className="text-gray-600">Réceptionnistes</span>
                </div>
                <span className={cn('font-medium', isRecepFull && 'text-red-500')}>
                  {limites.receptionnistes.actuel}/{limites.receptionnistes.max}
                </span>
              </div>
              <Progress
                value={(limites.receptionnistes.actuel / limites.receptionnistes.max) * 100}
                className={cn('h-2', isRecepFull && '[&>div]:bg-red-500')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-[#0A0A0A]">{personnel.length}</span> membre
            {personnel.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setViewMode('list')}
            >
              <List className="size-3.5" />
            </Button>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            disabled={isLimitReached}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2"
            size="sm"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Ajouter un membre</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Limit reached message */}
      {isLimitReached && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Vous avez atteint la limite de votre plan.{' '}
            <span className="font-medium">{limites.gerants.actuel}/{limites.gerants.max} gérants</span> et{' '}
            <span className="font-medium">{limites.receptionnistes.actuel}/{limites.receptionnistes.max} réceptionnistes</span>.
          </span>
        </div>
      )}

      {/* ── Staff Grid / List ─────────────────────────────────────────────────── */}
      {personnel.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Users className="size-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              Aucun membre du personnel
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Ajoutez votre premier membre en cliquant sur le bouton ci-dessus.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {personnel.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onView={() => {
                  setSelectedMember(member);
                  setViewOpen(true);
                }}
                onEdit={() => {
                  setSelectedMember(member);
                  setEditOpen(true);
                }}
                onToggleStatut={() => handleToggleStatut(member)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {personnel.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                onView={() => {
                  setSelectedMember(member);
                  setViewOpen(true);
                }}
                onEdit={() => {
                  setSelectedMember(member);
                  setEditOpen(true);
                }}
                onToggleStatut={() => handleToggleStatut(member)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────────── */}
      <StaffFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Ajouter un membre"
        isSubmitting={isSubmitting}
        limites={limites}
      />
      <StaffFormDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedMember(null);
        }}
        onSubmit={handleEdit}
        initialData={
          selectedMember
            ? {
                nom_complet: selectedMember.nom_complet,
                email: selectedMember.email,
                telephone: selectedMember.telephone,
                role: selectedMember.role,
              }
            : null
        }
        title="Modifier le membre"
        isSubmitting={isSubmitting}
        limites={limites}
      />
      <StaffViewDialog
        member={selectedMember}
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
}
