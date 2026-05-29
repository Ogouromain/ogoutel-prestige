'use client';

import AnalyticsCharts from '@/components/super-admin/AnalyticsCharts';
import ExportButtons from '@/components/shared/ExportButtons';

// ─── Page Analyses Super Admin ──────────────────────────────────────────────
// Route : /super-admin/analytics
// Accès : super_admin uniquement

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Analyses & Statistiques
          </h1>
          <p className="text-sm text-gray-500">
            Vue détaillée de la plateforme OGOUTEL_Prestige
          </p>
        </div>
        <ExportButtons
          data={[]}
          filename="ogoutel-analytics"
          formats={['csv']}
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts />
    </div>
  );
}
