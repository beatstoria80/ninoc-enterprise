"use client";

import React, { useState } from 'react';
import Link from '@/components/LocalizedLink';
import NextLink from 'next/link';
import { ShieldCheck, ArrowLeft, Scale, FileText, AlertTriangle, X, Package, Coffee, Shirt, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function SupplierTermsPage() {
  const pathname = usePathname();
  const lang = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const [activeOemPillar, setActiveOemPillar] = useState<'ALL' | 'APR' | 'OBJ' | 'PTR'>('ALL');

  const oemMatrix = {
    APR: {
      code: "APR-OEM",
      name: "Apparel Mfg",
      icon: Shirt,
      leadTime: "14 – 21 Hari Kerja per PO",
      qcTolerance: "Defect stitching < 2%, Toleransi ukuran ± 1.5cm, Color fastness grade 4+.",
      packaging: "Wajib dikemas dalam kemasan ziplock anti-statis resmi NINOC dengan woven label terjahit presisi.",
      warranty: "Garansi retur produksi 7 hari setelah tiba di Gudang Pusat NINOC."
    },
    OBJ: {
      code: "OBJ-OEM",
      name: "Objects & Ceramics Mfg",
      icon: Package,
      leadTime: "21 – 30 Hari Kerja per PO",
      qcTolerance: "Defect glaze < 1%, Zero chip tolerance, Lulus uji drop-test box standar ASTM.",
      packaging: "Wajib menggunakan boks ganda (double-wall corrugated) dengan sisipan EPE foam custom anti-pecah.",
      warranty: "Garansi klaim penggantian 100% jika terjadi kerusakan struktur pabrik saat QC gudang."
    },
    PTR: {
      code: "PTR-OEM",
      name: "Pantry & Café Roastery Mfg",
      icon: Coffee,
      leadTime: "2 – 4 Hari Kerja (On-Demand Freshness SLA)",
      qcTolerance: "Toleransi skor warna Agtron ± 2 poin, Integritas one-way degassing valve 100%, Tanggal roasting tercetak jelas.",
      packaging: "Wajib menggunakan pouch aluminium foil food-grade dengan katup degassing dan nitrogen flush sealing.",
      warranty: "SLA ketat perlindungan kebersihan pangan: barang basi/bocor saat penyerahan gudang ditolak mutlak."
    }
  };

  const DICT = {
    ID: {
      back: "Kembali ke Form Supplier",
      doc: "OEM SLA Matrix Ver 3.1",
      title: "Perjanjian Tingkat Layanan (OEM SLA)",
      desc: "Perjanjian mengikat antara NINOC dan Mitra Manufaktur (Supplier), diatur spesifik per pilar departemen untuk memenuhi kepatuhan standar industri RI & verifikasi Google Merchant Center.",
      date: "9 Juni 2026",
      s1_title: "Ketentuan Umum & Kemitraan White-Label",
      s1_text: "Program Supplier B2B adalah kemitraan eksklusif Original Equipment Manufacturer (OEM). NINOC memegang kendali penuh atas rebrand dan distribusi akhir produk. Identitas pabrik dijaga kerahasiaannya untuk melindungi persaingan bisnis.",
      s2_title: "Standarisasi Produksi & QC Hub",
      s2_text: "Seluruh barang wajib dikirim fisik ke NINOC Hub Bandung untuk inspeksi Quality Control (QC). Sistem Dropshipping langsung dari fasilitas Supplier sangat dilarang demi menjaga keseragaman kualitas Enterprise Store.",
      s3_title: "Mekanisme Pembayaran HPP",
      s3_text: "Harga Pokok Produksi (HPP) dikunci di muka pada setiap Purchase Order (PO). Payout dikreditkan ke buku besar Supplier setelah pesanan konsumen akhir selesai dan melewati batas klaim retur garansi tanpa sengketa."
    },
    EN: {
      back: "Back to Supplier Form",
      doc: "OEM SLA Matrix Ver 3.1",
      title: "Service Level Agreement (OEM SLA)",
      desc: "Legally binding agreement between NINOC and Manufacturing Partners (Suppliers), structured specifically per department pillar for RI industrial compliance and Google Merchant Center verification.",
      date: "June 9, 2026",
      s1_title: "General Terms & White-Label Partnership",
      s1_text: "The B2B Supplier Program is an exclusive Original Equipment Manufacturer (OEM) partnership. NINOC holds full control over rebranding and final distribution. Factory identity is kept confidential.",
      s2_title: "Production Standardization & QC Hub",
      s2_text: "All goods must be physically delivered to the NINOC Bandung Hub for Quality Control (QC) inspection. Direct Dropshipping from supplier facilities is strictly prohibited.",
      s3_title: "HPP Payment Mechanism",
      s3_text: "Cost of Goods Sold (HPP) is locked upfront on every Purchase Order (PO). Payouts are credited to the supplier ledger after end-consumer orders are completed without quality disputes."
    }
  };

  const dict = DICT[lang];

  return (
    <div className="min-h-screen w-full bg-[#111111] text-[#E5E5E5] flex flex-col p-4 md:p-8 overflow-y-auto relative font-sans selection:bg-rose selection:text-white">
      <div className="w-full max-w-[1600px] my-auto mx-auto min-h-[85vh] flex flex-col lg:grid lg:grid-cols-12 bg-[#161616] shadow-2xl border border-white/10 rounded-none overflow-hidden z-10">
        
        {/* Left Column - Header Info */}
        <div className="lg:col-span-4 flex flex-col bg-[#111111] p-8 md:p-12 text-white relative overflow-hidden h-full border-r border-white/10">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Scale size={350} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
            <div>
              <Link href="/supplier/apply" className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-rose mb-10 transition-colors uppercase tracking-widest">
                <ArrowLeft size={16} />
                {dict.back}
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose/20 border border-rose/40 text-rose text-[10px] font-mono uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  {dict.doc}
                </div>
                
                {/* Language Switcher */}
                <div className="flex items-center text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10 p-1">
                  <NextLink href={pathname?.replace('/en', '') || '/'} className={cn("px-2 py-1 transition-colors", lang === 'ID' ? "bg-rose text-white font-bold" : "text-white/50 hover:text-white")}>ID</NextLink>
                  <NextLink href={`/en${pathname?.replace('/en', '')}`} className={cn("px-2 py-1 transition-colors", lang === 'EN' ? "bg-rose text-white font-bold" : "text-white/50 hover:text-white")}>EN</NextLink>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-display italic font-medium mb-6 leading-tight uppercase tracking-tight">{dict.title}</h1>
              <p className="text-white/60 text-xs md:text-sm leading-relaxed font-mono">
                {dict.desc}
              </p>
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/40">
                <FileText size={16} className="text-rose" />
                <span className="text-[10px] font-mono uppercase tracking-widest">NINOC Legal Dept.</span>
              </div>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">{dict.date}</p>
            </div>
          </div>
        </div>

        {/* Right Column - SLA Matrix Content */}
        <div className="lg:col-span-8 p-8 md:p-12 relative flex flex-col h-full bg-[#181818] overflow-hidden">
          
          <Link href="/supplier/apply" className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 bg-white/5 hover:bg-rose hover:text-white flex items-center justify-center transition-all duration-300 z-50 group border border-white/10">
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </Link>

          <div className="flex-1 overflow-y-auto pr-2 space-y-8">
            
            {/* Pillar Filter Bar */}
            <div className="border-b border-white/10 pb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-rose block mb-3">
                Pilih Kategori Manufaktur Anda (Department Pillar SLA):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'SEMUA PILAR // SUMMARY', code: 'ALL' },
                  { id: 'APR', label: 'APPAREL MFG', code: 'APR-OEM' },
                  { id: 'OBJ', label: 'OBJECTS MFG', code: 'OBJ-OEM' },
                  { id: 'PTR', label: 'ROASTERY MFG', code: 'PTR-OEM' },
                ].map((btn) => {
                  const active = activeOemPillar === btn.id;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => setActiveOemPillar(btn.id as any)}
                      className={`p-3 text-left transition-all border flex flex-col justify-between ${
                        active ? 'bg-rose text-white border-rose font-bold shadow-md' : 'bg-[#141414] text-white/60 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-rose">{btn.code}</span>
                      <span className="text-xs font-display uppercase tracking-wider">{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matrix Display */}
            <div className="space-y-6">
              {Object.entries(oemMatrix).map(([key, oem]) => {
                if (activeOemPillar !== 'ALL' && activeOemPillar !== key) return null;
                const Icon = oem.icon;
                return (
                  <div key={key} className="p-6 bg-[#141414] border border-white/10 space-y-4 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose/20 text-rose border border-rose/30">
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-rose block uppercase font-bold">{oem.code}</span>
                          <h3 className="text-base font-display font-bold uppercase tracking-tight text-white">{oem.name}</h3>
                        </div>
                      </div>
                      <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 text-white/80">
                        Lead Time: <strong className="text-rose">{oem.leadTime}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                      <div className="bg-black/40 p-3.5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">QC Tolerance SLA</span>
                        <p className="text-white/80 leading-relaxed">{oem.qcTolerance}</p>
                      </div>
                      <div className="bg-black/40 p-3.5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-blue-400 uppercase block">Packaging Standard</span>
                        <p className="text-white/80 leading-relaxed">{oem.packaging}</p>
                      </div>
                      <div className="bg-black/40 p-3.5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Warranty & Payout</span>
                        <p className="text-white/80 leading-relaxed">{oem.warranty}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General B2B Contract Clauses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div className="p-5 bg-[#141414] border border-white/10 space-y-2">
                <h4 className="text-xs font-display font-bold uppercase tracking-wider text-blue-400">01 // {dict.s1_title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{dict.s1_text}</p>
              </div>
              <div className="p-5 bg-[#141414] border border-white/10 space-y-2">
                <h4 className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">02 // {dict.s2_title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{dict.s2_text}</p>
              </div>
              <div className="p-5 bg-[#141414] border border-white/10 space-y-2">
                <h4 className="text-xs font-display font-bold uppercase tracking-wider text-emerald-400">03 // {dict.s3_title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{dict.s3_text}</p>
              </div>
            </div>

            {/* Regulatory Compliance Stamp */}
            <div className="p-6 bg-gradient-to-r from-rose/20 to-black border border-rose/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-rose shrink-0" />
                <p className="text-xs text-white/80 font-mono">
                  SLA di atas mengikat secara hukum sesuai UU RI dan melindungi kredibilitas rantai pasok dari teguran otomatis audit Google Merchant Center B2B.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 bg-rose text-white shrink-0">
                VERIFIED SLA
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
