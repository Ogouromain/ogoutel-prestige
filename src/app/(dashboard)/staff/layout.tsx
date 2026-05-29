import StaffSidebar from '@/components/staff/StaffSidebar';
import DashboardHeader from '@/components/shared/DashboardHeader';

// ─── Layout Staff / Réceptionniste ─────────────────────────────────────────
// Accès LIMITÉ — le réceptionniste voit uniquement ce dont il a besoin.
// Sidebar avec menu restreint, pas d'accès aux finances/rapports/settings.
// DashboardHeader avec recherche globale et toggle thème.

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar fixe — sur mobile c'est un Sheet overlay */}
      <StaffSidebar />

      {/* Zone de contenu principale */}
      <main className="flex-1 ml-0 md:ml-64 transition-[margin] duration-300 ease-in-out">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <DashboardHeader />
          {children}
        </div>
      </main>
    </div>
  );
}
