"use client";

import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GlobalFooter from '@/components/Footer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function About() {
  const { isMobile, isIPhone } = useDevice();

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-white text-ink font-medium selection:bg-ink selection:text-white overflow-hidden",
        isIPhone && "pt-[env(safe-area-inset-top)]"
      )}
    >
      {/* TOP BAR — static, shrink */}
      <div className="shrink-0 bg-white border-b border-ink/5 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-11">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:-translate-x-0.5">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium">Return to Archive Catalog</span>
          </Link>
          <span className="text-[7px] uppercase tracking-[0.15em] text-ink/20 font-medium hidden md:block">About</span>
        </div>
      </div>

      {/* MAIN CONTENT — flex fill, scrollable */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-full flex flex-col">

          {/* Title Block */}
          <div className="shrink-0 pt-6 md:pt-8 pb-2">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display font-medium italic text-xl md:text-2xl tracking-tighter uppercase text-ink">About Us</h1>
            </div>
            <p className="text-[9px] md:text-[10px] font-medium text-ink/50 uppercase tracking-wider mt-1">NINOC ENTERPRISE — Born in Bandung. Made for the world.</p>
          </div>

          {/* Content Grid — fills remaining space */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-hidden border-t border-ink/5 pt-3">

            {/* Left: Story & Philosophy */}
            <div className="overflow-y-auto no-scrollbar space-y-4 md:space-y-5 pr-1">
              <div className="space-y-1.5">
                <h3 className="text-base md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">Our Story</h3>
                <p className="text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">
                  NINOC was founded with a simple vision: create clothing that speaks to the soul.
                  Based in Bandung, Indonesia, we blend local craftsmanship with global aesthetics.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">Philosophy</h3>
                <p className="text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">
                  &ldquo;Wear the art, own the day.&rdquo; Every piece is a canvas. Every wearer is an artist.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base md:text-xl font-display font-medium italic uppercase tracking-tight text-ink">Mission</h3>
                <p className="text-[10px] md:text-sm font-medium text-ink/60 leading-relaxed">
                  To deliver premium archival garments that merge industrial precision with cultural authenticity —
                  creating pieces that endure beyond trends.
                </p>
              </div>
            </div>

            {/* Right: Visual + Stats */}
            <div className="flex flex-col gap-3 overflow-hidden">
              {/* Image placeholder */}
              <div className="h-24 md:h-32 bg-white rounded-lg border border-ink/5 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-medium uppercase tracking-widest text-ink/20">NINOC STUDIO — BANDUNG, INDONESIA</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <div className="bg-white border border-ink/5 p-2.5 rounded-lg">
                  <p className="text-[6px] font-medium uppercase tracking-widest text-ink/20">Est.</p>
                  <p className="text-sm md:text-base font-display font-medium italic text-ink mt-0.5">2024</p>
                </div>
                <div className="bg-white border border-ink/5 p-2.5 rounded-lg">
                  <p className="text-[6px] font-medium uppercase tracking-widest text-ink/20">Location</p>
                  <p className="text-sm md:text-base font-display font-medium italic text-ink mt-0.5">Bandung</p>
                </div>
                <div className="bg-white border border-ink/5 p-2.5 rounded-lg">
                  <p className="text-[6px] font-medium uppercase tracking-widest text-ink/20">Contact</p>
                  <p className="text-[9px] md:text-[10px] font-display font-medium italic text-rose mt-0.5">hello@ninoc.art</p>
                </div>
              </div>

              {/* Tagline */}
              <div className="bg-ink p-4 rounded-lg shrink-0">
                <p className="text-[10px] md:text-xs font-medium uppercase leading-loose tracking-widest text-white/80">Origin Verified</p>
                <p className="text-[9px] md:text-[11px] font-medium uppercase leading-relaxed tracking-wider text-white mt-1">Not just clothing. These are artifacts born from the streets, the stage, and the culture.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER — always visible at bottom */}
      <div className="shrink-0">
        <GlobalFooter />
      </div>
    </div>
  );
}