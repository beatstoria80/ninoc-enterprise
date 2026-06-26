"use client";

import React from 'react';
import Link from '@/components/LocalizedLink';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, Video, Shield, ChevronRight, Check } from 'lucide-react';

interface ReturBannerProps {
  variant?: 'card' | 'inline' | 'highlight';
  className?: string;
}

export function ReturBanner({ variant = 'card', className = '' }: ReturBannerProps) {
  if (variant === 'inline') {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 p-4 border border-rose/10 bg-rose/[0.02] rounded-sm">
          <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw size={18} className="text-rose" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-[11px] font-semibold text-ink uppercase tracking-wider">Kebijakan Retur & Refund</p>
            <p className="text-xs md:text-[9px] text-ink/60 mt-0.5">
              Klaim 2x24 jam · Video 1-shot tanpa edit · Guest bisa ajukan
            </p>
          </div>
          <Link
            href="/retur"
            className="shrink-0 flex items-center gap-1 text-xs md:text-[9px] font-semibold text-rose uppercase tracking-wider hover:text-rose/70 transition-colors"
          >
            Ajukan <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'highlight') {
    return (
      <div className={className}>
        <div className="relative overflow-hidden bg-ink text-white rounded-sm p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-32 h-32 border border-white rounded-full" />
            <div className="absolute bottom-2 left-2 w-20 h-20 border border-white rounded-full" />
          </div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <RefreshCw size={22} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs md:text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Policy</p>
              <p className="text-[14px] font-display italic font-medium text-white uppercase tracking-tight leading-tight mb-2">
                Retur & Refund
              </p>
              <div className="flex flex-wrap gap-3 mb-3">
                {[
                  { label: '2x24 Jam', desc: 'Batas klaim' },
                  { label: '1-Shot', desc: 'Video tanpa edit' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-rose rounded-full" />
                    <span className="text-xs md:text-[9px] font-semibold text-white uppercase">{item.label}</span>
                    <span className="text-[10px] md:text-[7px] text-white/40">{item.desc}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/retur"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-ink text-xs md:text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose hover:text-white transition-colors"
              >
                Ajukan Sekarang <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={className}>
      <div className="border border-ink/5 rounded-sm overflow-hidden bg-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/5 bg-ink/[0.01] flex items-center gap-3">
          <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw size={18} className="text-rose" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm md:text-[11px] font-semibold text-ink uppercase tracking-wider">Kebijakan Retur & Refund</p>
            <p className="text-xs md:text-[9px] text-ink/60 mt-0.5">Klaim mudah, proses cepat, tanpa ribet</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          {/* 3 Policy Items */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Clock, label: '2x24 Jam', desc: 'Batas klaim' },
              { icon: Video, label: '1-Shot', desc: 'Video tanpa edit' },
              { icon: Shield, label: 'Aman', desc: 'Data terenkripsi' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 bg-ink/[0.02] border border-ink/5 rounded-sm">
                  <div className="w-8 h-8 bg-rose/10 rounded-full flex items-center justify-center">
                    <Icon size={14} className="text-rose" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider">{item.label}</span>
                  <span className="text-[10px] md:text-[7px] text-ink/50 uppercase tracking-widest">{item.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Policy Text */}
          <div className="bg-rose/[0.02] border border-rose/10 rounded-sm p-3 space-y-1">
            {[
              'Klaim maksimal 2x24 jam setelah barang diterima',
              'Bukti video 1-shot tanpa edit WAJIB',
              'Guest bisa ajukan tanpa login',
              'Refund 3-7 hari kerja setelah persetujuan',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-3.5 h-3.5 bg-rose/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                  <Check size={7} className="text-rose" strokeWidth={2.5} />
                </div>
                <p className="text-xs md:text-[9px] text-ink/50 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/retur"
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose text-white text-xs md:text-[10px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            Ajukan Retur & Refund
          </Link>

          {/* Sub link */}
          <p className="text-[11px] md:text-[8px] text-center text-ink/20">
            Guest tidak perlu login — siapkan Order ID dan email aktif
          </p>
        </div>
      </div>
    </div>
  );
}
