"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { supabase } from '@/lib/supabase';

export default function QuickBuyModal() {
  const router = useRouter();
  const { addItem } = useCart();
  const [quickBuyProduct, setQuickBuyProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [colorImages, setColorImages] = useState<Record<string, string>>({});

  const availableSizes = (() => {
    if (!quickBuyProduct?.variants?.length) return [];
    const sizes = Array.from(new Set(quickBuyProduct.variants.map((v: any) => v.size).filter((s: any): s is string => !!s))) as string[];
    const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
    sizes.sort((a: any, b: any) => {
      const idxA = SIZE_ORDER.indexOf(a.toUpperCase());
      const idxB = SIZE_ORDER.indexOf(b.toUpperCase());
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return sizes;
  })();

  const availableColors = (() => {
    if (!quickBuyProduct?.variants?.length) return [];
    const filtered = selectedSize 
      ? quickBuyProduct.variants.filter((v: any) => v.size?.toUpperCase() === selectedSize.toUpperCase())
      : quickBuyProduct.variants;
    return Array.from(new Set(filtered.map((v: any) => v.color).filter((c: any): c is string => !!c))) as string[];
  })();

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (quickBuyProduct?.variants?.length) {
      const filtered = quickBuyProduct.variants.filter((v: any) => v.size?.toUpperCase() === size.toUpperCase());
      const colors = Array.from(new Set(filtered.map((v: any) => v.color).filter((c: any): c is string => !!c))) as string[];
      if (colors.length > 0 && !colors.includes(selectedColor)) {
        setSelectedColor(colors[0] || '');
      }
    }
  };

  useEffect(() => {
    const handleOpenQuickBuy = (e: Event) => {
      const customEvent = e as CustomEvent<{ product: any }>;
      const prod = customEvent.detail.product;
      setQuickBuyProduct(prod);

      const sizes = prod.variants
        ? Array.from(new Set(prod.variants.map((v: any) => v.size).filter((s: any): s is string => !!s))) as string[]
        : [];
      const colors = prod.variants
        ? Array.from(new Set(prod.variants.map((v: any) => v.color).filter((c: any): c is string => !!c))) as string[]
        : [];

      const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
      sizes.sort((a: any, b: any) => {
        const idxA = SIZE_ORDER.indexOf(a.toUpperCase());
        const idxB = SIZE_ORDER.indexOf(b.toUpperCase());
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      setSelectedSize(sizes[0] || '');
      setSelectedColor(colors[0] || '');
    };

    window.addEventListener('open-quick-buy', handleOpenQuickBuy);
    return () => window.removeEventListener('open-quick-buy', handleOpenQuickBuy);
  }, []);

  useEffect(() => {
    if (quickBuyProduct?.id) {
      const fetchSpecs = async () => {
        const { data } = await supabase
          .from('specifications')
          .select('label, value')
          .eq('product_id', quickBuyProduct.id);
        
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(spec => {
            const match = spec.label.match(/^ColorImage:(.+)$/);
            if (match) {
              map[match[1].toUpperCase()] = spec.value;
            }
          });
          setColorImages(map);
        }
      };
      if (!quickBuyProduct.specifications) {
        fetchSpecs();
      } else {
        const map: Record<string, string> = {};
        quickBuyProduct.specifications.forEach((spec: any) => {
          const match = spec.label.match(/^ColorImage:(.+)$/);
          if (match) {
            map[match[1].toUpperCase()] = spec.value;
          }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColorImages(map);
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColorImages({});
    }
  }, [quickBuyProduct]);

  const handleConfirmQuickBuy = () => {
    if (!quickBuyProduct) return;
    const isSurchargeSize = (size: string) => SURCHARGE_SIZES.some(s => s.toUpperCase() === size.toUpperCase());
    const surcharge = selectedSize ? (isSurchargeSize(selectedSize) ? SIZE_SURCHARGE_AMOUNT : 0) : 0;
    
    addItem(
      {
        id: quickBuyProduct.id,
        name: quickBuyProduct.name,
        price: quickBuyProduct.price,
        image_url: (selectedColor && colorImages[selectedColor.toUpperCase()]) || quickBuyProduct.image_url || null,
        slug: quickBuyProduct.slug,
      },
      selectedSize || undefined,
      selectedColor || undefined,
      surcharge
    );
    setQuickBuyProduct(null);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {quickBuyProduct && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickBuyProduct(null)}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[990]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-end md:items-center justify-center z-[1000] pointer-events-none p-0 md:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 1 }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="w-full md:max-w-md bg-white border-t md:border border-ink/10 rounded-t-2xl md:rounded-none shadow-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 pointer-events-auto flex flex-col max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-visible"
            >
              {/* Handlebar (Mobile only) */}
              <div className="w-12 h-1 bg-ink/10 rounded-full mx-auto mb-4 md:hidden" />

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Add to Cart</h3>
                  <p className="text-xs text-ink/40 mt-1 uppercase tracking-wider">Select Size & Color</p>
                </div>
                <button
                  onClick={() => setQuickBuyProduct(null)}
                  className="p-1.5 rounded-full bg-ink/5 text-ink/40 active:scale-95 transition-all hover:bg-ink hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Product Info Row */}
              <div className="flex gap-4 mb-6 pb-4 border-b border-ink/5">
                <div className="w-16 h-20 bg-ink/[0.02] border border-ink/5 overflow-hidden relative flex-shrink-0">
                  {((selectedColor && colorImages[selectedColor.toUpperCase()]) || quickBuyProduct.image_url) && (
                    <Image
                      src={(selectedColor && colorImages[selectedColor.toUpperCase()]) || quickBuyProduct.image_url}
                      alt={quickBuyProduct.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-tight text-ink line-clamp-2 leading-snug">
                      {quickBuyProduct.name}
                    </h4>
                  </div>
                  <div>
                    <p className="text-sm font-display font-medium italic text-rose">
                      IDR {quickBuyProduct.price.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Select Options */}
              <div className="space-y-4 mb-6">
                {/* Size Selection */}
                {availableSizes.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                      Size Selection
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSize}
                        onChange={(e) => handleSizeChange(e.target.value)}
                        className="w-full bg-ink/5 border border-ink/10 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink focus:outline-none focus:border-ink focus:bg-white transition-all appearance-none rounded-none"
                      >
                        {availableSizes.map(size => {
                          const isSurcharge = SURCHARGE_SIZES.some(s => s.toUpperCase() === size.toUpperCase());
                          return (
                            <option key={size} value={size}>
                              {size} {isSurcharge ? `(+IDR ${SIZE_SURCHARGE_AMOUNT.toLocaleString('id-ID')})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-ink/40">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="1 1 5 5 9 1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {availableColors.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                      Color Selection
                    </label>
                    <div className="relative">
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full bg-ink/5 border border-ink/10 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink focus:outline-none focus:border-ink focus:bg-white transition-all appearance-none rounded-none"
                      >
                        {availableColors.map(color => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-ink/40">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="1 1 5 5 9 1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleConfirmQuickBuy}
                className="w-full bg-ink text-white py-4 text-xs font-medium uppercase tracking-[0.3em] active:scale-95 transition-all text-center hover:bg-rose"
              >
                Direct to Checkout
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
