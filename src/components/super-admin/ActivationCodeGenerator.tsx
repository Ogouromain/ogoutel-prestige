'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Key,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Ban,
  Plus,
  Check,
  Filter,
  Sparkles,
  Building,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
import type { CodeAcces, AbonnementDemande } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ActivationCodeGeneratorProps {
  codes: CodeAcces[];
  pendingRequests: AbonnementDemande[];
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

type CodeFilter = 'tous' | 'non_utilise' | 'utilise' | 'expire';

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

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getCodeStatus(code: CodeAcces): 'non_utilise' | 'utilise' | 'expire' {
  if (code.est_utilise) return 'utilise';
  if (isExpired(code.date_expiration)) return 'expire';
  return 'non_utilise';
}

// ─── Code Status Badge ─────────────────────────────────────────────────────────

function CodeStatusBadge({ code }: { code: CodeAcces }) {
  const status = getCodeStatus(code);

  switch (status) {
    case 'non_utilise':
      return (
        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
          Non utilisé
        </Badge>
      );
    case 'utilise':
      return (
        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 border-gray-200">
          Utilisé
        </Badge>
      );
    case 'expire':
      return (
        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
          Expiré
        </Badge>
      );
  }
}

// ─── Generate Code Dialog ──────────────────────────────────────────────────────

function GenerateCodeDialog({
  open,
  onClose,
  pendingRequests,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  pendingRequests: AbonnementDemande[];
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<'demande' | 'manual'>('demande');
  const [selectedDemandeId, setSelectedDemandeId] = useState('');
  const [manualPlan, setManualPlan] = useState<PlanId>('basique');
  const [manualEmail, setManualEmail] = useState('');
  const [manualHotel, setManualHotel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const selectedDemande = pendingRequests.find((d) => d.id === selectedDemandeId);

  const resetForm = useCallback(() => {
    setMode('demande');
    setSelectedDemandeId('');
    setManualPlan('basique');
    setManualEmail('');
    setManualHotel('');
    setGeneratedCode(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const effectiveEmail = mode === 'demande' && selectedDemande
    ? selectedDemande.email
    : manualEmail;

  const effectiveHotel = mode === 'demande' && selectedDemande
    ? selectedDemande.nom_hotel
    : manualHotel;

  const effectivePlan = mode === 'demande' && selectedDemande
    ? selectedDemande.plan_choisi
    : manualPlan;

  const canSubmit = effectiveEmail && effectiveHotel && effectivePlan;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        email: effectiveEmail,
        nom_hotel: effectiveHotel,
        plan: effectivePlan,
      };

      if (mode === 'demande' && selectedDemandeId) {
        body.demande_id = selectedDemandeId;
      }

      const res = await fetch('/api/super-admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const code = data.data?.code ?? data.code ?? 'CODE-GENERE';
      setGeneratedCode(code);
      toast.success(`Code d'activation généré avec succès !`);
      onSuccess();
    } catch {
      toast.error("Erreur lors de la génération du code");
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, effectiveEmail, effectiveHotel, effectivePlan, mode, selectedDemandeId, onSuccess]);

  const handleCopyCode = useCallback(() => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copié dans le presse-papier');
    }
  }, [generatedCode]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5 text-[#D4AF37]" />
            Générer un code d&apos;activation
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau code d&apos;activation pour un hôtel
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {generatedCode ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 py-4"
            >
              <div className="flex flex-col items-center text-center py-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <Check className="size-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#0A0A0A]">Code généré avec succès !</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Envoyé à {effectiveEmail}
                </p>

                <div className="mt-6 flex items-center gap-3 rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 px-6 py-4">
                  <code className="text-2xl font-mono font-bold tracking-wider text-[#D4AF37]">
                    {generatedCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Mode Toggle */}
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setMode('demande')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    mode === 'demande'
                      ? 'bg-white text-[#0A0A0A] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Demande existante
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    mode === 'manual'
                      ? 'bg-white text-[#0A0A0A] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Saisie manuelle
                </button>
              </div>

              {mode === 'demande' ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Demande payée</Label>
                    <Select value={selectedDemandeId} onValueChange={setSelectedDemandeId}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Sélectionner une demande..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingRequests.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            Aucune demande payée
                          </SelectItem>
                        ) : (
                          pendingRequests.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.nom_hotel} — {d.nom_complet}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto-filled preview */}
                  {selectedDemande && (
                    <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                      <PreviewRow label="Plan" value={PLANS_ABONNEMENT[selectedDemande.plan_choisi]?.nom ?? ''} />
                      <PreviewRow label="Email" value={selectedDemande.email} />
                      <PreviewRow label="Hôtel" value={selectedDemande.nom_hotel} />
                      <PreviewRow label="Ville" value={selectedDemande.ville} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Plan</Label>
                    <Select value={manualPlan} onValueChange={(v) => setManualPlan(v as PlanId)}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PLANS_ABONNEMENT) as PlanId[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PLANS_ABONNEMENT[p].nom} — {formaterPrix(PLANS_ABONNEMENT[p].prix)}/mois
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Email du destinataire</Label>
                    <Input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="hotel@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Nom de l&apos;hôtel</Label>
                    <Input
                      value={manualHotel}
                      onChange={(e) => setManualHotel(e.target.value)}
                      placeholder="Nom de l'hôtel"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {effectiveHotel && (
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                  <p className="text-xs font-medium text-[#D4AF37] mb-2">
                    <Sparkles className="inline size-3 mr-1" />
                    Aperçu du code
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Plan:</span>
                    <span className="font-medium">{PLANS_ABONNEMENT[effectivePlan]?.nom}</span>
                    <span className="text-gray-500">Hôtel:</span>
                    <span className="font-medium">{effectiveHotel}</span>
                    <span className="text-gray-500">Destinataire:</span>
                    <span className="font-medium text-xs truncate">{effectiveEmail}</span>
                    <span className="text-gray-500">Prix:</span>
                    <span className="font-medium">{formaterPrix(PLANS_ABONNEMENT[effectivePlan]?.prix ?? 0)}/mois</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {generatedCode ? (
            <Button onClick={handleClose} variant="outline">
              Fermer
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} variant="outline">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Générer et Envoyer
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#0A0A0A] truncate ml-4">{value}</span>
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
        <Key className="size-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-[#0A0A0A]">Aucun code trouvé</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">
        Aucun code d&apos;activation ne correspond à vos critères de recherche.
      </p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ActivationCodeGenerator({
  codes,
  pendingRequests,
  isLoading,
  onUpdate,
}: ActivationCodeGeneratorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CodeFilter>('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered data
  const filteredCodes = useMemo(() => {
    let result = codes;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.nom_hotel.toLowerCase().includes(q) ||
          c.email_destinataire.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'tous') {
      result = result.filter((c) => getCodeStatus(c) === statusFilter);
    }

    return result;
  }, [codes, debouncedSearch, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE);
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCodes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCodes, currentPage]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papier');
  }, []);

  const handleResendEmail = useCallback(
    async (code: CodeAcces) => {
      try {
        const res = await fetch('/api/super-admin/codes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resend',
            code_id: code.id,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Code renvoyé à ${code.email_destinataire}`);
      } catch {
        toast.error("Erreur lors du renvoi de l'email");
      }
    },
    []
  );

  const handleRevokeCode = useCallback(
    async (code: CodeAcces) => {
      if (code.est_utilise) {
        toast.error('Impossible de révoquer un code déjà utilisé');
        return;
      }
      try {
        const res = await fetch('/api/super-admin/codes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'revoke',
            code_id: code.id,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Code ${code.code} révoqué`);
        onUpdate?.();
      } catch {
        toast.error('Erreur lors de la révocation du code');
      }
    },
    [onUpdate]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <div className="space-y-4">
        {/* Header + Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par code, hôtel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v as CodeFilter); setCurrentPage(1); }}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="size-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="non_utilise">Non utilisé</SelectItem>
                <SelectItem value="utilise">Utilisé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setGenerateOpen(true)}
            className="gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white shrink-0"
          >
            <Plus className="size-4" />
            Générer un nouveau code
          </Button>
        </motion.div>

        {/* Table */}
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredCodes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Hôtel</TableHead>
                      <TableHead className="hidden md:table-cell">Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden sm:table-cell">Créé le</TableHead>
                      <TableHead className="hidden lg:table-cell">Expiration</TableHead>
                      <TableHead className="hidden lg:table-cell">Utilisé le</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedCodes.map((code, idx) => {
                        const expired = isExpired(code.date_expiration);
                        return (
                          <motion.tr
                            key={code.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider text-[#0A0A0A]">
                                  {code.code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 shrink-0"
                                  onClick={() => handleCopyCode(code.code)}
                                  title="Copier"
                                >
                                  <Copy className="size-3 text-gray-400" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-[#0A0A0A] text-sm">{code.nom_hotel}</p>
                                <p className="text-xs text-gray-400">{code.email_destinataire}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {getPlanBadge(code.plan)}
                            </TableCell>
                            <TableCell>
                              <CodeStatusBadge code={code} />
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 hidden sm:table-cell whitespace-nowrap">
                              {formatDate(code.created_at)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span
                                className={cn(
                                  'text-sm whitespace-nowrap',
                                  expired && !code.est_utilise
                                    ? 'text-red-600 font-medium'
                                    : 'text-gray-500'
                                )}
                              >
                                {formatDate(code.date_expiration)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                              {code.used_at ? formatDate(code.used_at) : '—'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <ChevronRight className="size-4 rotate-90" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleCopyCode(code.code)}>
                                    <Copy className="size-4 mr-2" />
                                    Copier le code
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleResendEmail(code)}>
                                    <Mail className="size-4 mr-2" />
                                    Renvoyer par email
                                  </DropdownMenuItem>
                                  {!code.est_utilise && (
                                    <DropdownMenuItem
                                      onClick={() => handleRevokeCode(code)}
                                      className="text-red-600"
                                    >
                                      <Ban className="size-4 mr-2" />
                                      Révoquer
                                    </DropdownMenuItem>
                                  )}
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
              {filteredCodes.length} code{filteredCodes.length > 1 ? 's' : ''}
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

      {/* Generate Code Dialog */}
      <GenerateCodeDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        pendingRequests={pendingRequests}
        onSuccess={() => onUpdate?.()}
      />
    </>
  );
}
