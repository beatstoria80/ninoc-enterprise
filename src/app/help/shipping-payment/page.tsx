"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CourierLogo from '@/components/CourierLogo';
import { ShieldCheck, Truck, CreditCard, Clock, CheckCircle, Zap, ArrowLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DICTIONARY: BAHASA INDONESIA
// ═══════════════════════════════════════════════════════════════
const dictID = {
  title: "Panduan Pengiriman & Pembayaran",
  subtitle: "SLA Logistik & Keamanan Transaksi",
  
  services: [
    {
      id: "instant",
      title: "GoSend & GrabExpress (Layanan Instant)",
      icon: <Zap size={24} className="text-rose" />,
      logos: ["gosend", "grabexpress"],
      description: "Pengiriman super cepat dalam kota (khusus Bandung Raya). Cocok untuk Anda yang membutuhkan barang di hari yang sama.",
      specs: [
        { label: "Estimasi Waktu", value: "1-3 jam setelah kurir melakukan pick-up di fasilitas kami." },
        { label: "Batas Operasional (Cut-off)", value: "Pemesanan sebelum pukul 15:00 WIB akan dikirim pada hari yang sama." },
        { label: "Batas Dimensi & Berat", value: "Maksimal 5 kg untuk layanan motor." },
        { label: "Asuransi & Jaminan", value: "Dilindungi penuh oleh pihak aplikasi. Wajib menyertakan video unboxing utuh jika terjadi kehilangan." }
      ]
    },
    {
      id: "jne",
      title: "JNE Express (Reguler, YES, JTR)",
      icon: <Truck size={24} className="text-blue-600" />,
      logos: ["jne"],
      description: "Mitra ekspedisi nasional utama kami. Memiliki jangkauan terluas hingga pelosok Indonesia dengan keandalan tinggi.",
      specs: [
        { label: "Reguler / OKE", value: "Estimasi 2-5 hari kerja tergantung wilayah tujuan." },
        { label: "YES (Yakin Esok Sampai)", value: "Estimasi 1 hari kerja (Next Day) untuk kota-kota besar yang didukung." },
        { label: "JTR (JNE Trucking)", value: "Khusus kargo berat minimum 10 kg. Estimasi 3-7 hari kerja." },
        { label: "Batas Operasional", value: "Pesanan terkonfirmasi sebelum pukul 16:00 WIB akan diserahkan ke JNE di hari yang sama." }
      ]
    },
    {
      id: "sicepat",
      title: "SiCepat Ekspres (HALU, BEST, GOKIL)",
      icon: <Truck size={24} className="text-red-600" />,
      logos: ["sicepat"],
      description: "Pilihan logistik cepat dengan tarif ekonomis, ideal untuk pengiriman reguler maupun kargo antar pulau.",
      specs: [
        { label: "HALU / Reguler", value: "Estimasi pengiriman 1-3 hari kerja untuk Pulau Jawa, 3-6 hari untuk luar pulau." },
        { label: "BEST (Besok Sampai Tujuan)", value: "Layanan prioritas 1 hari kerja (Next Day) untuk kota-kota besar." },
        { label: "GOKIL (Kargo Kilat)", value: "Layanan kargo hemat untuk paket berukuran besar (Minimum 10 kg)." },
        { label: "Batas Operasional", value: "Pesanan masuk sebelum pukul 16:00 WIB diproses pada hari yang sama." }
      ]
    },
    {
      id: "jnt",
      title: "J&T Express & Pos Indonesia",
      icon: <Truck size={24} className="text-orange-600" />,
      logos: ["jnt", "pos"],
      description: "Layanan ekspedisi tanpa hari libur (J&T beroperasi 365 hari) dan jangkauan kepulauan terluar (Pos Indonesia).",
      specs: [
        { label: "J&T EZ (Reguler)", value: "Estimasi 2-3 hari kerja. Kurir tetap melakukan pengiriman pada hari Minggu/Libur." },
        { label: "Pos Reguler", value: "Estimasi 3-7 hari kerja, sangat direkomendasikan untuk daerah pelosok/kabupaten terluar." },
        { label: "Batas Operasional", value: "Pesanan diproses hari kerja (Senin - Sabtu) sebelum 16:00 WIB." },
        { label: "Penanganan Kendala", value: "Batas klaim kerusakan adalah 1x24 jam setelah status 'Delivered' di sistem." }
      ]
    },
    {
      id: "midtrans",
      title: "Payment Gateway Resmi (Midtrans)",
      icon: <ShieldCheck size={24} className="text-emerald-600" />,
      logos: ["midtrans"],
      description: "Seluruh transaksi di NINOC Enterprise diproses menggunakan sistem keamanan perbankan (Enkripsi Level Bank & PCI-DSS V3.2.1) dari Midtrans.",
      specs: [
        { label: "Virtual Account & QRIS", value: "Konfirmasi pembayaran otomatis dalam 1-5 menit. Invoice akan kedaluwarsa dalam 24 jam jika tidak dibayar." },
        { label: "E-Wallet (GoPay, Dll)", value: "Proses real-time tanpa input manual. Sangat disarankan untuk transaksi cepat." },
        { label: "Kartu Kredit", value: "Mendukung 3D Secure (OTP verifikasi). NINOC tidak pernah menyimpan nomor kartu kredit/debit Anda." },
        { label: "Kebijakan Refund", value: "Jika transaksi gagal namun saldo terpotong, Midtrans/Bank akan memproses refund otomatis dalam 7-14 hari kerja." }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// DICTIONARY: ENGLISH
// ═══════════════════════════════════════════════════════════════
const dictEN = {
  title: "Shipping & Payment Guide",
  subtitle: "Logistics SLAs & Transaction Security",
  
  services: [
    {
      id: "instant",
      title: "GoSend & GrabExpress (Instant Services)",
      icon: <Zap size={24} className="text-rose" />,
      logos: ["gosend", "grabexpress"],
      description: "Ultra-fast intra-city delivery (Bandung Metropolitan Area). Perfect when you need items on the exact same day.",
      specs: [
        { label: "Time Estimate", value: "1-3 hours after the courier picks up the order from our facility." },
        { label: "Cut-off Time", value: "Orders placed before 15:00 WIB will be dispatched on the same day." },
        { label: "Weight Limits", value: "Maximum 5 kg for motorcycle delivery services." },
        { label: "Insurance & Guarantee", value: "Fully covered by the platform. Strict requirement: unedited unboxing video for loss claims." }
      ]
    },
    {
      id: "jne",
      title: "JNE Express (Reguler, YES, JTR)",
      icon: <Truck size={24} className="text-blue-600" />,
      logos: ["jne"],
      description: "Our primary national expedition partner. Boasts the widest reach across Indonesia with high reliability.",
      specs: [
        { label: "Regular / OKE", value: "Estimated 2-5 business days depending on the destination region." },
        { label: "YES (Next Day)", value: "Estimated 1 business day for supported major cities." },
        { label: "JTR (JNE Trucking)", value: "Dedicated for heavy cargo (Min 10 kg). Estimated 3-7 business days." },
        { label: "Cut-off Time", value: "Orders confirmed before 16:00 WIB are handed over to JNE on the same day." }
      ]
    },
    {
      id: "sicepat",
      title: "SiCepat Ekspres (HALU, BEST, GOKIL)",
      icon: <Truck size={24} className="text-red-600" />,
      logos: ["sicepat"],
      description: "Fast logistics option with economical rates, ideal for regular or inter-island cargo shipping.",
      specs: [
        { label: "HALU / Regular", value: "Estimated 1-3 business days for Java Island, 3-6 days for outer islands." },
        { label: "BEST (Next Day)", value: "Priority 1 business day service for major cities." },
        { label: "GOKIL (Cargo)", value: "Economical cargo service for large packages (Min 10 kg)." },
        { label: "Cut-off Time", value: "Orders placed before 16:00 WIB are processed on the same day." }
      ]
    },
    {
      id: "jnt",
      title: "J&T Express & Pos Indonesia",
      icon: <Truck size={24} className="text-orange-600" />,
      logos: ["jnt", "pos"],
      description: "Logistics with no holidays (J&T operates 365 days) and the furthest reach to remote islands (Pos Indonesia).",
      specs: [
        { label: "J&T EZ (Regular)", value: "Estimated 2-3 business days. Couriers continue delivery on Sundays/Holidays." },
        { label: "Pos Regular", value: "Estimated 3-7 business days, highly recommended for remote/outer districts." },
        { label: "Cut-off Time", value: "Orders are processed on weekdays (Mon-Sat) before 16:00 WIB." },
        { label: "Issue Resolution", value: "Damage claims must be filed within 1x24 hours of 'Delivered' status." }
      ]
    },
    {
      id: "midtrans",
      title: "Official Payment Gateway (Midtrans)",
      icon: <ShieldCheck size={24} className="text-emerald-600" />,
      logos: ["midtrans"],
      description: "All transactions on NINOC Enterprise are processed using bank-grade security systems (Bank-Level Encryption & PCI-DSS V3.2.1) powered by Midtrans.",
      specs: [
        { label: "Virtual Account & QRIS", value: "Auto-confirmation within 1-5 minutes. Invoices expire in 24 hours if unpaid." },
        { label: "E-Wallet (GoPay, etc.)", value: "Real-time processing with no manual input. Highly recommended for speed." },
        { label: "Credit Cards", value: "Supports 3D Secure (OTP verification). NINOC never stores your credit/debit card numbers." },
        { label: "Refund Policy", value: "If a transaction fails but balance is deducted, Midtrans/Bank will process an auto-refund within 7-14 business days." }
      ]
    }
  ]
};

export default function ShippingPaymentTermsPage() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith('/en');
  const dict = isEn ? dictEN : dictID;

  // NOTE: We DO NOT manually render <GlobalHeader /> and <Footer /> 
  // because ClientPlatformManager already injects them globally.

  return (
    <div className="min-h-screen bg-[#f8f9fa] selection:bg-ink selection:text-white pb-24">
      
      {/* Back Button */}
      <div className="pt-8 max-w-[1000px] w-full mx-auto px-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs md:text-[11px] font-medium uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {isEn ? "Back to Home" : "Kembali ke Beranda"}
        </Link>
      </div>

      {/* Header Section */}
      <div className="pt-8 pb-8 max-w-[1000px] w-full mx-auto px-6 border-b border-ink/5">
        <h1 className="font-display font-medium italic text-2xl md:text-3xl tracking-tighter text-ink mb-2 uppercase leading-tight">
          {dict.title}
        </h1>
        <p className="text-xs md:text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
          {dict.subtitle}
        </p>
      </div>

      {/* Vertical List Content */}
      <div className="max-w-[1000px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {dict.services.map((service, index) => (
          <section key={service.id} className="bg-white border border-ink/10 rounded-sm shadow-sm overflow-hidden group hover:border-ink/20 transition-colors">
            
            {/* Service Header */}
            <div className="p-4 md:p-5 bg-ink/[0.01] border-b border-ink/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-ink/5 shrink-0">
                  {service.icon}
                </div>
                <div>
                  <h2 className="text-base md:text-sm font-bold uppercase tracking-[0.1em] text-ink">{service.title}</h2>
                  <p className="text-xs md:text-[11px] text-ink/60 mt-1.5 leading-relaxed max-w-[600px]">{service.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center shrink-0">
                {service.logos.map(logo => (
                  <CourierLogo key={logo} courier={logo} className="h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                ))}
              </div>
            </div>

            {/* Service Specs Details */}
            <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {service.specs.map((spec, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-4 h-4 rounded-full bg-ink/5 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={10} className="text-ink/50" />
                  </div>
                  <div>
                    <h3 className="text-[11px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-1.5">{spec.label}</h3>
                    <p className="text-sm md:text-[12px] text-ink/80 leading-relaxed font-medium">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

          </section>
        ))}
      </div>

    </div>
  );
}
