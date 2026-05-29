'use client';

import CheckInForm from '@/components/staff/CheckInForm';
import { LogIn } from 'lucide-react';

export default function StaffCheckInPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0A0A0A]">
          <LogIn className="size-6 text-emerald-600" />
          Check-in Client
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enregistrez l&apos;arrivée d&apos;un client en 4 étapes rapides
        </p>
      </div>

      {/* ── CheckIn Form ─────────────────────────────────────────── */}
      <CheckInForm />
    </div>
  );
}
