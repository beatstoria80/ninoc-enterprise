"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { createClient } from '@/utils/supabase/client';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RegisterPage() {
  const router = useRouter();
  const { isMobile, isIPhone } = useDevice();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError((err as Error).message || 'Google auth gagal.');
      setIsLoading(false);
    }
  };

  return (
    <main className={cn(
      "min-h-screen bg-cr selection:bg-ink selection:text-white flex items-center justify-center p-4",
      isIPhone && "pt-[env(safe-area-inset-top)]"
    )}>
      {/* MOBILE NAV BAR */}
      {isMobile && (
        <nav className={cn(
          "fixed top-0 inset-x-0 z-[150] bg-white/95 backdrop-blur-xl border-b border-ink/5",
          isIPhone && "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="flex items-center justify-center py-3">
            <div className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</div>
          </div>
        </nav>
      )}

      {isMobile ? (
        /* MOBILE: Full width card */
        <div className={cn("w-full", isIPhone && "pt-12")}>
          <Link  href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose py-4 border-b border-ink/5">
            <ArrowLeft size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Kembali</span>
          </Link>
          <div className="bg-white rounded-none border-t-0 border-x-0 border-b border-ink/5 p-5 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-display font-medium italic uppercase text-ink">
                Daftar Akun <span className="text-rose">Baru</span>
              </h1>
              <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mt-1">
                Jadilah bagian dari NINOC
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white border border-ink/10 text-ink py-4 rounded-none text-xs md:text-[10px] uppercase tracking-widest font-medium flex items-center justify-center gap-3 hover:bg-ink/5 transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 shadow-sm"
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Daftar dengan Google
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-rose bg-rose/5 border border-rose/10 px-4 py-3 rounded-none">{error}</p>
            )}

            {/* Link to Login */}
            <div className="pt-6 border-t border-ink/5">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-ink/40">
                Sudah punya akun?{' '}
                <Link  href="/login" className="text-rose font-bold hover:text-ink transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP: Centered card with motion */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-full md:w-[500px] lg:w-[560px] max-w-[95vw] bg-white rounded-xl border border-ink/5 shadow-dashboard">
            {/* Header */}
            <Link  href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose py-4 px-6 lg:px-12 border-b border-ink/5 transition-colors">
              <ArrowLeft size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">Kembali</span>
            </Link>

            <div className="p-6 lg:p-10 lg:px-12 space-y-6 lg:space-y-8">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-display font-medium italic uppercase text-ink">
                  Daftar Akun <span className="text-rose">Baru</span>
                </h1>
                <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mt-2">
                  Jadilah bagian dari NINOC
                </p>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white border border-ink/10 text-ink py-4 rounded-lg text-sm font-medium flex items-center justify-center gap-3 hover:bg-ink/5 transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 shadow-sm"
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Daftar dengan Google
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <p className="text-xs font-medium text-rose bg-rose/5 px-4 py-2 rounded-lg text-center border border-rose/10">{error}</p>
              )}

              {/* Link to Login */}
              <div className="pt-6 border-t border-ink/5">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-ink/50">
                  Sudah punya akun?{' '}
                  <Link  href="/login" className="text-rose font-bold hover:text-ink transition-colors">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Trust Security Bar - PLACED BELOW CARD */}
          <div className="flex justify-center gap-12 pt-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
                <Shield size={12} strokeWidth={1.5} className="text-rose/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink">Aman</span>
                <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">Proteksi Data</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm">
                <Lock size={12} strokeWidth={1.5} className="text-rose/60" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink">Enkripsi</span>
                <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">SSL Terjamin</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
