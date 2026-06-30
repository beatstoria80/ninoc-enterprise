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
        <div className="flex items-center gap-2 p-2.5 border border-rose/10 bg-rose/[0.02] rounded-sm">
          <div className="w-7 h-7 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw size={13} className="text-rose" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-ink uppercase tracking-wider">Kebijakan Retur & Refund</p>
            <p className="text-[8px] text-ink/60 mt-px">
              Klaim 2x24 jam · Video 1-shot tanpa edit · Guest bisa ajukan
            </p>
          </div>
          <Link
            href="/retur"
            className="shrink-0 flex items-center gap-0.5 text-[9px] font-semibold text-rose uppercase tracking-wider hover:text-rose/70 transition-colors"
          >
            Ajukan <ChevronRight size={10} />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'highlight') {
    return (
      <div className={className}>
        <div className="relative overflow-hidden bg-ink text-white rounded-sm p-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-3 right-3 w-24 h-24 border border-white rounded-full" />
            <div className="absolute bottom-1 left-1 w-14 h-14 border border-white rounded-full" />
          </div>
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center shrink-0">
              <RefreshCw size={16} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-semibold uppercase tracking-widest text-white/50 mb-0.5">Policy</p>
              <p className="text-[12px] font-display italic font-medium text-white uppercase tracking-tight leading-tight mb-1.5">
                Retur & Refund
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: '2x24 Jam', desc: 'Batas klaim' },
                  { label: '1-Shot', desc: 'Video tanpa edit' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-rose rounded-full" />
                    <span className="text-[8px] font-semibold text-white uppercase">{item.label}</span>
                    <span className="text-[7px] text-white/40">{item.desc}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/retur"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-ink text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose hover:text-white transition-colors"
              >
                Ajukan Sekarang <ChevronRight size={9} />
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
        <div className="px-3 py-2.5 border-b border-ink/5 bg-ink/[0.01] flex items-center gap-2">
          <div className="w-7 h-7 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw size={13} className="text-rose" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink uppercase tracking-wider">Kebijakan Retur & Refund</p>
            <p className="text-[8px] text-ink/60 mt-px">Klaim mudah, proses cepat, tanpa ribet</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2.5 space-y-2">
          {/* 3 Policy Items */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: Clock, label: '2x24 Jam', desc: 'Batas klaim' },
              { icon: Video, label: '1-Shot', desc: 'Video tanpa edit' },
              { icon: Shield, label: 'Aman', desc: 'Data terenkripsi' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1 p-2 bg-ink/[0.02] border border-ink/5 rounded-sm">
                  <div className="w-6 h-6 bg-rose/10 rounded-full flex items-center justify-center">
                    <Icon size={11} className="text-rose" strokeWidth={1.5} />
                  </div>
                  <span className="text-[9px] font-semibold text-ink uppercase tracking-wider">{item.label}</span>
                  <span className="text-[7px] text-ink/50 uppercase tracking-widest">{item.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Policy Text */}
          <div className="bg-rose/[0.02] border border-rose/10 rounded-sm p-2 space-y-0.5">
            {[
              'Klaim maksimal 2x24 jam setelah barang diterima',
              'Bukti video 1-shot tanpa edit WAJIB',
              'Guest bisa ajukan tanpa login',
              'Refund 3-7 hari kerja setelah persetujuan',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="w-3 h-3 bg-rose/10 rounded-full flex items-center justify-center mt-px shrink-0">
                  <Check size={6} className="text-rose" strokeWidth={2.5} />
                </div>
                <p className="text-[8px] text-ink/50 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/retur"
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose text-white text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors"
          >
            <RefreshCw size={10} strokeWidth={1.5} />
            Ajukan Retur & Refund
          </Link>

          {/* Sub link */}
          <p className="text-[8px] text-center text-ink/20">
            Guest tidak perlu login — siapkan Order ID dan email aktif
          </p>
        </div>
      </div>
    </div>
  );
}
