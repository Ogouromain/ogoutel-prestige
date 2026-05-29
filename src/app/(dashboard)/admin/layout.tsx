import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardHeader from '@/components/shared/DashboardHeader';

// ─── Layout Admin ──────────────────────────────────────────────────────────
// Serveur component — sidebar + DashboardHeader + zone de contenu.
// Le DashboardHeader inclut : recherche globale (Ctrl+K), toggle thème,
// et bouton notifications.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar fixe — sur mobile c'est un Sheet overlay */}
      <AdminSidebar />

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
