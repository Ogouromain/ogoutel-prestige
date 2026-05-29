import AdminSidebar from '@/components/admin/AdminSidebar';

// ─── Layout Admin ──────────────────────────────────────────────────────────────
// Serveur component — fournit la structure sidebar + zone de contenu principale.
// La sidebar DesktopSidebar anime sa largeur entre 80px (réduit) et 256px (étendu).
// Sur mobile, un Sheet (overlay) est utilisé par le composant MobileSidebar.
// Le contenu principal utilise `ml-0 md:ml-64` (256px = w-64) en supposant
// la sidebar étendue par défaut sur desktop.

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
          {children}
        </div>
      </main>
    </div>
  );
}
