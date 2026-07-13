"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import SafeImage from '@/components/SafeImage';
import DragSlider from '@/components/DragSlider';
import type { Dictionary } from '@/lib/i18n';
import { Product } from '@/types/shop';

interface RelatedProductsListProps {
  relatedProducts: Product[];
  dict: Dictionary;
  staggerContainer: Variants;
  textVariants: Variants;
}

export function RelatedProductsList({ relatedProducts, dict, staggerContainer, textVariants }: RelatedProductsListProps) {
  if (relatedProducts.length === 0) return null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="mt-4 lg:mt-6 space-y-1">
      <motion.div variants={textVariants} className="flex justify-between items-end border-b border-ink/5 pb-1 lg:pb-1.5">
        <h2 className="text-xs md:text-[9px] md:text-[10px] font-display font-medium italic tracking-tight text-ink uppercase">{dict.product.relatedProducts}</h2>
        <Link href="/shop" className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose transition-colors flex items-center gap-1 group mb-0.5">
          {dict.product.viewFullCollection} <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <DragSlider className="flex gap-3 md:gap-4 pb-4 pt-1">
        {relatedProducts.map((p) => (
          <motion.div
            variants={textVariants}
            key={p.id}
            className="flex-shrink-0 w-[120px] md:w-[145px] lg:w-[160px]"
          >
            <Link href={`/shop/${p.slug}`} className="group block space-y-1">
              <div className="aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-lg transition-all duration-500 relative">
                <div className="absolute inset-3">
                  <SafeImage src={p.image_url} alt={p.image_alt || p.name} className="object-contain group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 120px, 160px" />
                </div>
                <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <div className="space-y-1 px-1">
                <h3 className="text-xs md:text-[10px] md:text-xs font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors leading-tight line-clamp-1">{p.name}</h3>
                {p.price_tag && (
                  <div className="text-[6px] font-medium uppercase tracking-[0.2em] text-rose mb-0.5">
                    {p.price_tag}
                  </div>
                )}
                <p className="text-xs md:text-[9px] font-medium text-rose">IDR {p.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </DragSlider>
    </motion.div>
  );
}
