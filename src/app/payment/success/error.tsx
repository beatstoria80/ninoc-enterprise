"use client";

import React, { useEffect } from "react";
import Link from "@/components/LocalizedLink";
import { AlertCircle, RefreshCw, ArrowLeft, MessageCircle } from "lucide-react";

export default function PaymentSuccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Payment success page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-cr noise flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-ink/10 p-6 md:p-8 shadow-xl shadow-ink/5 text-center">
        <div className="w-12 h-12 bg-rose/10 text-rose rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose mb-2">
          Perhatian
        </p>
        <h1 className="text-lg md:text-xl font-display font-medium italic uppercase tracking-tight text-ink mb-3">
          Tampilan Memuat Ulang
        </h1>
        <p className="text-xs text-ink/60 leading-relaxed mb-6">
          Terjadi kendala teknis pada peramban/perangkat Anda saat memuat halaman konfirmasi pembayaran. Jangan khawatir, jika Anda telah menyelesaikan pembayaran, pesanan Anda <strong>tetap aman dan tercatat</strong> di sistem kami.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-ink text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-colors shadow-lg cursor-pointer"
          >
            <RefreshCw size={14} />
            Coba Muat Ulang
          </button>

          <Link
            href="/profile"
            className="w-full py-3 bg-white border border-ink/10 text-ink text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:border-rose/30 transition-colors"
          >
            Cek Daftar Pesanan
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 text-ink/50 text-[10px] font-medium uppercase tracking-widest hover:text-rose transition-colors mt-2"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
