'use client';

import CheckOutForm from '@/components/staff/CheckOutForm';
import { LogOut } from 'lucide-react';

export default function StaffCheckOutPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0A0A0A]">
          <LogOut className="size-6 text-amber-600" />
          Check-out Client
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les départs et finalisez les paiements
        </p>
      </div>

      {/* ── Checkout Form ──────────────────────────────────────────── */}
      <CheckOutForm />
    </div>
  );
}
