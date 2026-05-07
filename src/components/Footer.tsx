"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-ink/5 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-6">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-display font-black italic tracking-tighter text-ink">NINOC</h1>
          </Link>
          <p className="text-[10px] font-medium leading-relaxed text-muted-text max-w-[200px]">
            Wear the art, own the day. Premium artistic collections for the conscious mobility.
          </p>
          <div className="flex gap-4">
            <Instagram size={16} className="text-ink/40 hover:text-rose transition-colors cursor-pointer" />
            <Twitter size={16} className="text-ink/40 hover:text-rose transition-colors cursor-pointer" />
            <Mail size={16} className="text-ink/40 hover:text-rose transition-colors cursor-pointer" />
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-6">
          <h4 className="label-caps !text-ink">Navigation</h4>
          <ul className="space-y-3">
            {['Home', 'Shop', 'Admin Dashboard'].map((item) => (
              <li key={item}>
                <Link 
                  href={item === 'Home' ? '/' : item === 'Shop' ? '/shop' : '/admin'} 
                  className="text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-rose transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal - MANDATORY FOR MIDTRANS */}
        <div className="space-y-6">
          <h4 className="label-caps !text-ink">Legal Info</h4>
          <ul className="space-y-3">
            <li>
              <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-rose transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Location */}
        <div className="space-y-6">
          <h4 className="label-caps !text-ink">Atelier Base</h4>
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-rose mt-0.5" />
            <p className="text-[10px] font-black uppercase tracking-widest text-ink/40 leading-loose">
              Bandung City<br />
              West Java, Indonesia<br />
              40112
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">
          © 2026 NINOC ENTERPRISE. All Rights Reserved.
        </p>
        <div className="flex gap-8">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-ink/10">Verified Merchant</span>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-ink/10">Midtrans Secure</span>
        </div>
      </div>
    </footer>
  );
}
