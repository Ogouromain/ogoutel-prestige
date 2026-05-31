'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel,
  LayoutDashboard,
  LogIn,
  LogOut,
  BedDouble,
  Users,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';

// ─── Navigation Items — LIMITÉ au staff ────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: 'Mon Tableau de bord',
    icon: <LayoutDashboard className="size-5" />,
    href: '/staff',
  },
  {
    label: 'Check-in client',
    icon: <LogIn className="size-5" />,
    href: '/staff/checkin',
  },
  {
    label: 'Check-out client',
    icon: <LogOut className="size-5" />,
    href: '/staff/checkout',
  },
  {
    label: 'État des chambres',
    icon: <BedDouble className="size-5" />,
    href: '/staff/rooms',
  },
  {
    label: 'Clients',
    icon: <Users className="size-5" />,
    href: '/staff/clients',
  },
];

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    router.push(item.href);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]',
        'hover:bg-emerald-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
        isActive
          ? 'border-l-[3px] border-l-emerald-600 bg-emerald-500/10 text-emerald-700'
          : 'border-l-[3px] border-l-transparent text-muted-foreground',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <span
        className={cn(
          'shrink-0',
          isActive
            ? 'text-emerald-600'
            : 'text-muted-foreground group-hover:text-emerald-600'
        )}
      >
        {item.icon}
      </span>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Logo Section ──────────────────────────────────────────────────────────

function LogoSection({
  isCollapsed,
  hotelName,
  staffName,
  staffRole,
  isLoading,
}: {
  isCollapsed: boolean;
  hotelName: string | null;
  staffName: string | null;
  staffRole: string | null;
  isLoading: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-4 py-5',
        isCollapsed && 'items-center px-2'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1B4332]">
          <Hotel className="size-6 text-white" />
        </div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-28 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <span className="whitespace-nowrap text-lg font-bold text-foreground">
                    {hotelName || 'OGOUTEL Prestige'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Espace Réception
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Staff info */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2 overflow-hidden"
          >
            {isLoading ? (
              <Skeleton className="h-8 w-full rounded-lg" />
            ) : (
              <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                  {staffName
                    ? staffName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'ST'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium text-foreground">
                    {staffName || 'Réceptionniste'}
                  </span>
                  <Badge
                    variant="outline"
                    className="w-fit border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 px-1.5 py-0"
                  >
                    {staffRole === 'gerant' ? 'Gérant' : 'Réceptionniste'}
                  </Badge>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Sheet Sidebar ──────────────────────────────────────────────────

function MobileSidebar({
  hotelName,
  staffName,
  staffRole,
  isLoading,
}: {
  hotelName: string | null;
  staffName: string | null;
  staffRole: string | null;
  isLoading: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-40 md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
          <span className="sr-only">Menu de navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-card">
        <SheetHeader className="border-b border-border px-4 py-0">
          <SheetTitle className="sr-only">
            Navigation Staff Hôtel
          </SheetTitle>
        </SheetHeader>
        <div className="py-2">
          <LogoSection
            isCollapsed={false}
            hotelName={hotelName}
            staffName={staffName}
            staffRole={staffRole}
            isLoading={isLoading}
          />
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-1">
            {STAFF_NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                isActive={pathname === item.href}
                isCollapsed={false}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Logout Button ────────────────────────────────────────────────────────

function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      toast.success('Déconnexion réussie');
      router.push('/');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <button
      onClick={handleLogout}
      aria-label="Se déconnecter"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 min-h-[44px]"
    >
      <DoorOpen className="size-5" />
      <span>Déconnexion</span>
    </button>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────

function DesktopSidebar({
  hotelName,
  staffName,
  staffRole,
  isLoading,
}: {
  hotelName: string | null;
  staffName: string | null;
  staffRole: string | null;
  isLoading: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card sidebar-bg-white md:flex"
    >
      <LogoSection
        isCollapsed={isCollapsed}
        hotelName={hotelName}
        staffName={staffName}
        staffRole={staffRole}
        isLoading={isLoading}
      />

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {STAFF_NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        <LogoutButton />
      </div>

      {/* Collapse Toggle */}
      <Separator />
      <div className="flex justify-center p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
          aria-label={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
          <span className="sr-only">
            {isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
          </span>
        </Button>
      </div>
    </motion.aside>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────

export default function StaffSidebar() {
  const isMobile = useIsMobile();
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await authFetch('/api/staff/stats');
        if (res.ok) {
          const data = await res.json();
          setHotelName(data.data?.hotel_nom || null);
          setStaffName(
            data.data?.staff_info?.prenom && data.data?.staff_info?.nom
              ? `${data.data.staff_info.prenom} ${data.data.staff_info.nom}`
              : null
          );
          setStaffRole(data.data?.staff_info?.role || null);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchInfo();
  }, []);

  if (isMobile) {
    return (
      <MobileSidebar
        hotelName={hotelName}
        staffName={staffName}
        staffRole={staffRole}
        isLoading={isLoading}
      />
    );
  }

  return (
    <DesktopSidebar
      hotelName={hotelName}
      staffName={staffName}
      staffRole={staffRole}
      isLoading={isLoading}
    />
  );
}
