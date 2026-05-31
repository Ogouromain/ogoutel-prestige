'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bed,
  Plus,
  Search,
  RefreshCw,
  Wifi,
  AirVent,
  Tv,
  Wine,
  Lock,
  Phone,
  Wind,
  Shirt,
  MoreVertical,
  Eye,
  Pencil,
  ToggleRight,
  Building,
  User,
  CalendarDays,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  formaterPrix,
  getLibelleTypeChambre,
  getLibelleStatutChambre,
  STATUTS_CHAMBRE,
  TYPES_CHAMBRES,
} from '@/lib/constants';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { authFetch } from '@/lib/api-fetch';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RoomsGridProps {
  chambres: any[];
  isLoading: boolean;
  limitesChambres: { actuel: number; max: number };
  onRefresh: () => void;
}

// ─── Amenity Icons ─────────────────────────────────────────────────────────────

const AMENITY_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi: { icon: <Wifi className="size-3.5" />, label: 'WiFi' },
  climatisation: { icon: <AirVent className="size-3.5" />, label: 'Climatisation' },
  tv: { icon: <Tv className="size-3.5" />, label: 'TV' },
  minibar: { icon: <Wine className="size-3.5" />, label: 'Minibar' },
  coffre: { icon: <Lock className="size-3.5" />, label: 'Coffre' },
  telephone: { icon: <Phone className="size-3.5" />, label: 'Téléphone' },
  'seche-cheveux': { icon: <Wind className="size-3.5" />, label: 'Sèche-cheveux' },
  peignoir: { icon: <Shirt className="size-3.5" />, label: 'Peignoir' },
};

const STATUT_BORDER_COLORS: Record<string, string> = {
  disponible: 'border-l-emerald-500',
  occupee: 'border-l-red-500',
  maintenance: 'border-l-amber-500',
  reservee: 'border-l-blue-500',
};

const STATUT_BADGE_CLASSES: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  occupee: 'bg-red-100 text-red-700 border-red-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  reservee: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  simple: 'bg-gray-100 text-gray-700',
  double: 'bg-sky-100 text-sky-700',
  suite: 'bg-purple-100 text-purple-700',
  vip: 'bg-[#D4AF37]/15 text-[#D4AF37]',
  familiale: 'bg-green-100 text-green-700',
};

const EQUIPEMENTS_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'tv', label: 'TV' },
  { id: 'minibar', label: 'Minibar' },
  { id: 'coffre', label: 'Coffre' },
  { id: 'telephone', label: 'Téléphone' },
  { id: 'seche-cheveux', label: 'Sèche-cheveux' },
  { id: 'peignoir', label: 'Peignoir' },
];

const ITEMS_PER_PAGE = 12;

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <Bed className="size-8 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">Aucune chambre trouvée</p>
      <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou ajoutez une chambre</p>
    </motion.div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({
  chambre,
  onView,
  onEditStatus,
  onEdit,
}: {
  chambre: any;
  onView: () => void;
  onEditStatus: () => void;
  onEdit: () => void;
}) {
  const borderClass = STATUT_BORDER_COLORS[chambre.statut] || 'border-l-gray-400';
  const badgeClass = STATUT_BADGE_CLASSES[chambre.statut] || 'bg-gray-100 text-gray-700';
  const typeBadgeClass = TYPE_BADGE_CLASSES[chambre.type] || 'bg-gray-100 text-gray-700';

  const equipements = chambre.equipements
    ? typeof chambre.equipements === 'string'
      ? JSON.parse(chambre.equipements)
      : chambre.equipements
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('border-l-4 overflow-hidden hover:shadow-md transition-shadow', borderClass)}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{chambre.numero}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge className={cn('border text-[10px] px-1.5 py-0', typeBadgeClass)}>
                  {getLibelleTypeChambre(chambre.type)}
                </Badge>
                <Badge className={cn('border text-[10px] px-1.5 py-0', badgeClass)}>
                  {getLibelleStatutChambre(chambre.statut)}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="size-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEditStatus}>
                  <ToggleRight className="size-4 mr-2" />
                  Modifier statut
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-4 mr-2" />
                  Modifier infos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-sm text-gray-600">
            <p>Étage {chambre.etage || '—'}</p>
            <p className="font-semibold text-gray-900">{formaterPrix(chambre.prix_nuit)}<span className="text-xs font-normal text-gray-400">/nuit</span></p>
          </div>

          {/* Current guest */}
          {chambre.current_reservation && (
            <div className="mt-3 rounded-md bg-orange-50 px-2.5 py-1.5">
              <p className="text-[11px] font-medium text-orange-700 flex items-center gap-1">
                <User className="size-3" />
                {chambre.current_reservation.client_nom} {chambre.current_reservation.client_prenom || ''}
              </p>
            </div>
          )}

          {/* Amenities */}
          {equipements.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {equipements.slice(0, 4).map((eq: string) => {
                const amenity = AMENITY_ICONS[eq];
                return amenity ? (
                  <span
                    key={eq}
                    className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                    title={amenity.label}
                  >
                    {amenity.icon}
                  </span>
                ) : null;
              })}
              {equipements.length > 4 && (
                <span className="text-[10px] text-gray-400 self-center">+{equipements.length - 4}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Add Room Dialog ───────────────────────────────────────────────────────────

function AddRoomDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero: '',
    type: '',
    etage: '',
    prix_nuit: '',
    description: '',
    equipements: [] as string[],
  });

  const handleEquipementToggle = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      equipements: prev.equipements.includes(id)
        ? prev.equipements.filter((e) => e !== id)
        : [...prev.equipements, id],
    }));
  }, []);

  const handleSubmit = async () => {
    if (!form.numero.trim()) {
      toast.error('Le numéro de chambre est requis');
      return;
    }
    if (!form.type) {
      toast.error('Le type de chambre est requis');
      return;
    }
    if (!form.prix_nuit || Number(form.prix_nuit) <= 0) {
      toast.error('Le prix par nuit est requis');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        numero: form.numero.trim(),
        type: form.type,
        etage: form.etage ? Number(form.etage) : 0,
        prix_nuit: Number(form.prix_nuit),
        description: form.description.trim(),
        equipements: form.equipements,
      });
      toast.success('Chambre ajoutée avec succès');
      setForm({ numero: '', type: '', etage: '', prix_nuit: '', description: '', equipements: [] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'ajout de la chambre");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-[#1B4332]" />
            Ajouter une chambre
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="room-numero">Numéro de chambre *</Label>
              <Input
                id="room-numero"
                placeholder="Ex: 101, A1..."
                value={form.numero}
                onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-type">Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_CHAMBRES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-etage">Étage</Label>
                <Input
                  id="room-etage"
                  type="number"
                  placeholder="0"
                  min={0}
                  value={form.etage}
                  onChange={(e) => setForm((p) => ({ ...p, etage: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-prix">Prix par nuit (FCFA) *</Label>
              <Input
                id="room-prix"
                type="number"
                placeholder="25000"
                min={0}
                value={form.prix_nuit}
                onChange={(e) => setForm((p) => ({ ...p, prix_nuit: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-desc">Description</Label>
              <Textarea
                id="room-desc"
                placeholder="Description de la chambre..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Équipements</Label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPEMENTS_OPTIONS.map((eq) => (
                  <div key={eq.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`eq-${eq.id}`}
                      checked={form.equipements.includes(eq.id)}
                      onCheckedChange={() => handleEquipementToggle(eq.id)}
                    />
                    <Label htmlFor={`eq-${eq.id}`} className="text-sm cursor-pointer font-normal">
                      {eq.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#1B4332] hover:bg-[#1B4332]/90">
            {loading ? 'Ajout en cours...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Room Detail Dialog ────────────────────────────────────────────────────────

function RoomDetailDialog({
  chambre,
  open,
  onOpenChange,
}: {
  chambre: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!chambre) return null;

  const badgeClass = STATUT_BADGE_CLASSES[chambre.statut] || 'bg-gray-100 text-gray-700';
  const typeBadgeClass = TYPE_BADGE_CLASSES[chambre.type] || 'bg-gray-100 text-gray-700';

  const equipements = chambre.equipements
    ? typeof chambre.equipements === 'string'
      ? JSON.parse(chambre.equipements)
      : chambre.equipements
    : [];

  const res = chambre.current_reservation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="size-5 text-[#1B4332]" />
            Chambre {chambre.numero}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('border text-xs px-2 py-0.5', typeBadgeClass)}>
                {getLibelleTypeChambre(chambre.type)}
              </Badge>
              <Badge className={cn('border text-xs px-2 py-0.5', badgeClass)}>
                {getLibelleStatutChambre(chambre.statut)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Étage</p>
                <p className="font-semibold">{chambre.etage || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Prix / nuit</p>
                <p className="font-semibold">{formaterPrix(chambre.prix_nuit)}</p>
              </div>
            </div>

            {chambre.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-700 mt-1">{chambre.description}</p>
              </div>
            )}

            {equipements.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Équipements</p>
                <div className="flex flex-wrap gap-2">
                  {equipements.map((eq: string) => {
                    const amenity = AMENITY_ICONS[eq];
                    return amenity ? (
                      <span
                        key={eq}
                        className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                      >
                        {amenity.icon}
                        {amenity.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {res && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="size-4" />
                    Client actuel
                  </h4>
                  <div className="rounded-lg bg-orange-50 p-3 space-y-1.5 text-sm">
                    <p>
                      <span className="text-gray-500">Nom :</span>{' '}
                      <span className="font-medium">{res.client_nom || '—'}</span>
                    </p>
                    {res.client_prenom && (
                      <p>
                        <span className="text-gray-500">Prénom :</span>{' '}
                        <span className="font-medium">{res.client_prenom}</span>
                      </p>
                    )}
                    {res.date_checkin && (
                      <p>
                        <span className="text-gray-500">Check-in :</span>{' '}
                        <span className="font-medium">
                          {format(new Date(res.date_checkin), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </p>
                    )}
                    {res.date_checkout && (
                      <p>
                        <span className="text-gray-500">Check-out :</span>{' '}
                        <span className="font-medium">
                          {format(new Date(res.date_checkout), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Status Dialog ───────────────────────────────────────────────────────

function EditStatusDialog({
  chambre,
  open,
  onOpenChange,
  onSubmit,
}: {
  chambre: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (chambreId: string, statut: string) => Promise<void>;
}) {
  const [selectedStatut, setSelectedStatut] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatut) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(chambre.id, selectedStatut);
      toast.success('Statut mis à jour avec succès');
      setSelectedStatut('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setSelectedStatut(''); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Modifier le statut — Chambre {chambre.numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nouveau statut</Label>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_CHAMBRE.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedStatut} className="bg-[#1B4332] hover:bg-[#1B4332]/90">
            {loading ? 'Mise à jour...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function RoomsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-gray-300">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoomsGrid({ chambres, isLoading, limitesChambres, onRefresh }: RoomsGridProps) {
  // Filters
  const [statutFilter, setStatutFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailChambre, setDetailChambre] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusChambre, setStatusChambre] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const limitReached = limitesChambres.actuel >= limitesChambres.max;

  // Filtered rooms
  const filteredChambres = useMemo(() => {
    let result = [...chambres];
    if (statutFilter !== 'all') {
      result = result.filter((c) => c.statut === statutFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => c.numero.toLowerCase().includes(q));
    }
    return result;
  }, [chambres, statutFilter, typeFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredChambres.length / ITEMS_PER_PAGE);
  const paginatedChambres = filteredChambres.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset page on filter change
  const handleStatutChange = useCallback((v: string) => {
    setStatutFilter(v);
    setPage(1);
  }, []);
  const handleTypeChange = useCallback((v: string) => {
    setTypeFilter(v);
    setPage(1);
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  // Submit handlers
  const handleAddRoom = useCallback(async (data: any) => {
    const res = await authFetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erreur lors de l'ajout");
    }
    onRefresh();
  }, [onRefresh]);

  const handleStatusChange = useCallback(async (chambreId: string, statut: string) => {
    const res = await authFetch('/api/admin/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chambreId, statut }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour');
    }
    onRefresh();
  }, [onRefresh]);

  const handleViewRoom = useCallback((chambre: any) => {
    setDetailChambre(chambre);
    setDetailDialogOpen(true);
  }, []);

  const handleEditStatus = useCallback((chambre: any) => {
    setStatusChambre(chambre);
    setStatusDialogOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* ─── Filter Bar & Actions ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Rechercher par numéro..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statutFilter} onValueChange={handleStatutChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUTS_CHAMBRE.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {TYPES_CHAMBRES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onRefresh} title="Actualiser">
            <RefreshCw className="size-4" />
          </Button>

          <Button
            onClick={() => setAddDialogOpen(true)}
            disabled={limitReached}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
          >
            <Plus className="size-4 mr-1.5" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Room count badge */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500">
          {limitesChambres.actuel}/{limitesChambres.max} chambres
        </p>
        {limitReached && (
          <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">
            Limite atteinte
          </Badge>
        )}
      </div>

      {/* ─── Grid ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <RoomsGridSkeleton />
      ) : paginatedChambres.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedChambres.map((chambre) => (
            <RoomCard
              key={chambre.id}
              chambre={chambre}
              onView={() => handleViewRoom(chambre)}
              onEditStatus={() => handleEditStatus(chambre)}
              onEdit={() => handleViewRoom(chambre)}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* ─── Pagination ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* ─── Dialogs ──────────────────────────────────────────────────── */}
      <AddRoomDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddRoom}
      />
      <RoomDetailDialog
        chambre={detailChambre}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      {statusChambre && (
        <EditStatusDialog
          chambre={statusChambre}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onSubmit={handleStatusChange}
        />
      )}
    </div>
  );
}
