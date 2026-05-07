"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-cr noise flex items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
          >
            <CheckCircle size={48} />
          </motion.div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose/10 rounded-full blur-xl" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-display font-black italic text-ink tracking-tighter">Art in Motion.</h1>
          <p className="text-sm text-muted-text font-medium leading-relaxed">
            Your transaction was successful. We are now preparing your artistic pieces for delivery. A confirmation email has been sent to your archive.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-8">
          <Link href="/shop" className="bg-ink text-white py-5 rounded-full label-caps text-[10px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20 group">
            Continue Collecting
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30 hover:text-rose transition-colors">
            Return to Atelier
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
