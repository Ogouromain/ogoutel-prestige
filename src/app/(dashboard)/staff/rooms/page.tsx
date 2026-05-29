'use client';

import RoomsStatusView from '@/components/staff/RoomsStatusView';
import { BedDouble } from 'lucide-react';

export default function StaffRoomsPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0A0A0A]">
          <BedDouble className="size-6 text-emerald-600" />
          État des Chambres
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d&apos;ensemble en temps réel de toutes les chambres
        </p>
      </div>

      {/* ── Rooms Grid ─────────────────────────────────────────────── */}
      <RoomsStatusView />
    </div>
  );
}
