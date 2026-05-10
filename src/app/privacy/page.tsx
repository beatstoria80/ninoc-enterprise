"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cr noise pb-20">
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-8 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Back to Atelier</span>
        </Link>
        <div className="font-display font-medium text-2xl italic tracking-tighter text-rose">PRIVACY</div>
        <div className="w-10" />
      </nav>

      <div className="pt-40 px-6 max-w-4xl mx-auto space-y-16">
        <section className="space-y-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-rose/5 rounded-2xl flex items-center justify-center text-rose mx-auto mb-6"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <h1 className="text-5xl font-display font-medium italic tracking-tighter text-ink">Privacy Policy</h1>
          <p className="label-caps text-ink/30">Your data, secured with artful integrity.</p>
        </section>

        <article className="prose prose-sm max-w-none text-ink/80 space-y-12 leading-relaxed">
          <div className="bg-white p-8 rounded-[2rem] border border-ink/5 shadow-dashboard space-y-4">
            <div className="flex items-center gap-3 text-rose">
              <Lock size={20} />
              <h2 className="text-xl font-display font-medium italic text-ink m-0">Your Information is Safe</h2>
            </div>
            <p className="m-0">NINOC ATELIER understands that privacy concerns are extremely important to our customers. You can rest assured that any information you submit to us will not be misused, abused or sold to any other parties.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium italic text-ink border-l-4 border-rose pl-4">Data Collection</h2>
            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or communicate with our atelier. This may include your name, email, phone number, and shipping address.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium italic text-ink border-l-4 border-rose pl-4">Use of Information</h2>
            <p>We only use your personal information to complete your order, provide customer support, and, if you opt-in, send you newsletters about our latest collections and special offers.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-medium italic text-ink border-l-4 border-rose pl-4">Secure Transactions</h2>
            <p>All financial transactions are processed through Midtrans, our secure payment gateway. We do not store your credit card or sensitive financial information on our servers.</p>
          </div>

          <div className="pt-12 border-t border-ink/5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink/20">© 2026 NINOC ENTERPRISE - Privacy Archive</p>
          </div>
        </article>
      </div>
    </main>
  );
}
