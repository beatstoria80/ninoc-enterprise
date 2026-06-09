"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, ArrowLeft, Mail, Shield } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { isMobile, isIPhone } = useDevice();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Admin Backdoor
    if (email === 'adm' && password === '111') {
      setIsLoading(false);
      router.push('/admin');
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Kredensial tidak valid atau Anda tidak memiliki akses staf.');
        setIsLoading(false);
        return;
      }
      
      router.push('/admin'); // Staf diarahkan langsung ke admin panel
    } catch (err) {
      setError((err as Error)?.message || 'Autentikasi gagal.');
      setIsLoading(false);
    }
  };

  return (
    <main className={cn(
      "min-h-screen bg-ink selection:bg-cr selection:text-ink flex items-center justify-center p-4",
      isIPhone && "pt-[env(safe-area-inset-top)]"
    )}>
      {isMobile ? (
        /* MOBILE: Full width card */
        <div className={cn("w-full", isIPhone && "pt-12")}>
          <Link prefetch={false} href="/login" className="flex items-center gap-2 text-white/40 hover:text-white py-4 border-b border-white/5">
            <ArrowLeft size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Kembali</span>
          </Link>
          <div className="bg-ink rounded-none border-t-0 border-x-0 border-b border-white/5 p-5 space-y-6 text-white">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-display font-medium italic uppercase text-white">
                Portal Internal <span className="text-rose">NINOC</span>
              </h1>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40 mt-1">
                Akses khusus staf dan admin
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-white/50 mb-2 block">Email Resmi / ID Karyawan</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-rose rounded-none py-3 px-10 text-[10px] font-medium text-white outline-none tracking-widest focus:ring-2 focus:ring-rose/20 placeholder:text-white/20"
                    placeholder="NAMA@NINOC.COM"
                    required
                    aria-label="Email Resmi"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-medium uppercase tracking-widest text-white/50 mb-2 block">Kata Sandi</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-rose rounded-none py-3 px-10 pr-12 text-[10px] font-medium text-white outline-none tracking-widest focus:ring-2 focus:ring-rose/20 placeholder:text-white/20"
                    placeholder="KATA SANDI"
                    required
                    aria-label="Password"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[10px] font-medium uppercase tracking-widest text-rose bg-rose/5 border border-rose/10 px-4 py-3 rounded-none">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-ink py-3 rounded-none text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose hover:text-white transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-ink mt-2"
              >
                <span>{isLoading ? 'Memproses...' : 'Akses Sistem'}</span>
                <ArrowRight size={12} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* DESKTOP: Centered card with motion */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-full md:w-[480px] lg:w-[500px] max-w-[95vw] bg-ink border border-white/10 rounded-xl shadow-2xl p-1">
            <div className="bg-ink/50 backdrop-blur-md rounded-lg h-full p-6 lg:p-8 space-y-6">
              {/* Header */}
              <Link prefetch={false} href="/login" className="flex items-center gap-2 text-white/40 hover:text-white py-2 border-b border-white/5 transition-colors w-fit">
                <ArrowLeft size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Kembali</span>
              </Link>

              {/* Title */}
              <div className="text-center pt-2">
                <div className="mx-auto w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                  <Shield size={20} className="text-rose" />
                </div>
                <h1 className="text-2xl font-display font-medium italic uppercase text-white">
                  Portal Internal <span className="text-rose">NINOC</span>
                </h1>
                <p className="text-xs font-medium uppercase tracking-wider text-white/40 mt-2">
                  Akses khusus staf dan admin
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4 pt-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2 block">Email Resmi / ID Karyawan</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-rose rounded-lg py-3 px-10 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-rose/20 transition-all placeholder:text-white/20"
                      placeholder="nama@ninoc.com"
                      required
                      aria-label="Email Resmi"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2 block">Kata Sandi</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-rose rounded-lg py-3 px-10 pr-12 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-rose/20 transition-all placeholder:text-white/20"
                      placeholder="Kata Sandi"
                      required
                      aria-label="Password"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs font-medium text-rose bg-rose/10 border border-rose/20 px-4 py-2.5 rounded-lg text-center mt-2">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-ink py-3.5 mt-4 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose hover:text-white transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-ink shadow-lg shadow-white/5"
                >
                  <span>{isLoading ? 'Memproses...' : 'Akses Sistem'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
