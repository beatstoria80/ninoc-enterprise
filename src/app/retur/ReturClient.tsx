"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from '@/components/LocalizedLink';
import { RefreshCw, Shield, Clock, Video, Check } from 'lucide-react';
import { ReturForm } from '@/components/ReturForm';
import { ReturStatus } from '@/components/ReturStatus';
import { ReturTracker } from '@/components/ReturTracker';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TRUST_ITEMS = [
  { icon: Clock, label: '2x24 Jam', sub: 'Batas klaim' },
  { icon: Video, label: '1-Shot', sub: 'Video tanpa edit' },
  { icon: Shield, label: 'Aman', sub: 'Data terenkripsi' },
];

export default function ReturClient() {
  const [view, setView] = useState<'form' | 'status' | 'track'>('form');
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
    <div className="min-h-screen bg-white pb-safe">
      <div className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-md pt-3 px-4 md:px-10 max-w-[1400px] mx-auto w-full shadow-sm md:shadow-none border-b md:border-none border-ink/5">
        <div className="flex items-center justify-between border-b border-ink/5 pb-1.5">
          <Link href="/" className="flex items-center gap-1.5 text-ink/50 hover:text-rose transition-colors group p-1.5 -ml-1.5 md:p-0 md:ml-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] font-medium">Return to Studio Catalog</span>
          </Link>
          <h1 className="font-display font-medium md:font-normal italic text-lg tracking-tight md:tracking-normal leading-tight uppercase text-ink">
            Return<span className="hidden md:inline">, Refund & Exchange</span>
          </h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 md:px-10 pt-2 pb-12">
        <div className="lg:grid lg:grid-cols-[1fr_300px] gap-4">

          <div className="border border-ink/5 bg-white rounded-sm">
            <div className="sticky top-[45px] md:top-[50px] z-40 px-3 md:px-4 pt-2.5 md:py-2 border-b border-ink/5 flex flex-col md:flex-row md:items-center gap-2 md:gap-1.5 bg-white/95 backdrop-blur-md rounded-t-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
                  <RefreshCw size={11} className="text-rose" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink uppercase tracking-wider leading-none">Pengajuan Retur</p>
                  <p className="text-[8px] text-ink/50 mt-px uppercase tracking-widest leading-none">Form submission</p>
                </div>
              </div>
              <div className="md:ml-auto flex gap-0 w-full md:w-auto overflow-x-auto no-scrollbar border-t md:border-none border-ink/5 pt-0.5 md:pt-0">
                {([{ id: 'form' as const, label: 'Ajukan' }, { id: 'status' as const, label: 'Status (Akun)' }, { id: 'track' as const, label: 'Lacak (Guest)' }]).map(tab => (
                  <button key={tab.id} onClick={() => setView(tab.id as any)} className={cn('pb-2 pt-1.5 md:pt-0 px-3 md:px-2.5 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap', view === tab.id ? 'border-rose text-rose' : 'border-transparent text-ink/50 hover:text-ink/60')}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3">
              <AnimatePresence mode="wait">
                {view === 'form' ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {isGuest && (
                      <div className="mb-2.5 px-2.5 py-2 bg-amber-50 border border-amber-100 rounded-sm flex items-start gap-1.5">
                        <div className="w-3.5 h-3.5 bg-amber-200 rounded-full flex items-center justify-center mt-px shrink-0">
                          <span className="text-[8px] font-bold text-amber-700">!</span>
                        </div>
                        <p className="text-[10px] text-amber-800 leading-snug">Guest Mode — Submit sebagai tamu. Isi email aktif untuk receive update.</p>
                      </div>
                    )}
                    <ReturForm isGuest={isGuest} onSuccess={() => setView('track')} />
                  </motion.div>
                ) : view === 'status' ? (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {user ? (
                      <ReturStatus />
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-10 h-10 bg-ink/5 rounded-full flex items-center justify-center mx-auto">
                          <RefreshCw size={16} className="text-ink/20" strokeWidth={1} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-ink/60">Login untuk Melihat Status</p>
                          <p className="text-[10px] text-ink/20 mt-0.5">Cek status pengajuan retur menggunakan akun.</p>
                        </div>
                        <Link href="/login" className="inline-block px-4 py-2 bg-rose text-white text-[10px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors">Login</Link>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ReturTracker />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3 lg:pt-0 pt-3 lg:sticky lg:top-[50px] lg:self-start">
            <div className="border border-ink/5 bg-white rounded-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-ink/5 bg-ink/[0.01]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60">Kebijakan Retur</p>
              </div>
              <div className="p-2.5 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {TRUST_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-1 p-2 bg-ink/[0.02] border border-ink/5 rounded-sm">
                        <div className="w-6 h-6 bg-rose/10 rounded-full flex items-center justify-center">
                          <Icon size={11} className="text-rose" strokeWidth={1.5} />
                        </div>
                        <span className="text-[9px] font-semibold text-ink uppercase tracking-wider text-center">{item.label}</span>
                        <span className="text-[8px] text-ink/60 uppercase tracking-widest text-center">{item.sub}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-rose/[0.02] border border-rose/10 rounded-sm p-2 space-y-1">
                  {['Klaim maksimal 2x24 jam setelah barang diterima', 'Bukti video 1-shot tanpa edit WAJIB', 'Guest bisa ajukan tanpa login', 'Refund 3-7 hari kerja setelah persetujuan', 'Label & tag masih menempel', 'Barang belum digunakan / dicuci'].map((text, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <div className="w-3 h-3 bg-rose/10 rounded-full flex items-center justify-center mt-px shrink-0">
                        <Check size={6} className="text-rose" strokeWidth={2.5} />
                      </div>
                      <p className="text-[9px] text-ink/70 leading-snug">{text}</p>
                    </div>
                  ))}
                </div>

                <Link href="/help" className="block w-full text-center py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors">Baca Help Guide Lengkap</Link>
              </div>
            </div>

            <div className="border border-ink/5 bg-white rounded-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-ink/5 bg-ink/[0.01]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60">Alur Pengajuan</p>
              </div>
              <div className="p-2.5 space-y-1.5">
                {[{ num: '01', text: 'Siapkan Order ID dari email konfirmasi' }, { num: '02', text: 'Rekam video unboxing 1-shot (min 30 detik)' }, { num: '03', text: 'Isi form dengan lengkap & akurat' }, { num: '04', text: 'Submit & tunggu review 1-2 hari kerja' }].map((step) => (
                  <div key={step.num} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-rose shrink-0 mt-px">{step.num}</span>
                    <p className="text-[10px] text-ink/70 leading-snug">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {isGuest && (
              <div className="border border-amber-100 bg-amber-50 rounded-sm p-2.5 space-y-1">
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Info Guest</p>
                <p className="text-[10px] text-amber-700 leading-snug">Anda submit sebagai <strong>tamu</strong>. Kami akan hubungi via email untuk update status.</p>
                <p className="text-[10px] text-amber-600 leading-snug">Sudah punya akun? <Link href="/login" className="underline hover:text-amber-800">Login</Link> untuk lacak retur lebih mudah.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
