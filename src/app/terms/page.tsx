"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scale, Languages, Globe } from 'lucide-react';
import Link from 'next/link';

type Language = 'EN' | 'ID';

export default function TermsPage() {
  const [lang, setLang] = useState<Language>('ID');

  const content = {
    EN: {
      title: "Terms & Conditions",
      updated: "Last Updated: May 7, 2026",
      sections: [
        {
          title: "1. Conditions of Use",
          text: "NINOC ATELIER is offered to you, the user, conditioned on your acceptance of the terms, conditions and notices contained or incorporated by reference herein. Your use of this Site constitutes your agreement to all such terms, conditions and notices."
        },
        {
          title: "2. Overview",
          text: "Please read these terms carefully. By using this Site, you agree to these Terms and Conditions, as well as any other terms, guidelines or rules that are applicable to any portion of this Site. If you do not agree, you must exit the Site immediately."
        },
        {
          title: "3. Modification",
          text: "NINOC ATELIER reserves the right to change, modify, or update the prices, information, and content of this site at any time without prior notice. Continued use of the site constitutes agreement to such changes."
        },
        {
          title: "4. Shipping & Risk of Loss",
          text: "All items purchased from NINOC ATELIER are made pursuant to a shipment contract. This means that the risk of loss and title for such items pass to you upon our delivery to the carrier (Expedition service)."
        },
        {
          title: "5. Conditions of Returns",
          items: [
            "Items must be returned within 7 days from the date it is received.",
            "Items must be in original condition with all tags attached.",
            "Sale items are not eligible for returns.",
            "Shipping and handling charges are not refundable."
          ]
        }
      ]
    },
    ID: {
      title: "Syarat & Ketentuan",
      updated: "Terakhir Diperbarui: 7 Mei 2026",
      sections: [
        {
          title: "1. Syarat Penggunaan",
          text: "NINOC ATELIER ditawarkan kepada Anda, pengguna, dengan syarat penerimaan Anda atas syarat, ketentuan, dan pemberitahuan yang terkandung di sini. Penggunaan Anda atas Situs ini merupakan persetujuan Anda terhadap semua syarat, ketentuan, dan pemberitahuan tersebut."
        },
        {
          title: "2. Ringkasan",
          text: "Harap baca ketentuan ini dengan cermat. Dengan menggunakan Situs ini, Anda menyetujui Syarat dan Ketentuan ini, serta ketentuan, pedoman, atau aturan lain yang berlaku untuk bagian mana pun dari Situs ini. Jika Anda tidak setuju, Anda harus segera meninggalkan Situs."
        },
        {
          title: "3. Perubahan",
          text: "NINOC ATELIER berhak untuk mengubah, memodifikasi, atau memperbarui harga, informasi, dan konten situs ini kapan saja tanpa pemberitahuan sebelumnya. Penggunaan situs yang berkelanjutan merupakan persetujuan atas perubahan tersebut."
        },
        {
          title: "4. Pengiriman & Risiko Kehilangan",
          text: "Semua barang yang dibeli dari NINOC ATELIER dibuat sesuai dengan kontrak pengiriman. Ini berarti bahwa risiko kehilangan dan kepemilikan barang tersebut berpindah kepada Anda setelah pengiriman kami ke pihak ekspedisi."
        },
        {
          title: "5. Ketentuan Pengembalian",
          items: [
            "Barang harus dikembalikan dalam waktu 7 hari sejak tanggal diterima.",
            "Barang harus dalam kondisi asli dengan semua label terpasang.",
            "Barang diskon/sale tidak dapat dikembalikan.",
            "Biaya pengiriman dan penanganan tidak dapat dikembalikan."
          ]
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

      {/* CONTENT AREA - SINGLE SCREEN GRID */}
      <div className="flex-1 pt-24 pb-8 px-6 md:px-12 overflow-hidden flex flex-col max-w-[1600px] mx-auto w-full">
        
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

        {/* High-Density Industrial Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden pb-4">
          
          {/* Sector A: Primary Rules */}
          <div className="space-y-4 flex flex-col">
            {[t.sections[0], t.sections[1]].map((section, idx) => (
              <div key={idx} className="bg-white border border-ink/5 p-4 rounded-lg space-y-2 flex-1 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 border-b border-ink/5 pb-1">
                   <span className="text-[8px] font-medium text-rose tracking-tighter uppercase">Section 0{idx + 1}</span>
                   <h2 className="text-[10px] font-display font-medium italic text-ink uppercase tracking-wider">{section.title}</h2>
                </div>
                <p className="text-[9px] font-medium leading-tight text-ink/50 uppercase tracking-wide">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          {/* Sector B: Logistics & Change */}
          <div className="space-y-4 flex flex-col">
            {[t.sections[2], t.sections[3]].map((section, idx) => (
              <div key={idx} className="bg-white border border-ink/5 p-4 rounded-lg space-y-2 flex-1 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 border-b border-ink/5 pb-1">
                   <span className="text-[8px] font-medium text-rose tracking-tighter uppercase">Section 0{idx + 3}</span>
                   <h2 className="text-[10px] font-display font-medium italic text-ink uppercase tracking-wider">{section.title}</h2>
                </div>
                <p className="text-[9px] font-medium leading-tight text-ink/50 uppercase tracking-wide">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          {/* Sector C: Returns & Final Archive */}
          <div className="flex flex-col space-y-4">
            <div className="bg-ink text-white p-5 rounded-lg space-y-3 flex-1 shadow-xl">
               <div className="flex items-center gap-2 border-b border-white/10 pb-1">
                  <span className="text-[8px] font-medium text-rose tracking-tighter uppercase">Section 05</span>
                  <h2 className="text-[10px] font-display font-medium italic text-white uppercase tracking-wider">{t.sections[4].title}</h2>
               </div>
               <ul className="space-y-2">
                 {t.sections[4].items?.map((item, i) => (
                   <li key={i} className="flex items-start gap-2 text-[8px] font-medium uppercase tracking-widest text-white/50">
                     <div className="w-1 h-1 bg-rose rounded-full mt-1.5 flex-shrink-0" />
                     <span>{item}</span>
                   </li>
                 ))}
               </ul>
            </div>

            {/* Micro Archive Footer */}
            <div className="bg-white/30 border border-ink/5 rounded-lg p-4 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex items-center gap-4 opacity-10">
                <Globe size={14} />
                <Scale size={14} />
                <Shield size={14} />
              </div>
              <p className="text-[6px] font-medium uppercase tracking-[0.5em] text-ink/20 leading-relaxed">
                NINOC ENTERPRISE — LEGAL ARCHIVE PROTOCOL<br/>
                HIGH-INTEGRITY DOCUMENTATION SYSTEM v2.1
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function Shield({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
