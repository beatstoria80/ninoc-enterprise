import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Scale, FileText, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Syarat & Ketentuan Afiliasi - NINOC',
  description: 'Syarat dan Ketentuan resmi Program Afiliasi NINOC berdasarkan hukum perundang-undangan Republik Indonesia.',
};

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/affiliate" className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={16} />
          Kembali ke Pendaftaran
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-ink p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
              <Scale size={300} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium uppercase tracking-wider mb-6">
                <ShieldCheck size={14} />
                Dokumen Legal Resmi
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-medium mb-4">Syarat & Ketentuan Afiliasi</h1>
              <p className="text-white/70 max-w-2xl text-sm md:text-base leading-relaxed">
                Perjanjian ini mengikat secara hukum antara NINOC dan Anda sebagai Mitra Afiliasi, diatur dan tunduk pada hukum perundang-undangan Negara Kesatuan Republik Indonesia.
              </p>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8 md:p-12 space-y-12 text-ink/80 leading-relaxed text-sm md:text-base">
            
            {/* 1. KETENTUAN UMUM */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center text-sm">1</span>
                Ketentuan Umum & Definisi
              </h2>
              <div className="pl-11 space-y-3">
                <p>1.1. <strong>&quot;Program Afiliasi&quot;</strong> adalah program kemitraan di mana Mitra Afiliasi mempromosikan produk NINOC untuk mendapatkan komisi dari setiap penjualan yang valid.</p>
                <p>1.2. <strong>&quot;Mitra Afiliasi&quot;</strong> adalah individu (Warga Negara Indonesia) yang telah disetujui secara resmi oleh pihak NINOC.</p>
                <p>1.3. Dengan mendaftar, Mitra Afiliasi menyatakan bahwa seluruh data yang diberikan (KTP, NPWP, Rekening, URL Media Sosial) adalah asli, akurat, dan dapat dipertanggungjawabkan di mata hukum.</p>
              </div>
            </section>

            {/* 2. SYARAT PENDAFTARAN & KELAYAKAN */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center text-sm">2</span>
                Syarat Pendaftaran & Kelayakan
              </h2>
              <div className="pl-11 space-y-3">
                <p>2.1. Berusia minimal 18 tahun atau telah memiliki Kartu Tanda Penduduk (KTP) yang sah.</p>
                <p>2.2. Wajib melampirkan profil yang masih aktif dan valid dari 4 (empat) platform sekaligus: Instagram, TikTok, YouTube, dan Facebook.</p>
                <p>2.3. NINOC memiliki hak prerogatif penuh untuk menolak atau menyetujui aplikasi afiliasi tanpa kewajiban memberikan alasan spesifik.</p>
              </div>
            </section>

            {/* 3. KOMISI DAN KEPATUHAN PAJAK (PPh 21) */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">3</span>
                Komisi dan Kepatuhan Pajak (PPh 21)
              </h2>
              <div className="pl-11 space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-sm mb-4">
                  <strong className="block mb-1">Kepatuhan Hukum Pajak RI</strong>
                  Sesuai dengan Undang-Undang Harmonisasi Peraturan Perpajakan (UU HPP) No. 7 Tahun 2021, penghasilan komisi afiliasi merupakan objek Pajak Penghasilan (PPh).
                </div>
                <p>3.1. Komisi hanya diberikan untuk pesanan yang telah berstatus <strong>&quot;Selesai&quot; (Delivered)</strong> dan telah melewati masa garansi pengembalian (Retur).</p>
                <p>3.2. Penarikan dana (<em>Payout</em>) mewajibkan verifikasi KTP dan Rekening Koran / Buku Tabungan guna mematuhi UU No. 8 Tahun 2010 tentang Pencegahan dan Pemberantasan Tindak Pidana Pencucian Uang (TPPU).</p>
                <p>3.3. <strong>Pemotongan Pajak:</strong> Komisi yang dicairkan akan dipotong PPh Pasal 21. Bagi Mitra yang mencantumkan NPWP valid, akan dikenakan tarif normal sesuai lapisan PTKP. Bagi Mitra tanpa NPWP, akan dikenakan tarif pajak lebih tinggi (berlaku tarif 20% lebih tinggi dari tarif normal sesuai peraturan Direktorat Jenderal Pajak).</p>
              </div>
            </section>

            {/* 4. LARANGAN & ANTI-FRAUD (UU ITE) */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-rose flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-rose/10 text-rose flex items-center justify-center text-sm">
                  <AlertTriangle size={16} />
                </span>
                Larangan, Anti-Fraud, & UU ITE
              </h2>
              <div className="pl-11 space-y-3">
                <p>Mitra Afiliasi dilarang keras melakukan hal-hal berikut. Pelanggaran terhadap poin ini akan mengakibatkan <strong>pemblokiran akun permanen dan penyitaan seluruh komisi yang tertahan</strong>:</p>
                <ul className="list-disc pl-5 space-y-2 text-ink/70 mt-2">
                  <li><strong>Self-Purchasing:</strong> Melakukan pembelian produk menggunakan tautan afiliasi milik sendiri atau mendaftarkan akun palsu untuk mendapatkan komisi.</li>
                  <li><strong>Penyebaran Spam:</strong> Menyebarkan tautan afiliasi melalui email massal yang tidak diminta (Spam) atau metode yang melanggar Undang-Undang Informasi dan Transaksi Elektronik (UU ITE) No. 11 Tahun 2008 beserta perubahannya.</li>
                  <li><strong>Penipuan (Phishing/Scam):</strong> Membuat website, profil media sosial palsu, atau iklan (Search Engine Marketing) yang menyamar sebagai akun resmi NINOC.</li>
                  <li><strong>Pencemaran Nama Baik:</strong> Menyandingkan merek NINOC dengan konten pornografi, perjudian, SARA, diskriminasi, atau konten ilegal lainnya yang melanggar hukum RI.</li>
                </ul>
              </div>
            </section>

            {/* 5. HAK KEKAYAAN INTELEKTUAL */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center text-sm">5</span>
                Hak Kekayaan Intelektual (HAKI)
              </h2>
              <div className="pl-11 space-y-3">
                <p>5.1. Seluruh logo, foto produk, *Media Kit*, dan identitas visual yang disediakan oleh NINOC dilindungi oleh Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta dan UU No. 20 Tahun 2016 tentang Merek.</p>
                <p>5.2. Mitra Afiliasi diberikan lisensi non-eksklusif, tidak dapat dialihkan, dan dapat dicabut kapan saja untuk menggunakan aset tersebut semata-mata demi keperluan promosi Program Afiliasi.</p>
              </div>
            </section>

            {/* 6. PENYELESAIAN SENGKETA */}
            <section className="space-y-4">
              <h2 className="text-xl font-display font-medium text-ink flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center text-sm">6</span>
                Hukum yang Berlaku & Penyelesaian Sengketa
              </h2>
              <div className="pl-11 space-y-3">
                <p>6.1. Syarat dan Ketentuan ini dibuat, ditafsirkan, dan tunduk pada hukum Negara Kesatuan Republik Indonesia.</p>
                <p>6.2. Segala perselisihan yang timbul dari pelaksanaan perjanjian ini akan diselesaikan secara musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari kalender.</p>
                <p>6.3. Apabila mufakat tidak tercapai, kedua belah pihak sepakat untuk menyelesaikan sengketa tersebut melalui yurisdiksi non-eksklusif Pengadilan Negeri tempat domisili hukum perusahaan NINOC beroperasi.</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-ink/40 uppercase tracking-wider font-medium">Terakhir Diperbarui: 9 Juni 2026</p>
              <div className="flex items-center gap-2 text-ink/40">
                <FileText size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">NINOC Legal Dept.</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
