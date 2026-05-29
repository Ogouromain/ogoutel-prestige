'use client';

import { useRef, useEffect, useSyncExternalStore } from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import GlobalSearch from '@/components/shared/GlobalSearch';

// ─── Dashboard Header ──────────────────────────────────────────────────────
// Barre d'outils supérieure du dashboard avec :
//   - Recherche globale (Ctrl+K)
//   - Notifications
//   - Toggle mode sombre/clair

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const searchRef = useRef(false);
  const searchListeners = useRef(new Set<() => void>());

  const getSearch = () => searchRef.current;
  const subscribeSearch = (cb: () => void) => {
    searchListeners.current.add(cb);
    return () => { searchListeners.current.delete(cb); };
  };
  const openSearch = () => {
    searchRef.current = true;
    searchListeners.current.forEach((cb) => cb());
  };
  const closeSearch = () => {
    searchRef.current = false;
    searchListeners.current.forEach((cb) => cb());
  };

  const searchOpen = useSyncExternalStore(subscribeSearch, getSearch, getSearch);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  // Raccourci clavier Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        {title && (
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-[#0A0A0A]">{title}</h2>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Search — Desktop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 text-gray-500 sm:flex"
                onClick={openSearch}
              >
                <Search className="size-4" />
                <span className="text-sm">Rechercher...</span>
                <kbd className="pointer-events-none ml-2 hidden select-none items-center gap-1 rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-400 md:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rechercher (Ctrl+K)</TooltipContent>
          </Tooltip>

          {/* Search — Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={openSearch}
            aria-label="Rechercher"
          >
            <Search className="size-5" />
          </Button>

          {/* Theme Toggle */}
          {mounted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                  {theme === 'dark' ? (
                    <Sun className="size-4 text-amber-400" />
                  ) : (
                    <Moon className="size-4 text-gray-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4 text-gray-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <GlobalSearch open={searchOpen as boolean} onOpenChange={(v: boolean) => { if (!v) closeSearch(); else openSearch(); }} />
    </>
  );
}
