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
    <main className={cn("min-h-screen bg-cr noise", isIPhone && "pt-[env(safe-area-inset-top)]")}>
      {/* MOBILE NAV BAR */}
      {isMobile && (
        <nav className={cn(
          "fixed top-0 inset-x-0 z-[150] bg-white/95 backdrop-blur-xl border-b border-ink/5",
          isIPhone && "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-ink/40">
              <ArrowLeft size={16} />
            </Link>
            <div className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</div>
            <div className="w-8" />
          </div>
        </nav>
      )}

      <div className={cn("max-w-[1800px] mx-auto", isMobile ? "pt-14 px-4" : "pt-32 px-6 md:px-12")}>
        <div className="mb-8 md:mb-16">
          <span className="text-[10px] font-medium uppercase tracking-[0.5em] text-rose">NINOC</span>
          <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink uppercase mt-4">About</h1>
          <p className="text-sm font-medium text-ink/60 uppercase tracking-wider mt-6 max-w-xl">Born in Bandung. Made for the world.</p>
        </div>

        <div className="py-8 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20">
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Our Story</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">
                NINOC was founded with a simple vision: create clothing that speaks to the soul.
                Based in Bandung, Indonesia, we blend local craftsmanship with global aesthetics.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-medium italic uppercase tracking-tight">Philosophy</h3>
              <p className="text-sm font-medium text-ink/60 leading-relaxed">
                &ldquo;Wear the art, own the day.&rdquo; Every piece is a canvas. Every wearer is an artist.
              </p>
            </div>
          </div>
          <div className="h-96 bg-white rounded-2xl border border-ink/5" />
        </div>

        <div className="py-10 md:py-20 border-t border-ink/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Est.</p>
              <p className="text-4xl font-display font-medium italic">2024</p>
            </div>
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Location</p>
              <p className="text-4xl font-display font-medium italic">Bandung, ID</p>
            </div>
            <div className="space-y-4">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Contact</p>
              <p className="text-lg font-display font-medium italic">hello@ninoc.art</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}