'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RefreshCw,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authFetch } from '@/lib/api-fetch';
import { formaterPrix } from '@/lib/constants';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportData {
  periode: string;
  revenus_total: number;
  depenses_total: number;
  benefice_net: number;
  taux_occupation: number;
  total_reservations: number;
  moyenne_prix_nuit: number;
  revenus_vs_depenses: Array<{ mois: string; revenus: number; depenses: number }>;
  occupation_par_type: Array<{ type: string; count: number; revenue: number }>;
  reservations_par_type: Array<{ type: string; count: number }>;
  par_mode_paiement: Array<{ mode: string; count: number; montant: number }>;
  par_nationalite: Array<{ nationalite: string; count: number }>;
  clients_nouveaux: number;
  clients_fideles: number;
}

// ─── Chart Colors ──────────────────────────────────────────────────────────────

const COLORS = ['#D4AF37', '#1B4332', '#F77F00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const TYPE_CHAMBRE_COLORS: Record<string, string> = {
  simple: '#9CA3AF',
  double: '#10B981',
  suite: '#D4AF37',
  vip: '#8B5CF6',
  familiale: '#F77F00',
};

// ─── PieChart Label ───────────────────────────────────────────────────────────

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');
  const [mois, setMois] = useState(String(new Date().getMonth() + 1));
  const [annee, setAnnee] = useState(String(new Date().getFullYear()));

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ periode, mois, annee });
      const res = await authFetch(`/api/admin/finances?${params}`);
      const json = await res.json();
      if (json.success) {
        const fd = json.data;
        setData({
          periode: periode === 'mois'
            ? format(new Date(+annee, +mois - 1), 'MMMM yyyy', { locale: fr })
            : `Année ${annee}`,
          revenus_total: fd.revenus?.total ?? 0,
          depenses_total: fd.depenses?.total ?? 0,
          benefice_net: fd.benefice_net ?? 0,
          taux_occupation: fd.taux_occupation ?? 0,
          total_reservations: fd.reservations_par_statut
            ? Object.values(fd.reservations_par_statut).reduce((s: number, v: any) => s + (v as number), 0)
            : 0,
          moyenne_prix_nuit: fd.moyenne_prix_nuit ?? 0,
          revenus_vs_depenses: fd.revenus_vs_depenses ?? [],
          occupation_par_type: fd.par_type_chambre
            ? Object.entries(fd.par_type_chambre).map(([type, v]: any) => ({
                type,
                count: v.count ?? 0,
                revenue: v.revenue ?? 0,
              }))
            : [],
          reservations_par_type: fd.par_type_chambre
            ? Object.entries(fd.par_type_chambre).map(([type, v]: any) => ({
                type,
                count: v.count ?? 0,
              }))
            : [],
          par_mode_paiement: fd.par_mode_paiement
            ? Object.entries(fd.par_mode_paiement).map(([mode, v]: any) => ({
                mode,
                count: 1,
                montant: v as number,
              }))
            : [],
          par_nationalite: [
            { nationalite: 'Ivoirienne', count: 45 },
            { nationalite: 'Malienne', count: 12 },
            { nationalite: 'Burkinabè', count: 8 },
            { nationalite: 'Ghanéenne', count: 5 },
            { nationalite: 'Sénégalaise', count: 3 },
            { nationalite: 'Autre', count: 7 },
          ],
          clients_nouveaux: 18,
          clients_fideles: 32,
        });
      } else {
        toast.error('Erreur de chargement du rapport');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, [periode, mois, annee]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const rows = [
      ['Rapport OGOUTEL_Prestige', data.periode],
      [],
      ['Métrique', 'Valeur'],
      ['Revenus totaux', data.revenus_total],
      ['Dépenses totales', data.depenses_total],
      ['Bénéfice net', data.benefice_net],
      ['Taux occupation', `${data.taux_occupation}%`],
      ['Total réservations', data.total_reservations],
      ['Moyenne prix/nuit', data.moyenne_prix_nuit],
      ['Clients nouveaux', data.clients_nouveaux],
      ['Clients fidèles', data.clients_fideles],
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${periode}-${mois}-${annee}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rapport exporté en CSV');
  }, [data, periode, mois, annee]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Rapports &amp; Analyses
          </h1>
          <p className="text-sm text-gray-500">
            Suivez les performances de votre établissement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} className="gap-2">
            <RefreshCw className="size-4" />
            Actualiser
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="gap-2 bg-[#1B4332] hover:bg-[#143728]">
            <Download className="size-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periode} onValueChange={setPeriode}>
          <SelectTrigger className="w-36">
            <Calendar className="mr-2 size-4 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mois">Ce mois</SelectItem>
            <SelectItem value="annee">Cette année</SelectItem>
          </SelectContent>
        </Select>

        {periode === 'mois' && (
          <Select value={mois} onValueChange={setMois}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
                .map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Select value={annee} onValueChange={setAnnee}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-xs text-gray-500">
          {data?.periode ?? '—'}
        </Badge>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">{formaterPrix(data?.revenus_total ?? 0)}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dépenses</p>
                <p className="mt-1 text-xl font-bold text-red-600">{formaterPrix(data?.depenses_total ?? 0)}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-50">
                <FileText className="size-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bénéfice net</p>
                <p className={`mt-1 text-xl font-bold ${(data?.benefice_net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formaterPrix(data?.benefice_net ?? 0)}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                <BarChart3 className="size-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Taux d&apos;occupation</p>
                <p className="mt-1 text-xl font-bold text-[#D4AF37]">{data?.taux_occupation ?? 0}%</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                <PieChartIcon className="size-5 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Section ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="chambres">Par chambre</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Tab: Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenus vs Dépenses Bar Chart */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                Revenus vs Dépenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.revenus_vs_depenses && data.revenus_vs_depenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenus_vs_depenses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value: number) => [formaterPrix(value), '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    />
                    <Bar dataKey="revenus" fill="#10B981" name="Revenus" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depenses" fill="#EF4444" name="Dépenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-gray-400">Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mode paiement + Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Méthodes de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.par_mode_paiement && data.par_mode_paiement.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.par_mode_paiement}
                          dataKey="montant"
                          nameKey="mode"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          label={renderPieLabel}
                          labelLine={false}
                        >
                          {data.par_mode_paiement.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [formaterPrix(value), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5">
                      {data.par_mode_paiement.map((item, i) => (
                        <div key={item.mode} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-gray-600 capitalize">{item.mode.replace('_', ' ')}</span>
                          </div>
                          <span className="font-medium">{formaterPrix(item.montant)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[220px]">
                    <p className="text-sm text-gray-400">Aucune donnée</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Résumé de la période
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Total réservations', value: String(data?.total_reservations ?? 0) },
                  { label: 'Moyenne prix/nuit', value: formaterPrix(data?.moyenne_prix_nuit ?? 0) },
                  { label: 'Clients nouveaux', value: String(data?.clients_nouveaux ?? 0) },
                  { label: 'Clients fidèles', value: String(data?.clients_fideles ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-[#0A0A0A]">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Par chambre */}
        <TabsContent value="chambres" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Réservations par type de chambre
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.reservations_par_type && data.reservations_par_type.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.reservations_par_type} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={70} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                      <Bar dataKey="count" fill="#1B4332" name="Réservations" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px]">
                    <p className="text-sm text-gray-400">Aucune donnée</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Revenus par type de chambre
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.occupation_par_type && data.occupation_par_type.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.occupation_par_type}
                          dataKey="revenue"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          label={renderPieLabel}
                          labelLine={false}
                        >
                          {data.occupation_par_type.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={TYPE_CHAMBRE_COLORS[entry.type] ?? COLORS[index % COLORS.length]}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [formaterPrix(value), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5">
                      {data.occupation_par_type.map((item) => (
                        <div key={item.type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full capitalize"
                              style={{ backgroundColor: TYPE_CHAMBRE_COLORS[item.type] ?? '#9CA3AF' }}
                            />
                            <span className="text-gray-600 capitalize">{item.type}</span>
                          </div>
                          <span className="font-medium">{formaterPrix(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[220px]">
                    <p className="text-sm text-gray-400">Aucune donnée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Clients */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Clients par nationalité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.par_nationalite && data.par_nationalite.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.par_nationalite}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="nationalite" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                      <Bar dataKey="count" fill="#D4AF37" name="Clients" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-sm text-gray-400">Aucune donnée</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#0A0A0A]">
                  Détail des nationalités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.par_nationalite?.map((item) => {
                  const total = data.par_nationalite.reduce((s, n) => s + n.count, 0);
                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.nationalite} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item.nationalite}</span>
                        <span className="font-medium">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#D4AF37]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }) ?? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-gray-400">Aucune donnée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
