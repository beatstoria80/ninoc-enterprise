"use client";

import React from 'react';
import { ArrowLeft, Truck, Clock, Shield, MapPin } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import GlobalFooter from '@/components/Footer';

export default function ShippingPolicyPage() {
  const sections = [
    {
      id: "01",
      title: "PROSES & WAKTU PENYIAPAN (HANDLING TIME)",
      text: "Seluruh pesanan yang masuk diproses dan dikemas di studio/gudang kami di Bandung setiap hari kerja (Senin–Sabtu) pukul 08.00–17.00 WIB. Waktu penyiapan standar adalah 1–2 hari kerja setelah verifikasi pembayaran berhasil. Pesanan yang diverifikasi sebelum pukul 15.00 WIB akan diproses pada hari yang sama."
    },
    {
      id: "02",
      title: "ESTIMASI WAKTU PENGIRIMAN (TRANSIT TIME)",
      text: "Waktu transit pengiriman bergantung pada spesifikasi lokasi tujuan Anda dari gudang asal kami di Bandung:\n\n• Jabodetabek & Bandung: 1–2 hari kerja\n• Pulau Jawa (luar Jabodetabek): 2–4 hari kerja\n• Luar Pulau Jawa: 3–7 hari kerja\n• Wilayah Remote / Indonesia Timur: 5–10 hari kerja"
    },
    {
      id: "03",
      title: "MITRA EKSPEDISI & PELACAKAN (CARRIERS & TRACKING)",
      text: "Kami bekerja sama dengan mitra ekspedisi terpercaya seperti JNE, J&T Express, SiCepat, dan Anteraja. Nomor resi (tracking ID) akan dibuat dan dikirimkan secara otomatis melalui WhatsApp dan Email setelah paket diserahkan kepada kurir. Pelacakan juga dapat dilakukan langsung melalui menu 'Lacak' di website kami."
    },
    {
      id: "04",
      title: "TARIF PENGIRIMAN (SHIPPING COSTS)",
      text: "Biaya pengiriman dikalkulasi secara otomatis di halaman Checkout berdasarkan berat/volume produk dan lokasi tujuan pengiriman sesuai tarif resmi ekspedisi. Kami transparan mengenai seluruh biaya tanpa biaya tersembunyi."
    },
    {
      id: "05",
      title: "RISIKO PENGIRIMAN (SHIPPING RISK & LIABILITY)",
      text: "Seluruh pengiriman barang mengacu pada ketentuan FOB Shipping Point. Namun demikian, kami memastikan setiap paket dikemas dengan standar keamanan proteksi ganda (double-sealed/encrypted structure). Apabila terjadi kerusakan atau kehilangan oleh pihak ekspedisi, tim layanan pelanggan kami bersiap membantu proses klaim asuransi pengiriman."
    },
    {
      id: "06",
      title: "LOKASI GUDANG & KONTAK LOGISTIK",
      text: "Gudang Utama NINOC ENTERPRISE:\nJl. Dago No. 108, Coblong, Kota Bandung, Jawa Barat 40132, Indonesia.\n\nUntuk kendala keterlambatan atau pertanyaan logistik, silakan hubungi tim kami di cs@ninoc.store atau WhatsApp +62 821-1983-7744."
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
          <Truck size={12} className="text-rose" />
          <span className="hidden md:inline uppercase">Logistics Protocol</span>
        </div>
      </nav>

      <div className="flex-1 min-h-0 pt-20 md:pt-24 pb-12 px-6 md:px-12 flex flex-col max-w-[1400px] mx-auto w-full">
        <div className="flex items-baseline justify-between mb-8 border-b border-ink/5 pb-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl md:text-3xl font-display font-medium italic tracking-tighter text-ink uppercase leading-none">
              KEBIJAKAN PENGIRIMAN (SHIPPING POLICY)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-600/60">Verified Logistics</span>
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
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Waktu Operasional Logistik</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Senin – Sabtu: 08.00 – 17.00 WIB<br />
                Minggu / Hari Libur: Tutup (Diproses hari kerja berikutnya)
              </p>
            </div>

            <div className="p-5 bg-white border border-ink/5 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-ink">
                <MapPin size={16} className="text-rose" />
                <span className="text-xs font-bold uppercase tracking-widest">Asal Pengiriman</span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Seluruh produk dikirim langsung dari Studio Utama NINOC ENTERPRISE, Bandung, Jawa Barat, Indonesia.
              </p>
            </div>

            <div className="p-5 bg-white border border-ink/5 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-ink">
                <Shield size={16} className="text-rose" />
                <span className="text-xs font-bold uppercase tracking-widest">Jaminan Transparansi</span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Sesuai kebijakan Google Merchant Center, seluruh tarif logistik, pajak, dan waktu estimasi disajikan secara akurat sebelum pembayaran dilakukan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </main>
  );
}
