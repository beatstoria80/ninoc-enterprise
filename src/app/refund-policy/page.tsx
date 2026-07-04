"use client";

import React from 'react';
import { ArrowLeft, RefreshCw, Video, Shield, CheckCircle } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import GlobalFooter from '@/components/Footer';

export default function RefundPolicyPage() {
  const sections = [
    {
      id: "01",
      title: "BATAS WAKTU PENGAJUAN (RETURN WINDOW)",
      text: "Kepuasan pelanggan adalah prioritas utama NINOC ENTERPRISE. Anda berhak mengajukan pengembalian barang (retur) atau pengembalian dana (refund) maksimal dalam waktu 2 x 24 jam (48 jam) terhitung sejak status resi ekspedisi dinyatakan 'Diterima' oleh pelanggan. Pengajuan yang melewati batas waktu ini tidak dapat diproses."
    },
    {
      id: "02",
      title: "SYARAT WAJIB VIDEO UNBOXING (EVIDENCE REQUIREMENT)",
      text: "Demi transparansi dan standar verifikasi, setiap klaim retur/refund WAJIB menyertakan bukti Video Unboxing dengan ketentuan berikut:\n\n• Video direkam secara utuh (1-Shot) tanpa jeda, potong (cut), atau proses edit, mulai dari paket masih tersegel utuh di seluruh sisi hingga barang dikeluarkan dan diperiksa.\n• Label resi pengiriman dan timestamp waktu harus terlihat jelas di dalam rekaman video.\n• Tanpa bukti video unboxing yang memenuhi standar di atas, klaim cacat, kekurangan barang, atau ketidaksesuaian akan ditolak secara mutlak."
    },
    {
      id: "03",
      title: "KONDISI BARANG YANG DAPAT DIKEMBALIKAN (ELIGIBLE CONDITIONS)",
      text: "Barang yang dikembalikan harus memenuhi kondisi berikut:\n\n• Produk diterima dalam kondisi rusak/cacat produksi (defective) atau kesalahan pengiriman model/ukuran/warna dari pihak NINOC.\n• Produk belum pernah dipakai beraktivitas, belum dicuci, tidak berbau parfum/deterjen, dan tidak mengalami perubahan bentuk.\n• Seluruh hangtag, label woven, kemasan ziplock resmi, dan kelengkapan aksesoris masih terpasang utuh seperti saat pertama kali diterima."
    },
    {
      id: "04",
      title: "PROSES VERIFIKASI & PENGEMBALIAN DANA (REFUND TIMELINE)",
      text: "• Setelah pengajuan dikirim melalui form Retur di website atau tim Support kami, proses verifikasi membutuhkan waktu 1–2 hari kerja.\n• Apabila barang yang diretur telah kami terima di gudang dan lolos inspeksi kualitas, pengembalian dana (refund) akan diproses dalam waktu 3–7 hari kerja.\n• Pengembalian dana akan disalurkan langsung ke metode pembayaran awal (Kartu Kredit/Bank Transfer/E-Wallet) yang digunakan saat transaksi."
    },
    {
      id: "05",
      title: "BIAYA PENGIRIMAN RETUR (SHIPPING FEES FOR RETURNS)",
      text: "• Jika retur disebabkan oleh cacat produksi atau kesalahan pengiriman dari pihak NINOC, seluruh biaya ongkos kirim pengembalian dan pengiriman ulang akan DITANGGUNG SEPENUHNYA oleh NINOC.\n• Apabila retur atas dasar penukaran ukuran atas keinginan pembeli (selama stok tersedia dan disetujui), biaya ongkos kirim ditanggung oleh pembeli."
    },
    {
      id: "06",
      title: "ALAMAT PENGEMBALIAN & KONTAK LEGAL",
      text: "Alamat Penerimaan Retur Gudang NINOC:\nKompleks Griya Saluyu, Blok AA No.87, Mekarjaya RANCASARI, KOTA BANDUNG, JAWA BARAT, ID, 40292\n\nUntuk pengajuan retur cepat, gunakan menu 'Retur' di navigasi bawah atau hubungi tim layanan pelanggan resmi kami via email di cs@ninoc.store atau WhatsApp +628211983774."
    }
  ];

  return (
    <main className="min-h-screen bg-cr noise flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-[200] px-6 md:px-12 py-4 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-3 text-ink/60 hover:text-rose transition-all group">
          <ArrowLeft size={12} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/20">Studio Exit</span>
            <span className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink">Back to Store</span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-xs md:text-[9px] font-display font-medium italic tracking-tighter text-rose uppercase">NINOC</span>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-[9px] font-medium tracking-widest text-ink/40">
          <RefreshCw size={12} className="text-rose" />
          <span className="hidden md:inline uppercase">Refund Protocol</span>
        </div>
      </nav>

      <div className="flex-1 min-h-0 pt-20 md:pt-24 pb-12 px-6 md:px-12 flex flex-col max-w-[1400px] mx-auto w-full">
        <div className="flex items-baseline justify-between mb-8 border-b border-ink/5 pb-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl md:text-3xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">
              KEBIJAKAN RETUR & REFUND (RETURN POLICY)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-600/60">Consumer Protection</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-8 space-y-6">
            {sections.map((s) => (
              <div key={s.id} className="p-4 md:p-6 bg-white border border-ink/5 rounded-sm shadow-sm space-y-2 group hover:border-ink/15 transition-all">
                <div className="flex items-center gap-3 border-b border-ink/5 pb-2">
                  <span className="text-xs font-bold text-rose tabular-nums">{s.id}</span>
                  <h3 className="text-sm font-display font-medium text-ink uppercase tracking-wider">{s.title}</h3>
                </div>
                <p className="text-xs md:text-sm font-medium leading-relaxed text-ink/70 whitespace-pre-line pt-1">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="md:col-span-4 space-y-4">
            <div className="p-5 bg-ink text-white rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-rose">
                <Video size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Wajib Video Unboxing</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Rekam video 1-shot dari awal paket tersegel utuh. Bukti video adalah syarat mutlak pemrosesan klaim retur atau refund.
              </p>
            </div>

            <div className="p-5 bg-white border border-ink/5 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-ink">
                <CheckCircle size={16} className="text-rose" />
                <span className="text-xs font-bold uppercase tracking-widest">Jaminan Kualitas 100%</span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Setiap item melewati verifikasi kualitas ketat di studio kami. Apabila terbukti cacat pabrik, kami ganti baru atau kembalikan dana Anda secara penuh.
              </p>
            </div>

            <div className="p-5 bg-white border border-ink/5 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-ink">
                <Shield size={16} className="text-rose" />
                <span className="text-xs font-bold uppercase tracking-widest">Kepatuhan Hukum Konsumen</span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Kebijakan ini dibuat patuh terhadap Undang-Undang Perlindungan Konsumen No. 8 Tahun 1999 dan standar Google Merchant Center.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </main>
  );
}
