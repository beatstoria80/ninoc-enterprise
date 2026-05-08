"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Lock, ArrowRight, Mail } from 'lucide-react';
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Hardcoded Admin Backdoor
    if (email === 'adm' && password === '111') {
      setTimeout(() => {
        router.push('/admin');
      }, 500);
      return;
    }

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email to verify your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/onboarding'); // Complete profile data first
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred during authentication.');
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
          redirectTo: `${window.location.origin}/auth/callback`, // Standard Supabase callback
        }
      });
      if (error) throw error;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to authenticate with Google.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink/5 selection:bg-ink selection:text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-rose/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-ink/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-[10px] p-10 md:p-14 shadow-2xl shadow-ink/10 relative z-10 border border-ink/5"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-ink/30 hover:text-ink transition-colors mb-10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Return</span>
        </Link>

        <div className="space-y-2 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-ink uppercase">
            {isSignUp ? (
              <>Join <span className="text-rose italic">Archive</span></>
            ) : (
              <>Access <span className="text-rose italic">Portal</span></>
            )}
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/40">
            {isSignUp ? 'Create your new account' : 'System Authentication Required'}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border border-ink/10 text-ink py-4 rounded-[10px] text-xs font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-ink/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-ink/5"></div>
            <span className="flex-shrink-0 mx-4 text-ink/20 text-[10px] font-medium uppercase tracking-[0.2em]">OR EMAIL</span>
            <div className="flex-grow border-t border-ink/5"></div>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 pl-4">Email / Username</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30">
                <Mail size={18} />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink/5 border-2 border-transparent focus:border-rose focus:bg-white rounded-[10px] py-4 pl-12 pr-4 text-sm font-medium text-ink outline-none transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 pl-4">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink/5 border-2 border-transparent focus:border-rose focus:bg-white rounded-[10px] py-4 pl-12 pr-4 text-sm font-medium text-ink outline-none transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose text-xs font-medium bg-rose/5 p-3 rounded-[10px]">
              {error}
            </motion.p>
          )}

          {message && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 text-xs font-medium bg-emerald-50 p-3 rounded-[10px]">
              {message}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ink text-white py-5 rounded-[10px] text-[11px] font-medium uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group mt-8"
          >
            <span>{isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
            {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink/40">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} 
              className="ml-2 text-ink hover:text-rose transition-colors underline"
              type="button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <div className="flex items-center justify-center pt-2">
            <Link 
              href="/checkout" 
              className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/20 hover:text-rose transition-colors flex items-center gap-2 group"
            >
              <span>Continue as Guest</span>
              <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

      </motion.div>
    </main>
  );
}
