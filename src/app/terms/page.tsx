"use client";

import React, { useState } from 'react';
import { ArrowLeft, Scale, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LegalArchivePage() {
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  const content = {
    EN: {
      title: "LEGAL ARCHIVE",
      updated: "VER 2.1 / MAY 2026",
      terms: [
        { id: "T1", title: "Conditions of Use", text: "NINOC ATELIER is offered to you conditioned on your acceptance of the terms contained herein. Use of this Site constitutes agreement." },
        { id: "T2", title: "Overview", text: "By using this Site, you agree to these Terms, guidelines and rules. If you do not agree, you must exit the Site immediately." },
        { id: "T3", title: "Modification", text: "NINOC reserves the right to change prices and content at any time without prior notice. Continued use constitutes agreement." },
        { id: "T4", title: "Shipment", text: "Risk of loss passes to you upon our delivery to the carrier. All items are made pursuant to a shipment contract." },
        { id: "T5", title: "Returns", text: "Items must be returned within 7 days in original condition. Sale items are not eligible for returns." }
      ],
      privacy: [
        { id: "P1", title: "Data Security", text: "We guarantee confidentiality. Your information will not be misused, abused or sold to third parties." },
        { id: "P2", title: "Info Collection", text: "We collect name, email, and address for order processing only. Data is protected by industrial encryption." },
        { id: "P3", title: "Transactions", text: "Processed through Midtrans secure gateway. We do not store credit card or sensitive financial info." }
      ]
    },
    ID: {
      title: "ARSIP LEGAL",
      updated: "VER 2.1 / MEI 2026",
      terms: [
        { id: "T1", title: "Syarat Penggunaan", text: "NINOC ATELIER ditawarkan kepada Anda dengan syarat penerimaan Anda atas ketentuan ini. Penggunaan Situs merupakan persetujuan." },
        { id: "T2", title: "Ringkasan", text: "Dengan menggunakan Situs ini, Anda menyetujui Syarat dan Ketentuan ini, serta ketentuan, pedoman, atau aturan lain yang berlaku. Jika tidak setuju, silakan tinggalkan Situs." },
        { id: "T3", title: "Perubahan", text: "NINOC berhak mengubah harga dan konten kapan saja tanpa pemberitahuan. Penggunaan berkelanjutan adalah bentuk persetujuan." },
        { id: "T4", title: "Pengiriman", text: "Risiko kehilangan berpindah tangan setelah penyerahan barang ke pihak ekspedisi berdasarkan kontrak pengiriman." },
        { id: "T5", title: "Pengembalian", text: "Barang harus dikembalikan dalam 7 hari dengan kondisi asli. Barang diskon tidak dapat dikembalikan." }
      ],
      privacy: [
        { id: "P1", title: "Keamanan Data", text: "Kami menjamin kerahasiaan data. Informasi Anda tidak akan disalahgunakan atau dijual kepada pihak ketiga." },
        { id: "P2", title: "Koleksi Data", text: "Kami mengumpulkan nama dan alamat hanya untuk pengiriman. Data dilindungi oleh enkripsi standar industri." },
        { id: "P3", title: "Transaksi", text: "Diproses melalui gateway Midtrans. Kami tidak menyimpan data kartu kredit atau info keuangan sensitif Anda." }
      ]
    }
  };

  const t = content[lang];
  const allSections = [...t.terms, ...t.privacy];

  return (
    <main className="h-screen bg-cr noise overflow-hidden flex flex-col">
      {/* COMPACT NAV */}
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-4 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-3 text-ink/40 hover:text-rose transition-all group">
          <ArrowLeft size={12} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/20">Studio Exit</span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-ink">Back to Atelier</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[9px] font-display font-medium italic tracking-tighter text-rose uppercase">NINOC ARCHIVE</span>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-medium tracking-widest border border-ink/5 rounded-full px-3 py-1.5 bg-white/50 shadow-sm">
          <button onClick={() => setLang('ID')} className={`transition-all ${lang === 'ID' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>ID</button>
          <span className="text-ink/5">|</span>
          <button onClick={() => setLang('EN')} className={`transition-all ${lang === 'EN' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>EN</button>
        </div>
      </nav>

      {/* UNIFIED ARCHIVE GRID */}
      <div className="flex-1 pt-20 pb-6 px-6 md:px-12 flex flex-col max-w-[1900px] mx-auto w-full overflow-hidden">
        
        {/* Minimal Header */}
        <div className="flex items-baseline justify-between mb-4 border-b border-ink/5 pb-2">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl md:text-2xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">{t.title}</h1>
            <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">{t.updated}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-emerald-500" />
             <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600/50">System Live</span>
          </div>
        </div>

        {/* 4x2 Industrial Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 pb-2">
          {allSections.map((s) => (
            <div key={s.id} className="bg-white border border-ink/5 p-4 rounded-lg flex flex-col justify-between shadow-sm hover:border-rose/20 transition-all group overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-ink/5 pb-1">
                  <span className="text-[7px] font-medium text-rose tracking-tighter uppercase">{s.id}</span>
                  <h2 className="text-[9px] font-display font-medium italic text-ink uppercase tracking-wider group-hover:text-rose transition-colors">{s.title}</h2>
                </div>
                <p className="text-[9px] font-medium leading-relaxed text-ink/60 uppercase tracking-wide">
                  {s.text}
                </p>
              </div>
              <div className="pt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                 <Scale size={8} className="text-rose" />
              </div>
            </div>
          ))}
        </div>

        {/* High-Density Global Legal Footer */}
        <div className="mt-2 pt-2 border-t border-ink/5 flex justify-between items-center opacity-30">
          <div className="flex gap-6">
             <div className="flex items-center gap-2">
                <Shield size={10} strokeWidth={1.5} />
                <span className="text-[7px] font-medium uppercase tracking-widest">Encrypted Archive</span>
             </div>
             <div className="flex items-center gap-2">
                <Globe size={10} strokeWidth={1.5} />
                <span className="text-[7px] font-medium uppercase tracking-widest">Global Protocol</span>
             </div>
          </div>
          <p className="text-[7px] font-medium uppercase tracking-[0.5em] text-ink">NINOC ENTERPRISE — LEGAL ARCHIVE SYSTEM v2.1</p>
        </div>
      </div>
    </main>
  );
}
