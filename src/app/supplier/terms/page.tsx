"use client";

import React from 'react';
import Link from '@/components/LocalizedLink';
import NextLink from 'next/link';
import { ShieldCheck, ArrowLeft, Scale, FileText, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const DICT = {
  ID: {
    back: "Kembali ke Form Supplier",
    doc: "Dokumen Legal",
    title: "Perjanjian Tingkat Layanan (OEM SLA)",
    desc: "Perjanjian ini mengikat secara hukum antara NINOC dan Anda sebagai Mitra Manufaktur (Supplier), diatur dan tunduk pada hukum perundang-undangan Negara Kesatuan Republik Indonesia.",
    date: "9 Juni 2026",
    s1_title: "Ketentuan Umum & Definisi",
    s1_1: "\"Program Supplier B2B\" adalah kemitraan eksklusif Original Equipment Manufacturer (OEM) di mana Supplier memproduksi barang fisik untuk diedarkan oleh NINOC.",
    s1_2: "\"NINOC Hub\" merujuk pada Gudang Pusat NINOC tempat barang diserahkan untuk proses Quality Control (QC) dan fulfillment ke tangan pembeli.",
    s1_3: "Seluruh dokumen Know Your Customer (KYC) yang diserahkan bersifat rahasia dan dilindungi oleh Kebijakan Privasi perusahaan.",
    s2_title: "Syarat Produksi",
    s2_1: "Supplier wajib memiliki entitas hukum yang sah atau terdaftar minimal dengan NIB untuk keperluan komersial (B2B).",
    s2_2: "Kapasitas produksi harus dapat memenuhi Service Level Agreement (SLA) waktu penyelesaian yang disepakati untuk setiap Purchase Order (PO).",
    s2_3: "Supplier menjamin mutu barang tidak mengandung bahan berbahaya atau menyalahi regulasi standardisasi industri Republik Indonesia (SNI).",
    s3_title: "Hak Rebrand Eksklusif",
    s3_tag: "Model OEM (White-Label)",
    s3_tag_desc: "NINOC memegang kendali penuh atas identitas akhir produk yang dipasarkan ke konsumen.",
    s3_1: "Supplier memberikan hak eksklusif yang sah, final, dan tak tergugurkan kepada NINOC untuk mengemas, mengubah, dan memberi merek ulang (rebrand) setiap barang yang didistribusikan.",
    s3_2: "Identitas asli dari pabrik (Supplier) akan dijaga kerahasiaannya untuk melindungi persaingan B2B. Semua distribusi konsumen akan berada di bawah merek NINOC atau afiliasinya.",
    s4_title: "Integritas & Kepatuhan",
    s4_1: "Pelanggaran Kekayaan Intelektual: Supplier menjamin seluruh produk yang dipasok bebas dari pelanggaran paten, desain industri, hak cipta, atau merek pihak ketiga. Risiko sengketa HKI sepenuhnya menjadi tanggung jawab Supplier.",
    s4_2: "Konsinyasi Fisik (QC): Semua barang wajib dikirim fisik ke NINOC Hub. Sistem Dropshipping langsung dari fasilitas Supplier sangat dilarang keras demi menjaga standarisasi Quality Control.",
    s5_title: "Mekanisme Pembayaran HPP",
    s5_1: "Harga Pokok Produksi (HPP) ditentukan dan dikunci di muka pada setiap dokumen Purchase Order (PO).",
    s5_2: "Syarat Payout: Dana HPP baru akan dikreditkan ke buku besar (ledger) Supplier setelah konsumen akhir menyatakan pesanan \"Selesai\" (Delivered) dan melewati batas klaim Retur Garansi 7 hari secara aman tanpa sengketa kualitas.",
    s5_3: "Pemotongan pajak (jika ada) akan dilakukan sesuai peraturan Dirjen Pajak RI terkait transaksi B2B.",
    s6_title: "Penyelesaian Sengketa",
    s6_1: "Perjanjian SLA ini tunduk pada hukum perdata Negara Kesatuan Republik Indonesia.",
    s6_2: "Perselisihan terkait pembayaran maupun kualitas barang akan diselesaikan secara musyawarah dalam kurun waktu maksimum 30 hari kalender.",
    s6_3: "Apabila mufakat tidak tercapai, sengketa akan dibawa ke yurisdiksi non-eksklusif Pengadilan Negeri terdekat domisili perusahaan NINOC."
  },
  EN: {
    back: "Back to Supplier Form",
    doc: "Legal Document",
    title: "Service Level Agreement (OEM SLA)",
    desc: "This agreement is legally binding between NINOC and you as the Manufacturing Partner (Supplier), governed by and subject to the laws of the Republic of Indonesia.",
    date: "June 9, 2026",
    s1_title: "General Terms & Definitions",
    s1_1: 'The "B2B Supplier Program" is an exclusive Original Equipment Manufacturer (OEM) partnership where the Supplier produces physical goods to be distributed by NINOC.',
    s1_2: '"NINOC Hub" refers to the NINOC Central Warehouse where goods are handed over for Quality Control (QC) processes and fulfillment to buyers.',
    s1_3: "All submitted Know Your Customer (KYC) documents are confidential and protected by the company's Privacy Policy.",
    s2_title: "Production Requirements",
    s2_1: "The Supplier must have a valid legal entity or be registered with at least an NIB for commercial (B2B) purposes.",
    s2_2: "Production capacity must meet the agreed Service Level Agreement (SLA) completion time for each Purchase Order (PO).",
    s2_3: "The Supplier guarantees that the product quality does not contain hazardous materials or violate the industrial standardization regulations of the Republic of Indonesia (SNI).",
    s3_title: "Exclusive Rebrand Rights",
    s3_tag: "OEM Model (White-Label)",
    s3_tag_desc: "NINOC holds full control over the final identity of the products marketed to consumers.",
    s3_1: "The Supplier grants an exclusive, valid, final, and irrevocable right to NINOC to package, alter, and rebrand every distributed item.",
    s3_2: "The original identity of the factory (Supplier) will be kept confidential to protect B2B competition. All consumer distribution will be under the NINOC brand or its affiliates.",
    s4_title: "Integrity & Compliance",
    s4_1: "Intellectual Property Infringement: The Supplier guarantees that all supplied products are free from third-party patent, industrial design, copyright, or trademark infringements. The risk of IP disputes is entirely the responsibility of the Supplier.",
    s4_2: "Physical Consignment (QC): All goods must be physically sent to the NINOC Hub. Direct Dropshipping systems from the Supplier's facility are strictly prohibited to maintain Quality Control standards.",
    s5_title: "HPP Payment Mechanism",
    s5_1: "The Cost of Goods Sold (HPP) is determined and locked upfront on every Purchase Order (PO) document.",
    s5_2: "Payout Conditions: HPP funds will only be credited to the Supplier's ledger after the end consumer declares the order \"Completed\" (Delivered) and safely passes the 7-day Warranty Return claim limit without quality disputes.",
    s5_3: "Tax deductions (if applicable) will be made according to the regulations of the Directorate General of Taxes of the Republic of Indonesia regarding B2B transactions.",
    s6_title: "Dispute Resolution",
    s6_1: "This SLA agreement is subject to the civil laws of the Republic of Indonesia.",
    s6_2: "Disputes related to payments or product quality will be resolved amicably within a maximum of 30 calendar days.",
    s6_3: "If no consensus is reached, the dispute will be brought to the non-exclusive jurisdiction of the nearest District Court to the NINOC company domicile."
  }
};

export default function SupplierTermsPage() {
  const pathname = usePathname();
  const lang = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = DICT[lang];

  return (
    <div className="min-h-screen w-full bg-cr noise flex flex-col p-4 md:p-8 overflow-y-auto relative">
      <div className="w-full lg:w-[96vw] max-w-[1800px] my-auto mx-auto lg:min-h-[800px] lg:h-[92vh] lg:max-h-[1000px] flex flex-col lg:grid lg:grid-cols-12 bg-white shadow-2xl border border-ink/5 rounded-xl overflow-visible lg:overflow-hidden z-10">
        
        {/* Left Column - Header Info */}
        <div className="lg:col-span-3 flex flex-col bg-ink p-8 md:p-12 text-white relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Scale size={300} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <Link href="/supplier/apply" className="inline-flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white mb-12 transition-colors uppercase tracking-widest shrink-0">
              <ArrowLeft size={16} />
              {dict.back}
            </Link>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs md:text-[10px] font-medium uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  {dict.doc}
                </div>
                
                {/* Language Switcher */}
                <div className="flex items-center text-xs md:text-[10px] font-medium uppercase tracking-widest bg-white/5 border border-white/10 rounded-full p-1">
                  <NextLink prefetch={false} href={pathname?.replace('/en', '') || '/'} className={cn("px-2 py-1 rounded-full transition-colors", lang === 'ID' ? "bg-white text-ink" : "text-white/50 hover:text-white")}>ID</NextLink>
                  <NextLink prefetch={false} href={`/en${pathname?.replace('/en', '')}`} className={cn("px-2 py-1 rounded-full transition-colors", lang === 'EN' ? "bg-white text-ink" : "text-white/50 hover:text-white")}>EN</NextLink>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-display italic font-medium mb-6 leading-tight">{dict.title}</h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                {dict.desc}
              </p>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-white/40">
                <FileText size={16} />
                <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest">NINOC Legal Dept.</span>
              </div>
              <p className="text-xs md:text-[10px] text-white/40 uppercase tracking-widest font-medium">{dict.date}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Terms Content (3 Grids) */}
        <div className="lg:col-span-9 p-8 md:p-12 relative flex flex-col h-full bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pr-4">
            
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 space-y-8">
              
              {/* 1. KETENTUAN UMUM */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">01</span>
                  {dict.s1_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>1.1. {dict.s1_1}</p>
                  <p>1.2. {dict.s1_2}</p>
                  <p>1.3. {dict.s1_3}</p>
                </div>
              </section>

              {/* 2. SYARAT PRODUKSI & KUALIFIKASI */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">02</span>
                  {dict.s2_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>2.1. {dict.s2_1}</p>
                  <p>2.2. {dict.s2_2}</p>
                  <p>2.3. {dict.s2_3}</p>
                </div>
              </section>

              {/* 3. HAK REBRAND & DISTRIBUSI */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">03</span>
                  {dict.s3_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <div className="bg-cr noise border border-ink/10 p-4 text-ink font-mono text-xs md:text-[10px] mb-4">
                    <strong className="block mb-1 uppercase tracking-wider text-ink">{dict.s3_tag}</strong>
                    {dict.s3_tag_desc}
                  </div>
                  <p>3.1. {dict.s3_1}</p>
                  <p>3.2. {dict.s3_2}</p>
                </div>
              </section>

              {/* 4. INTEGRITAS HUKUM & QC */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-rose uppercase tracking-widest flex items-center gap-2 border-b border-rose/20 pb-2">
                  <AlertTriangle size={14} className="text-rose" />
                  {dict.s4_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>4.1. {dict.s4_1}</p>
                  <p>4.2. {dict.s4_2}</p>
                </div>
              </section>

              {/* 5. MEKANISME PENCAIRAN DANA */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">05</span>
                  {dict.s5_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>5.1. {dict.s5_1}</p>
                  <p>5.2. {dict.s5_2}</p>
                  <p>5.3. {dict.s5_3}</p>
                </div>
              </section>

              {/* 6. PENYELESAIAN SENGKETA */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">06</span>
                  {dict.s6_title}
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>6.1. {dict.s6_1}</p>
                  <p>6.2. {dict.s6_2}</p>
                  <p>6.3. {dict.s6_3}</p>
                </div>
              </section>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
