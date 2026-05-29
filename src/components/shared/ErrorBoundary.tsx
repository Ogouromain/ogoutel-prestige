'use client';

// ============================================
// OGOUTEL_Prestige - ErrorBoundary
// Composant React Error Boundary réutilisable
// Capture les erreurs de rendu dans les enfants
// ============================================

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  /** Enfants à protéger */
  children: ReactNode;
  /** Fallback personnalisé (optionnel) */
  fallback?: ReactNode;
  /** Callback appelé lors d'une erreur (optionnel) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Classes additionnelles */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Capture les erreurs de rendu des composants enfants.
 * Affiche un message d'erreur avec un bouton de réessai.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log l'erreur en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Erreur interceptée:', error);
      console.error('[ErrorBoundary] Composant stack:', errorInfo.componentStack);
    }

    // Appelle le callback onError si fourni
    this.props.onError?.(error, errorInfo);
  }

  /** Réinitialise l'état pour réessayer le rendu */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <Card
          className={cn(
            'border-red-200 bg-red-50/50',
            this.props.className
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {/* Icône d'erreur */}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            {/* Titre */}
            <h3 className="mb-2 text-lg font-semibold text-red-800">
              Une erreur est survenue
            </h3>

            {/* Description */}
            <p className="mb-6 max-w-md text-sm text-red-600/80">
              Un problème inattendu s&apos;est produit lors de l&apos;affichage
              de cette section. Veuillez réessayer.
            </p>

            {/* Détail technique (mode développement) */}
            {process.env.NODE_ENV === 'development' && this.state.error?.message && (
              <div className="mb-6 max-w-sm rounded-lg border border-red-200 bg-white/80 p-3 text-left">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Bouton Réessayer */}
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="gap-2 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
