"use client";

import React, { useState } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import GlobalFooter from '@/components/Footer';

export default function LegalPage() {
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  const content = {
    EN: {
      title: "LEGAL",
      updated: "VER 2.1 / MAY 2026",
      terms: {
        title: "TERMS & CONDITIONS",
        sections: [
          { id: "01", title: "Conditions of Use", text: "NINOC ATELIER is offered to you conditioned on your acceptance of the terms contained herein. Use of this Site constitutes agreement." },
          { id: "02", title: "Overview", text: "By using this Site, you agree to these Terms, guidelines and rules. If you do not agree, you must exit the Site immediately." },
          { id: "03", title: "Modification", text: "NINOC reserves the right to change prices and content at any time without prior notice. Continued use constitutes agreement." },
          { id: "04", title: "Shipment", text: "Risk of loss passes to you upon our delivery to the carrier. All items are made pursuant to a shipment contract." },
          { id: "05", title: "Returns", text: "Items must be returned within 2x24 hours in unused, original condition." }
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
      title: "LEGAL",
      updated: "VER 2.1 / MEI 2026",
      terms: {
        title: "SYARAT & KETENTUAN",
        sections: [
          { id: "01", title: "Syarat Penggunaan", text: "NINOC ATELIER ditawarkan kepada Anda dengan syarat penerimaan Anda atas ketentuan ini. Penggunaan Situs merupakan persetujuan." },
          { id: "02", title: "Ringkasan", text: "Dengan menggunakan Situs ini, Anda menyetujui Syarat dan Ketentuan ini, serta ketentuan, pedoman, atau aturan lain yang berlaku. Jika tidak setuju, silakan tinggalkan Situs." },
          { id: "03", title: "Perubahan", text: "NINOC berhak mengubah harga dan konten kapan saja tanpa pemberitahuan. Penggunaan berkelanjutan adalah bentuk persetujuan." },
          { id: "04", title: "Pengiriman", text: "Risiko kehilangan berpindah tangan setelah penyerahan barang ke pihak ekspedisi berdasarkan kontrak pengiriman." },
          { id: "05", title: "Pengembalian", text: "Pengajuan maksimal 2x24 jam setelah barang diterima. Produk belum digunakan dan dalam kondisi lengkap." }
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
          <span className="text-[9px] font-display font-medium italic tracking-tighter text-rose uppercase">NINOC</span>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-medium tracking-widest border border-ink/5 rounded-full px-3 py-1.5 bg-white/50 shadow-sm">
          <button onClick={() => setLang('ID')} className={`transition-all ${lang === 'ID' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>ID</button>
          <span className="text-ink/5">|</span>
          <button onClick={() => setLang('EN')} className={`transition-all ${lang === 'EN' ? 'text-rose' : 'text-ink/20 hover:text-ink'}`}>EN</button>
        </div>
      </nav>

      {/* 2-GRID UNIFIED ARCHIVE */}
      <div className="flex-1 min-h-0 pt-16 md:pt-20 pb-4 px-6 md:px-12 flex flex-col max-w-[1800px] mx-auto w-full">
        
        {/* Minimal Header */}
        <div className="flex items-baseline justify-between mb-4 border-b border-ink/5 pb-2">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl md:text-2xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">{t.title}</h1>
            <span className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/60">{t.updated}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-emerald-500" />
             <span className="text-[7px] font-medium uppercase tracking-widest text-emerald-600/50">Studio Live</span>
          </div>
        </div>

        {/* OPEN ARCHIVE LAYOUT - NO CARDS */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 pt-4">
          
          {/* Sector A: TERMS & CONDITIONS */}
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-ink/10 pb-1">
                <div className="flex items-center gap-3">
                   <h2 className="text-[12px] font-display font-medium italic text-ink uppercase tracking-[0.3em]">{t.terms.title}</h2>
                </div>
                <span className="text-[7px] font-medium text-ink/20 uppercase tracking-[0.4em]">Section 01</span>
             </div>
             
             <div className="space-y-3">
                {t.terms.sections.map((s) => (
                  <div key={s.id} className="space-y-1">
                     <div className="flex items-center gap-4">
                        <span className="text-[8px] font-medium text-rose/40 tabular-nums">{s.id}</span>
                        <h3 className="text-[10px] font-medium text-ink uppercase tracking-widest">{s.title}</h3>
                     </div>
                     <p className="text-[10px] font-medium leading-tight text-ink/60 uppercase tracking-wide pl-8 max-w-md">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>
          </div>

          {/* Sector B: PRIVACY POLICY */}
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-ink/10 pb-1">
                <div className="flex items-center gap-3">
                   <h2 className="text-[12px] font-display font-medium italic text-ink uppercase tracking-[0.3em]">{t.privacy.title}</h2>
                </div>
                <span className="text-[7px] font-medium text-ink/20 uppercase tracking-[0.4em]">Section 02</span>
             </div>

             <div className="space-y-3">
                {t.privacy.sections.map((s) => (
                  <div key={s.id} className="space-y-1">
                     <div className="flex items-center gap-4">
                        <span className="text-[8px] font-medium text-rose/40 tabular-nums">{s.id}</span>
                        <h3 className="text-[10px] font-medium text-ink uppercase tracking-widest">{s.title}</h3>
                     </div>
                     <p className="text-[10px] font-medium leading-tight text-ink/60 uppercase tracking-wide pl-8 max-w-md">
                        {s.text}
                     </p>
                  </div>
                ))}
             </div>

             <div className="pt-4 border-t border-ink/5 space-y-2">
                <div className="flex items-center gap-3">
                   <Shield size={10} className="text-rose/40" />
                   <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/30">Security Protocol</span>
                </div>
                <p className="text-[8px] text-ink/20 uppercase tracking-[0.1em] leading-tight max-w-xs">
                   THIS DOCUMENT IS LEGALLY BINDING. ALL MODIFICATIONS ARE LOGGED IN THE ORIGIN SPECIFICATION.
                </p>
             </div>
          </div>

        </div>
      </div>
      
      <GlobalFooter />
    </main>
  );
}
