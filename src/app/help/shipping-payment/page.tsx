"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalHeader from '@/components/GlobalHeader';
import Footer from '@/components/Footer';
import CourierLogo, { COURIER_LOGOS } from '@/components/CourierLogo';
import { ShieldCheck, Truck, CreditCard, Lock, Clock, Package, AlertTriangle, Zap, CheckCircle, Info } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DICTIONARY: BAHASA INDONESIA
// ═══════════════════════════════════════════════════════════════
const dictID = {
  title: "Syarat & Ketentuan Terpadu",
  subtitle: "Kebijakan Logistik, SLA Ekspedisi, dan Transaksi Keuangan",
  
  grid1: {
    title: "1. Layanan Instant & Same Day",
    desc: "Pengiriman super cepat dalam kota (GoSend / GrabExpress).",
    sla: "SLA & Batas Waktu Operasional:",
    points: [
      "Batas pemesanan: 15:00 WIB. Pemesanan di atas jam ini akan dikirim esok hari.",
      "Instant: Maksimal 3 jam setelah kurir mengambil barang dari hub kami.",
      "Same Day: Maksimal 8 jam setelah barang diserahkan ke kurir.",
      "Maksimal berat 5kg untuk Instant motor, dan 7kg untuk Same Day.",
      "Kurir tidak berhak memungut biaya tambahan apapun (seperti parkir/tol) tanpa konfirmasi ke sistem NINOC."
    ]
  },

  grid2: {
    title: "2. Reguler, Kargo & Antarkota",
    desc: "Layanan logistik konvensional untuk pengiriman ke seluruh Indonesia.",
    sla: "SLA & Batas Waktu Operasional:",
    points: [
      "Reguler (JNE, SiCepat, J&T): 1-3 hari kerja (luar pulau menyesuaikan wilayah).",
      "Kargo (JTR / SiCepat Gokil): Diperuntukkan untuk barang berat > 10kg. Estimasi 3-7 hari kerja.",
      "Batas cut-off resi: Semua order masuk sebelum 16:00 WIB akan diserahkan ke hub kurir di hari yang sama.",
      "Asuransi: Semua pengiriman di-cover oleh pihak ketiga. Jika barang rusak/hilang, klaim diproses maksimal 7-14 hari kerja.",
      "Kurir akan mencoba mengirimkan barang maksimal 3x. Jika gagal, paket akan dikembalikan (Retur) ke fasilitas kami."
    ]
  },

  grid3: {
    title: "3. Enkripsi Transaksi Midtrans",
    desc: "Infrastruktur pembayaran resmi yang digunakan oleh NINOC Enterprise.",
    sla: "Keamanan PCI-DSS & Protokol 3D Secure",
    points: [
      "NINOC Enterprise tidak pernah menyimpan data nomor Kartu Kredit atau PIN Anda.",
      "Semua transaksi di-handle secara independen melalui Midtrans Core API dengan enkripsi level bank.",
      "Virtual Account (VA) & E-Wallet: Konfirmasi instan dalam hitungan detik. Batas kedaluwarsa adalah 24 jam.",
      "Kartu Kredit: Mendukung fitur 3D secure (OTP) dari Visa/Mastercard/JCB.",
      "Setiap kegagalan transaksi yang terpotong di saldo Anda akan otomatis di-refund oleh bank penerbit dalam 7-14 hari kerja."
    ]
  },

  grid4: {
    title: "4. Kebijakan Asuransi & Resolusi",
    desc: "Protokol mitigasi jika terjadi kendala pengiriman atau transaksi.",
    sla: "Hak Konsumen & Pelaporan:",
    points: [
      "Pelaporan Kerusakan: Maksimal 1x24 jam setelah status 'Delivered'. Wajib melampirkan video unboxing utuh.",
      "Paket Hilang (Lost in Transit): Dana bisa dikembalikan penuh (Refund) atau pengiriman ulang barang jika stok tersedia, setelah verifikasi ekspedisi.",
      "Keterlambatan Ekstrim: Melewati batas SLA kurir > 3 hari kerja, hubungi tim NINOC untuk dilakukan push priority ke agen pusat logistik.",
      "Perubahan Alamat: Tidak dapat dilakukan apabila resi (Waybill) sudah tercetak dan diserahkan ke kurir."
    ]
  }
};

// ═══════════════════════════════════════════════════════════════
// DICTIONARY: ENGLISH
// ═══════════════════════════════════════════════════════════════
const dictEN = {
  title: "Unified Terms & Conditions",
  subtitle: "Logistics Policies, Courier SLAs, and Financial Transactions",
  
  grid1: {
    title: "1. Instant & Same Day Services",
    desc: "Ultra-fast intra-city delivery (GoSend / GrabExpress).",
    sla: "SLA & Operational Cut-offs:",
    points: [
      "Cut-off time: 15:00 WIB. Orders placed after this hour will be dispatched the next day.",
      "Instant: Delivered within 3 hours after the courier picks up the item from our hub.",
      "Same Day: Delivered within 8 hours after handing over to the courier.",
      "Weight limits: Maximum 5kg for Instant motorcycles, and 7kg for Same Day.",
      "Couriers are not authorized to collect additional fees (e.g., parking/tolls) without confirmation via the NINOC system."
    ]
  },

  grid2: {
    title: "2. Regular, Cargo & Inter-city",
    desc: "Conventional logistics services for nationwide shipping across Indonesia.",
    sla: "SLA & Operational Cut-offs:",
    points: [
      "Regular (JNE, SiCepat, J&T): 1-3 business days (inter-island deliveries adjust regionally).",
      "Cargo (JTR / SiCepat Gokil): Dedicated for heavy/bulky items > 10kg. Est. 3-7 business days.",
      "Dispatch Cut-off: All orders received before 16:00 WIB will be handed over to the courier hub on the same day.",
      "Insurance: All shipments are covered by third-party logistics. In case of damage/loss, claims take 7-14 business days.",
      "Couriers will attempt delivery up to 3x. If unsuccessful, the package will be returned to our facility."
    ]
  },

  grid3: {
    title: "3. Midtrans Transaction Encryption",
    desc: "Official payment infrastructure powering NINOC Enterprise.",
    sla: "PCI-DSS Security & 3D Secure Protocols",
    points: [
      "NINOC Enterprise never stores your Credit Card numbers or PINs.",
      "All transactions are handled independently via Midtrans Core API utilizing bank-level encryption.",
      "Virtual Accounts (VA) & E-Wallets: Instant confirmation within seconds. Expiry is strictly 24 hours.",
      "Credit Cards: Supports 3D Secure (OTP) for Visa/Mastercard/JCB.",
      "Any failed transactions where balances are deducted will be automatically refunded by the issuing bank within 7-14 business days."
    ]
  },

  grid4: {
    title: "4. Insurance & Resolution Policy",
    desc: "Mitigation protocols in the event of shipping or transaction issues.",
    sla: "Consumer Rights & Reporting:",
    points: [
      "Damage Reporting: Maximum 1x24 hours after 'Delivered' status. Unedited unboxing video is strictly required.",
      "Lost in Transit: Full refund or replacement shipment (subject to availability) after courier verification.",
      "Extreme Delays: Exceeding courier SLA by > 3 business days, contact NINOC to request a push priority to the logistics central agent.",
      "Address Changes: Cannot be accommodated once the Waybill is printed and handed over to the courier."
    ]
  }
};

export default function ShippingPaymentTermsPage() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const dict = isEn ? dictEN : dictID;

  return (
    <main className="min-h-screen flex flex-col bg-[#f8f9fa] selection:bg-ink selection:text-white">
      <GlobalHeader />
      
      <div className="flex-1 pt-32 pb-20 max-w-[1400px] w-full mx-auto px-6">
        <div className="mb-10 max-w-[800px]">
          <h1 className="font-display font-medium italic text-3xl md:text-5xl tracking-tighter text-ink mb-3 uppercase leading-tight">
            {dict.title}
          </h1>
          <p className="text-xs md:text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
            {dict.subtitle}
          </p>
        </div>

        {/* 4-GRIDS BENTO LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* GRID 1: INSTANT & SAMEDAY */}
          <div className="bg-white p-6 md:p-8 border border-ink/5 shadow-sm rounded-sm flex flex-col hover:border-ink/10 transition-colors">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink/5">
              <div className="w-12 h-12 bg-rose/5 rounded-full flex items-center justify-center text-rose shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.grid1.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1">{dict.grid1.desc}</p>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap gap-4">
              <CourierLogo courier="gosend" className="h-6" />
              <CourierLogo courier="grabexpress" className="h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4 flex items-center gap-1.5"><Clock size={10} /> {dict.grid1.sla}</h3>
              <ul className="space-y-4">
                {dict.grid1.points.map((pt, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-3.5 h-3.5 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={8} className="text-ink/60" /></div>
                    <p className="text-[12px] md:text-[10px] text-ink/80 leading-relaxed font-medium">{pt}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* GRID 2: REGULER & CARGO */}
          <div className="bg-white p-6 md:p-8 border border-ink/5 shadow-sm rounded-sm flex flex-col hover:border-ink/10 transition-colors">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink/5">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Truck size={24} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.grid2.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1">{dict.grid2.desc}</p>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap gap-4">
              <CourierLogo courier="sicepat" className="h-6" />
              <CourierLogo courier="jnt" className="h-6" />
              <CourierLogo courier="jne" className="h-6" />
              <CourierLogo courier="anteraja" className="h-6" />
              <CourierLogo courier="ninja" className="h-6" />
              <CourierLogo courier="pos" className="h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4 flex items-center gap-1.5"><Package size={10} /> {dict.grid2.sla}</h3>
              <ul className="space-y-4">
                {dict.grid2.points.map((pt, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-3.5 h-3.5 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={8} className="text-ink/60" /></div>
                    <p className="text-[12px] md:text-[10px] text-ink/80 leading-relaxed font-medium">{pt}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* GRID 3: MIDTRANS SECURE */}
          <div className="bg-white p-6 md:p-8 border border-ink/5 shadow-sm rounded-sm flex flex-col hover:border-ink/10 transition-colors">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink/5">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.grid3.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1">{dict.grid3.desc}</p>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              <div className="h-8 px-3 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-emerald-100">
                <Lock size={10} /> PCI-DSS V3.2.1
              </div>
              <div className="h-8 px-3 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-blue-100">
                AES-256 Encryption
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4 flex items-center gap-1.5"><CreditCard size={10} /> {dict.grid3.sla}</h3>
              <ul className="space-y-4">
                {dict.grid3.points.map((pt, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-3.5 h-3.5 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={8} className="text-ink/60" /></div>
                    <p className="text-[12px] md:text-[10px] text-ink/80 leading-relaxed font-medium">{pt}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* GRID 4: RESOLUTION POLICY */}
          <div className="bg-white p-6 md:p-8 border border-ink/5 shadow-sm rounded-sm flex flex-col hover:border-ink/10 transition-colors">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink/5">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.grid4.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1">{dict.grid4.desc}</p>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              <div className="h-8 px-3 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-amber-100">
                <Info size={10} /> Help Center Priority
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4 flex items-center gap-1.5"><ShieldCheck size={10} /> {dict.grid4.sla}</h3>
              <ul className="space-y-4">
                {dict.grid4.points.map((pt, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-3.5 h-3.5 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={8} className="text-ink/60" /></div>
                    <p className="text-[12px] md:text-[10px] text-ink/80 leading-relaxed font-medium">{pt}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
