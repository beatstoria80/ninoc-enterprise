"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from '@/components/LocalizedLink';
import { RefreshCw, Shield, Clock, Video, Check } from 'lucide-react';
import { ReturForm } from '@/components/ReturForm';
import { ReturStatus } from '@/components/ReturStatus';
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
    <div className="min-h-screen bg-white no-scrollbar overflow-x-hidden">
      <div className="pt-16 md:pt-24 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between border-b border-ink/5 pb-2">
          <Link href="/" className="flex items-center gap-2 text-ink/30 hover:text-rose transition-colors group">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] md:text-[8px] uppercase tracking-[0.2em] font-medium">Return to Studio Catalog</span>
          </Link>
          <h1 className="font-display font-medium italic text-xl tracking-tighter uppercase text-ink">Return& Refund</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-6 pb-20">
        <div className="lg:grid lg:grid-cols-[1fr_340px] gap-6">

          <div className="border border-ink/5 bg-white rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-ink/5 flex items-center gap-3 bg-ink/[0.01]">
              <div className="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
                <RefreshCw size={14} className="text-rose" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm md:text-[11px] font-semibold text-ink uppercase tracking-wider">Pengajuan Retur</p>
                <p className="text-[11px] md:text-[8px] text-ink/30 mt-0.5 uppercase tracking-widest">Form submission</p>
              </div>
              <div className="ml-auto flex gap-0">
                {([{ id: 'form' as const, label: 'Ajukan' }, { id: 'status' as const, label: 'Status' }]).map(tab => (
                  <button key={tab.id} onClick={() => setView(tab.id)} className={cn('pb-2.5 px-3 text-xs md:text-[9px] font-semibold uppercase tracking-wider border-b-2 transition-colors', view === tab.id ? 'border-rose text-rose' : 'border-transparent text-ink/30 hover:text-ink/60')}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {view === 'form' ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {isGuest && (
                      <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-sm flex items-start gap-2">
                        <div className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <span className="text-[10px] md:text-[7px] font-bold text-amber-700">!</span>
                        </div>
                        <p className="text-xs md:text-[9px] text-amber-800 leading-relaxed">Guest Mode — Submit sebagai tamu. Isi email aktif untuk receive update dari tim kami.</p>
                      </div>
                    )}
                    <ReturForm isGuest={isGuest} onSuccess={() => setView('status')} />
                  </motion.div>
                ) : (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {user ? (
                      <ReturStatus />
                    ) : (
                      <div className="text-center py-16 space-y-4">
                        <div className="w-14 h-14 bg-ink/5 rounded-full flex items-center justify-center mx-auto">
                          <RefreshCw size={22} className="text-ink/20" strokeWidth={1} />
                        </div>
                        <div>
                          <p className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink/40">Login untuk Melihat Status</p>
                          <p className="text-xs md:text-[9px] text-ink/20 mt-1">Cek status pengajuan retur yang pernah Anda ajukan</p>
                        </div>
                        <Link href="/login" className="inline-block px-6 py-2.5 bg-rose text-white text-xs md:text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors">Login</Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4 lg:pt-0 pt-4">
            <div className="border border-ink/5 bg-white rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-ink/5 bg-ink/[0.01]">
                <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/30">Kebijakan Retur</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {TRUST_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 bg-ink/[0.02] border border-ink/5 rounded-sm">
                        <div className="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center">
                          <Icon size={14} className="text-rose" strokeWidth={1.5} />
                        </div>
                        <span className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider">{item.label}</span>
                        <span className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest">{item.sub}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-rose/[0.02] border border-rose/10 rounded-sm p-3 space-y-1.5">
                  {['Klaim maksimal 2x24 jam setelah barang diterima', 'Bukti video 1-shot tanpa edit WAJIB', 'Guest bisa ajukan tanpa login', 'Refund3-7 hari kerja setelah persetujuan', 'Label & tag masih menempel', 'Barang belum digunakan / dicuci'].map((text, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-3.5 h-3.5 bg-rose/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                        <Check size={7} className="text-rose" strokeWidth={2.5} />
                      </div>
                      <p className="text-xs md:text-[9px] text-ink/50 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <Link href="/help" className="block w-full text-center py-2 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">Baca Help Guide Lengkap</Link>
              </div>
            </div>

            <div className="border border-ink/5 bg-white rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-ink/5 bg-ink/[0.01]">
                <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-ink/30">Alur Pengajuan</p>
              </div>
              <div className="p-4 space-y-2">
                {[{ num: '01', text: 'Siapkan Order ID dari email konfirmasi' }, { num: '02', text: 'Rekam video unboxing 1-shot (min 30 detik)' }, { num: '03', text: 'Isi form dengan lengkap & akurat' }, { num: '04', text: 'Submit & tunggu review 1-2 hari kerja' }].map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <span className="text-[11px] md:text-[8px] font-bold text-rose shrink-0 mt-0.5">{step.num}</span>
                    <p className="text-xs md:text-[9px] text-ink/50 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {isGuest && (
              <div className="border border-amber-100 bg-amber-50 rounded-sm p-4 space-y-2">
                <p className="text-xs md:text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Info Guest</p>
                <p className="text-xs md:text-[9px] text-amber-700 leading-relaxed">Anda submit sebagai <strong>tamu</strong>. Kami akan hubungi via email untuk update status pengajuan.</p>
                <p className="text-[11px] md:text-[8px] text-amber-600 leading-relaxed">Sudah punya akun? <Link href="/login" className="underline hover:text-amber-800">Login</Link> untuk lacak retur lebih mudah.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
