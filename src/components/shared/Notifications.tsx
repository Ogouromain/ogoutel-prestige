'use client';

// ============================================
// OGOUTEL_Prestige - Système de Notifications
// Toast + Badge + Realtime (Supabase)
//
// Utilise react-hot-toast (déjà configuré dans layout)
// + Supabase Realtime pour les notifications temps réel
// + Badge compteur pour le menu sidebar
//
// NOTE: Toast notifications sont gérées par react-hot-toast
// directement dans les composants via toast.success/error()
// Ce composant gère la couche "Notification Center" avec
// badge, dropdown, et souscriptions realtime.
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Bell,
  Check,
  X,
  Trash2,
  Clock,
  AlertCircle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Notification } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationHookReturn {
  /** Notifications non lues */
  unreadCount: number;
  /** Toutes les notifications */
  notifications: Notification[];
  /** Marquer tout comme lu */
  markAllAsRead: () => Promise<void>;
  /** Marquer une notification comme lue */
  markAsRead: (id: string) => Promise<void>;
  /** Supprimer une notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Supprimer tout */
  clearAll: () => Promise<void>;
  /** Chargement */
  isLoading: boolean;
  /** Recharger */
  reload: () => Promise<void>;
}

interface NotificationBellProps {
  /** Hook de notifications */
  notifications: NotificationHookReturn;
  /** Classes additionnelles */
  className?: string;
}

// ─── Icône par type ──────────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  reservation_nouvelle: Clock,
  reservation_annulee: X,
  checkin: Check,
  checkout: Check,
  facture_impayee: AlertCircle,
  abonnement_expiration: AlertCircle,
  personnel_ajoute: Info,
  systeme: Info,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  reservation_nouvelle: 'bg-blue-100 text-blue-600',
  reservation_annulee: 'bg-red-100 text-red-600',
  checkin: 'bg-emerald-100 text-emerald-600',
  checkout: 'bg-emerald-100 text-emerald-600',
  facture_impayee: 'bg-amber-100 text-amber-600',
  abonnement_expiration: 'bg-red-100 text-red-600',
  personnel_ajoute: 'bg-purple-100 text-purple-600',
  systeme: 'bg-gray-100 text-gray-600',
};

// ─── Hook useNotifications ───────────────────────────────────────────────

export function useNotifications(userId?: string): NotificationHookReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<unknown>(null);

  // Initialiser Supabase
  useEffect(() => {
    async function init() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        supabaseRef.current = createClient();
      } catch {
        // Mode dégradé
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    const supa = supabaseRef.current as null | {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: unknown) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[]; error: unknown }>;
          };
        };
      };
      channel: (name: string) => {
        on: (event: string, cb: () => void) => {
          subscribe: () => { unsubscribe: () => void };
        };
      };
      removeChannel: (ch: { unsubscribe: () => void }) => void;
    };

    if (!supa || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supa
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data as unknown as Notification[]);
      }
    } catch (err) {
      console.error('[useNotifications] Erreur chargement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    const supa = supabaseRef.current as null | {
      channel: (name: string) => {
        on: (event: string, cb: () => void) => {
          subscribe: () => { unsubscribe: () => void };
        };
      };
      removeChannel: (ch: { unsubscribe: () => void }) => void;
    };

    if (!supa || !userId) return;

    const channel = supa
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
          // Son de notification (optionnel)
          if (typeof Audio !== 'undefined') {
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      supa.removeChannel(channel);
    };
  }, [supaRef.current, userId, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.est_lue).length;

  // Marquer comme lue
  const markAsRead = useCallback(async (id: string) => {
    const supa = supabaseRef.current as null | {
      from: (t: string) => {
        update: (data: unknown) => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>;
        };
      };
    };
    if (!supa) return;

    await supa.from('notifications').update({ est_lue: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, est_lue: true } : n))
    );
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(async () => {
    const supa = supabaseRef.current as null | {
      from: (t: string) => {
        update: (data: unknown) => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>;
        };
      };
    };
    if (!supa) return;

    await supa.from('notifications').update({ est_lue: true }).eq('est_lue', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, est_lue: true })));
    toast.success('Toutes les notifications marquées comme lues');
  }, []);

  // Supprimer
  const deleteNotification = useCallback(async (id: string) => {
    const supa = supabaseRef.current as null | {
      from: (t: string) => {
        delete: () => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>;
        };
      };
    };
    if (!supa) return;

    await supa.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Supprimer tout
  const clearAll = useCallback(async () => {
    const supa = supabaseRef.current as null | {
      from: (t: string) => {
        delete: () => Promise<{ error: unknown }>;
      };
    };
    if (!supa) return;

    await supa.from('notifications').delete();
    setNotifications([]);
    toast.success('Toutes les notifications supprimées');
  }, []);

  return {
    unreadCount,
    notifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAll,
    isLoading,
    reload: loadNotifications,
  };
}

// ─── Composant : NotificationBell (dropdown) ──────────────────────────────

export function NotificationBell({ notifications, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { unreadCount, markAllAsRead, markAsRead, deleteNotification, clearAll, isLoading, notifications: notifs } = notifications;

  return (
    <div className={cn('relative', className)}>
      {/* Bouton cloche */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} non lues)`}
      >
        <Bell className="h-4 w-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#0A0A0A]">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 text-xs">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#D4AF37] hover:text-[#B8972E] font-medium"
                  >
                    Tout lire
                  </button>
                )}
                <ChevronDown className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>

            {/* Liste */}
            <ScrollArea className="max-h-72">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifs.map((notif) => {
                    const Icon = NOTIFICATION_ICONS[notif.type] ?? Info;
                    const colorClass = NOTIFICATION_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600';

                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50/50 cursor-pointer',
                          !notif.est_lue && 'bg-[#D4AF37]/5'
                        )}
                        onClick={() => {
                          if (!notif.est_lue) markAsRead(notif.id);
                        }}
                      >
                        <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0', colorClass)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm text-gray-700', !notif.est_lue && 'font-semibold')}>
                            {notif.titre}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-gray-300">
                            {formatNotifDate(notif.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifs.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-2">
                  <button
                    onClick={clearAll}
                    className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Tout effacer
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatNotifDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

// ─── Utilitaire : Toast helpers ────────────────────────────────────────────

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message, { duration: 6000 }),
  info: (message: string) =>
    toast(message, {
      icon: 'ℹ️',
      style: { borderLeft: '4px solid #3B82F6' },
    }),
  warning: (message: string) =>
    toast(message, {
      icon: '⚠️',
      style: { borderLeft: '4px solid #F77F00' },
    }),
  promise: <T,>(
    promise: Promise<T>,
    opts: {
      loading: string;
      success: string;
      error: string;
    }
  ) =>
    toast.promise(promise, {
      loading: opts.loading,
      success: opts.success,
      error: opts.error,
    }),
};
