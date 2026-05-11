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
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailHint, setShowEmailHint] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowEmailHint(false);
    setIsLoading(true);

    // Hardcoded Admin Backdoor
    if (email === 'adm' && password === '111') {
      setTimeout(() => router.push('/admin'), 500);
      return;
    }

    try {
      if (isSignUp) {
        // For sign up, check if email already exists
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

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email to verify.');
      } else {
        // For login, try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Check if it's "not found" vs wrong password
          if (signInError.message.includes('Invalid login credentials')) {
            // Email exists but wrong password - show hint
            setShowEmailHint(true);
            setIsLoading(false);
            return;
          }
          throw signInError;
        }
        router.push('/onboarding');
      }
    } catch (err) {
      const errorMsg = err as Error;
      setError(errorMsg.message || 'Authentication failed.');
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
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err) {
      setError((err as Error).message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cr selection:bg-ink selection:text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-xl border border-ink/5 shadow-dashboard relative z-10"
      >
        <Link href="/" className="flex items-center gap-2 text-ink/30 hover:text-rose py-3 px-5 border-b border-ink/5">
          <ArrowLeft size={12} />
          <span className="text-[8px] font-medium uppercase tracking-widest">Return</span>
        </Link>

        <div className="p-5 space-y-4">
          <div>
            <h1 className="text-lg font-display font-medium italic uppercase tracking-tight text-ink">
              {isSignUp ? 'Join' : 'Access'} <span className="text-rose">Archive</span>
            </h1>
            <p className="text-[8px] font-medium uppercase tracking-widest text-ink/30">
              {isSignUp ? 'Create account' : 'Authentication required'}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border border-ink/5 text-ink py-2.5 rounded-lg text-[9px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/5 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-ink/5" />
            <span className="flex-shrink-0 mx-3 text-[7px] font-medium uppercase tracking-widest text-ink/15">OR</span>
            <div className="flex-grow border-t border-ink/5" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <label className="text-[7px] font-medium uppercase tracking-widest text-ink/30 mb-1 block">Email</label>
              <div className="relative">
                <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/20" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setShowEmailHint(false); setError(''); }}
                  className="w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-2 px-8 text-[10px] font-medium text-ink outline-none placeholder:text-ink/15"
                  placeholder="email@example.com"
                  required
                />
              </div>
              {/* Email Hint Popover */}
              <AnimatePresence>
                {showEmailHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 mt-1 bg-rose/10 border border-rose/20 rounded-lg px-3 py-2 flex items-center gap-2 z-20"
                  >
                    <AlertCircle size={10} className="text-rose flex-shrink-0" />
                    <p className="text-[8px] font-medium text-rose">
                      {isSignUp ? 'Email sudah terdaftar. Gunakan fitur login.' : 'Email belum terdaftar.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!isSignUp && !showEmailHint && (
              <div className="relative">
                <label className="text-[7px] font-medium uppercase tracking-widest text-ink/30 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/20" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-ink/[0.03] border border-ink/5 focus:border-rose rounded-lg py-2 px-8 text-[10px] font-medium text-ink outline-none"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-[8px] font-medium text-rose bg-rose/5 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ink text-white py-3 rounded-lg text-[9px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
              <ArrowRight size={10} />
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setShowEmailHint(false); }} className="text-[8px] font-medium text-ink/30 hover:text-rose">
              {isSignUp ? 'Sudah punya akun? Sign In' : 'Belum daftar? Sign Up'}
            </button>
          </div>

          {/* Guest Checkout */}
          <div className="pt-2 border-t border-ink/5">
            <Link href="/checkout" className="flex items-center justify-center gap-1.5 text-[8px] font-medium uppercase tracking-widest text-ink/20 hover:text-rose">
              <span>Lanjut sebagai Guest</span>
              <ArrowRight size={9} />
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}