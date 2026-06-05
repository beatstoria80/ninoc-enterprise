"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReturForm } from '@/components/ReturForm';
import { ReturStatus } from '@/components/ReturStatus';
import { supabase } from '@/lib/supabase';

export default function ReturPage() {
  const router = useRouter();
  const [view, setView] = useState<'form' | 'status'>('form');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-ink/5 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-ink/30 hover:text-ink transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[9px] uppercase tracking-widest">Profile</span>
          </Link>
          <h1 className="text-[10px] font-semibold uppercase tracking-widest text-ink">
            Retur & Refund
          </h1>
          <div className="w-16" />
        </div>
        {/* Tab Switcher */}
        <div className="max-w-md mx-auto px-5 pb-0 flex">
          {[
            { id: 'form' as const, label: 'Ajukan Retur' },
            { id: 'status' as const, label: 'Status Retur' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={
                'pb-2.5 px-1 text-[9px] font-semibold uppercase tracking-wider border-b-2 transition-colors ' +
                (view === tab.id ? 'border-rose text-rose' : 'border-transparent text-ink/30 hover:text-ink/60')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5 py-4">
        {checkingAuth ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border border-ink/10 border-t-rose rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ReturForm
                  className="border border-ink/5 rounded-sm shadow-sm"
                  onSuccess={() => {
                    setView('status');
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="border border-ink/5 bg-white rounded-sm shadow-sm"
              >
                <div className="p-5">
                  <ReturStatus />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
