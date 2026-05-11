"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailHint, setShowEmailHint] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowEmailHint(false);
    setIsLoading(true);

    // Admin Backdoor
    if (email === 'adm' && password === '111') {
      setTimeout(() => router.push('/admin'), 500);
      return;
    }

    try {
      if (isSignUp) {
        const { data: existingUser } = await supabase
          .from('customer_profiles')
          .select('email')
          .eq('email', email)
          .single();

        if (existingUser) {
          setShowEmailHint(true);
          setIsLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Registrasi berhasil! Cek email untuk verifikasi.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setShowEmailHint(true);
            setIsLoading(false);
            return;
          }
          throw signInError;
        }
        router.push('/onboarding');
      }
    } catch (err) {
      setError((err as Error).message || 'Autentikasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

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
      setError((err as Error).message || 'Google auth gagal.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cr selection:bg-ink selection:text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl border border-ink/5 shadow-dashboard"
      >
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose py-4 px-6 border-b border-ink/5">
          <ArrowLeft size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Kembali</span>
        </Link>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-display font-medium italic uppercase text-ink">
              {isSignUp ? 'Daftar' : 'Masuk'} <span className="text-rose">NINOC</span>
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mt-1">
              {isSignUp ? 'Buat akun baru' : 'Autentikasi diperlukan'}
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border border-ink/10 text-ink py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-3 hover:bg-ink/5 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Lanjutkan dengan Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-ink/5" />
            <span className="px-4 text-xs font-medium text-ink/25">ATAU</span>
            <div className="flex-grow border-t border-ink/5" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-ink/50 mb-2 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setShowEmailHint(false); setError(''); }}
                  className="w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-3 px-10 text-sm font-medium text-ink outline-none"
                  placeholder="email@contoh.com"
                  required
                />
              </div>
              {/* Hint */}
              <AnimatePresence>
                {showEmailHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 bg-rose/10 border border-rose/20 rounded-lg px-4 py-2 flex items-center gap-2"
                  >
                    <AlertCircle size={14} className="text-rose" />
                    <p className="text-xs font-medium text-rose">
                      {isSignUp ? 'Email sudah terdaftar. Gunakan login.' : 'Email belum terdaftar.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            {!isSignUp && !showEmailHint && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-ink/50 mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/25" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-3 px-10 text-sm font-medium text-ink outline-none"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs font-medium text-rose bg-rose/5 px-4 py-2 rounded-lg">{error}</p>
            )}

            {/* Success */}
            {message && (
              <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">{message}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ink text-white py-3 rounded-lg text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Memproses...' : (isSignUp ? 'Daftar' : 'Masuk')}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setShowEmailHint(false); }} className="text-xs font-medium text-ink/40 hover:text-rose">
              {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya? Daftar'}
            </button>
          </p>

          {/* Guest */}
          <div className="pt-4 border-t border-ink/5">
            <Link href="/checkout" className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-ink/30 hover:text-rose">
              <span>Lanjut sebagai Tamu</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}