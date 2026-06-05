"use client";

import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function About() {
  const { isMobile, isIPhone } = useDevice();

  return (
    <main
      className={cn(
        "fixed inset-0 bg-cr noise overflow-hidden flex flex-col",
        isIPhone && "pt-[env(safe-area-inset-top)]"
      )}
    >
      {/* MOBILE TOP BAR — Single line, no scroll */}
      {isMobile && (
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-ink/5 shrink-0",
        )}>
          <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors">
            <ArrowLeft size={14} />
            <span className="text-[9px] font-medium uppercase tracking-wider">Back</span>
          </Link>
          <div className="font-display font-medium text-base italic tracking-tighter text-rose uppercase">NINOC</div>
          <div className="w-12" />
        </div>
      )}

      {/* MAIN CONTENT — Flex fill, scrollable only if needed */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className={cn("max-w-[1800px] mx-auto px-4 md:px-12", isMobile ? "pt-4 pb-4" : "pt-8 pb-6")}>
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC ENTERPRISE</span>
            <h1 className="text-3xl md:text-6xl font-display font-medium italic tracking-tighter text-ink uppercase leading-[0.85] mt-1 md:mt-2">About Us</h1>
            <p className="text-[9px] md:text-xs font-medium text-ink/60 uppercase tracking-wider mt-1 md:mt-3">Born in Bandung. Made for the world.</p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Left: Story & Philosophy */}
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <h3 className="text-base md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink">Our Story</h3>
                <p className="text-[9px] md:text-sm font-medium text-ink/60 leading-relaxed">
                  NINOC was founded with a simple vision: create clothing that speaks to the soul.
                  Based in Bandung, Indonesia, we blend local craftsmanship with global aesthetics.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-base md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink">Philosophy</h3>
                <p className="text-[9px] md:text-sm font-medium text-ink/60 leading-relaxed">
                  &ldquo;Wear the art, own the day.&rdquo; Every piece is a canvas. Every wearer is an artist.
                </p>
              </div>
            </div>

            {/* Right: Visual + Stats */}
            <div className="flex flex-col gap-4">
              {/* Image placeholder */}
              <div className="h-28 md:h-40 bg-white rounded-lg border border-ink/5 flex items-center justify-center">
                <span className="text-[9px] font-medium uppercase tracking-widest text-ink/20">NINOC STUDIO — BANDUNG</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-ink/5 p-3 rounded-lg">
                  <p className="text-[7px] font-medium uppercase tracking-widest text-ink/20">Est.</p>
                  <p className="text-base md:text-xl font-display font-medium italic text-ink mt-0.5">2024</p>
                </div>
                <div className="bg-white border border-ink/5 p-3 rounded-lg">
                  <p className="text-[7px] font-medium uppercase tracking-widest text-ink/20">Location</p>
                  <p className="text-base md:text-xl font-display font-medium italic text-ink mt-0.5">Bandung</p>
                </div>
                <div className="bg-white border border-ink/5 p-3 rounded-lg">
                  <p className="text-[7px] font-medium uppercase tracking-widest text-ink/20">Contact</p>
                  <p className="text-[9px] md:text-base font-display font-medium italic text-rose mt-0.5">hello@ninoc.art</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}