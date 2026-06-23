"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Paperclip, ChevronRight, ArrowRight, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useCart } from '@/store/useCart';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';
import { useBrandColor } from '@/components/BrandProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM MODERN ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

// Pakaian (Apparel) — T-shirt icon
const PakaianIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

// Utilities (Functional) — Wrench/tool icon
const UtilitiesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);

// Aksesoris (Accents) — Diamond/gem icon
const AksesorisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 9L12 16L22 9L12 2Z" />
    <path d="M2 15L12 22L22 15" />
    <path d="M2 9V15L12 22V9" />
    <path d="M22 9V15L12 22V9" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  springBounce: { type: "spring" as const, stiffness: 300, damping: 20 },
};

const DURATION = {
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
  hero: 0.8,
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, href: '/shop?filter=Fashion', spec: 'GARMENT-001' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, href: '/shop?filter=Utilities', spec: 'UTIL-002' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, href: '/shop?filter=Accessories', spec: 'ACCS-003' },
];

// ═══════════════════════════════════════════════════════════════
// PRESS SCALE BUTTON
// ═══════════════════════════════════════════════════════════════

function PressButton({ children, className = '', onClick, href }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <div className={cn(className, "cursor-pointer")}>
      {children}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">
      {inner}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PORTRAIT CAROUSEL
// ═══════════════════════════════════════════════════════════════

const PORTRAIT_IMAGES = [
  "/banner_ninoc_1.png",
];
const CAROUSEL_INTERVAL = 150;

function PortraitImageCarousel() {
  return (
    <div
      className="aspect-[4/5] md:aspect-[3/4] bg-white overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
    >
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={PORTRAIT_IMAGES[0]}
          alt="Archival Garment"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover grayscale"
          priority
        />
      </div>

      <div className="absolute top-2 left-1 bg-ink text-white px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tighter z-20">
        SPEC-001
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cr/20 to-transparent hidden md:block z-20" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: { id: string; name: string; price: number; image_url?: string; slug: string; category?: CategoryType; price_tag?: string | null };
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();

  const categoryInfo = CATEGORIES.find((c) => c.id === product.category);
  const CategoryIcon = categoryInfo?.icon || PakaianIcon;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <PressButton href={`/shop/${product.slug}`} className="bg-white p-2 md:p-3 group relative overflow-hidden flex flex-col h-full border border-transparent hover:border-ink/5">
        <div className="aspect-[4/5] overflow-hidden mb-3 md:mb-4 relative bg-ink/5 border border-ink/5">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              draggable={false}
              className="object-cover object-top transition-transform duration-300 select-none pointer-events-none group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <CategoryIcon />
            </div>
          )}

          {/* Dynamic Badge (NEW / SALE) */}
          {(product.price_tag || index < 3) && (
            <div
              className={cn(
                "absolute top-0 left-0 text-white px-2 py-1 text-[10px] uppercase tracking-widest z-10 font-bold",
                product.price_tag ? "bg-rose" : "bg-ink"
              )}
            >
              {product.price_tag ? 'SALE' : 'NEW'}
            </div>
          )}
        </div>

        <div className="flex flex-col flex-grow">
          <div className="space-y-0.5">
            <p className="text-[9px] md:text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/50 leading-none">
              {categoryInfo?.label || 'Garment Origin'}
            </p>

            <h3
              className="text-[11px] md:text-xs font-display font-medium italic uppercase tracking-tighter line-clamp-2 leading-snug text-ink group-hover:text-rose transition-colors duration-200"
            >
              {product.name}
            </h3>
          </div>

          <div className="mt-auto pt-1 border-t border-ink/5 space-y-1.5">
            {product.price_tag && (
              <div className="flex items-center gap-1 border border-rose/20 px-1 py-0.5 bg-rose/[0.02] w-fit">
                <span className="text-[6px] md:text-[7px] font-medium text-rose uppercase tracking-widest flex items-center gap-0.5">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {product.price_tag}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-[12px] font-display font-medium italic text-ink whitespace-nowrap leading-none">
                IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>

              <div className="flex gap-1.5 relative z-10">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleQuickBuy}
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center transition-colors duration-200 cursor-pointer group-hover:bg-rose group-hover:text-white"
                >
                  <ChevronRight className="w-4 h-4 text-ink group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PressButton>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY QUICK ACCESS — Desktop Only
// ═══════════════════════════════════════════════════════════════

function CategoryQuickAccess() {
  return (
    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <div key={cat.id}>
            <PressButton
              href={cat.href}
              className="flex items-center gap-4 bg-white border border-ink/10 px-6 py-4 group whitespace-nowrap rounded-none hover:border-rose hover:bg-rose transition-all duration-200"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-ink/5 rounded-none group-hover:bg-white/20 transition-colors duration-200">
                <div className="text-ink group-hover:text-white transition-colors duration-200">
                  <Icon />
                </div>
              </div>

              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-base font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-white transition-colors duration-200">
                  {cat.label}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/50 group-hover:text-white/70 transition-colors duration-200">
                  {cat.sublabel}
                </span>
              </div>

              <div className="ml-2 opacity-40 group-hover:opacity-90 group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
                <ArrowRight size={14} />
              </div>
            </PressButton>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FADE-UP SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════

function FadeUpSection({ children, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════

interface Product {
  id: string; name: string; price: number; image_url?: string; slug: string; category?: CategoryType; price_tag?: string | null;
}



// ═══════════════════════════════════════════════════════════════
// HERO SEQUENCE (MORPHING)
// ═══════════════════════════════════════════════════════════════

function HeroSequence({ dict }: { dict: any }) {
  return (
    <div className="relative w-full overflow-hidden bg-white border-b border-ink/5 min-h-[260px] md:min-h-[30vw] lg:min-h-[28vw] 2xl:min-h-[520px]">
      <section className="relative md:pt-16 pt-2 pb-0 px-4 md:px-12 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">
          {/* Left: Branding */}
          <div className="lg:col-span-4 space-y-2.5 md:space-y-4 lg:pt-24">
            <div className="flex items-center gap-2 text-rose">
              <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
              <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] md:tracking-widest whitespace-nowrap">Origin Specification</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">
              <span className="block">NINOC</span>
              <span className="block">ATELIER</span>
            </h1>

            <p className="text-[11px] md:text-sm font-medium leading-snug md:leading-relaxed text-ink/60 md:text-ink/60 max-w-[260px] md:max-w-sm uppercase tracking-tight md:tracking-wider">
              {dict.home.heroSubtitle} <span className="hidden md:inline">{dict.home.craftDesc}</span>
            </p>

            <div>
              <PressButton href="/shop" className="group inline-flex items-center gap-2 text-ink">
                <span className="md:hidden inline-flex items-center gap-1.5 bg-ink/5 px-3 py-1.5 border border-ink/10">
                  <span className="text-xs md:text-[7px] font-medium uppercase tracking-[0.2em]">Catalog</span>
                  <ArrowRight size={10} className="text-rose group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="hidden md:inline text-sm md:text-[11px] font-medium uppercase tracking-[0.4em]">Browse Category</span>
                <div className="hidden md:inline relative w-12 h-[1px] overflow-hidden bg-ink/20">
                  <div className="absolute inset-y-0 left-0 bg-rose transition-all duration-300 w-0 group-hover:w-full" />
                </div>
              </PressButton>
            </div>

            {/* Mobile Metadata */}
            <div className="flex items-center gap-4 mt-4 md:hidden">
              {[
                { label: 'year', value: '2024' },
                { label: 'loc', value: 'bdg, id' },
                { label: 'phil', value: 'simplicity' }
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-start text-left">
                  <p className="text-[8px] font-normal tracking-[0.15em] text-ink/25 leading-none mb-1 lowercase">{item.label}</p>
                  <p className="text-[10px] font-medium text-ink/50 lowercase leading-none tracking-wide whitespace-nowrap">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Portrait */}
          <div className="lg:col-span-4 relative mt-0 z-50">
            <div className="aspect-[4/4] md:aspect-[3/4] lg:aspect-[4/5] bg-white overflow-hidden relative shadow-2xl shadow-ink/5 border border-ink/5">
              <Image src="/banner_ninoc_1.png" alt="NINOC Intro" fill sizes="100vw" className="object-cover object-top" priority />
              <div className="absolute top-2 left-1 bg-ink text-white px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tighter z-20">
                SPEC-001
              </div>
            </div>

            {/* Technical Detail card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block z-30">
              <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30 mb-2">Technical Detail</p>
              <p className="text-xs md:text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br />Industrial Grade Fabrics</p>
            </div>
          </div>

          {/* Right: Metadata Sidebar */}
          <div className="col-span-2 lg:col-span-4 lg:pt-20 -mt-10 md:mt-0 lg:mt-0">
            <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
              {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                <div key={item.label} className="space-y-0">
                  <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">{item.label}</p>
                  <p className={`text-xs md:text-[10px] font-medium text-ink ${i === 2 ? 'italic leading-tight' : ''}`}>{item.value}</p>
                </div>
              ))}

              {/* Origin Verified card */}
              <div className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8">
                <div className="flex items-center gap-3">
                  <div className="text-rose">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest">Origin Verified</span>
                </div>
                <div className="text-sm md:text-[11px] font-medium uppercase leading-loose tracking-widest !text-white !opacity-100">Not just clothing. These are artifacts born from the streets, the stage, and the culture that shaped who we are.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const pathname = usePathname();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*, variants(*)').limit(8);
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white relative z-40">
      <div className="mobile-momentum select-none">
        <HeroSequence dict={dict} />

        {/* CATALOG */}
        <section id="archive-catalog" className="mt-1 md:mt-2 lg:mt-1 px-4 md:px-12 max-w-[1800px] mx-auto min-h-screen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] bg-white animate-pulse border border-ink/5"
                />
              ))
            ) : (
              products.map((product, i) => (
                <div key={product.id}>
                  <ProductCard product={product} index={i} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* CONNECT SECTION */}
        <FadeUpSection>
          <section className="px-4 md:px-12 max-w-[1800px] mx-auto mb-6 md:mb-16">
            <div className="bg-white border border-ink/5 p-4 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/ninoc.store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-rose/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">Follow Us</p>
                  <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">@ninoc.store</p>
                  <p className="text-xs md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Instagram</p>
                </a>

                {/* Email */}
                <a
                  href="mailto:beatstoria.ai@gmail.com"
                  className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-rose/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">Email Us</p>
                  <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">beatstoria.ai@gmail.com</p>
                  <p className="text-xs md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Direct Message</p>
                </a>

                {/* Phone / WhatsApp */}
                <a
                  href="https://wa.me/628211983774"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-rose/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-rose">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </div>
                  <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">WhatsApp</p>
                  <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">+62 8211983774</p>
                  <p className="text-xs md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Chat Now</p>
                </a>

              </div>

              {/* Bottom CTA */}
              <div className="mt-8 pt-6 border-t border-ink/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col">
                  <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.4em] text-rose">NINOC ENTERPRISE</p>
                  <p className="text-base md:text-xs font-display font-medium italic text-ink mt-0.5">Wear the art, own the day.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/about" className="px-5 py-2.5 bg-rose text-white text-sm md:text-[9px] font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors">
                    About NINOC
                  </Link>
                  <Link href="/shop" className="px-5 py-2.5 border border-ink/10 text-ink/50 text-[10px] md:text-[9px] font-semibold uppercase tracking-widest hover:border-ink/20 hover:text-ink transition-colors">
                    catalog
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </FadeUpSection>
      </div>
    </div>
  );
}
