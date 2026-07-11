"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
  index: number;
  price_tag?: string | null;
}

/**
 * NativeMobileProductCard - Native mobile app style product card
 *
 * Features:
 * - Square/ratio image (like Instagram/Pinterest/Shopee)
 * - Minimal info (name + price only)
 * - Full-width in grid
 * - Touch-friendly
 * - Image scale on hover/touch
 */
export function NativeMobileProductCard({ product, onTap }: { product: ProductCardProps; onTap?: () => void }) {
  const { addItem } = useCart();
  const router = useRouter();

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: product.index * 0.05 }}
      className="w-full"
      onClick={onTap}
    >
      {/* Image Container - Square ratio */}
      <div className="relative aspect-[4/5] rounded-none overflow-hidden bg-ink/5 border border-ink/5 group">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 bg-ink/10 rounded-full" />
          </div>
        )}

        {/* Quick Add Button (appears on touch) */}
        <div className="absolute bottom-2 right-2 z-10">
          <button onClick={handleQuickBuy} className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-none flex items-center justify-center border border-ink/10 shadow-sm active:scale-90 transition-all text-ink hover:text-white hover:bg-ink">
            <ShoppingBag size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Minimal Info */}
      <div className="mt-1.5 px-0.5 space-y-0.5">
        <p className="text-xs md:text-[9px] font-medium text-ink uppercase tracking-[0.1em] line-clamp-1">
          {product.name}
        </p>
        {product.price_tag && (
          <p className="text-[10px] md:text-[7px] font-medium text-rose uppercase tracking-[0.15em] leading-none pt-0.5">
            {product.price_tag}
          </p>
        )}
        <p className="text-base md:text-[12px] font-display font-bold italic text-emerald-700 pt-0.5">
          IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * SwipeIndicators - Minimalist dot navigation for horizontal scroll sections
 *
 * Features:
 * - Small dots showing position in scroll
 * - Current position highlighted
 * - Minimalist design
 */
export function SwipeIndicators({ count, activeIndex, onDotClick }: {
  count: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
}) {
  // Only show if more than 1 page
  if (count <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick?.(i)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === activeIndex
              ? "w-6 bg-rose"
              : "w-1.5 bg-ink/20"
          )}
          aria-label={`Go to page ${i + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * HorizontalProductScroll - Horizontal scrolling section with snap
 *
 * Features:
 * - Snap scroll (like Instagram stories)
 * - Shows partial next item to indicate scrollability
 * - Dot indicators below
 * - Touch/swipe friendly
 */
export function HorizontalProductScroll({
  products,
  title,
  showIndicators = true
}: {
  products: ProductCardProps[];
  title?: string;
  showIndicators?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Calculate visible items based on screen width (approx 2 items per view)
  const itemsPerView = 2;
  const totalPages = Math.ceil(products.length / itemsPerView);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const itemWidth = el.offsetWidth / itemsPerView;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    };

    el.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPage = (pageIndex: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.offsetWidth / itemsPerView;
    el.scrollTo({ left: pageIndex * itemWidth, behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {title && (
        <div className="px-4 mb-3">
          <h3 className="text-xs md:text-[10px] font-display font-medium italic text-ink uppercase tracking-widest">
            {title}
          </h3>
        </div>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[calc(50%-6px)] shrink-0 snap-start"
          >
            <NativeMobileProductCard
              product={{ ...product, index: i }}
            />
          </div>
        ))}
      </div>

      {/* Indicators */}
      {showIndicators && (
        <SwipeIndicators
          count={totalPages}
          activeIndex={activeIndex}
          onDotClick={scrollToPage}
        />
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

/**
 * CategoryGrid - Grid organized by category with swipe per category
 *
 * Features:
 * - Products grouped by category
 * - Each category is a horizontal swipe section
 * - Minimalist design
 * - Large number of products supported
 */
export default function CategoryGrid({
  products,
  categories
}: {
  products: ProductCardProps[];
  categories: string[];
}) {
  return (
    <div className="space-y-8 pb-32">
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        if (categoryProducts.length === 0) return null;

        return (
          <div key={category} className="border-b border-ink/5 pb-6">
            {/* Category Header */}
            <div className="px-4 mb-3 flex items-center justify-between">
              <h2 className="text-xs md:text-[10px] font-display font-medium italic text-ink/60 uppercase tracking-[0.2em]">
                {category}
              </h2>
              <span className="text-[11px] md:text-[8px] font-medium text-rose/40 uppercase tracking-widest">
                {categoryProducts.length} pieces
              </span>
            </div>

            {/* Horizontal Scroll */}
            <HorizontalProductScroll
              products={categoryProducts}
              showIndicators={true}
            />
          </div>
        );
      })}

      {/* All Products (if not filtered by category) */}
      {categories.includes('All') && (
        <div className="border-t border-ink/5 pt-6">
          <div className="px-4 mb-4">
            <h2 className="text-[13px] font-display font-medium italic text-ink/60 uppercase tracking-widest">
              All Pieces
            </h2>
          </div>
          <HorizontalProductScroll
            products={products}
            showIndicators={true}
          />
        </div>
      )}
    </div>
  );
}
