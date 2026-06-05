"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Shield, Clock, Video, Check } from 'lucide-react';
import { ReturForm } from '@/components/ReturForm';
import { ReturStatus } from '@/components/ReturStatus';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TRUST_BADGES = [
  { icon: Clock, label: '2x24 Jam', desc: 'Batas klaim' },
  { icon: Video, label: '1-Shot', desc: 'Video tanpa edit' },
  { icon: Shield, label: 'Aman', desc: 'Data terenkripsi' },
];

export default function ReturPage() {
  const [view, setView] = useState<'form' | 'status'>('form');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const isGuest = !user;

  return (
    <div className="min-h-screen bg-white">
      {/* ── TOP BAR ── Tidak overlap dengan global header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-ink/5">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink/30 hover:text-rose transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[9px] uppercase tracking-widest">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-rose/10 rounded-full flex items-center justify-center">
              <RefreshCw size={10} className="text-rose" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">Retur & Refund</span>
          </div>
          <div className="w-16" />
        </div>

        {/* Tab Switcher */}
        <div className="max-w-lg mx-auto px-5 flex gap-0">
          {[
            { id: 'form' as const, label: 'Ajukan Retur' },
            { id: 'status' as const, label: 'Status' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                'pb-2.5 px-3 text-[9px] font-semibold uppercase tracking-wider border-b-2 transition-colors',
                view === tab.id
                  ? 'border-rose text-rose'
                  : 'border-transparent text-ink/30 hover:text-ink/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-lg mx-auto px-5 py-6">

        {/* ANIMATE VIEW SWITCH */}
        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* HERO SECTION */}
              <div className="mb-6">
                {/* Trust Badges Row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {TRUST_BADGES.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div key={badge.label} className="flex flex-col items-center gap-1.5 p-3 border border-ink/5 rounded-sm bg-ink/[0.01]">
                        <div className="w-7 h-7 bg-rose/10 rounded-full flex items-center justify-center">
                          <Icon size={13} className="text-rose" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">{badge.label}</span>
                        <span className="text-[7px] text-ink/30 uppercase tracking-widest">{badge.desc}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Hero Text */}
                <h1 className="text-xl font-display italic font-medium text-ink uppercase tracking-tight leading-tight mb-2">
                  Ajukan Retur & Refund
                </h1>
                <p className="text-[11px] text-ink/40 leading-relaxed mb-1">
                  Klaim retur maksimal <span className="text-rose font-semibold">2 x 24 jam</span> setelah barang diterima.
                  Wajib sertakan bukti video unboxing <span className="text-rose font-semibold">1-shot tanpa edit</span>.
                </p>
                <p className="text-[10px] text-ink/20">
                  Guest bisa ajukan tanpa login — siapkan Order ID dan email aktif.
                </p>
              </div>

              {/* Guest Banner */}
              {isGuest && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-sm flex items-start gap-2"
                >
                  <div className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-[7px] font-bold text-amber-700">!</span>
                  </div>
                  <p className="text-[9px] text-amber-800 leading-relaxed">
                    Guest Mode — Anda submit sebagai tamu. Isi email aktif untuk receive update status dari tim kami.
                  </p>
                </motion.div>
              )}

              {/* The Form */}
              <ReturForm
                isGuest={isGuest}
                className="border border-ink/5 rounded-sm shadow-sm"
                onSuccess={() => setView('status')}
              />
            </motion.div>

          ) : (
            <motion.div key="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {user ? (
                <ReturStatus />
              ) : (
                <div className="text-center py-16 space-y-4">
                  <div className="w-14 h-14 bg-ink/5 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw size={22} className="text-ink/20" strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">Login untuk Melihat Status</p>
                    <p className="text-[9px] text-ink/20 mt-1">Cek status pengajuan retur yang pernah Anda ajukan</p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-block px-6 py-2.5 bg-rose text-white text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
