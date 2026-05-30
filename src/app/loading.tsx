// ============================================
// OGOUTEL_Prestige - Loading Global
// Indicateur de chargement pour les transitions
// de page (Next.js loading.tsx convention)
// ============================================

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="default" label="Chargement..." />
      </div>
    </div>
  );
}
