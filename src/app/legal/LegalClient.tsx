"use client";

import React, { useState } from 'react';
import { ArrowLeft, Shield, AlertCircle, CheckCircle2, Package, Coffee, Shirt } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { usePathname, useRouter } from 'next/navigation';
import GlobalFooter from '@/components/Footer';

export default function LegalClient() {
  const pathname = usePathname();
  const router = useRouter();
  const lang: 'ID' | 'EN' = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const [activePillarFilter, setActivePillarFilter] = useState<'ALL' | 'APR' | 'OBJ' | 'PTR'>('ALL');

  const handleLangChange = (newLang: 'ID' | 'EN') => {
    if (newLang === lang) return;
    if (newLang === 'EN' && !pathname?.startsWith('/en')) {
      router.push(`/en${pathname === '/' ? '' : pathname}`);
    } else if (newLang === 'ID' && pathname?.startsWith('/en')) {
      router.push(pathname.replace('/en', '') || '/');
    }
  };

  const content = {
    EN: {
      title: "LEGAL & COMPLIANCE PROTOCOLS",
      updated: "VER 3.1 / JUNE 2026 // GMC COMPLIANT",
      terms: {
        title: "TERMS & CONDITIONS (PILLAR SPECIFIC)",
        sections: [
          { id: "01", pillar: "ALL", title: "Acceptance of Terms", text: "By accessing and purchasing from NINOC STORE, you legally agree to be bound by these Terms of Service. These terms apply across all 3 Department Pillars: Apparel & Archive, Objects & Goods, and Pantry & Café." },
          { id: "02", pillar: "ALL", title: "Accuracy & Pricing", text: "We reserve the right to modify prices, product availability, and specifications at any time. Pricing transparency follows Google Merchant Center (GMC) regulations without hidden checkout fees." },
          { id: "03", pillar: "ALL", title: "Shipping & Liability", text: "All purchases are made pursuant to a shipment contract (FOB Shipping Point). Risk of loss transfers upon carrier handover. All packages are sealed with double-layer tamper-evident packaging." },
          { id: "04", pillar: "APR", title: "Apparel Return Protocol (APR-01)", text: "Returns for Garment & Footwear are accepted within 48 hours (2x24 hours) of delivery confirmation. Size exchanges are allowed subject to stock. Products MUST be unworn, unwashed, perfume-free, with all woven tags and original branded ziplock intact. Requires continuous 1-shot unboxing video." },
          { id: "05", pillar: "OBJ", title: "Objects & Ceramics Warranty (OBJ-02)", text: "Homeware & Ceramics are covered for transit damage (shattering/cracking) or factory defects reported within 48 hours. CRITICAL: Unboxing video must clearly show the unopened double-wall box and EPE foam protective inserts. No return for change of mind." },
          { id: "06", pillar: "PTR", title: "Pantry & Perishable Exemption (PTR-03)", text: "In strict compliance with Food Safety regulations and BPOM standards, all specialty coffee beans, pastry, and F&B beverages are STRICTLY NON-RETURNABLE and NON-REFUNDABLE once delivered. Exceptions are ONLY made if the package arrives burst in transit or wrong roast profile was dispatched by NINOC, claimed within 3 hours of instant delivery." },
          { id: "07", pillar: "ALL", title: "Intellectual Property Rights", text: "All design archives, garment cuts, ceramic molds, and branding photography are exclusive property of NINOC Enterprise, protected under Copyright & Trademark Laws." },
          { id: "08", pillar: "ALL", title: "Limitation of Liability & UU No. 8/1999", text: "In accordance with Consumer Protection Laws, our maximum liability for any verified claim shall not exceed the total transaction amount paid for the specific affected item." }
        ]
      },
      privacy: {
        title: "PRIVACY POLICY",
        sections: [
          { id: "01", title: "Data Collection", text: "We collect personal data (Name, Address, Email, Phone Number) strictly for order fulfillment, logistics delivery, and mandatory B2B KYC verification." },
          { id: "02", title: "Data Usage & Distribution", text: "Your data is strictly confidential. We only share necessary information with official partners (Logistics Carriers and Midtrans Payment Gateway). We NEVER sell or monetize customer data." },
          { id: "03", title: "Security & Encryption", text: "All financial transactions are encrypted via banking industry standards (PCI-DSS). NINOC does not store credit card numbers or banking credentials on our servers." },
          { id: "04", title: "User Rights", text: "You retain full right to request access, modification, or permanent erasure of your personal data from our systems at any time by contacting our legal compliance team." }
        ]
      }
    },
    ID: {
      title: "LEGAL & PROTOKOL KEPATUHAN",
      updated: "VER 3.1 / JUNI 2026 // GMC COMPLIANT",
      terms: {
        title: "SYARAT & KETENTUAN (SPESIFIK PER PILAR)",
        sections: [
          { id: "01", pillar: "ALL", title: "Persetujuan Hukum", text: "Dengan mengakses dan bertransaksi di NINOC STORE, Anda secara sah terikat dengan Syarat dan Ketentuan ini yang berlaku untuk seluruh 3 Gerbang Portal: Apparel & Archive, Objects & Goods, dan Pantry & Café." },
          { id: "02", pillar: "ALL", title: "Akurasi & Transparansi Harga", text: "NINOC memegang hak penuh mengubah harga dan spesifikasi. Seluruh kalkulasi harga patuh pada standar Google Merchant Center (GMC) tanpa biaya tersembunyi saat checkout." },
          { id: "03", pillar: "ALL", title: "Pengiriman & Risiko Logistik", text: "Pengiriman mengacu pada kontrak FOB Shipping Point. Seluruh paket dikemas dengan standar keamanan proteksi ganda (double-sealed/encrypted structure)." },
          { id: "04", pillar: "APR", title: "Protokol Retur Apparel (APR-01)", text: "Klaim pengembalian Pakaian & Sepatu dilayani maksimal 2x24 jam sejak resi 'Diterima'. Tukar ukuran diizinkan selama stok ada. Syarat mutlak: belum dipakai/dicuci, bebas bau parfum, tag woven & kemasan ziplock utuh, serta menyertakan video unboxing 1-shot tanpa jeda." },
          { id: "05", pillar: "OBJ", title: "Garansi Objects & Keramik (OBJ-02)", text: "Barang keramik & rumah tangga dilindungi garansi kerusakan transit (pecah/retak) atau cacat pabrik maksimal 48 jam. WAJIB video unboxing memperlihatkan boks ganda (double-box) tersegel dan struktur EPE foam. Tidak berlaku retur karena perubahan selera rasa/warna." },
          { id: "06", pillar: "PTR", title: "Pengecualian Barang Mudah Basi / F&B (PTR-03)", text: "Sesuai standar Google Merchant Center dan UU Perlindungan Konsumen No. 8/1999 pasal 4 tentang barang mudah basi (perishable goods), produk kopi sangrai, pastry, dan minuman TIDAK DAPAT DIRETUR / REFUND setelah dikirim. Pengecualian HANYA jika kemasan bocor saat transit atau salah kirim varian dari pihak NINOC (klaim maksimal 3 jam untuk kurir instan)." },
          { id: "07", pillar: "ALL", title: "Hak Kekayaan Intelektual", text: "Seluruh arsip desain pakaian, cetakan keramik, foto kampanye, dan tipografi adalah milik eksklusif NINOC dan dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta." },
          { id: "08", pillar: "ALL", title: "Batasan Tanggung Jawab Konsumen", text: "Sesuai Undang-Undang Perlindungan Konsumen, tanggung jawab maksimal NINOC atas klaim ganti rugi yang sah tidak akan melebihi total nominal transaksi item yang bersangkutan." }
        ]
      },
      privacy: {
        title: "KEBIJAKAN PRIVASI",
        sections: [
          { id: "01", title: "Pengumpulan Data", text: "Sesuai UU Pelindungan Data Pribadi (UU PDP), kami mengumpulkan identitas pribadi murni untuk pemrosesan pesanan, logistik, dan verifikasi akun." },
          { id: "02", title: "Penggunaan & Distribusi", text: "Data Anda dijamin kerahasiaannya. Kami hanya membagikan data kepada mitra resmi (Ekspedisi dan Gateway Midtrans). Kami TIDAK PERNAH memperjualbelikan data pelanggan." },
          { id: "03", title: "Keamanan Transaksi", text: "Transaksi finansial dilindungi oleh enkripsi standar perbankan industri (PCI-DSS). NINOC tidak pernah menyimpan nomor kartu kredit atau sandi perbankan di server." },
          { id: "04", title: "Hak Pengguna Data", text: "Anda berhak untuk meminta akses, koreksi, atau penghapusan permanen atas data diri Anda dari sistem kami kapan saja dengan menghubungi departemen legal kami." }
        ]
      }
    }
  };

  const t = content[lang];

  const filteredTerms = t.terms.sections.filter(s => {
    if (activePillarFilter === 'ALL') return true;
    return s.pillar === 'ALL' || s.pillar === activePillarFilter;
  });

  return (
    <main className="min-h-screen bg-[#111111] text-[#E5E5E5] flex flex-col font-sans selection:bg-rose selection:text-white">
      {/* Top Header */}
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-4 flex items-center justify-between bg-[#111111]/90 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 text-white/60 hover:text-rose transition-all group">
          <ArrowLeft size={14} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] md:text-[8px] font-mono uppercase tracking-[0.2em] text-white/40">Studio Exit</span>
            <span className="text-xs md:text-[10px] font-bold uppercase tracking-widest text-white">Back to Store</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-xs md:text-sm font-display font-medium italic tracking-tighter text-rose uppercase">NINOC // LEGAL & SLA</span>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-[10px] font-mono tracking-widest border border-white/10 rounded-none px-3 py-1.5 bg-white/[0.05]">
          <button onClick={() => handleLangChange('ID')} className={`transition-all ${lang === 'ID' ? 'text-rose font-bold' : 'text-white/30 hover:text-white'}`}>ID</button>
          <span className="text-white/20">|</span>
          <button onClick={() => handleLangChange('EN')} className={`transition-all ${lang === 'EN' ? 'text-rose font-bold' : 'text-white/30 hover:text-white'}`}>EN</button>
        </div>
      </nav>

      <div className="flex-1 min-h-0 pt-24 md:pt-28 pb-16 px-6 md:px-12 flex flex-col max-w-[1400px] mx-auto w-full">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-white/15 pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose font-mono text-[10px] tracking-[0.3em] uppercase">
              <span>Google Merchant Center Verified</span>
              <span>{"//"}</span>
              <span>Department Pillars Legal Framework</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-medium italic tracking-tighter text-white uppercase leading-none">
              {t.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-3 py-1.5">
            <CheckCircle2 size={14} />
            <span>{t.updated}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left Column: Terms & Conditions with Pillar Switcher */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4 sticky top-20 bg-[#111111]/95 backdrop-blur-md z-10 pt-2">
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-rose inline-block" />
                {t.terms.title}
              </h2>

              {/* Department Pillar Filter Buttons */}
              <div className="flex items-center gap-1 bg-black/50 p-1 border border-white/10 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: 'ALL PILLARS', icon: Shield },
                  { id: 'APR', label: 'APR-01', icon: Shirt },
                  { id: 'OBJ', label: 'OBJ-02', icon: Package },
                  { id: 'PTR', label: 'PTR-03', icon: Coffee },
                ].map((btn) => {
                  const active = activePillarFilter === btn.id;
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => setActivePillarFilter(btn.id as any)}
                      className={`px-3 py-1 text-[10px] font-mono flex items-center gap-1.5 transition-all whitespace-nowrap ${
                        active ? 'bg-rose text-white font-bold shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {filteredTerms.map((s) => {
                const isPillarSpecific = s.pillar !== 'ALL';
                return (
                  <div
                    key={s.id}
                    className={`p-5 border transition-all ${
                      isPillarSpecific
                        ? 'bg-[#181818] border-rose/40 shadow-md'
                        : 'bg-[#141414] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-rose tabular-nums">[{s.id}]</span>
                        <h3 className="text-xs md:text-sm font-display font-bold text-white uppercase tracking-wider">{s.title}</h3>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 uppercase ${
                        s.pillar === 'APR' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' :
                        s.pillar === 'OBJ' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                        s.pillar === 'PTR' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {s.pillar === 'ALL' ? 'General Scope' : `Pillar // ${s.pillar}`}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-sans leading-relaxed text-white/75">
                      {s.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Privacy Policy & Regulatory Stamp */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 sticky top-20 bg-[#111111]/95 backdrop-blur-md z-10 pt-2">
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 inline-block" />
                {t.privacy.title}
              </h2>
              <span className="text-[10px] font-mono text-white/40 uppercase">UU PDP RI Approved</span>
            </div>

            <div className="space-y-4">
              {t.privacy.sections.map((s) => (
                <div key={s.id} className="p-5 bg-[#141414] border border-white/10 space-y-2 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">[{s.id}]</span>
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">{s.title}</h3>
                  </div>
                  <p className="text-xs font-sans leading-relaxed text-white/70">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Regulatory KITH Editorial Box */}
            <div className="p-6 bg-[#181818] border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-rose">
                <AlertCircle size={16} />
                <span className="text-xs font-mono font-bold uppercase tracking-widest">Kepatuhan Hukum & Google Merchant</span>
              </div>
              <p className="text-xs text-white/60 font-mono leading-relaxed">
                Pemisahan syarat retur dan garansi di atas bertujuan memenuhi regulasi verifikasi akun Google Merchant Center (GMC) dan Pasal 4 UU No. 8/1999 tentang Perlindungan Konsumen atas barang mudah basi/rusak (perishable goods).
              </p>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </main>
  );
}
