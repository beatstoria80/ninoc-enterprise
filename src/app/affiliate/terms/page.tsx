import React from 'react';
import Link from '@/components/LocalizedLink';
import { ShieldCheck, ArrowLeft, Scale, FileText, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Syarat & Ketentuan Afiliasi - NINOC',
  description: 'Syarat dan Ketentuan resmi Program Afiliasi NINOC berdasarkan hukum perundang-undangan Republik Indonesia.',
};

export default function AffiliateTermsPage() {
  return (
    <div className="h-screen w-screen bg-cr noise flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="w-[96vw] max-w-[1800px] h-[92vh] max-h-[1000px] flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 bg-white shadow-2xl border border-ink/5 rounded-xl overflow-hidden z-10">
        
        {/* Left Column - Header Info */}
        <div className="lg:col-span-3 flex flex-col bg-ink p-8 md:p-12 text-white relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Scale size={300} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <Link href="/affiliate" className="inline-flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white mb-12 transition-colors uppercase tracking-widest shrink-0">
              <ArrowLeft size={16} />
              Kembali
            </Link>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium uppercase tracking-widest mb-6">
                <ShieldCheck size={14} />
                Dokumen Legal
              </div>
              <h1 className="text-4xl md:text-5xl font-display italic font-medium mb-6 leading-tight">Syarat & Ketentuan Afiliasi</h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Perjanjian ini mengikat secara hukum antara NINOC dan Anda sebagai Mitra Afiliasi, diatur dan tunduk pada hukum perundang-undangan Negara Kesatuan Republik Indonesia.
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
                  <p>1.1. <strong>&quot;Program Afiliasi&quot;</strong> adalah program kemitraan di mana Mitra Afiliasi mempromosikan produk NINOC untuk mendapatkan komisi dari setiap penjualan yang valid.</p>
                  <p>1.2. <strong>&quot;Mitra Afiliasi&quot;</strong> adalah individu (Warga Negara Indonesia) yang telah disetujui secara resmi oleh pihak NINOC.</p>
                  <p>1.3. Dengan mendaftar, Mitra Afiliasi menyatakan bahwa seluruh data yang diberikan (KTP, NPWP, Rekening, URL Media Sosial) adalah asli, akurat, dan dapat dipertanggungjawabkan di mata hukum.</p>
                </div>
              </section>

              {/* 2. SYARAT PENDAFTARAN & KELAYAKAN */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">02</span>
                  Syarat Pendaftaran
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>2.1. Berusia minimal 18 tahun atau telah memiliki Kartu Tanda Penduduk (KTP) yang sah.</p>
                  <p>2.2. Wajib melampirkan profil yang masih aktif dan valid dari 4 (empat) platform sekaligus: Instagram, TikTok, YouTube, dan Facebook.</p>
                  <p>2.3. NINOC memiliki hak prerogatif penuh untuk menolak atau menyetujui aplikasi afiliasi tanpa kewajiban memberikan alasan spesifik.</p>
                </div>
              </section>

              {/* 3. KOMISI DAN KEPATUHAN PAJAK */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">03</span>
                  Komisi & Pajak (PPh 21)
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <div className="bg-cr noise border border-ink/10 p-4 text-ink font-mono text-[10px] mb-4">
                    <strong className="block mb-1 uppercase tracking-wider text-rose">Kepatuhan Hukum Pajak RI</strong>
                    Sesuai dengan UU HPP No. 7 Tahun 2021, penghasilan komisi afiliasi merupakan objek Pajak Penghasilan (PPh).
                  </div>
                  <p>3.1. Komisi hanya diberikan untuk pesanan yang telah berstatus <strong>&quot;Selesai&quot; (Delivered)</strong> dan telah melewati masa garansi pengembalian (Retur).</p>
                  <p>3.2. Penarikan dana (<em>Payout</em>) mewajibkan verifikasi KTP dan Rekening Koran / Buku Tabungan guna mematuhi UU No. 8 Tahun 2010 (TPPU).</p>
                  <p>3.3. <strong>Pemotongan Pajak:</strong> Komisi yang dicairkan akan dipotong PPh Pasal 21. Bagi Mitra yang mencantumkan NPWP valid, akan dikenakan tarif normal. Bagi Mitra tanpa NPWP, akan dikenakan tarif pajak 20% lebih tinggi.</p>
                </div>
              </section>

              {/* 4. LARANGAN & ANTI-FRAUD */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-rose uppercase tracking-widest flex items-center gap-2 border-b border-rose/20 pb-2">
                  <AlertTriangle size={14} className="text-rose" />
                  Larangan & Anti-Fraud
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>Pelanggaran terhadap poin ini akan mengakibatkan <strong>pemblokiran permanen dan penyitaan komisi</strong>:</p>
                  <ul className="list-disc pl-4 space-y-2 mt-2">
                    <li><strong>Self-Purchasing:</strong> Pembelian produk menggunakan tautan afiliasi milik sendiri.</li>
                    <li><strong>Spamming:</strong> Menyebarkan tautan via email massal tak diundang (Spam) melanggar UU ITE No. 11/2008.</li>
                    <li><strong>Penipuan (Phishing/Scam):</strong> Website/akun palsu atau iklan menyamar sebagai NINOC resmi.</li>
                    <li><strong>Pencemaran:</strong> Menyandingkan merek NINOC dengan pornografi, perjudian, SARA, atau konten ilegal.</li>
                  </ul>
                </div>
              </section>

              {/* 5. HAK KEKAYAAN INTELEKTUAL */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">05</span>
                  Hak Kekayaan Intelektual
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>5.1. Logo, foto produk, Media Kit, dan identitas visual NINOC dilindungi oleh UU No. 28/2014 tentang Hak Cipta dan UU No. 20/2016 tentang Merek.</p>
                  <p>5.2. Mitra diberikan lisensi non-eksklusif, tidak dapat dialihkan, dan dapat dicabut kapan saja untuk keperluan promosi Afiliasi.</p>
                </div>
              </section>

              {/* 6. PENYELESAIAN SENGKETA */}
              <section className="break-inside-avoid space-y-4">
                <h2 className="text-sm font-display font-medium text-ink uppercase tracking-widest flex items-center gap-2 border-b border-ink/10 pb-2">
                  <span className="text-ink/40">06</span>
                  Penyelesaian Sengketa
                </h2>
                <div className="space-y-3 text-xs text-ink/70 leading-relaxed">
                  <p>6.1. Perjanjian ini tunduk pada hukum Negara Kesatuan Republik Indonesia.</p>
                  <p>6.2. Perselisihan akan diselesaikan secara musyawarah mufakat dalam waktu 30 (tiga puluh) hari kalender.</p>
                  <p>6.3. Apabila gagal, sengketa akan diselesaikan melalui yurisdiksi non-eksklusif Pengadilan Negeri tempat NINOC beroperasi.</p>
                </div>
              </section>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
