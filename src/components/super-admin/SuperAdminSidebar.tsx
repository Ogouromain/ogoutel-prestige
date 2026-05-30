'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  LayoutDashboard,
  Hotel,
  FileText,
  Key,
  DollarSign,
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
  SheetClose,
} from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    label: 'Vue d\'ensemble',
    icon: <LayoutDashboard className="size-5" />,
    href: '/super-admin',
  },
  {
    label: 'Tous les Hôtels',
    icon: <Hotel className="size-5" />,
    href: '/super-admin/hotels',
  },
  {
    label: 'Demandes d\'abonnement',
    icon: <FileText className="size-5" />,
    href: '/super-admin/subscriptions',
  },
  {
    label: 'Codes d\'activation',
    icon: <Key className="size-5" />,
    href: '/super-admin/activation-codes',
  },
  {
    label: 'Analyses',
    icon: <DollarSign className="size-5" />,
    href: '/super-admin/analytics',
  },
  {
    label: 'Paramètres',
    icon: <Settings className="size-5" />,
    href: '/super-admin',
    disabled: true,
    badge: 'Bientôt',
  },
];

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
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]',
        'hover:bg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'border-l-[3px] border-l-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
          : 'border-l-[3px] border-l-transparent text-muted-foreground',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={cn('shrink-0', isActive ? 'text-[#D4AF37]' : 'text-muted-foreground group-hover:text-foreground')}>
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

function LogoSection({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-5', isCollapsed && 'justify-center px-2')}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]">
        <Building2 className="size-6 text-white" />
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
            <span className="whitespace-nowrap text-lg font-bold text-foreground">
              OGOUTEL<span className="text-[#D4AF37]">_Prestige</span>
            </span>
            <Badge className="mt-0.5 w-fit bg-red-500 text-white text-[10px] px-1.5 py-0 border-0">
              Super Admin
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Sheet Sidebar ──────────────────────────────────────────────────────

function MobileSidebar() {
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
          <SheetTitle className="sr-only">Navigation Super Admin</SheetTitle>
        </SheetHeader>
        <div className="py-2">
          <LogoSection isCollapsed={false} />
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
      aria-label="Se déconnecter"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 min-h-[44px]"
    >
      <LogOut className="size-5" />
      <span>Déconnexion</span>
    </button>
  );
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card sidebar-bg-white md:flex"
    >
      <LogoSection isCollapsed={isCollapsed} />

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

// ─── Main Export ───────────────────────────────────────────────────────────────

export default function SuperAdminSidebar() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar />;
  }

  return <DesktopSidebar />;
}
