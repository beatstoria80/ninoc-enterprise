"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  const content = {
    ID: {
      title: "Privacy Policy",
      updated: "Terakhir Diperbarui: 7 Mei 2026",
      sections: [
        {
          title: "Keamanan Data",
          text: "NINOC ATELIER menjamin kerahasiaan informasi pelanggan. Data Anda tidak akan disalahgunakan atau dijual kepada pihak ketiga."
        },
        {
          title: "Koleksi Informasi",
          text: "Kami mengumpulkan informasi identitas seperti nama, email, dan alamat pengiriman hanya untuk keperluan pemrosesan pesanan."
        },
        {
          title: "Transaksi Aman",
          text: "Semua transaksi diproses melalui gateway pembayaran Midtrans yang terenkripsi. Kami tidak menyimpan data kartu kredit Anda."
        }
      ]
    },
    EN: {
      title: "Privacy Policy",
      updated: "Last Updated: May 7, 2026",
      sections: [
        {
          title: "Data Security",
          text: "NINOC ATELIER guarantees the confidentiality of customer information. Your data will not be misused or sold to third parties."
        },
        {
          title: "Info Collection",
          text: "We collect identity information such as name, email, and shipping address only for order processing purposes."
        },
        {
          title: "Secure Payment",
          text: "All transactions are processed through encrypted Midtrans payment gateways. We do not store your credit card data."
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <main className="h-screen bg-cr noise overflow-hidden flex flex-col">
      {/* FIXED TOP NAVIGATION */}
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-6 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-3 text-ink/40 hover:text-rose transition-all group">
          <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/20">Studio Exit</span>
            <span className="text-[10px] font-medium uppercase tracking-widest">Back to Atelier</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[10px] font-display font-medium italic tracking-tighter text-rose uppercase">NINOC ARCHIVE</span>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-medium tracking-widest border border-ink/5 rounded-full px-4 py-2 bg-white/50">
          <button 
            onClick={() => setLang('ID')}
            className={`transition-all ${lang === 'ID' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}
          >
            ID
          </button>
          <span className="text-ink/5">|</span>
          <button 
            onClick={() => setLang('EN')}
            className={`transition-all ${lang === 'EN' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}
          >
            EN
          </button>
        </div>
      </nav>

      {/* CONTENT AREA */}
      <div className="flex-1 pt-24 pb-8 px-6 md:px-12 overflow-hidden flex flex-col max-w-[1400px] mx-auto w-full">
        
        {/* Compact Header */}
        <div className="flex items-baseline gap-4 mb-6 border-b border-ink/5 pb-2">
          <h1 className="text-2xl md:text-3xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">
            {t.title}
          </h1>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-rose animate-pulse" />
             <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20 whitespace-nowrap">{t.updated}</span>
          </div>
        </div>

        {/* High-Density Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden pb-4">
          {t.sections.map((section, idx) => (
            <div key={idx} className="bg-white border border-ink/5 p-6 rounded-xl space-y-3 shadow-dashboard flex flex-col justify-center overflow-hidden">
              <div className="flex items-center gap-2 border-b border-ink/5 pb-1">
                 <ShieldCheck size={12} className="text-rose" />
                 <h2 className="text-[10px] font-display font-medium italic text-ink uppercase tracking-wider">{section.title}</h2>
              </div>
              <p className="text-[9px] font-medium leading-tight text-ink/50 uppercase tracking-wide">
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* Minimal Footer */}
        <div className="pt-6 flex justify-between items-center opacity-20 border-t border-ink/5">
           <p className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink">© 2026 NINOC ENTERPRISE - PRIVACY ARCHIVE</p>
           <div className="flex gap-4">
              <Lock size={10} />
              <ShieldCheck size={10} />
           </div>
        </div>
      </div>
    </main>
  );
}
