"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, FileText, Scale } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cr noise pb-20">
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-8 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Atelier</span>
        </Link>
        <div className="font-display font-black text-2xl italic tracking-tighter text-rose">TERMS</div>
        <div className="w-10" />
      </nav>

      <div className="pt-40 px-6 max-w-4xl mx-auto space-y-16">
        <section className="space-y-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-rose/5 rounded-2xl flex items-center justify-center text-rose mx-auto mb-6"
          >
            <Scale size={32} />
          </motion.div>
          <h1 className="text-5xl font-display font-black italic tracking-tighter text-ink">Terms & Conditions</h1>
          <p className="label-caps text-ink/30">Last Updated: May 7, 2026</p>
        </section>

        <article className="prose prose-sm max-w-none text-ink/80 space-y-12 leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl font-display font-black italic text-ink border-l-4 border-rose pl-4">1. Conditions of Use</h2>
            <p>NINOC ATELIER is offered to you, the user, conditioned on your acceptance of the terms, conditions and notices contained or incorporated by reference herein. Your use of this Site constitutes your agreement to all such terms, conditions and notices.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-black italic text-ink border-l-4 border-rose pl-4">2. Overview</h2>
            <p>Please read these terms carefully. By using this Site, you agree to these Terms and Conditions, as well as any other terms, guidelines or rules that are applicable to any portion of this Site. If you do not agree, you must exit the Site immediately.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-black italic text-ink border-l-4 border-rose pl-4">3. Modification</h2>
            <p>NINOC ATELIER reserves the right to change, modify, or update the prices, information, and content of this site at any time without prior notice. Continued use of the site constitutes agreement to such changes.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-black italic text-ink border-l-4 border-rose pl-4">4. Shipping & Risk of Loss</h2>
            <p>All items purchased from NINOC ATELIER are made pursuant to a shipment contract. This means that the risk of loss and title for such items pass to you upon our delivery to the carrier (Expedition service).</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-black italic text-ink border-l-4 border-rose pl-4">5. Conditions of Returns</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Items must be returned within 7 days from the date it is received.</li>
              <li>Items must be in original condition with all tags attached.</li>
              <li>Sale items are not eligible for returns.</li>
              <li>Shipping and handling charges are not refundable.</li>
            </ul>
          </div>

          <div className="pt-12 border-t border-ink/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink/20">© 2026 NINOC ENTERPRISE - All Rights Reserved</p>
          </div>
        </article>
      </div>
    </main>
  );
}
