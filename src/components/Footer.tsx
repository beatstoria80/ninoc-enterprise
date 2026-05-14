"use client";

import React from 'react';
import { Mail, MapPin, Shield, Lock, Phone } from 'lucide-react';
import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-ink/5 pt-4 pb-2 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Brand Column */}
        <div className="flex flex-col gap-1 w-full md:w-1/4">
          <Link href="/" className="inline-block">
            <span className="text-xl font-display font-medium italic tracking-tighter text-ink leading-none">NINOC</span>
          </Link>
          <p className="text-[9px] font-medium leading-tight text-muted-text mt-1">
            Wear the art, own the day. Premium artistic collections for the conscious mobility.
          </p>
        </div>

        {/* Navigation & Legal in one flex container for extreme compactness */}
        <div className="flex flex-row justify-between w-full md:w-2/4 gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-ink mb-2">Navigation</h4>
            {['Home', 'Shop', 'Collections', 'Craft'].map((item) => (
              <Link 
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                className="text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors leading-none"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-ink mb-2">Legal Info</h4>
            <Link href="/legal" className="text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors leading-none">
              Legal Specifications
            </Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-ink mb-2">NINOC Base</h4>
            <div className="flex items-start gap-1.5">
              <MapPin size={10} className="text-rose mt-0.5" />
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/40 leading-tight">
                Bandung City<br />
                West Java, ID 40112
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={10} className="text-rose" />
              <a href="mailto:beatstoria.ai@gmail.com" className="text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors lowercase">
                beatstoria.ai@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone size={10} className="text-rose" />
              <a href="tel:+628211983774" className="text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">
                +62 8211983774
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-4 pt-2 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">© 2026 NINOC ENTERPRISE.</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.2em] text-ink/30">
              <Shield size={8} strokeWidth={1.5} className="text-rose/40" />
              <span>Aman</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.2em] text-ink/30">
              <Lock size={8} strokeWidth={1.5} className="text-rose/40" />
              <span>Enkripsi</span>
            </div>
          </div>
          <div className="h-2 w-[1px] bg-ink/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-ink/15">Verified Merchant</span>
            <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-ink/15">Midtrans Secure</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-1 pt-1 border-t border-ink/5 text-center">
        <p className="text-[7px] font-medium uppercase tracking-[0.1em] text-ink/15 leading-none">
          Data privasi Anda terlindungi melalui enkripsi standar industri. Kami tidak membagikan informasi pribadi ke pihak ketiga.
        </p>
      </div>
    </footer>
  );
}
