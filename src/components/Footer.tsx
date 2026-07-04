"use client";

import React from 'react';
import { Mail, MapPin, Shield, Lock, Phone } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { usePathname } from 'next/navigation';
import { useStoreName } from '@/components/BrandProvider';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';

export default function GlobalFooter() {
  const storeName = useStoreName();
  const pathname = usePathname();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  if (pathname?.endsWith('/supplier/apply') || pathname?.endsWith('/supplier/terms') || pathname?.endsWith('/affiliate') || pathname?.endsWith('/affiliate/terms')) return null;

  return (
    <footer className="bg-white border-t border-ink/5 pt-3 pb-2 px-4 md:px-8 w-full mt-auto">
      <div className="w-full flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">

        {/* Brand Column */}
        <div className="flex flex-col gap-0.5 w-full md:max-w-[200px] lg:max-w-xs">
          <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer">
            <span className="text-base font-display font-medium italic tracking-tighter text-ink leading-none">{storeName}</span>
          </Link>
          <p className="text-[11px] md:text-[8px] font-medium leading-relaxed text-ink/60 mt-1 uppercase tracking-widest">
            {dict.footer.aboutText}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink mb-0.5">{dict.footer.shop}</h4>
          <div className="flex flex-col gap-1">
            {[
              { label: dict.header.shop, href: '/shop' },
              { label: dict.header.collections, href: '/collections' },
              { label: dict.header.affiliate, href: '/affiliate' },
              { label: dict.header.logbook, href: '/logbook' },
              { label: 'Become a Partner', href: '/supplier/apply' },
              { label: dict.header.about, href: '/about' }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm inline-block py-2 -my-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink mb-0.5">{dict.footer.legal}</h4>
          <Link href="/legal" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {dict.footer.terms}
          </Link>
          <Link href="/help" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {dict.footer.support}
          </Link>
          <Link href="/shipping-policy" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {(dict.footer as any).shippingPolicy || 'Shipping Policy'}
          </Link>
          <Link href="/refund-policy" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {(dict.footer as any).refundPolicy || 'Refund Policy'}
          </Link>
          <Link href="/track" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {dict.header.track}
          </Link>
          <Link href="/retur" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-rose hover:text-rose/80 transition-colors leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm cursor-pointer inline-block py-2 -my-2">
            {dict.footer.returns}
          </Link>
        </div>

        {/* Base */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink mb-0.5">{storeName} Base</h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <MapPin size={9} className="text-rose mt-0.5 flex-shrink-0" />
              <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 leading-tight">
                Jl. Dago No. 108, Coblong, Kota Bandung, Jawa Barat 40132, ID
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={9} className="text-rose flex-shrink-0" />
              <a href="mailto:cs@ninoc.store" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors lowercase cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm">
                cs@ninoc.store
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={9} className="text-rose flex-shrink-0" />
              <a href="tel:+628211983774" className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/60 hover:text-rose transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm">
                +62 821-1983-7744
              </a>
            </div>
          </div>
        </div>

      </div>

      <div className="w-full mt-3 pt-2 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-widest text-ink/50">© 2026 {storeName} ENTERPRISE.</p>
          <div className="h-2 w-[1px] bg-ink/10 hidden md:block" />
          <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.1em] text-ink/20 leading-none hidden md:block">
            Data privasi terlindungi melalui enkripsi standar. Tidak membagikan informasi pribadi ke pihak ketiga.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/50">
              <Shield size={7} strokeWidth={1.5} className="text-rose/40" />
              <span>Aman</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/50">
              <Lock size={7} strokeWidth={1.5} className="text-rose/40" />
              <span>Enkripsi</span>
            </div>
          </div>
          <div className="h-2 w-[1px] bg-ink/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.1em] text-ink/20">Verified Merchant</span>
            <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.1em] text-ink/20">Midtrans Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
