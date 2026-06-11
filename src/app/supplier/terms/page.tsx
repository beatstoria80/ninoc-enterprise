import React from 'react';
import Link from '@/components/LocalizedLink';
import { ShieldCheck, ArrowLeft, Scale, FileText, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Perjanjian Tingkat Layanan (OEM SLA) - NINOC',
  description: 'Syarat dan Ketentuan resmi Kemitraan Manufaktur NINOC berdasarkan hukum perundang-undangan Republik Indonesia.',
};

export default function SupplierTermsPage() {
  return (
    <div className="h-screen w-screen bg-cr noise flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="w-[96vw] max-w-[1800px] h-[92vh] max-h-[1000px] flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 bg-white shadow-2xl border border-ink/5 rounded-xl overflow-hidden z-10">
        
        {/* Left Column - Header Info */}
        <div className="lg:col-span-3 flex flex-col bg-ink p-8 md:p-12 text-white relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Scale size={300} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <Link href="/supplier/apply" className="inline-flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white mb-12 transition-colors uppercase tracking-widest shrink-0">
              <ArrowLeft size={16} />
              Kembali
            </Link>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium uppercase tracking-widest mb-6">
                <ShieldCheck size={14} />
                Dokumen Legal
              </div>
              <h1 className="text-4xl md:text-5xl font-display italic font-medium mb-6 leading-tight">Perjanjian Tingkat Layanan (OEM SLA)</h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Perjanjian ini mengikat secara hukum antara NINOC dan Anda sebagai Mitra Manufaktur (Supplier), diatur dan tunduk pada hukum perundang-undangan Negara Kesatuan Republik Indonesia.
              </p>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-white/40">
                <FileText size={16} />
                <span className="text-[10px] font-medium uppercase tracking-widest">NINOC Legal Dept.</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">9 Juni 2026</p>
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
                  Ketentuan Umum & Definisi
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>1.1. <strong>&quot;Program Supplier B2B&quot;</strong> adalah kemitraan eksklusif *Original Equipment Manufacturer* (OEM) di mana Supplier memproduksi barang fisik untuk diedarkan oleh NINOC.</p>
                  <p>1.2. <strong>&quot;NINOC Hub&quot;</strong> merujuk pada Gudang Pusat NINOC tempat barang diserahkan untuk proses *Quality Control* (QC) dan *fulfillment* ke tangan pembeli.</p>
                  <p>1.3. Seluruh dokumen *Know Your Customer* (KYC) yang diserahkan bersifat rahasia dan dilindungi oleh Kebijakan Privasi perusahaan.</p>
                </div>
              </section>

              {/* 2. SYARAT PRODUKSI & KUALIFIKASI */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">02</span>
                  Syarat Produksi
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>2.1. Supplier wajib memiliki entitas hukum yang sah atau terdaftar minimal dengan NIB untuk keperluan komersial (B2B).</p>
                  <p>2.2. Kapasitas produksi harus dapat memenuhi Service Level Agreement (SLA) waktu penyelesaian yang disepakati untuk setiap Purchase Order (PO).</p>
                  <p>2.3. Supplier menjamin mutu barang tidak mengandung bahan berbahaya atau menyalahi regulasi standardisasi industri Republik Indonesia (SNI).</p>
                </div>
              </section>

              {/* 3. HAK REBRAND & DISTRIBUSI */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">03</span>
                  Hak Rebrand Eksklusif
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <div className="bg-cr noise border border-ink/10 p-4 text-ink font-mono text-[10px] mb-4">
                    <strong className="block mb-1 uppercase tracking-wider text-ink">Model OEM (White-Label)</strong>
                    NINOC memegang kendali penuh atas identitas akhir produk yang dipasarkan ke konsumen.
                  </div>
                  <p>3.1. Supplier memberikan hak eksklusif yang sah, final, dan tak tergugurkan kepada NINOC untuk <strong>mengemas, mengubah, dan memberi merek ulang (rebrand)</strong> setiap barang yang didistribusikan.</p>
                  <p>3.2. Identitas asli dari pabrik (Supplier) akan dijaga kerahasiaannya untuk melindungi persaingan B2B. Semua distribusi konsumen akan berada di bawah merek NINOC atau afiliasinya.</p>
                </div>
              </section>

              {/* 4. INTEGRITAS HUKUM & QC */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-rose uppercase tracking-widest flex items-center gap-2 border-b border-rose/20 pb-2">
                  <AlertTriangle size={14} className="text-rose" />
                  Integritas & Kepatuhan
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>4.1. <strong>Pelanggaran Kekayaan Intelektual:</strong> Supplier menjamin seluruh produk yang dipasok bebas dari pelanggaran paten, desain industri, hak cipta, atau merek pihak ketiga. Risiko sengketa HKI sepenuhnya menjadi tanggung jawab Supplier.</p>
                  <p>4.2. <strong>Konsinyasi Fisik (QC):</strong> Semua barang wajib dikirim fisik ke NINOC Hub. Sistem *Dropshipping* langsung dari fasilitas Supplier sangat <strong>dilarang keras</strong> demi menjaga standarisasi Quality Control.</p>
                </div>
              </section>

              {/* 5. MEKANISME PENCAIRAN DANA */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">05</span>
                  Mekanisme Pembayaran HPP
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>5.1. Harga Pokok Produksi (HPP) ditentukan dan dikunci di muka pada setiap dokumen *Purchase Order* (PO).</p>
                  <p>5.2. <strong>Syarat Payout:</strong> Dana HPP baru akan dikreditkan ke buku besar (ledger) Supplier setelah konsumen akhir menyatakan pesanan <strong>&quot;Selesai&quot;</strong> (Delivered) dan melewati batas klaim Retur Garansi 7 hari secara aman tanpa sengketa kualitas.</p>
                  <p>5.3. Pemotongan pajak (jika ada) akan dilakukan sesuai peraturan Dirjen Pajak RI terkait transaksi B2B.</p>
                </div>
              </section>

              {/* 6. PENYELESAIAN SENGKETA */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">06</span>
                  Penyelesaian Sengketa
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>6.1. Perjanjian SLA ini tunduk pada hukum perdata Negara Kesatuan Republik Indonesia.</p>
                  <p>6.2. Perselisihan terkait pembayaran maupun kualitas barang akan diselesaikan secara musyawarah dalam kurun waktu maksimum 30 hari kalender.</p>
                  <p>6.3. Apabila mufakat tidak tercapai, sengketa akan dibawa ke yurisdiksi non-eksklusif Pengadilan Negeri terdekat domisili perusahaan NINOC.</p>
                </div>
              </section>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
