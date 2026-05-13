"use client";

import React, { useState } from 'react';
import { ArrowLeft, Scale, Globe, Shield, Lock, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  const content = {
    EN: {
      title: "LEGAL ARCHIVE",
      updated: "VER 2.1 / MAY 2026",
      terms: {
        title: "TERMS & CONDITIONS",
        sections: [
          { id: "01", title: "Conditions of Use", text: "NINOC ATELIER is offered to you conditioned on your acceptance of the terms contained herein. Use of this Site constitutes agreement." },
          { id: "02", title: "Overview", text: "By using this Site, you agree to these Terms, guidelines and rules. If you do not agree, you must exit the Site immediately." },
          { id: "03", title: "Modification", text: "NINOC reserves the right to change prices and content at any time without prior notice. Continued use constitutes agreement." },
          { id: "04", title: "Shipment", text: "Risk of loss passes to you upon our delivery to the carrier. All items are made pursuant to a shipment contract." },
          { id: "05", title: "Returns", text: "Items must be returned within 7 days in original condition. Sale items are not eligible for returns." }
        ]
      },
      privacy: {
        title: "PRIVACY POLICY",
        sections: [
          { id: "01", title: "Data Security", text: "We guarantee confidentiality. Your information will not be misused, abused or sold to third parties." },
          { id: "02", title: "Info Collection", text: "We collect name, email, and address for order processing only. Data is protected by industrial encryption." },
          { id: "03", title: "Transactions", text: "Processed through Midtrans secure gateway. We do not store credit card or sensitive financial info." }
        ]
      }
    },
    ID: {
      title: "ARSIP LEGAL",
      updated: "VER 2.1 / MEI 2026",
      terms: {
        title: "SYARAT & KETENTUAN",
        sections: [
          { id: "01", title: "Syarat Penggunaan", text: "NINOC ATELIER ditawarkan kepada Anda dengan syarat penerimaan Anda atas ketentuan ini. Penggunaan Situs merupakan persetujuan." },
          { id: "02", title: "Ringkasan", text: "Dengan menggunakan Situs ini, Anda menyetujui Syarat dan Ketentuan ini, serta ketentuan, pedoman, atau aturan lain yang berlaku. Jika tidak setuju, silakan tinggalkan Situs." },
          { id: "03", title: "Perubahan", text: "NINOC berhak mengubah harga dan konten kapan saja tanpa pemberitahuan. Penggunaan berkelanjutan adalah bentuk persetujuan." },
          { id: "04", title: "Pengiriman", text: "Risiko kehilangan berpindah tangan setelah penyerahan barang ke pihak ekspedisi berdasarkan kontrak pengiriman." },
          { id: "05", title: "Pengembalian", text: "Barang harus dikembalikan dalam 7 hari dengan kondisi asli. Barang diskon tidak dapat dikembalikan." }
        ]
      },
      privacy: {
        title: "KEBIJAKAN PRIVASI",
        sections: [
          { id: "01", title: "Keamanan Data", text: "Kami menjamin kerahasiaan data. Informasi Anda tidak akan disalahgunakan atau dijual kepada pihak ketiga." },
          { id: "02", title: "Koleksi Data", text: "Kami mengumpulkan nama dan alamat hanya untuk pengiriman. Data dilindungi oleh enkripsi standar industri." },
          { id: "03", title: "Transaksi", text: "Diproses melalui gateway Midtrans. Kami tidak menyimpan data kartu kredit atau info keuangan sensitif Anda." }
        ]
      }
    }
  };

  const t = content[lang];

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

      {/* 2-GRID UNIFIED ARCHIVE */}
      <div className="flex-1 pt-20 pb-6 px-6 md:px-12 flex flex-col max-w-[1800px] mx-auto w-full overflow-hidden">
        
        {/* Minimal Header */}
        <div className="flex items-baseline justify-between mb-4 border-b border-ink/5 pb-2">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl md:text-2xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">{t.title}</h1>
            <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/60">{t.updated}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-emerald-500" />
             <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600/50">System Live</span>
          </div>
        </div>

        {/* 2-GRID Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          
          {/* Sector 1: TERMS & CONDITIONS */}
          <div className="bg-white border border-ink/5 rounded-xl flex flex-col overflow-hidden shadow-dashboard">
             <div className="px-6 py-4 border-b border-ink/5 bg-ink/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <FileText size={16} className="text-rose" />
                   <h2 className="text-[14px] font-display font-medium italic text-ink tracking-widest">{t.terms.title}</h2>
                </div>
                <span className="text-[9px] font-medium text-ink/20 uppercase tracking-[0.3em]">Sector A / Archive</span>
             </div>
             <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
                {t.terms.sections.map((s) => (
                  <div key={s.id} className="space-y-3 group">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-rose tabular-nums">{s.id}</span>
                        <h3 className="text-[12px] font-medium text-ink uppercase tracking-wider group-hover:text-rose transition-colors">{s.title}</h3>
                     </div>
                     <p className="text-[13px] font-medium leading-relaxed text-ink/50 uppercase tracking-wide pl-7">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>
          </div>

          {/* Sector 2: PRIVACY POLICY */}
          <div className="bg-white border border-ink/5 rounded-xl flex flex-col overflow-hidden shadow-dashboard">
             <div className="px-6 py-4 border-b border-ink/5 bg-ink/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Lock size={16} className="text-rose" />
                   <h2 className="text-[14px] font-display font-medium italic text-ink tracking-widest">{t.privacy.title}</h2>
                </div>
                <span className="text-[9px] font-medium text-ink/20 uppercase tracking-[0.3em]">Sector B / Archive</span>
             </div>
             <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-10">
                {t.privacy.sections.map((s) => (
                  <div key={s.id} className="space-y-3 group">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-rose tabular-nums">{s.id}</span>
                        <h3 className="text-[12px] font-medium text-ink uppercase tracking-wider group-hover:text-rose transition-colors">{s.title}</h3>
                     </div>
                     <p className="text-[13px] font-medium leading-relaxed text-ink/50 uppercase tracking-wide pl-7">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>
             <div className="p-6 bg-ink text-white">
                <div className="flex items-center gap-3 mb-2">
                   <Shield size={12} className="text-rose" />
                   <span className="text-[8px] font-medium uppercase tracking-[0.2em]">Archival Security Protocol</span>
                </div>
                <p className="text-[7px] text-white/40 uppercase tracking-widest leading-loose">
                   This document is legally binding under the NINOC Enterprise digital archive jurisdiction. All modifications are logged in the origin system.
                </p>
             </div>
          </div>

        </div>

        {/* Global Legal Footer */}
        <div className="mt-4 pt-4 border-t border-ink/5 flex justify-between items-center opacity-60">
          <div className="flex gap-8">
             <div className="flex items-center gap-2">
                <Globe size={10} strokeWidth={1.5} />
                <span className="text-[7px] font-medium uppercase tracking-widest">Global Protocol</span>
             </div>
             <div className="flex items-center gap-2">
                <Scale size={10} strokeWidth={1.5} />
                <span className="text-[7px] font-medium uppercase tracking-widest">Legal Integrity</span>
             </div>
          </div>
          <p className="text-[7px] font-medium uppercase tracking-[0.5em] text-ink">NINOC ENTERPRISE — HIGH-DENSITY LEGAL ARCHIVE v2.1</p>
        </div>
      </div>
    </main>
  );
}
