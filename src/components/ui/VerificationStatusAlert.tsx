"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  HelpCircle, 
  ExternalLink, 
  MessageSquare, 
  Mail, 
  ChevronRight, 
  X, 
  FileText 
} from 'lucide-react';

export interface VerificationStatusAlertProps {
  type?: 'invalid_order' | 'expired' | 'retur_expired' | 'unauthorized' | 'generic';
  title?: string;
  message: string;
  orderId?: string;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export function VerificationStatusAlert({
  type = 'generic',
  title,
  message,
  orderId,
  onRetry,
  onClose,
  className = '',
}: VerificationStatusAlertProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Determine Icon & Color Palette based on Error Type
  const getThemeConfig = () => {
    switch (type) {
      case 'invalid_order':
        return {
          icon: ShieldAlert,
          badgeText: 'STATUS: ID PESANAN TIDAK TERIDENTIFIKASI',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          gradientBorder: 'from-rose-500/40 via-stone-800/40 to-stone-900/60',
          accentColor: 'text-rose-400',
          defaultTitle: 'Nomor Pesanan / Invoice Tidak Terverifikasi',
          reasons: [
            'Nomor pesanan atau kontak seluler tidak terdaftar pada basis data server.',
            'Format pengenal tidak sesuai standar resmi (Format valid: NINOC-XXXX / NC-XXXX).',
            'Sesi transaksi belum terenkripsi sempurna atau koneksi terputus saat checkout.',
          ],
        };
      case 'retur_expired':
        return {
          icon: Clock,
          badgeText: 'STATUS: MASA GARANSI (48 JAM) BERAKHIR',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          gradientBorder: 'from-amber-500/40 via-stone-800/40 to-stone-900/60',
          accentColor: 'text-amber-400',
          defaultTitle: 'Batas Waktu Pengajuan Klaim Retur Telah Kedaluwarsa',
          reasons: [
            'Masa garansi pengajuan klaim (2x24 jam) terhitung sejak serah terima logistik telah berakhir.',
            'Waktu penerimaan paket terekam secara real-time melalui integrasi sistem manifes kurir.',
            'Prosedur evaluasi khusus dapat dikonsultasikan melalui Layanan Pelanggan Resmi.',
          ],
        };
      case 'expired':
        return {
          icon: Clock,
          badgeText: 'STATUS: SESI PEMBAYARAN KEDALUWARSA',
          badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          gradientBorder: 'from-orange-500/40 via-stone-800/40 to-stone-900/60',
          accentColor: 'text-orange-400',
          defaultTitle: 'Durasi Pembayaran Transaksi Telah Berakhir',
          reasons: [
            'Batas durasi otorisasi pembayaran (24 jam) pada payment gateway telah berakhir.',
            'Pengembalian dana untuk transaksi yang terlanjur terproses memerlukan verifikasi manual.',
            'Alokasi stok inventori secara otomatis dikembalikan ke katalog publik.',
          ],
        };
      case 'unauthorized':
        return {
          icon: ShieldAlert,
          badgeText: 'STATUS: OTORISASI AKUN DIBATASI',
          badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
          gradientBorder: 'from-red-500/40 via-stone-800/40 to-stone-900/60',
          accentColor: 'text-red-400',
          defaultTitle: 'Akses Dibatasi — Kredensial Akun Berbeda',
          reasons: [
            'Kredensial akun aktif tidak memiliki wewenang akses terhadap data pesanan terkait.',
            'Silakan lakukan autentikasi ulang menggunakan akun terdaftar atau mode Pencarian Pelanggan.',
          ],
        };
      default:
        return {
          icon: AlertTriangle,
          badgeText: 'STATUS: SINKRONISASI DATA KENDALA',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          gradientBorder: 'from-rose-500/40 via-stone-800/40 to-stone-900/60',
          accentColor: 'text-rose-400',
          defaultTitle: 'Kendala Verifikasi Sistem',
          reasons: [
            message || 'Data transaksi yang dimasukkan memerlukan pemeriksaan lebih lanjut oleh sistem.',
          ],
        };
    }
  };

  const theme = getThemeConfig();
  const IconComponent = theme.icon;
  const displayTitle = title || theme.defaultTitle;
  const waHelpUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(
    `Halo Layanan Pelanggan NINOC Enterprise, mohon bantuan verifikasi pesanan:\nOrder ID: ${orderId || 'Tidak Diketahui'}\nKendala: ${message}`
  )}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-xl border bg-stone-950/95 p-5 md:p-6 text-stone-100 shadow-2xl backdrop-blur-xl transition-all ${className}`}
        style={{
          borderImage: `linear-gradient(to bottom right, var(--tw-gradient-stops)) 1`,
        }}
      >
        {/* Top Decorative Ambient Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 opacity-80" />

        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-stone-900/80 shadow-inner ${theme.badgeBg}`}>
              <IconComponent className={`h-5 w-5 ${theme.accentColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider ${theme.badgeBg}`}>
                  {theme.badgeText}
                </span>
              </div>
              <h4 className="mt-1 text-sm md:text-base font-bold tracking-tight text-white">
                {displayTitle}
              </h4>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Message Banner Body */}
        <div className="mt-4 rounded-lg border border-stone-800/80 bg-stone-900/50 p-3.5 backdrop-blur-sm">
          <p className="text-xs md:text-sm leading-relaxed text-stone-200 font-medium">
            {message}
          </p>
        </div>

        {/* Transparansi: Analisis Penyebab / Why Did This Happen? */}
        <div className="mt-4 border-t border-stone-800/60 pt-3.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-rose-400" />
            CATATAN DISKRIPSI SINKRONISASI SISTEM:
          </p>
          <ul className="space-y-1.5 text-xs text-stone-300">
            {theme.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-mono text-[11px] font-bold mt-0.5">•</span>
                <span className="leading-snug text-stone-300/90">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Transparent Options (Professional Solutions) */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-stone-800/60 pt-4">
          <a
            href={waHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/90 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Layanan Pelanggan Official</span>
          </a>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-200 shadow-sm transition-all hover:border-stone-500 hover:bg-stone-800 hover:text-white"
          >
            <Mail className="h-3.5 w-3.5 text-rose-400" />
            <span>Panduan Resi & Invoice</span>
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-white"
            >
              <span>Verifikasi Ulang</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Modal Petunjuk Pencarian Invoice / Bantuan Transparansi */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-6 text-stone-100 shadow-2xl"
            >
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-rose-400" />
                <h3 className="text-base font-bold">Panduan Mencari Invoice NINOC</h3>
              </div>

              <div className="mt-4 space-y-3 text-xs text-stone-300 leading-relaxed">
                <p>
                  Setiap transaksi di NINOC Enterprise dikirimkan bukti resi resmi secara otomatis melalui 2 saluran resmi:
                </p>
                <div className="rounded-lg bg-stone-950 p-3 border border-stone-800 space-y-2">
                  <p className="font-semibold text-rose-300">1. Pesan WhatsApp Otomatis:</p>
                  <p className="text-stone-400">Cari pesan WA dari akun resmi NINOC. Di sana tertera Nomor Order (Contoh: <code className="text-white">NINOC-178582...</code>).</p>
                  <p className="font-semibold text-rose-300 pt-1">2. Email Invoice PDF:</p>
                  <p className="text-stone-400">Periksa folder Inbox atau Spam email Anda dengan kata kunci <code className="text-white">NINOC Enterprise Invoice</code>.</p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="mt-6 w-full rounded-lg bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition-colors"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
