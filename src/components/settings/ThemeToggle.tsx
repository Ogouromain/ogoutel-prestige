'use client';

// ============================================
// OGOUTEL_Prestige - ThemeToggle
// Bouton de bascule mode clair / sombre
// Utilise next-themes pour la gestion du thème
// ============================================

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Hook détectant si le composant est monté côté client */
const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    // Rendu squelette avant le montage pour éviter le mismatch
    return (
      <Button variant="ghost" size="icon" aria-label="Changer le thème" disabled>
        <span className="sr-only">Changer le thème</span>
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Changer le thème"
          className="relative transition-all duration-300"
        >
          {/* Icône soleil (visible en mode sombre) */}
          <Sun
            className={
              isDark
                ? 'h-4 w-4 rotate-0 scale-100 transition-all duration-300'
                : 'h-4 w-4 rotate-90 scale-0 transition-all duration-300'
            }
          />
          {/* Icône lune (visible en mode clair) */}
          <Moon
            className={
              isDark
                ? 'absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300'
                : 'absolute h-4 w-4 rotate-0 scale-100 transition-all duration-300'
            }
          />
          <span className="sr-only">
            {isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? 'Mode clair' : 'Mode sombre'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
