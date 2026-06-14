"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalHeader from '@/components/GlobalHeader';
import Footer from '@/components/Footer';
import CourierLogo, { COURIER_LOGOS } from '@/components/CourierLogo';
import { ShieldCheck, Truck, CreditCard, Lock, Clock, Package } from 'lucide-react';

const dictID = {
  title: "Pengiriman & Pembayaran",
  subtitle: "Kebijakan Logistik & Transaksi Aman",
  shipping: {
    title: "1. Mitra Ekspedisi & Logistik",
    desc: "NINOC bekerja sama dengan layanan ekspedisi terkemuka di Indonesia untuk memastikan keamanan dan kecepatan pengiriman produk Anda.",
    couriers: "Kurir Resmi",
    terms: [
      "Semua pesanan akan diproses maksimal 1x24 jam setelah pembayaran dikonfirmasi.",
      "Estimasi pengiriman bergantung pada layanan kurir yang dipilih (Reguler, Next Day, atau Kargo).",
      "Nomor resi otomatis dikirimkan ke email Anda dan dapat dilacak langsung di halaman Track Order kami.",
      "Setiap paket dilindungi asuransi pengiriman sesuai kebijakan masing-masing kurir.",
      "Jika terjadi keterlambatan atau kerusakan selama pengiriman, segera hubungi Customer Service kami dalam waktu 1x24 jam setelah status 'Delivered'."
    ]
  },
  payment: {
    title: "2. Gerbang Pembayaran Resmi (Payment Gateway)",
    desc: "Seluruh transaksi di NINOC diproses melalui sistem enkripsi tingkat tinggi yang ditenagai oleh Midtrans, payment gateway terbaik di Indonesia.",
    secure: "Transaksi Aman & Terenkripsi",
    methods: "Metode Pembayaran yang Didukung",
    terms: [
      "Virtual Account (BCA, Mandiri, BNI, BRI, Permata)",
      "E-Wallet (GoPay, ShopeePay, OVO, Dana)",
      "QRIS (Dapat discan dari seluruh aplikasi Bank/E-Wallet)",
      "Kartu Kredit / Debit (Visa, Mastercard, JCB, Amex)",
      "Pembayaran akan kedaluwarsa secara otomatis dalam 24 jam jika tidak diselesaikan.",
      "NINOC tidak pernah menyimpan detail kartu kredit/debit Anda. Semua diproses langsung oleh bank dan Midtrans secara aman."
    ]
  }
};

const dictEN = {
  title: "Shipping & Payments",
  subtitle: "Logistics Policy & Secure Transactions",
  shipping: {
    title: "1. Logistics & Expedition Partners",
    desc: "NINOC partners with Indonesia's leading expedition services to ensure the security and speed of your product delivery.",
    couriers: "Official Couriers",
    terms: [
      "All orders will be processed within 1x24 hours after payment is confirmed.",
      "Delivery estimates depend on the selected courier service (Regular, Next Day, or Cargo).",
      "Tracking numbers are automatically sent to your email and can be tracked directly on our Track Order page.",
      "Every package is covered by shipping insurance according to each courier's policy.",
      "If there is a delay or damage during shipping, please contact our Customer Service within 1x24 hours after 'Delivered' status."
    ]
  },
  payment: {
    title: "2. Official Payment Gateway",
    desc: "All transactions on NINOC are processed through a high-level encryption system powered by Midtrans, Indonesia's premier payment gateway.",
    secure: "Secure & Encrypted Transactions",
    methods: "Supported Payment Methods",
    terms: [
      "Virtual Account (BCA, Mandiri, BNI, BRI, Permata)",
      "E-Wallet (GoPay, ShopeePay, OVO, Dana)",
      "QRIS (Scannable from all Bank/E-Wallet apps)",
      "Credit / Debit Card (Visa, Mastercard, JCB, Amex)",
      "Payments will automatically expire within 24 hours if not completed.",
      "NINOC never stores your credit/debit card details. Everything is processed directly by the bank and Midtrans securely."
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
      
      <div className="flex-1 pt-32 pb-20 max-w-[800px] w-full mx-auto px-6">
        <div className="mb-12">
          <h1 className="font-display font-medium italic text-4xl tracking-tighter text-ink mb-2 uppercase">
            {dict.title}
          </h1>
          <p className="text-xs md:text-[11px] font-medium uppercase tracking-[0.2em] text-ink/40">
            {dict.subtitle}
          </p>
        </div>

        <div className="space-y-16">
          {/* SHIPPING SECTION */}
          <section className="bg-white p-8 border border-ink/5 shadow-sm rounded-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-ink/5">
              <div className="w-10 h-10 bg-ink/5 rounded-full flex items-center justify-center text-ink/60 shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.shipping.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1 leading-relaxed">{dict.shipping.desc}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">{dict.shipping.couriers}</h3>
              <div className="flex flex-wrap items-center gap-4">
                {Object.keys(COURIER_LOGOS).map(c => (
                  <div key={c} className="h-10 px-4 bg-ink/[0.02] border border-ink/10 rounded flex items-center justify-center transition-colors hover:bg-white hover:shadow-sm">
                    <CourierLogo courier={c} className="h-4 object-contain" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {dict.shipping.terms.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-4 h-4 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Package size={8} className="text-ink/60" />
                  </div>
                  <p className="text-xs md:text-[10px] text-ink/80 leading-relaxed font-medium">{term}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PAYMENT SECTION */}
          <section className="bg-white p-8 border border-ink/5 shadow-sm rounded-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-ink/5">
              <div className="w-10 h-10 bg-ink/5 rounded-full flex items-center justify-center text-ink/60 shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-sm md:text-xs font-bold uppercase tracking-[0.1em] text-ink">{dict.payment.title}</h2>
                <p className="text-[11px] md:text-[9px] text-ink/60 mt-1 leading-relaxed">{dict.payment.desc}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-600" />
                {dict.payment.secure}
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="h-8 px-3 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-emerald-100">
                  <Lock size={10} /> PCI-DSS Compliant
                </div>
                <div className="h-8 px-3 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 border border-blue-100">
                  Midtrans Core API
                </div>
              </div>
            </div>

            <div className="mb-8">
               <h3 className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">{dict.payment.methods}</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {['Virtual Account', 'E-Wallet', 'QRIS', 'Credit Card'].map(m => (
                   <div key={m} className="p-3 bg-ink/[0.02] border border-ink/5 rounded-sm text-center">
                     <p className="text-[10px] md:text-[9px] font-bold uppercase text-ink/70">{m}</p>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
              {dict.payment.terms.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-4 h-4 bg-ink/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Lock size={8} className="text-ink/60" />
                  </div>
                  <p className="text-xs md:text-[10px] text-ink/80 leading-relaxed font-medium">{term}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
