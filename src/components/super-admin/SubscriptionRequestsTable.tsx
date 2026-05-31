'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  Wallet,
  Key,
  RotateCcw,
  MessageSquare,
  Mail,
  MoreHorizontal,
  Filter,
  FileText,
  Phone,
  MapPin,
  Building,
  Bed,
  StickyNote,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PLANS_ABONNEMENT,
  STATUTS_DEMANDE,
  formaterPrix,
} from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import type { AbonnementDemande } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionRequestsTableProps {
  demandes: AbonnementDemande[];
  isLoading?: boolean;
  onUpdate?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_BADGE_CLASSES: Record<string, string> = {
  basique: 'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  premium: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30',
};

const ITEMS_PER_PAGE = 10;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPlanBadge(plan: PlanId) {
  const label = PLANS_ABONNEMENT[plan]?.nom ?? plan;
  const colorClass = PLAN_BADGE_CLASSES[plan] ?? 'bg-gray-100 text-gray-700';
  return <Badge variant="outline" className={cn('text-xs', colorClass)}>{label}</Badge>;
}

function getStatutBadge(statut: string) {
  const found = STATUTS_DEMANDE.find((s) => s.id === statut);
  if (!found) return <Badge variant="outline" className="text-xs">{statut}</Badge>;
  return <Badge variant="outline" className={cn('text-xs', found.color)}>{found.label}</Badge>;
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function DemandDetailModal({
  demande,
  open,
  onClose,
  onSaveNotes,
}: {
  demande: AbonnementDemande | null;
  open: boolean;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (demande) {
      setNotes(demande.notes_admin ?? '');
    }
  }, [demande]);

  if (!demande) return null;

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onSaveNotes(demande.id, notes);
      toast.success('Notes sauvegardées');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Détails de la demande
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails de la demande de {demande.nom_complet}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Prospect Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#1B4332]/10">
                <span className="text-sm font-bold text-[#1B4332]">
                  {demande.nom_complet.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-[#0A0A0A]">{demande.nom_complet}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {getStatutBadge(demande.statut)}
                  {getPlanBadge(demande.plan_choisi)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                icon={<Mail className="size-4" />}
                label="Email"
                value={demande.email}
              />
              <DetailItem
                icon={<Phone className="size-4" />}
                label="Téléphone"
                value={demande.telephone}
              />
              <DetailItem
                icon={<Building className="size-4" />}
                label="Hôtel"
                value={demande.nom_hotel}
              />
              <DetailItem
                icon={<MapPin className="size-4" />}
                label="Ville"
                value={`${demande.ville}${demande.quartier ? ` — ${demande.quartier}` : ''}`}
              />
              <DetailItem
                icon={<Bed className="size-4" />}
                label="Chambres"
                value={demande.nombre_chambres?.toString() ?? 'Non spécifié'}
              />
              <DetailItem
                icon={<Wallet className="size-4" />}
                label="Prix plan"
                value={formaterPrix(PLANS_ABONNEMENT[demande.plan_choisi]?.prix ?? 0)}
              />
            </div>

            {demande.message && (
              <>
                <Separator />
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                    <MessageSquare className="size-3.5" />
                    Message du prospect
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                    {demande.message}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Admin Notes */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                <StickyNote className="size-3.5" />
                Notes administrateur
              </p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes internes sur cette demande..."
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="gap-2 bg-[#1B4332] hover:bg-[#1B4332]/90"
                >
                  <Save className="size-3.5" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(`https://wa.me/${demande.telephone.replace(/\s/g, '')}?text=${encodeURIComponent(`Bonjour ${demande.nom_complet},\n\nNous avons bien reçu votre demande d'abonnement OGOUTEL_Prestige pour ${demande.nom_hotel}.\n\nMerci de nous confirmer votre intérêt pour le plan ${PLANS_ABONNEMENT[demande.plan_choisi]?.nom}.\n\nCordialement,\nL'équipe OGOUTEL_Prestige`)}`, '_blank')
              }
              className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <MessageSquare className="size-3.5" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${demande.email}`, '_blank')}
              className="gap-2"
            >
              <Mail className="size-3.5" />
              Email
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-[#0A0A0A] break-all">{value}</p>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-3">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <FileText className="size-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-[#0A0A0A]">Aucune demande trouvée</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Aucune demande d&apos;abonnement ne correspond à vos critères. Modifiez vos filtres.
      </p>
    </motion.div>
  );
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

function exportToCSV(demandes: AbonnementDemande[]) {
  const headers = [
    'Date', 'Prospect', 'Email', 'Téléphone', 'Hôtel', 'Ville',
    'Plan', 'Prix', 'Statut', 'Notes',
  ];
  const rows = demandes.map((d) => [
    formatDate(d.created_at),
    d.nom_complet,
    d.email,
    d.telephone,
    d.nom_hotel,
    d.ville,
    PLANS_ABONNEMENT[d.plan_choisi]?.nom ?? d.plan_choisi,
    formaterPrix(PLANS_ABONNEMENT[d.plan_choisi]?.prix ?? 0),
    STATUTS_DEMANDE.find((s) => s.id === d.statut)?.label ?? d.statut,
    d.notes_admin ?? '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(';')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `demandes_abonnement_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SubscriptionRequestsTable({
  demandes,
  isLoading,
  onUpdate,
}: SubscriptionRequestsTableProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [planFilter, setPlanFilter] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDemande, setSelectedDemande] = useState<AbonnementDemande | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered data
  const filteredDemandes = useMemo(() => {
    let result = demandes;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.nom_complet.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.nom_hotel.toLowerCase().includes(q) ||
          d.telephone.includes(q)
      );
    }

    if (statusFilter !== 'tous') {
      result = result.filter((d) => d.statut === statusFilter);
    }

    if (planFilter !== 'tous') {
      result = result.filter((d) => d.plan_choisi === planFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((d) => new Date(d.created_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((d) => new Date(d.created_at) <= to);
    }

    return result;
  }, [demandes, debouncedSearch, statusFilter, planFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredDemandes.length / ITEMS_PER_PAGE);
  const paginatedDemandes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDemandes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDemandes, currentPage]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const updateStatut = useCallback(
    async (id: string, statut: string) => {
      try {
        const res = await authFetch('/api/super-admin/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, statut }),
        });
        if (!res.ok) throw new Error();
        const label = STATUTS_DEMANDE.find((s) => s.id === statut)?.label ?? statut;
        toast.success(`Statut mis à jour : ${label}`);
        onUpdate?.();
      } catch {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    },
    [onUpdate]
  );

  const handleGenerateCode = useCallback(
    async (demande: AbonnementDemande) => {
      try {
        const res = await authFetch('/api/super-admin/codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demande_id: demande.id,
            email: demande.email,
            nom_hotel: demande.nom_hotel,
            plan: demande.plan_choisi,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Code d'activation généré pour "${demande.nom_hotel}"`);
        onUpdate?.();
      } catch {
        toast.error("Erreur lors de la génération du code d'activation");
      }
    },
    [onUpdate]
  );

  const handleSaveNotes = useCallback(
    async (id: string, notes: string) => {
      try {
        const res = await authFetch('/api/super-admin/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, notes_admin: notes }),
        });
        if (!res.ok) throw new Error();
        onUpdate?.();
      } catch {
        throw new Error();
      }
    },
    [onUpdate]
  );

  const handleViewDetail = useCallback((demande: AbonnementDemande) => {
    setSelectedDemande(demande);
    setDetailOpen(true);
  }, []);

  const handleWhatsApp = useCallback((demande: AbonnementDemande) => {
    const msg = encodeURIComponent(
      `Bonjour ${demande.nom_complet},\n\nNous avons bien reçu votre demande d'abonnement OGOUTEL_Prestige pour "${demande.nom_hotel}".\n\nMerci de nous confirmer votre intérêt pour le plan ${PLANS_ABONNEMENT[demande.plan_choisi]?.nom}.\n\nCordialement,\nL'équipe OGOUTEL_Prestige`
    );
    window.open(`https://wa.me/${demande.telephone.replace(/\s/g, '')}?text=${msg}`, '_blank');
  }, []);

  const handleEmail = useCallback((demande: AbonnementDemande) => {
    window.open(`mailto:${demande.email}`, '_blank');
  }, []);

  const handleExport = useCallback(() => {
    if (filteredDemandes.length === 0) {
      toast('Aucune donnée à exporter', { icon: 'ℹ️' });
      return;
    }
    exportToCSV(filteredDemandes);
    toast.success(`${filteredDemandes.length} demandes exportées en CSV`);
  }, [filteredDemandes]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, hôtel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-gray-400 hidden sm:block" />

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS_DEMANDE.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les plans</SelectItem>
                <SelectItem value="basique">Basique</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-[140px]"
              placeholder="Du"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-[140px]"
              placeholder="Au"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </motion.div>

        {/* Table */}
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredDemandes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Hôtel</TableHead>
                      <TableHead className="hidden md:table-cell">Ville</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="hidden lg:table-cell">Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedDemandes.map((demande, idx) => (
                        <motion.tr
                          key={demande.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                        >
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(demande.created_at)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#0A0A0A] text-sm">
                                {demande.nom_complet}
                              </p>
                              <p className="text-xs text-gray-400">{demande.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-[#0A0A0A] font-medium">
                            {demande.nom_hotel}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 hidden md:table-cell">
                            {demande.ville}
                          </TableCell>
                          <TableCell>{getPlanBadge(demande.plan_choisi)}</TableCell>
                          <TableCell className="text-sm text-gray-600 hidden lg:table-cell whitespace-nowrap">
                            {formaterPrix(PLANS_ABONNEMENT[demande.plan_choisi]?.prix ?? 0)}
                          </TableCell>
                          <TableCell>{getStatutBadge(demande.statut)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleViewDetail(demande)}>
                                  <Eye className="size-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => updateStatut(demande.id, 'contacte')}
                                  disabled={demande.statut === 'contacte'}
                                >
                                  <UserCheck className="size-4 mr-2" />
                                  Marquer comme contacté
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => updateStatut(demande.id, 'paye')}
                                  disabled={demande.statut === 'paye' || demande.statut === 'active'}
                                >
                                  <Wallet className="size-4 mr-2" />
                                  Marquer comme payé
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleGenerateCode(demande)}
                                  disabled={demande.statut !== 'paye'}
                                  className="text-[#D4AF37]"
                                >
                                  <Key className="size-4 mr-2" />
                                  Générer code d&apos;activation
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => updateStatut(demande.id, 'en_attente')}
                                  disabled={demande.statut === 'en_attente'}
                                >
                                  <RotateCcw className="size-4 mr-2" />
                                  Remettre en attente
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => handleWhatsApp(demande)}>
                                  <MessageSquare className="size-4 mr-2 text-emerald-600" />
                                  WhatsApp direct
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleEmail(demande)}>
                                  <Mail className="size-4 mr-2" />
                                  Email direct
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
              {totalPages > 1 && ` — Page ${currentPage}/${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Précédent
              </Button>
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && page - prev > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-1 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="size-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </span>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DemandDetailModal
        demande={selectedDemande}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSaveNotes={handleSaveNotes}
      />
    </>
  );
}
