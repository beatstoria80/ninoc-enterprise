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
    <main className="min-h-screen bg-cr noise pb-40">
      {/* HEADER SECTION (Static, No Overlap) */}
      <div className="pt-32 px-6 max-w-4xl mx-auto space-y-12">
        
        {/* Navigation & Language Switcher */}
        <div className="flex items-center justify-between border-b border-ink/5 pb-8">
          <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Back to Atelier</span>
          </Link>

          <div className="flex items-center gap-3 text-[10px] font-medium tracking-widest">
            <button 
              onClick={() => setLang('ID')}
              className={`transition-all ${lang === 'ID' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}
            >
              ID
            </button>
            <span className="text-ink/10">|</span>
            <button 
              onClick={() => setLang('EN')}
              className={`transition-all ${lang === 'EN' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Title Section */}
        <section className="space-y-4 text-center py-10">
          <motion.div 
            key={`icon-${lang}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-rose/5 rounded-2xl flex items-center justify-center text-rose mx-auto mb-6"
          >
            <Scale size={32} />
          </motion.div>
          <motion.h1 
            key={`title-${lang}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-medium italic tracking-tighter text-ink uppercase"
          >
            {t.title}
          </motion.h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-ink/20">{t.updated}</p>
        </section>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          <motion.article 
            key={lang}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-16"
          >
            {t.sections.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-xl font-display font-medium italic text-ink border-l-4 border-rose pl-6 uppercase tracking-tight">
                  {section.title}
                </h2>
                {section.text && (
                  <p className="text-sm font-medium leading-relaxed text-ink/60 pl-7">
                    {section.text}
                  </p>
                )}
                {section.items && (
                  <ul className="space-y-4 pl-7">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-sm font-medium text-ink/60">
                        <div className="w-1.5 h-1.5 bg-rose rounded-full mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Trust Indicator */}
            <div className="pt-20 border-t border-ink/5 flex flex-col items-center gap-6">
              <div className="flex items-center gap-8 opacity-20">
                <Globe size={24} />
                <Languages size={24} />
                <Shield size={24} />
              </div>
              <p className="text-[9px] font-medium uppercase tracking-[0.5em] text-ink/10 text-center">
                NINOC ENTERPRISE — LEGAL ARCHIVE SYSTEM v2.0
              </p>
            </div>
          </motion.article>
        </AnimatePresence>
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
