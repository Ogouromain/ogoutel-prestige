'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel,
  LayoutDashboard,
  Bed,
  CalendarDays,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanId } from '@/lib/constants';

// ─── Navigation Items ──────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="size-5" />,
    href: '/admin',
  },
  {
    label: 'Mes Chambres',
    icon: <Bed className="size-5" />,
    href: '/admin/rooms',
  },
  {
    label: 'Réservations',
    icon: <CalendarDays className="size-5" />,
    href: '/admin/reservations',
  },
  {
    label: 'Mon Personnel',
    icon: <Users className="size-5" />,
    href: '/admin/staff',
  },
  {
    label: 'Finances',
    icon: <DollarSign className="size-5" />,
    href: '/admin/finances',
  },
  {
    label: 'Rapports',
    icon: <BarChart3 className="size-5" />,
    href: '/admin/reports',
  },
  {
    label: 'Mon Hôtel',
    icon: <Settings className="size-5" />,
    href: '/admin/settings',
  },
];

// ─── Plan badge color map ──────────────────────────────────────────────────────

const PLAN_BADGE_COLORS: Record<PlanId, { bg: string; text: string }> = {
  basique: { bg: 'bg-gray-100', text: 'text-gray-700' },
  standard: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  premium: { bg: 'bg-[#D4AF37]/15', text: 'text-[#D4AF37]' },
};

const PLAN_LABELS: Record<PlanId, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium',
};

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────

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

  const handleClick = useCallback(() => {
    if (item.disabled) {
      toast('Fonctionnalité bientôt disponible', { icon: '🔒' });
      return;
    }
    router.push(item.href);
    onClick?.();
  }, [item, router, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        'hover:bg-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'border-l-[3px] border-l-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
          : 'border-l-[3px] border-l-transparent text-gray-600',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={cn('shrink-0', isActive ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-gray-700')}>
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
      {!isCollapsed && item.badge && (
        <Badge
          variant="outline"
          className="ml-auto text-[10px] px-1.5 py-0 text-gray-400 border-gray-300"
        >
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

// ─── Logo Section ──────────────────────────────────────────────────────────────

function LogoSection({
  isCollapsed,
  hotelName,
  plan,
  isLoading,
}: {
  isCollapsed: boolean;
  hotelName: string | null;
  plan: PlanId | null;
  isLoading: boolean;
}) {
  const planColors = plan ? PLAN_BADGE_COLORS[plan] : null;

  return (
    <div className={cn('flex items-center gap-3 px-4 py-5', isCollapsed && 'justify-center px-2')}>
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
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <span className="whitespace-nowrap text-lg font-bold text-[#1B4332]">
                  {hotelName || 'Mon Hôtel'}
                </span>
                {plan && planColors && (
                  <Badge
                    className={cn('mt-0.5 w-fit border-0 text-[10px] px-1.5 py-0', planColors.bg, planColors.text)}
                  >
                    {PLAN_LABELS[plan]}
                  </Badge>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Sheet Sidebar ──────────────────────────────────────────────────────

function MobileSidebar({
  hotelName,
  plan,
  isLoading,
}: {
  hotelName: string | null;
  plan: PlanId | null;
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
          className="fixed left-4 top-4 z-40 md:hidden"
        >
          <Menu className="size-5" />
          <span className="sr-only">Menu de navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-gray-100 px-4 py-0">
          <SheetTitle className="sr-only">Navigation Admin Hôtel</SheetTitle>
        </SheetHeader>
        <div className="py-2">
          <LogoSection isCollapsed={false} hotelName={hotelName} plan={plan} isLoading={isLoading} />
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                isActive={pathname === item.href && !item.disabled}
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

// ─── Logout Button ─────────────────────────────────────────────────────────────

function LogoutButton() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
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
  }, [router]);

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      <LogOut className="size-5" />
      <span>Déconnexion</span>
    </button>
  );
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar({
  hotelName,
  plan,
  isLoading,
}: {
  hotelName: string | null;
  plan: PlanId | null;
  isLoading: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-gray-200 bg-white md:flex"
    >
      <LogoSection isCollapsed={isCollapsed} hotelName={hotelName} plan={plan} isLoading={isLoading} />

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              isActive={pathname === item.href && !item.disabled}
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
          className="size-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
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

// ─── Main Export ───────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const isMobile = useIsMobile();
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHotelInfo() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setHotelName(data.hotel?.nom || data.hotel?.name || null);
          if (data.hotel?.plan_abonnement) {
            setPlan(data.hotel.plan_abonnement as PlanId);
          }
        }
      } catch {
        // Silently fail — sidebar still works with defaults
      } finally {
        setIsLoading(false);
      }
    }
    fetchHotelInfo();
  }, []);

  if (isMobile) {
    return <MobileSidebar hotelName={hotelName} plan={plan} isLoading={isLoading} />;
  }

  return <DesktopSidebar hotelName={hotelName} plan={plan} isLoading={isLoading} />;
}
