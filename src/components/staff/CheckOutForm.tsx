'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Search,
  CreditCard,
  CheckCircle2,
  Loader2,
  BedDouble,
  User,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { authFetch } from '@/lib/api-fetch';
import { cn, formatCFA } from '@/lib/utils';
import { TYPES_CHAMBRES } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────

interface SejourActif {
  id: string;
  chambre_id: string;
  client_id: string;
  date_arrivee: string;
  date_depart: string;
  nombre_nuits: number;
  prix_nuit: number;
  montant_total: number;
  montant_paye: number;
  statut: string;
  notes: string | null;
  client: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  chambre: {
    numero: string;
    type: string;
    prix_nuit: number;
  };
}

// ─── Checkout Modal ───────────────────────────────────────────────────────

function CheckoutModal({
  sejour,
  open,
  onClose,
  onConfirm,
}: {
  sejour: SejourActif | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    montant_paye_final: number;
    mode_paiement_final: string;
    notes: string;
  }) => void;
}) {
  const [montantPayeFinal, setMontantPayeFinal] = useState('');
  const [modePaiementFinal, setModePaiementFinal] = useState('especes');
  const [notes, setNotes] = useState(sejour?.notes || '');

  const resteAPayer = sejour
    ? sejour.montant_total - sejour.montant_paye
    : 0;

  if (!sejour) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LogOut className="size-5 text-amber-600" />
            Check-out — Chambre {sejour.chambre.numero}
          </DialogTitle>
          <DialogDescription>
            Confirmez le départ de {sejour.client.prenom} {sejour.client.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Récapitulatif */}
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <BedDouble className="size-3 text-gray-400" />
                <span className="text-gray-500">Chambre :</span>{' '}
                <span className="font-medium">{sejour.chambre.numero}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="size-3 text-gray-400" />
                <span className="text-gray-500">Client :</span>{' '}
                <span className="font-medium">
                  {sejour.client.prenom} {sejour.client.nom}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="size-3 text-gray-400" />
                <span className="text-gray-500">Arrivée :</span>{' '}
                <span className="font-medium">{sejour.date_arrivee}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="size-3 text-gray-400" />
                <span className="text-gray-500">Jours :</span>{' '}
                <span className="font-medium">{sejour.nombre_nuits} nuitée(s)</span>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700">Total</span>
                <span className="font-bold">{formatCFA(sejour.montant_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Déjà payé</span>
                <span className="font-medium">{formatCFA(sejour.montant_paye)}</span>
              </div>
              <Separator className="bg-amber-200" />
              <div className="flex justify-between">
                <span className="font-semibold text-amber-800">Reste à payer</span>
                <span className="font-bold text-lg text-amber-700">
                  {formatCFA(resteAPayer)}
                </span>
              </div>
            </div>
          </div>

          {/* Final payment form if remaining */}
          {resteAPayer > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Paiement final
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    min={0}
                    max={resteAPayer}
                    placeholder="0"
                    value={montantPayeFinal}
                    onChange={(e) => setMontantPayeFinal(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Mode paiement</Label>
                  <Select
                    value={modePaiementFinal}
                    onValueChange={setModePaiementFinal}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                      <SelectItem value="virement">Virement bancaire</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur le départ..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                montant_paye_final: parseFloat(montantPayeFinal) || 0,
                mode_paiement_final: modePaiementFinal,
                notes,
              })
            }
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <CheckCircle2 className="size-4" />
            Confirmer le départ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main CheckOutForm Component ─────────────────────────────────────────

export default function CheckOutForm() {
  const [sejours, setSejours] = useState<SejourActif[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSejour, setSelectedSejour] = useState<SejourActif | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSejours = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`/api/staff/checkout${params}`);
      const json = await res.json();
      if (json.success) {
        setSejours(json.data.sejours ?? []);
      }
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSejours();
  }, [fetchSejours]);

  const handleCheckout = async (data: {
    montant_paye_final: number;
    mode_paiement_final: string;
    notes: string;
  }) => {
    if (!selectedSejour) return;
    setIsProcessing(true);
    try {
      const res = await authFetch('/api/staff/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedSejour.id,
          ...data,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Check-out effectué avec succès ! 🎉');
        setModalOpen(false);
        setSelectedSejour(null);
        fetchSejours();
      } else {
        toast.error(json.error || 'Erreur lors du check-out');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsProcessing(false);
    }
  };

  const openCheckoutModal = (sejour: SejourActif) => {
    setSelectedSejour(sejour);
    setModalOpen(true);
  };

  const resteAPayer = (sejour: SejourActif) =>
    sejour.montant_total - sejour.montant_paye;

  return (
    <>
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par n° chambre ou nom client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active stays list */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : sejours.length === 0 ? (
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <LogOut className="mb-3 size-10 text-gray-300" />
              <p className="text-sm text-gray-400">
                {search
                  ? 'Aucun séjour trouvé pour cette recherche'
                  : 'Aucun séjour en cours'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sejours.map((sejour) => {
              const reste = resteAPayer(sejour);
              return (
                <Card
                  key={sejour.id}
                  className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    {/* Room + Client header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <BedDouble className="size-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-800">
                            Ch. {sejour.chambre.numero}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sejour.client.prenom} {sejour.client.nom}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                      >
                        En cours
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    {/* Details */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Arrivée</span>
                        <span className="font-medium">
                          {sejour.date_arrivee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jours séjour</span>
                        <span className="font-medium">
                          {sejour.nombre_nuits} nuitée(s)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-medium">
                          {formatCFA(sejour.montant_total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payé</span>
                        <span className="font-medium text-emerald-600">
                          {formatCFA(sejour.montant_paye)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reste</span>
                        <span
                          className={cn(
                            'font-bold',
                            reste > 0 ? 'text-amber-600' : 'text-emerald-600'
                          )}
                        >
                          {reste > 0 ? formatCFA(reste) : 'Soldé'}
                        </span>
                      </div>
                    </div>

                    {/* Checkout button */}
                    <Button
                      onClick={() => openCheckoutModal(sejour)}
                      className="mt-3 w-full gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <LogOut className="size-4" />
                      Check-out
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal — key forces remount when sejour changes */}
      <CheckoutModal
        key={selectedSejour?.id || 'none'}
        sejour={selectedSejour}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleCheckout}
      />
    </>
  );
}
