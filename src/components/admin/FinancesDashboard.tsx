'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Plus,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formaterPrix } from '@/lib/constants';
import { authFetch } from '@/lib/api-fetch';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FinancesDashboardProps {
  finances: any;
  isLoading: boolean;
  onRefresh: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const CATEGORIES_DEPENSE = [
  'Personnel',
  'Fournitures',
  'Maintenance',
  'Énergie',
  'Communication',
  'Autre',
];

const PIE_COLORS = ['#10B981', '#D4AF37', '#F77F00', '#3B82F6', '#8B5CF6', '#EC4899'];

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  carte: 'Carte bancaire',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function getStatutPaiementBadge(statut: string) {
  const classes: Record<string, string> = {
    en_attente: 'bg-amber-100 text-amber-700 border-amber-200',
    partiel: 'bg-orange-100 text-orange-700 border-orange-200',
    paye: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    partiel: 'Partiel',
    paye: 'Payé',
  };
  return (
    <Badge
      variant="outline"
      className={cn('text-xs', classes[statut] ?? 'bg-gray-100 text-gray-700')}
    >
      {labels[statut] ?? statut}
    </Badge>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function FinanceStatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  suffix,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  suffix?: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                iconBg
              )}
            >
              <span className={iconColor}>{icon}</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
              {formaterPrix(value)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ─── Add Expense Dialog ────────────────────────────────────────────────────────

function AddExpenseDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    categorie: 'Personnel',
    description: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.description.trim() || !form.montant) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      onSubmit({
        categorie: form.categorie,
        description: form.description,
        montant: parseFloat(form.montant),
        date: form.date,
      });
    },
    [form, onSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A0A0A]">Ajouter une dépense</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle dépense pour la période sélectionnée.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie *</Label>
            <Select
              value={form.categorie}
              onValueChange={(v) => setForm((p) => ({ ...p, categorie: v }))}
            >
              <SelectTrigger id="categorie">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES_DEPENSE.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Description de la dépense"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="0"
                min="0"
                value={form.montant}
                onChange={(e) => setForm((p) => ({ ...p, montant: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_depense">Date *</Label>
              <Input
                id="date_depense"
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
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
              {isSubmitting && <RefreshCw className="size-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function FinancesDashboard({
  finances,
  isLoading,
  onRefresh,
}: FinancesDashboardProps) {
  const [periode, setPeriode] = useState<'mois' | 'annee'>('mois');
  const [selectedMois, setSelectedMois] = useState(new Date().getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const revenus = finances?.revenus ?? 0;
  const depenses = finances?.depenses ?? 0;
  const beneficeNet = finances?.benefice_net ?? 0;
  const tauxOccupation = finances?.taux_occupation ?? 0;
  const factures = finances?.factures ?? [];
  const expenses = finances?.depenses_detail ?? [];
  const repartitionPaiement = finances?.repartition_paiement ?? [];

  // Chart data
  const barChartData = useMemo(
    () => [
      { name: 'Revenus', value: revenus, color: '#10B981' },
      { name: 'Dépenses', value: depenses, color: '#EF4444' },
      { name: 'Bénéfice', value: beneficeNet > 0 ? beneficeNet : 0, color: '#3B82F6' },
    ],
    [revenus, depenses, beneficeNet]
  );

  const pieChartData = useMemo(
    () =>
      repartitionPaiement.map((item: any, idx: number) => ({
        name: MODE_PAIEMENT_LABELS[item.mode] ?? item.mode,
        value: item.montant ?? item.count ?? 0,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      })),
    [repartitionPaiement]
  );

  const handleAddExpense = useCallback(
    async (data: any) => {
      setIsSubmittingExpense(true);
      try {
        const res = await authFetch('/api/admin/finances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Dépense ajoutée avec succès');
          setAddExpenseOpen(false);
          onRefresh();
        } else {
          toast.error(json.message || 'Erreur lors de l\'ajout');
        }
      } catch {
        toast.error('Erreur de connexion');
      } finally {
        setIsSubmittingExpense(false);
      }
    },
    [onRefresh]
  );

  const handlePrevMonth = useCallback(() => {
    if (selectedMois === 1) {
      setSelectedMois(12);
      setSelectedAnnee((p) => p - 1);
    } else {
      setSelectedMois((p) => p - 1);
    }
  }, [selectedMois]);

  const handleNextMonth = useCallback(() => {
    if (selectedMois === 12) {
      setSelectedMois(1);
      setSelectedAnnee((p) => p + 1);
    } else {
      setSelectedMois((p) => p + 1);
    }
  }, [selectedMois]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Period selector ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPeriode(periode === 'mois' ? 'annee' : 'mois')}
            className="gap-2"
          >
            <CalendarDays className="size-4" />
            {periode === 'mois' ? 'Vue mensuelle' : 'Vue annuelle'}
          </Button>
        </div>

        {periode === 'mois' && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={handlePrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium text-[#0A0A0A] min-w-[140px] text-center">
              {MOIS_FR[selectedMois - 1]} {selectedAnnee}
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={handleNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Top Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceStatCard
          label="Revenus du mois"
          value={revenus}
          icon={<TrendingUp className="size-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          isLoading={false}
        />
        <FinanceStatCard
          label="Dépenses du mois"
          value={depenses}
          icon={<TrendingDown className="size-5" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          isLoading={false}
        />
        <FinanceStatCard
          label="Bénéfice net"
          value={beneficeNet}
          icon={<DollarSign className="size-5" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          isLoading={false}
        />
        <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                <span className="text-amber-600">
                  <BarChart3 className="size-5" />
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
                {tauxOccupation.toFixed(0)}%
              </p>
              <p className="mt-0.5 text-sm text-gray-500">Taux d&apos;occupation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="revenus" className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="revenus" className="gap-1.5 text-sm">
            <Receipt className="size-4" />
            REVENUS
          </TabsTrigger>
          <TabsTrigger value="depenses" className="gap-1.5 text-sm">
            <Wallet className="size-4" />
            DÉPENSES
          </TabsTrigger>
          <TabsTrigger value="rapport" className="gap-1.5 text-sm">
            <BarChart3 className="size-4" />
            RAPPORT
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Revenus ────────────────────────────────────────────────────── */}
        <TabsContent value="revenus">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                Factures du mois
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {factures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 mb-3">
                    <Receipt className="size-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">Aucune facture pour cette période</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Montant TTC</TableHead>
                        <TableHead>Mode de paiement</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factures.map((facture: any, idx: number) => (
                        <TableRow
                          key={facture.id ?? idx}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(facture.date_facture ?? facture.created_at)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#0A0A0A]">
                            {facture.numero ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#0A0A0A]">
                            {formaterPrix(facture.montant_ttc ?? 0)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {MODE_PAIEMENT_LABELS[facture.mode_paiement] ?? facture.mode_paiement ?? '—'}
                          </TableCell>
                          <TableCell>
                            {getStatutPaiementBadge(facture.statut_paiement ?? 'en_attente')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Dépenses ───────────────────────────────────────────────────── */}
        <TabsContent value="depenses">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Dépenses du mois
                </CardTitle>
                <Button
                  onClick={() => setAddExpenseOpen(true)}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2"
                  size="sm"
                >
                  <Plus className="size-4" />
                  Ajouter dépense
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 mb-3">
                    <Wallet className="size-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">Aucune dépense enregistrée</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((depense: any, idx: number) => (
                        <TableRow
                          key={depense.id ?? idx}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(depense.date ?? depense.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              {depense.categorie ?? '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                            {depense.description ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-red-600">
                            {formaterPrix(depense.montant ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Rapport ────────────────────────────────────────────────────── */}
        <TabsContent value="rapport">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bar chart — Revenus vs Dépenses */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Revenus vs Dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [formaterPrix(value), 'Montant']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie chart — Paiement methods */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Modes de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px]">
                    <p className="text-sm text-gray-400">Aucune donnée disponible</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ percent }) =>
                          percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : null
                        }
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formaterPrix(value),
                          name,
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '13px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-sm text-gray-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card className="rounded-xl border-0 shadow-sm mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                Indicateurs clés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Revenus</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">{formaterPrix(revenus)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Dépenses</p>
                  <p className="mt-1 text-lg font-bold text-red-600">{formaterPrix(depenses)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Bénéfice net</p>
                  <p className={cn('mt-1 text-lg font-bold', beneficeNet >= 0 ? 'text-sky-600' : 'text-red-600')}>
                    {formaterPrix(beneficeNet)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Taux d&apos;occupation</p>
                  <p className="mt-1 text-lg font-bold text-amber-600">{tauxOccupation.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Expense Dialog ────────────────────────────────────────────────── */}
      <AddExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSubmit={handleAddExpense}
        isSubmitting={isSubmittingExpense}
      />
    </div>
  );
}
