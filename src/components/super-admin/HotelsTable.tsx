'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  MoreHorizontal,
  Filter,
  Hotel,
  Users,
  Calendar,
  TrendingUp,
  Bed,
  UserCog,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { PLANS_ABONNEMENT, formaterPrix } from '@/lib/constants';
import type { PlanId } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HotelRow {
  id: string;
  nom: string;
  ville: string | null;
  plan: PlanId;
  est_actif: boolean;
  nombre_chambres: number;
  nombre_etoiles: number;
  created_at: string;
  email: string | null;
  telephone: string | null;
  admin_id: string | null;
  date_fin_abonnement: string;
  admin?: {
    full_name: string;
    email: string;
  } | null;
  chambres_count?: number;
  personnel_count?: number;
}

interface HotelsTableProps {
  hotels: HotelRow[];
  isLoading?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, { chambres: number; personnel: number }> = {
  basique: { chambres: 20, personnel: 2 },
  standard: { chambres: 50, personnel: 5 },
  premium: { chambres: 999, personnel: 14 },
};

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

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function getHotelInitial(nom: string): string {
  return nom.charAt(0).toUpperCase();
}

// ─── Hotel Detail Modal ────────────────────────────────────────────────────────

function HotelDetailModal({
  hotel,
  open,
  onClose,
}: {
  hotel: HotelRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!hotel) return null;

  const planInfo = PLANS_ABONNEMENT[hotel.plan];
  const limits = PLAN_LIMITS[hotel.plan] ?? { chambres: 999, personnel: 99 };
  const chambresCount = hotel.chambres_count ?? hotel.nombre_chambres;
  const personnelCount = hotel.personnel_count ?? 0;
  const chambrePercent = Math.min(
    Math.round((chambresCount / limits.chambres) * 100),
    100
  );
  const personnelPercent = Math.min(
    Math.round((personnelCount / limits.personnel) * 100),
    100
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="size-10 bg-[#D4AF37]/10">
              <AvatarFallback className="bg-[#D4AF37]/15 text-[#D4AF37] font-semibold">
                {getHotelInitial(hotel.nom)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{hotel.nom}</span>
              <div className="flex items-center gap-2 mt-1">
                {getPlanBadge(hotel.plan)}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    hotel.est_actif
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  )}
                >
                  {hotel.est_actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails de l&apos;hôtel {hotel.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={<Users className="size-4" />} label="Propriétaire" value={hotel.admin?.full_name ?? 'Non défini'} />
            <InfoItem icon={<Hotel className="size-4" />} label="Ville" value={hotel.ville ?? 'Non défini'} />
            <InfoItem icon={<Calendar className="size-4" />} label="Inscrit le" value={formatDate(hotel.created_at)} />
            <InfoItem icon={<Calendar className="size-4" />} label="Fin abonnement" value={formatDate(hotel.date_fin_abonnement)} />
            <InfoItem icon={<Inbox className="size-4" />} label="Email" value={hotel.admin?.email ?? hotel.email ?? 'Non défini'} />
            <InfoItem icon={<TrendingUp className="size-4" />} label="Étoiles" value={`${hotel.nombre_etoiles} ★`} />
          </div>

          <Separator />

          {/* Plan Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-[#0A0A0A] mb-3">
              Plan {planInfo?.nom} — {formaterPrix(planInfo?.prix ?? 0)}/mois
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1"><Bed className="size-3" /> Chambres</span>
                  <span>{chambresCount} / {limits.chambres === 999 ? '∞' : limits.chambres}</span>
                </div>
                <Progress value={chambrePercent} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1"><UserCog className="size-3" /> Personnel</span>
                  <span>{personnelCount} / {limits.personnel}</span>
                </div>
                <Progress value={personnelPercent} className="h-2" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Revenue Stats (placeholders) */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-[#D4AF37]">—</p>
                <p className="text-xs text-gray-500">Revenus total</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-[#1B4332]">—</p>
                <p className="text-xs text-gray-500">Taux d&apos;occupation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
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
        <p className="text-sm font-medium text-[#0A0A0A]">{value}</p>
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
      </div>
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-3">
            <div className="grid grid-cols-9 gap-2">
              {Array.from({ length: 9 }).map((_, j) => (
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
        <Hotel className="size-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-[#0A0A0A]">Aucun hôtel trouvé</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Aucun hôtel ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
      </p>
    </motion.div>
  );
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

function exportToCSV(hotels: HotelRow[]) {
  const headers = [
    'Nom', 'Propriétaire', 'Ville', 'Plan', 'Statut',
    'Chambres', 'Personnel', 'Date inscription',
  ];
  const rows = hotels.map((h) => [
    h.nom,
    h.admin?.full_name ?? '',
    h.ville ?? '',
    PLANS_ABONNEMENT[h.plan]?.nom ?? h.plan,
    h.est_actif ? 'Actif' : 'Inactif',
    h.chambres_count ?? h.nombre_chambres,
    h.personnel_count ?? 0,
    formatDate(h.created_at),
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(';')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hotels_ogoutel_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HotelsTable({ hotels, isLoading }: HotelsTableProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [planFilter, setPlanFilter] = useState<string>('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHotel, setSelectedHotel] = useState<HotelRow | null>(null);
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
  const filteredHotels = useMemo(() => {
    let result = hotels;

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (h) =>
          h.nom.toLowerCase().includes(q) ||
          h.ville?.toLowerCase().includes(q) ||
          h.admin?.full_name.toLowerCase().includes(q) ||
          h.email?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'actif') {
      result = result.filter((h) => h.est_actif);
    } else if (statusFilter === 'inactif') {
      result = result.filter((h) => !h.est_actif);
    }

    // Plan filter
    if (planFilter !== 'tous') {
      result = result.filter((h) => h.plan === planFilter);
    }

    return result;
  }, [hotels, debouncedSearch, statusFilter, planFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / ITEMS_PER_PAGE);
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, currentPage]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleToggleActive = useCallback(
    async (hotel: HotelRow) => {
      try {
        const res = await fetch('/api/super-admin/hotels', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: hotel.id,
            est_actif: !hotel.est_actif,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(
          hotel.est_actif
            ? `Hôtel "${hotel.nom}" désactivé`
            : `Hôtel "${hotel.nom}" activé`
        );
      } catch {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    },
    []
  );

  const handleChangePlan = useCallback(async (hotel: HotelRow, newPlan: PlanId) => {
    try {
      const res = await fetch('/api/super-admin/hotels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hotel.id, plan: newPlan }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Plan changé en "${PLANS_ABONNEMENT[newPlan]?.nom}" pour "${hotel.nom}"`);
    } catch {
      toast.error('Erreur lors du changement de plan');
    }
  }, []);

  const handleViewDetail = useCallback((hotel: HotelRow) => {
    setSelectedHotel(hotel);
    setDetailOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    if (filteredHotels.length === 0) {
      toast('Aucune donnée à exporter', { icon: 'ℹ️' });
      return;
    }
    exportToCSV(filteredHotels);
    toast.success(`${filteredHotels.length} hôtels exportés en CSV`);
  }, [filteredHotels]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <div className="space-y-4">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, ville, propriétaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-gray-400 hidden sm:block" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
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
            {filteredHotels.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="w-[50px]">Logo</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Chambres</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedHotels.map((hotel, idx) => {
                        const limits = PLAN_LIMITS[hotel.plan] ?? { chambres: 999, personnel: 99 };
                        const chambresCount = hotel.chambres_count ?? hotel.nombre_chambres;
                        const personnelCount = hotel.personnel_count ?? 0;

                        return (
                          <motion.tr
                            key={hotel.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                          >
                            <TableCell>
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
                                  {getHotelInitial(hotel.nom)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium text-[#0A0A0A]">
                              {hotel.nom}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {hotel.admin?.full_name ?? '—'}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {hotel.ville ?? '—'}
                            </TableCell>
                            <TableCell>{getPlanBadge(hotel.plan)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  hotel.est_actif
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                                )}
                              >
                                {hotel.est_actif ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className={cn(chambresCount >= limits.chambres && 'text-red-600 font-medium')}>
                                {chambresCount}
                              </span>
                              <span className="text-gray-400">
                                /{limits.chambres === 999 ? '∞' : limits.chambres}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className={cn(personnelCount >= limits.personnel && 'text-red-600 font-medium')}>
                                {personnelCount}
                              </span>
                              <span className="text-gray-400">
                                /{limits.personnel}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(hotel.created_at)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetail(hotel)}>
                                    <Eye className="size-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleToggleActive(hotel)}>
                                    {hotel.est_actif ? (
                                      <>
                                        <ToggleLeft className="size-4 mr-2" />
                                        Désactiver
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="size-4 mr-2" />
                                        Activer
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenu
                                    onOpenChange={(open) => {
                                      // Nested dropdown for plan change
                                    }}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <DropdownMenuItem
                                        className="w-full"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <ArrowUpDown className="size-4 mr-2" />
                                        Changer de plan
                                      </DropdownMenuItem>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      {(Object.keys(PLANS_ABONNEMENT) as PlanId[]).map((planId) => (
                                        <DropdownMenuItem
                                          key={planId}
                                          disabled={planId === hotel.plan}
                                          onClick={() => handleChangePlan(hotel, planId)}
                                        >
                                          {PLANS_ABONNEMENT[planId].nom} — {formaterPrix(PLANS_ABONNEMENT[planId].prix)}/mois
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
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
              {filteredHotels.length} hôtel{filteredHotels.length > 1 ? 's' : ''} trouvé{filteredHotels.length > 1 ? 's' : ''}
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
                    // Show first, last, current and neighbors
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

      {/* Hotel Detail Modal */}
      <HotelDetailModal
        hotel={selectedHotel}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
