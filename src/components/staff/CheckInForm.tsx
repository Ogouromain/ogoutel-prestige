'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

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
import { Separator } from '@/components/ui/separator';
import { authFetch } from '@/lib/api-fetch';
import { cn, formatCFA } from '@/lib/utils';
import { TYPES_CHAMBRES, PIECES_IDENTITE } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────

interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  piece_identite_type?: string;
  piece_identite_numero?: string;
  nationalite: string;
}

interface Chambre {
  id: string;
  numero: string;
  type: string;
  etage: number;
  prix_nuit: number;
  statut: string;
  equipements?: string[];
}

// ─── CheckInForm Component ─────────────────────────────────────────────────

export default function CheckInForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Client
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New client form
  const [newClient, setNewClient] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    piece_identite_type: '',
    piece_identite_numero: '',
    nationalite: '',
  });

  // Step 2: Room selection
  const [availableRooms, setAvailableRooms] = useState<Chambre[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Chambre | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Step 3: Stay details
  const today = new Date().toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState('');
  const [nombrePersonnes, setNombrePersonnes] = useState(1);
  const [montantPaye, setMontantPaye] = useState('');
  const [modePaiement, setModePaiement] = useState('especes');
  const [requetesSpeciales, setRequetesSpeciales] = useState('');
  const [notes, setNotes] = useState('');

  // Calculated values
  const nombreNuits = checkOutDate
    ? Math.max(1, differenceInDays(new Date(checkOutDate), new Date(checkInDate)))
    : 0;
  const montantTotal = selectedRoom ? selectedRoom.prix_nuit * nombreNuits : 0;
  const resteAPayer = montantTotal - (parseFloat(montantPaye) || 0);

  // ── Fetch available rooms ──
  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const res = await authFetch('/api/admin/rooms?statut=disponible&limit=50');
      const json = await res.json();
      if (json.success) {
        setAvailableRooms(json.data.chambres ?? []);
      }
    } catch {
      toast.error('Erreur de chargement des chambres');
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 2 && availableRooms.length === 0) {
      fetchRooms();
    }
  }, [currentStep, fetchRooms, availableRooms.length]);

  // ── Search client by ID ──
  const handleSearchClient = async () => {
    if (!searchId.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/staff/clients?search=${encodeURIComponent(searchId.trim())}`
      );
      const json = await res.json();
      if (json.success && json.data.clients.length > 0) {
        const client = json.data.clients[0];
        setSelectedClient(client);
        setIsNewClient(false);
        toast.success('Client trouvé !');
      } else {
        setSelectedClient(null);
        setIsNewClient(true);
        setNewClient((prev) => ({ ...prev, piece_identite_numero: searchId.trim() }));
        toast('Client non trouvé — remplissez le formulaire', { icon: '📝' });
      }
    } catch {
      toast.error('Erreur de recherche');
    } finally {
      setIsSearching(false);
    }
  };

  // ── Validate step ──
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        if (isNewClient) {
          return (
            newClient.prenom.trim() !== '' &&
            newClient.nom.trim() !== '' &&
            newClient.telephone.trim() !== '' &&
            newClient.piece_identite_numero.trim() !== '' &&
            newClient.nationalite.trim() !== ''
          );
        }
        return selectedClient !== null;
      case 2:
        return selectedRoom !== null;
      case 3:
        return (
          checkInDate !== '' &&
          checkOutDate !== '' &&
          new Date(checkOutDate) > new Date(checkInDate) &&
          nombreNuits > 0
        );
      default:
        return false;
    }
  };

  // ── Submit check-in ──
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let clientId = selectedClient?.id;

      // Create client if new
      if (isNewClient && !clientId) {
        const clientRes = await authFetch('/api/staff/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClient),
        });
        const clientJson = await clientRes.json();
        if (clientJson.success) {
          clientId = clientJson.data.id;
        } else {
          toast.error('Erreur lors de la création du client');
          setIsSubmitting(false);
          return;
        }
      }

      // Create check-in reservation
      const res = await authFetch('/api/staff/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          chambre_id: selectedRoom?.id,
          date_arrivee: checkInDate,
          date_depart: checkOutDate,
          nombre_nuits: nombreNuits,
          nombre_personnes: nombrePersonnes,
          montant_total: montantTotal,
          montant_paye: parseFloat(montantPaye) || 0,
          reste_a_payer: resteAPayer,
          mode_paiement: modePaiement,
          requetes_speciales: requetesSpeciales,
          notes: notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Check-in effectué avec succès ! 🎉');
        // Reset form
        setCurrentStep(1);
        setSelectedClient(null);
        setIsNewClient(false);
        setSearchId('');
        setSelectedRoom(null);
        setCheckOutDate('');
        setMontantPaye('');
        setRequetesSpeciales('');
        setNotes('');
      } else {
        toast.error(json.error || 'Erreur lors du check-in');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Steps labels ──
  const steps = [
    { num: 1, label: 'Client' },
    { num: 2, label: 'Chambre' },
    { num: 3, label: 'Séjour' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Step Indicator ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => {
                if (step.num < currentStep) setCurrentStep(step.num);
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                currentStep === step.num
                  ? 'bg-emerald-600 text-white shadow-md'
                  : currentStep > step.num
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400'
              )}
              disabled={step.num > currentStep}
            >
              {currentStep > step.num ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full border text-xs">
                  {step.num}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-6 sm:w-12',
                  currentStep > step.num ? 'bg-emerald-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Client ─────────────────────────────────────── */}
      {currentStep === 1 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="size-5 text-emerald-600" />
              Rechercher / Créer un Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search by ID */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="id-search">
                  Numéro de pièce d&apos;identité
                </Label>
                <Input
                  id="id-search"
                  placeholder="Ex: CI-12345678"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClient()}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearchClient}
                  disabled={isSearching || !searchId.trim()}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSearching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Existing client found */}
            {selectedClient && !isNewClient && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    Client trouvé
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="text-sm font-medium">
                      {selectedClient.prenom} {selectedClient.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="text-sm font-medium">
                      {selectedClient.telephone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nationalité</p>
                    <p className="text-sm font-medium">
                      {selectedClient.nationalite}
                    </p>
                  </div>
                  {selectedClient.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">
                        {selectedClient.email}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Pièce d&apos;identité</p>
                    <p className="text-sm font-medium">
                      {selectedClient.piece_identite_type || 'N/A'} —{' '}
                      {selectedClient.piece_identite_numero || 'N/A'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSelectedClient(null);
                    setIsNewClient(true);
                    setNewClient((prev) => ({
                      ...prev,
                      piece_identite_numero: searchId.trim(),
                    }));
                  }}
                >
                  <UserPlus className="mr-1 size-4" />
                  Créer un nouveau client plutôt
                </Button>
              </div>
            )}

            {/* New client form */}
            {isNewClient && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <UserPlus className="size-5" />
                  <span className="font-medium">Nouveau client</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={newClient.prenom}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          prenom: e.target.value,
                        }))
                      }
                      placeholder="Prénom"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={newClient.nom}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          nom: e.target.value,
                        }))
                      }
                      placeholder="Nom"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone *</Label>
                    <Input
                      id="telephone"
                      value={newClient.telephone}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          telephone: e.target.value,
                        }))
                      }
                      placeholder="+225 07 XX XX XX XX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="email@exemple.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="piece-type">Type pièce identité</Label>
                    <Select
                      value={newClient.piece_identite_type}
                      onValueChange={(val) =>
                        setNewClient((prev) => ({
                          ...prev,
                          piece_identite_type: val,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PIECES_IDENTITE.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="piece-numero">N° pièce identité *</Label>
                    <Input
                      id="piece-numero"
                      value={newClient.piece_identite_numero}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          piece_identite_numero: e.target.value,
                        }))
                      }
                      placeholder="Numéro de la pièce"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="nationalite">Nationalité *</Label>
                    <Input
                      id="nationalite"
                      value={newClient.nationalite}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          nationalite: e.target.value,
                        }))
                      }
                      placeholder="Ex: Ivoirienne"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canGoNext()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Room Selection ───────────────────────────────── */}
      {currentStep === 2 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BedDouble className="size-5 text-emerald-600" />
              Sélection de la Chambre
            </CardTitle>
            <p className="text-sm text-gray-500">
              Chambres disponibles uniquement
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingRooms ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BedDouble className="mb-3 size-10 text-gray-300" />
                <p className="text-sm text-gray-400">
                  Aucune chambre disponible
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={fetchRooms}
                >
                  Actualiser
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      'flex flex-col rounded-xl border-2 p-4 text-left transition-all',
                      selectedRoom?.id === room.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-800">
                        {room.numero}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-100 text-emerald-700 text-xs"
                      >
                        {TYPES_CHAMBRES.find((t) => t.id === room.type)?.label ||
                          room.type}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Étage {room.etage}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCFA(room.prix_nuit)}/nuit
                      </span>
                    </div>
                    {selectedRoom?.id === room.id && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3" />
                        Sélectionnée
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <Separator />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Précédent
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canGoNext()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Stay Details ─────────────────────────────────── */}
      {currentStep === 3 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-5 text-emerald-600" />
              Détails du Séjour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="checkin-date">Date d&apos;arrivée</Label>
                <Input
                  id="checkin-date"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="checkout-date">Date de départ prévue</Label>
                <Input
                  id="checkout-date"
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nb-personnes">Nombre de personnes</Label>
                <Input
                  id="nb-personnes"
                  type="number"
                  min={1}
                  max={10}
                  value={nombrePersonnes}
                  onChange={(e) =>
                    setNombrePersonnes(parseInt(e.target.value) || 1)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nombre de nuitées</Label>
                <div className="mt-1 flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-bold">
                  {nombreNuits > 0 ? nombreNuits : '—'}
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">
                Résumé financier
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Prix/nuit × {nombreNuits || 0} nuitée(s)
                  </span>
                  <span className="font-medium">
                    {montantTotal > 0 ? formatCFA(montantTotal) : '—'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant total</span>
                  <span className="text-lg font-bold text-gray-800">
                    {montantTotal > 0 ? formatCFA(montantTotal) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="montant-paye">Montant payé</Label>
                <Input
                  id="montant-paye"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={montantPaye}
                  onChange={(e) => setMontantPaye(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="mode-paiement">Mode de paiement</Label>
                <Select
                  value={modePaiement}
                  onValueChange={setModePaiement}
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

            {resteAPayer > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Reste à payer :</span>{' '}
                  {formatCFA(resteAPayer)}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="requetes">Requêtes spéciales</Label>
              <Textarea
                id="requetes"
                value={requetesSpeciales}
                onChange={(e) => setRequetesSpeciales(e.target.value)}
                placeholder="Chambre calme, lit supplémentaire, allergie..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visibles uniquement par le staff..."
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Navigation */}
            <Separator />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Précédent
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!canGoNext()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Confirmation ────────────────────────────────── */}
      {currentStep === 4 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="size-5 text-emerald-600" />
              Confirmation du Check-in
            </CardTitle>
            <p className="text-sm text-gray-500">
              Vérifiez les informations avant de confirmer
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Client Recap */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">
                👤 Client
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Nom :</span>{' '}
                  <span className="font-medium">
                    {isNewClient
                      ? `${newClient.prenom} ${newClient.nom}`
                      : `${selectedClient?.prenom} ${selectedClient?.nom}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Téléphone :</span>{' '}
                  <span className="font-medium">
                    {isNewClient
                      ? newClient.telephone
                      : selectedClient?.telephone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Nationalité :</span>{' '}
                  <span className="font-medium">
                    {isNewClient
                      ? newClient.nationalite
                      : selectedClient?.nationalite}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Pièce :</span>{' '}
                  <span className="font-medium">
                    {isNewClient
                      ? newClient.piece_identite_numero
                      : selectedClient?.piece_identite_numero}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Recap */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">
                🛏️ Chambre
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Numéro :</span>{' '}
                  <span className="font-bold text-lg">
                    {selectedRoom?.numero}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Type :</span>{' '}
                  <span className="font-medium">
                    {TYPES_CHAMBRES.find((t) => t.id === selectedRoom?.type)
                      ?.label || selectedRoom?.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Étage :</span>{' '}
                  <span className="font-medium">{selectedRoom?.etage}</span>
                </div>
              </div>
            </div>

            {/* Stay Recap */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">
                📅 Séjour
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-gray-500">Arrivée :</span>{' '}
                  <span className="font-medium">{checkInDate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Départ :</span>{' '}
                  <span className="font-medium">{checkOutDate}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nuitées :</span>{' '}
                  <span className="font-bold">{nombreNuits}</span>
                </div>
                <div>
                  <span className="text-gray-500">Personnes :</span>{' '}
                  <span className="font-medium">{nombrePersonnes}</span>
                </div>
              </div>
            </div>

            {/* Financial Recap */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-emerald-800">
                💰 Financier
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Montant total</span>
                  <span className="font-bold text-lg">
                    {formatCFA(montantTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Montant payé</span>
                  <span className="font-medium">
                    {formatCFA(parseFloat(montantPaye) || 0)}
                  </span>
                </div>
                {resteAPayer > 0 && (
                  <div className="flex justify-between border-t border-emerald-200 pt-1">
                    <span className="font-semibold text-amber-700">
                      Reste à payer
                    </span>
                    <span className="font-bold text-amber-600">
                      {formatCFA(resteAPayer)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-emerald-700">Mode paiement</span>
                  <span className="font-medium capitalize">
                    {modePaiement === 'especes'
                      ? 'Espèces'
                      : modePaiement === 'mobile_money'
                        ? 'Mobile Money'
                        : modePaiement === 'carte'
                          ? 'Carte bancaire'
                          : modePaiement}
                  </span>
                </div>
              </div>
            </div>

            {requetesSpeciales && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-1 text-sm font-semibold text-blue-800">
                  ✨ Requêtes spéciales
                </h4>
                <p className="text-sm text-blue-700">{requetesSpeciales}</p>
              </div>
            )}

            {/* Navigation */}
            <Separator />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Modifier
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Confirmer le Check-in
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
