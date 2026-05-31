'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Pencil,
  LogIn,
  LogOut,
  XCircle,
  Phone,
  CalendarDays,
  User,
  Bed,
  Building,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  formaterPrix,
  getLibelleStatutReservation,
  getLibelleTypeChambre,
  getLibelleModePaiement,
  STATUTS_RESERVATION,
  MODES_PAIEMENT,
  PIECES_IDENTITE,
} from '@/lib/constants';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { authFetch } from '@/lib/api-fetch';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReservationsListProps {
  reservations: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatReservationDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function calcNuits(checkin: string | null | undefined, checkout: string | null | undefined): number {
  if (!checkin || !checkout) return 0;
  try {
    return Math.max(0, differenceInDays(parseISO(checkout), parseISO(checkin)));
  } catch {
    return 0;
  }
}

function truncateId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const STATUT_BADGE_CLASSES: Record<string, string> = {
  en_attente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmee: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  checkin: 'bg-sky-100 text-sky-800 border-sky-200',
  checkout: 'bg-gray-100 text-gray-800 border-gray-200',
  annulee: 'bg-red-100 text-red-800 border-red-200',
};

const ITEMS_PER_PAGE = 10;

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <CalendarDays className="size-8 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">Aucune réservation trouvée</p>
      <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou créez une réservation</p>
    </motion.div>
  );
}

// ─── Reservation Detail Dialog ────────────────────────────────────────────────

function ReservationDetailDialog({
  reservation,
  open,
  onOpenChange,
}: {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!reservation) return null;

  const nuits = calcNuits(reservation.date_checkin, reservation.date_checkout);
  const reste = (reservation.montant_total || 0) - (reservation.montant_paye || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[#1B4332]" />
            Réservation {truncateId(reservation.id)}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          <div className="space-y-4">
            {/* Statut */}
            <Badge className={cn('border text-xs px-2.5 py-0.5', STATUT_BADGE_CLASSES[reservation.statut] || 'bg-gray-100 text-gray-700')}>
              {getLibelleStatutReservation(reservation.statut)}
            </Badge>

            {/* Client */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User className="size-4" />
                Client
              </h4>
              <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                <p>
                  <span className="text-gray-500">Nom complet :</span>{' '}
                  <span className="font-medium">{reservation.client_nom} {reservation.client_prenom || ''}</span>
                </p>
                {reservation.client_telephone && (
                  <p>
                    <span className="text-gray-500">Téléphone :</span>{' '}
                    <span className="font-medium">{reservation.client_telephone}</span>
                  </p>
                )}
                {reservation.client_email && (
                  <p>
                    <span className="text-gray-500">Email :</span>{' '}
                    <span className="font-medium">{reservation.client_email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Chambre */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Bed className="size-4" />
                Chambre
              </h4>
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium">
                  Chambre {reservation.chambre_numero || '—'} — {getLibelleTypeChambre(reservation.chambre_type)}
                </p>
                {reservation.prix_nuit != null && (
                  <p className="text-gray-500 text-xs mt-1">{formaterPrix(reservation.prix_nuit)}/nuit</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CalendarDays className="size-4" />
                Dates
              </h4>
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 text-sm">
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p className="font-medium">{formatReservationDate(reservation.date_checkin)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p className="font-medium">{formatReservationDate(reservation.date_checkout)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nuits</p>
                  <p className="font-medium">{nuits}</p>
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard className="size-4" />
                Paiement
              </h4>
              <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                <p>
                  <span className="text-gray-500">Montant total :</span>{' '}
                  <span className="font-semibold">{formaterPrix(reservation.montant_total || 0)}</span>
                </p>
                <p>
                  <span className="text-gray-500">Montant payé :</span>{' '}
                  <span className="font-semibold text-emerald-600">{formaterPrix(reservation.montant_paye || 0)}</span>
                </p>
                <p>
                  <span className="text-gray-500">Reste à payer :</span>{' '}
                  <span className={cn('font-semibold', reste > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {formaterPrix(reste)}
                  </span>
                </p>
                {reservation.mode_paiement && (
                  <p>
                    <span className="text-gray-500">Mode :</span>{' '}
                    <span className="font-medium">{getLibelleModePaiement(reservation.mode_paiement)}</span>
                  </p>
                )}
              </div>
            </div>

            {reservation.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-700 mt-1">{reservation.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Reservation Dialog ────────────────────────────────────────────────────

interface NewReservationForm {
  // Client
  client_nom: string;
  client_prenom: string;
  client_telephone: string;
  client_email: string;
  client_nationalite: string;
  client_piece_identite: string;
  // Chambre
  chambre_id: string;
  // Dates & Paiement
  date_checkin: string;
  date_checkout: string;
  montant_paye: string;
  mode_paiement: string;
  notes: string;
}

function NewReservationDialog({
  open,
  onOpenChange,
  onSubmit,
  chambresDisponibles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  chambresDisponibles: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewReservationForm>({
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    client_nationalite: '',
    client_piece_identite: '',
    chambre_id: '',
    date_checkin: '',
    date_checkout: '',
    montant_paye: '',
    mode_paiement: '',
    notes: '',
  });

  const updateField = useCallback((field: keyof NewReservationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectedChambre = chambresDisponibles.find((c) => c.id === form.chambre_id);
  const nuits = calcNuits(form.date_checkin, form.date_checkout);
  const montantTotal = selectedChambre ? selectedChambre.prix_nuit * nuits : 0;
  const reste = montantTotal - Number(form.montant_paye || 0);

  const handleSubmit = async () => {
    if (!form.client_nom.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }
    if (!form.chambre_id) {
      toast.error('Veuillez sélectionner une chambre');
      return;
    }
    if (!form.date_checkin || !form.date_checkout) {
      toast.error('Les dates de check-in et check-out sont requises');
      return;
    }
    if (nuits <= 0) {
      toast.error('Les dates sont invalides');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        client_nom: form.client_nom.trim(),
        client_prenom: form.client_prenom.trim(),
        client_telephone: form.client_telephone.trim(),
        client_email: form.client_email.trim(),
        client_nationalite: form.client_nationalite.trim(),
        client_piece_identite: form.client_piece_identite,
        chambre_id: form.chambre_id,
        date_checkin: form.date_checkin,
        date_checkout: form.date_checkout,
        montant_total: montantTotal,
        montant_paye: Number(form.montant_paye || 0),
        mode_paiement: form.mode_paiement,
        notes: form.notes.trim(),
      });
      toast.success('Réservation créée avec succès');
      setForm({
        client_nom: '', client_prenom: '', client_telephone: '', client_email: '',
        client_nationalite: '', client_piece_identite: '', chambre_id: '',
        date_checkin: '', date_checkout: '', montant_paye: '', mode_paiement: '', notes: '',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la création de la réservation");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof NewReservationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    updateField(field, e.target.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-[#1B4332]" />
            Nouvelle réservation
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="client" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="client" className="flex-1">Client</TabsTrigger>
            <TabsTrigger value="chambre" className="flex-1">Chambre</TabsTrigger>
            <TabsTrigger value="dates" className="flex-1">Dates & Paiement</TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input placeholder="Nom du client" value={form.client_nom} onChange={update('client_nom')} />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input placeholder="Prénom" value={form.client_prenom} onChange={update('client_prenom')} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="+225 XX XX XX XX" value={form.client_telephone} onChange={update('client_telephone')} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@exemple.com" value={form.client_email} onChange={update('client_email')} />
              </div>
              <div className="space-y-2">
                <Label>Nationalité</Label>
                <Input placeholder="Ivoirienne" value={form.client_nationalite} onChange={update('client_nationalite')} />
              </div>
              <div className="space-y-2">
                <Label>Pièce d'identité</Label>
                <Select value={form.client_piece_identite} onValueChange={(v) => updateField('client_piece_identite', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIECES_IDENTITE.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chambre" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Chambre disponible *</Label>
              <Select value={form.chambre_id} onValueChange={(v) => updateField('chambre_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une chambre" />
                </SelectTrigger>
                <SelectContent>
                  {chambresDisponibles.length > 0 ? (
                    chambresDisponibles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        Chambre {c.numero} — {getLibelleTypeChambre(c.type)} — {formaterPrix(c.prix_nuit)}/nuit
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>Aucune chambre disponible</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedChambre && (
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-4 text-sm space-y-1">
                  <p><span className="text-gray-500">Chambre :</span> <span className="font-medium">{selectedChambre.numero}</span></p>
                  <p><span className="text-gray-500">Type :</span> <span className="font-medium">{getLibelleTypeChambre(selectedChambre.type)}</span></p>
                  <p><span className="text-gray-500">Étage :</span> <span className="font-medium">{selectedChambre.etage || '—'}</span></p>
                  <p><span className="text-gray-500">Prix / nuit :</span> <span className="font-semibold text-[#D4AF37]">{formaterPrix(selectedChambre.prix_nuit)}</span></p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dates" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de check-in *</Label>
                <Input
                  type="date"
                  value={form.date_checkin}
                  onChange={update('date_checkin')}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de check-out *</Label>
                <Input
                  type="date"
                  value={form.date_checkout}
                  onChange={update('date_checkout')}
                />
              </div>
            </div>

            {nuits > 0 && (
              <Card className="border-0 bg-[#D4AF37]/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Nombre de nuits</p>
                      <p className="text-lg font-bold">{nuits}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Montant total</p>
                      <p className="text-lg font-bold text-[#D4AF37]">{formaterPrix(montantTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant payé (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={form.montant_paye}
                  onChange={update('montant_paye')}
                />
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={form.mode_paiement} onValueChange={(v) => updateField('mode_paiement', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_PAIEMENT.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {montantTotal > 0 && (
              <p className="text-sm">
                <span className="text-gray-500">Reste à payer : </span>
                <span className={cn('font-semibold', reste > 0 ? 'text-red-600' : 'text-emerald-600')}>
                  {formaterPrix(Math.max(0, reste))}
                </span>
              </p>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Notes supplémentaires..." value={form.notes} onChange={update('notes')} rows={2} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#1B4332] hover:bg-[#1B4332]/90">
            {loading ? 'Création en cours...' : 'Créer la réservation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel Confirmation Dialog ────────────────────────────────────────────────

function CancelConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  reservationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
  reservationId: string | null;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      await onConfirm(reservationId);
      toast.success('Réservation annulée avec succès');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La chambre sera libérée et la réservation marquée comme annulée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Non, garder</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Annulation...' : 'Oui, annuler'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReservationsList({ reservations, isLoading, onRefresh }: ReservationsListProps) {
  // Filters
  const [statutFilter, setStatutFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [newResDialogOpen, setNewResDialogOpen] = useState(false);
  const [detailReservation, setDetailReservation] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Filtered
  const filteredReservations = useMemo(() => {
    let result = [...reservations];
    if (statutFilter !== 'all') {
      result = result.filter((r) => r.statut === statutFilter);
    }
    if (dateFrom) {
      result = result.filter((r) => r.date_checkin >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((r) => r.date_checkin <= dateTo);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.client_nom || '').toLowerCase().includes(q) ||
          (r.client_prenom || '').toLowerCase().includes(q) ||
          (r.chambre_numero || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [reservations, statutFilter, dateFrom, dateTo, search]);

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedReservations = filteredReservations.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Available rooms (statut = disponible) for new reservation dialog
  const chambresDisponibles = useMemo(() => {
    return reservations
      .filter((r) => r.chambre_statut === 'disponible' || r.statut === 'disponible')
      .reduce((acc: any[], r) => {
        if (r.chambre_id && !acc.find((c) => c.id === r.chambre_id)) {
          acc.push({
            id: r.chambre_id,
            numero: r.chambre_numero,
            type: r.chambre_type,
            etage: r.chambre_etage,
            prix_nuit: r.prix_nuit || 0,
          });
        }
        return acc;
      }, []);
  }, [reservations]);

  const handleStatutFilter = useCallback((v: string) => {
    setStatutFilter(v);
    setPage(1);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleDateFrom = useCallback((v: string) => {
    setDateFrom(v);
    setPage(1);
  }, []);

  const handleDateTo = useCallback((v: string) => {
    setDateTo(v);
    setPage(1);
  }, []);

  // API actions
  const handleAction = useCallback(async (id: string, statut: string, label: string) => {
    try {
      const res = await authFetch('/api/admin/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur');
      }
      toast.success(label);
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'action');
    }
  }, [onRefresh]);

  const handleCheckin = useCallback((id: string) =>
    handleAction(id, 'checkin', 'Check-in effectué avec succès'), [handleAction]);

  const handleCheckout = useCallback((id: string) =>
    handleAction(id, 'checkout', 'Check-out effectué avec succès'), [handleAction]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      const res = await authFetch('/api/admin/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut: 'annulee' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur');
      }
      toast.success('Réservation annulée avec succès');
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'annulation");
    }
  }, [onRefresh]);

  const handleNewReservation = useCallback(async (data: any) => {
    const res = await authFetch('/api/admin/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erreur lors de la création");
    }
    onRefresh();
  }, [onRefresh]);

  const handleViewDetail = useCallback((r: any) => {
    setDetailReservation(r);
    setDetailDialogOpen(true);
  }, []);

  const handleOpenCancel = useCallback((r: any) => {
    setCancelReservationId(r.id);
    setCancelDialogOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* ─── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        <div className="relative flex-1 w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Rechercher par client ou chambre..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statutFilter} onValueChange={handleStatutFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUTS_RESERVATION.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFrom(e.target.value)}
            className="w-[150px]"
            placeholder="Du"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            className="w-[150px]"
            placeholder="Au"
          />

          <Button variant="outline" size="icon" onClick={onRefresh} title="Actualiser">
            <RefreshCw className="size-4" />
          </Button>

          <Button
            onClick={() => setNewResDialogOpen(true)}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
          >
            <Plus className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Nouvelle réservation</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      {/* ─── Table ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : paginatedReservations.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="w-[70px]">N°</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Chambre</TableHead>
                      <TableHead className="hidden lg:table-cell">Check-in</TableHead>
                      <TableHead className="hidden lg:table-cell">Check-out</TableHead>
                      <TableHead className="text-center">Nuits</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Reste</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReservations.map((r: any) => {
                      const nuits = calcNuits(r.date_checkin, r.date_checkout);
                      const reste = (r.montant_total || 0) - (r.montant_paye || 0);
                      const payeTotal = reste <= 0;

                      return (
                        <TableRow key={r.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-mono text-xs text-gray-400">
                            {truncateId(r.id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {r.client_nom} {r.client_prenom || ''}
                                </p>
                                {r.client_telephone && (
                                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <Phone className="size-3" />
                                    {r.client_telephone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{r.chambre_numero || '—'}</p>
                            <p className="text-[11px] text-gray-400">
                              {getLibelleTypeChambre(r.chambre_type)}
                            </p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {formatReservationDate(r.date_checkin)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {formatReservationDate(r.date_checkout)}
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {nuits}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formaterPrix(r.montant_total || 0)}
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-sm font-medium', payeTotal ? 'text-emerald-600' : 'text-[#F77F00]')}>
                              {formaterPrix(r.montant_paye || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-sm font-medium', reste > 0 ? 'text-red-600' : 'text-emerald-600')}>
                              {formaterPrix(reste)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('border text-[10px] px-1.5 py-0', STATUT_BADGE_CLASSES[r.statut] || 'bg-gray-100 text-gray-700')}>
                              {getLibelleStatutReservation(r.statut)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(r)}>
                                  <Eye className="size-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {r.statut === 'confirmee' && (
                                  <DropdownMenuItem onClick={() => handleCheckin(r.id)}>
                                    <LogIn className="size-4 mr-2" />
                                    Check-in
                                  </DropdownMenuItem>
                                )}
                                {r.statut === 'checkin' && (
                                  <DropdownMenuItem onClick={() => handleCheckout(r.id)}>
                                    <LogOut className="size-4 mr-2" />
                                    Check-out
                                  </DropdownMenuItem>
                                )}
                                {r.statut !== 'checkout' && r.statut !== 'annulee' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleOpenCancel(r)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="size-4 mr-2" />
                                      Annuler
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedReservations.map((r: any) => {
                  const nuits = calcNuits(r.date_checkin, r.date_checkout);
                  const reste = (r.montant_total || 0) - (r.montant_paye || 0);

                  return (
                    <div key={r.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {r.client_nom} {r.client_prenom || ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            Chambre {r.chambre_numero || '—'} &middot; {nuits} nuit{nuits > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge className={cn('border text-[10px] px-1.5 py-0', STATUT_BADGE_CLASSES[r.statut] || 'bg-gray-100 text-gray-700')}>
                          {getLibelleStatutReservation(r.statut)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatReservationDate(r.date_checkin)} → {formatReservationDate(r.date_checkout)}
                        </span>
                        <span className="font-semibold text-[#D4AF37]">{formaterPrix(r.montant_total || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs">
                          <span className="text-emerald-600 font-medium">Payé: {formaterPrix(r.montant_paye || 0)}</span>
                          <span className={cn('font-medium', reste > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            Reste: {formaterPrix(reste)}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(r)}>
                              <Eye className="size-4 mr-2" />Voir détails
                            </DropdownMenuItem>
                            {r.statut === 'confirmee' && (
                              <DropdownMenuItem onClick={() => handleCheckin(r.id)}>
                                <LogIn className="size-4 mr-2" />Check-in
                              </DropdownMenuItem>
                            )}
                            {r.statut === 'checkin' && (
                              <DropdownMenuItem onClick={() => handleCheckout(r.id)}>
                                <LogOut className="size-4 mr-2" />Check-out
                              </DropdownMenuItem>
                            )}
                            {r.statut !== 'checkout' && r.statut !== 'annulee' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenCancel(r)} className="text-red-600 focus:text-red-600">
                                  <XCircle className="size-4 mr-2" />Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Pagination ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
      <ReservationDetailDialog
        reservation={detailReservation}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <NewReservationDialog
        open={newResDialogOpen}
        onOpenChange={setNewResDialogOpen}
        onSubmit={handleNewReservation}
        chambresDisponibles={chambresDisponibles}
      />

      <CancelConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancel}
        reservationId={cancelReservationId}
      />
    </div>
  );
}
