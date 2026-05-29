'use client';

// ============================================
// OGOUTEL_Prestige - Login Page
// Fichier : app/(auth)/login/page.tsx
//
// Page de connexion — split screen design
// useSearchParams nécessite un Suspense boundary
// ============================================

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function LoginFormFallback() {
  return (
    <div className="flex min-h-screen">
      {/* Placeholder côté gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]" />
      {/* Placeholder côté droit */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <Card className="border-0 shadow-xl shadow-black/5 w-full max-w-md">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
