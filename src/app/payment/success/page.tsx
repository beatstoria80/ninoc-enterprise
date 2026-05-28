"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Package, Truck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SuccessPage() {
  const { isMobile, isIPhone } = useDevice();

  return (
    <main className={cn(
      "min-h-screen bg-cr noise flex items-center justify-center p-6",
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

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("max-w-2xl w-full space-y-8", isMobile && "pt-16")}
      >
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
          >
            <CheckCircle size={40} />
          </motion.div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose/10 rounded-full blur-xl" />
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-display font-medium italic text-ink tracking-tighter">Payment Successful.</h1>
          <p className="text-[11px] text-ink/50 font-medium uppercase tracking-[0.1em] leading-relaxed max-w-md mx-auto">
            Thank you for your purchase. We are now processing your order.
          </p>
        </div>

        {/* INTERACTIVE TIMELINE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-ink/5 p-6 md:p-8 shadow-xl shadow-ink/5 relative overflow-hidden"
        >
           <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-8 flex items-center justify-between border-b border-ink/5 pb-4">
              <span>Shipment Protocol</span>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[8px] text-emerald-600 uppercase">Live Update</span>
              </div>
           </h3>
           
           <div className="relative pl-8 md:pl-10 border-l-2 border-ink/5 ml-6 md:ml-8 mt-6 space-y-8">
              
              {/* Step 1: Active */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="relative group"
              >
                 <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <ShieldCheck size={18} strokeWidth={2.5} className="animate-pulse" />
                 </div>
                 <div className="bg-emerald-50/50 border border-emerald-500/20 p-5 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center gap-3 mb-1.5 relative">
                      <h4 className="text-[12px] font-bold uppercase tracking-widest text-emerald-700">Payment Confirmed</h4>
                      <span className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-[9px] font-medium tracking-[0.15em] text-emerald-600/70 uppercase flex items-center gap-1.5 relative">
                      <Clock size={12} strokeWidth={2} /> Just Now • System Authenticated
                    </p>
                 </div>
              </motion.div>

              {/* Step 2: Processing */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                className="relative group hover:scale-[1.01] transition-transform"
              >
                 <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                    <Package size={18} strokeWidth={2} />
                 </div>
                 <div className="p-5 border border-ink/5 rounded-xl bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 group-hover:text-ink/70 transition-colors">Processing in Atelier</h4>
                    </div>
                    <p className="text-[9px] font-medium tracking-[0.15em] text-ink/30 uppercase">Pending Quality Control</p>
                 </div>
              </motion.div>

              {/* Step 3: Logistics */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                className="relative group hover:scale-[1.01] transition-transform"
              >
                 <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                    <Truck size={18} strokeWidth={2} />
                 </div>
                 <div className="p-5 border border-ink/5 rounded-xl bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 group-hover:text-ink/70 transition-colors">Handed to Logistics</h4>
                    </div>
                    <p className="text-[9px] font-medium tracking-[0.15em] text-ink/30 uppercase">Awaiting Pickup via Biteship</p>
                 </div>
              </motion.div>
           </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6"
        >
          <Link href="/shop" className="w-full md:w-auto bg-ink text-white px-8 py-4 rounded-none text-[10px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose active:scale-[0.98] transition-all shadow-xl shadow-ink/5 group">
            Continue Collecting
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/" className="w-full md:w-auto px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose transition-colors text-center border border-transparent hover:border-rose/20">
            Return to Atelier
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
