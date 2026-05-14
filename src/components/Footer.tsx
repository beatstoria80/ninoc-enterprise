"use client";

import React from 'react';
import { Mail, MapPin, Shield, Lock } from 'lucide-react';
import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-ink/5 pt-10 pb-6 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-display font-medium italic tracking-tighter text-ink">NINOC</span>
          </Link>
          <p className="text-[10px] font-medium leading-relaxed text-muted-text max-w-[200px]">
            Wear the art, own the day. Premium artistic collections for the conscious mobility.
          </p>
          <div className="flex gap-4">
            <Mail size={16} className="text-ink/40 hover:text-rose transition-colors cursor-pointer" />
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          <h4 className="label-caps !text-ink">Navigation</h4>
          <ul className="space-y-2">
            {['Home', 'Shop', 'Collections', 'Craft'].map((item) => (
              <li key={item}>
                <Link 
                  href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                  className="text-[10px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal - MANDATORY FOR MIDTRANS */}
        <div className="space-y-4">
          <h4 className="label-caps !text-ink">Legal Info</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="text-[10px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[10px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h4 className="label-caps !text-ink">NINOC Base</h4>
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-rose mt-0.5" />
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink/40 leading-loose">
              Bandung City<br />
              West Java, Indonesia<br />
              40112
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">
          © 2026 NINOC ENTERPRISE. All Rights Reserved.
        </p>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30">
              <Shield size={10} strokeWidth={1.5} className="text-rose/40" />
              <span>Aman</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30">
              <Lock size={10} strokeWidth={1.5} className="text-rose/40" />
              <span>Enkripsi</span>
            </div>
          </div>
          <div className="h-3 w-[1px] bg-ink/5 hidden md:block" />
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/15">Verified Merchant</span>
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/15">Midtrans Secure</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-ink/5 text-center">
        <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/15">
          Data privasi Anda terlindungi melalui enkripsi standar industri. Kami tidak membagikan informasi pribadi ke pihak ketiga.
        </p>
      </div>
    </footer>
  );
}
