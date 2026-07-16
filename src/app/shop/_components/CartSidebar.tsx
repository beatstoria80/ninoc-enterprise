"use client";

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ShoppingBag, Trash2, Ruler, X, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { useCart, CartItem } from '@/store/useCart';
import { supabase } from '@/lib/supabase';
import type { Dictionary } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function CartItemImage({ item }: { item: CartItem }) {
  const [fetchedOverride, setFetchedOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!item.color || !item.id) return;

    let isMounted = true;
    const fetchColorPhoto = async () => {
      try {
        const safeColor = item.color!.trim().toUpperCase();
        const { data } = await supabase
          .from('specifications')
          .select('label, value')
          .eq('product_id', item.id);

        if (!isMounted || !data) return;

        const specMatch = data.find(spec => {
          if (!spec.label || !spec.value) return false;
          const m = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
          return m && m[2].trim().toUpperCase() === safeColor && spec.value.trim();
        });

        if (specMatch && specMatch.value?.trim()) {
          const img = specMatch.value.trim();
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
          return;
        }

        const { data: varData } = await supabase
          .from('variants')
          .select('image_url')
          .eq('product_id', item.id)
          .ilike('color', safeColor)
          .limit(1);

        if (isMounted && varData && varData[0]?.image_url) {
          const img = varData[0].image_url;
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
        }
      } catch (err) {
        console.error('CartItemImage resolve error:', err);
      }
    };

    fetchColorPhoto();
    return () => { isMounted = false; };
  }, [item.id, item.color, item.size]);

  const src = fetchedOverride || item.image_url;
  return src ? <SafeImage src={src} alt={item.name} sizes="56px" /> : null;
}

interface CartSidebarProps {
  dict: Dictionary;
  isMobile: boolean;
  displayMeasurements: any[];
  isPants: boolean;
  getWeightAndHeight: (size: string) => { w: string; h: string };
  textVariants: Variants;
  columnVariants: Variants;
}

export function CartSidebar({
  dict,
  isMobile,
  displayMeasurements,
  isPants,
  getWeightAndHeight,
  textVariants,
  columnVariants
}: CartSidebarProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [measurementPopupItemKey, setMeasurementPopupItemKey] = useState<string | null>(null);

  return (
    <motion.div 
      variants={columnVariants}
      className={cn(
        "col-span-2 2xl:col-span-1 flex-col py-0 lg:py-1 mt-2 lg:mt-0 lg:pl-3 lg:border-l lg:border-ink/5",
        isMobile 
          ? (items.length === 0 ? "hidden" : "flex") 
          : "hidden 2xl:flex"
      )}
    >
      <div className="border border-ink/10 bg-white shadow-sm flex flex-col relative z-20 h-full min-h-[300px]">
        <motion.div variants={textVariants} className="flex justify-between items-center border-b border-ink/5 px-4 py-3">
          <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60">{dict.product.yourCart}</span>
          <span className="text-xs md:text-[10px] font-medium text-ink">{items.length} {items.length === 1 ? dict.product.item : dict.product.items}</span>
        </motion.div>

        {items.length === 0 ? (
          <motion.div variants={textVariants} className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-4 md:py-10 px-4">
            <ShoppingBag size={28} className="mb-3 text-ink" />
            <span className="text-xs md:text-[9px] uppercase tracking-widest text-ink font-medium">{dict.product.cartEmpty}</span>
            <span className="text-[11px] md:text-[8px] text-ink/60 font-medium mt-1">{dict.product.selectSizeToAdd}</span>
          </motion.div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-ink/5 minimal-scroll">
                {items.map((item) => (
                  <motion.div
                    variants={textVariants}
                    key={`${item.id}-${item.size}-${item.color}`}
                    className="flex gap-3 items-start px-4 py-3 group/item hover:bg-ink/[0.01] transition-colors relative"
                  >
                    <div
                      className="w-14 h-16 bg-ink/[0.02] border border-ink/5 relative overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center"
                      onClick={() => {
                        if (item.slug) {
                          router.push(`/shop/${item.slug}`);
                        }
                      }}
                    >
                      <CartItemImage item={item} />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs md:text-[10px] font-medium uppercase leading-tight text-ink line-clamp-2 pt-0.5">{item.name}</span>
                        <button
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-ink/25 hover:text-white hover:bg-rose border border-transparent hover:border-rose transition-all -mt-0.5 -mr-1"
                          title="Remove from cart"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mb-auto mt-0.5 relative">
                        <span className="text-[11px] md:text-[8px] font-medium text-ink/60 uppercase tracking-wider">
                          {item.color ? `Color ${item.color} / ` : ''}Size {item.size}
                        </span>
                        {displayMeasurements.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const key = `${item.id}-${item.size}-${item.color}`;
                              setMeasurementPopupItemKey(prev => prev === key ? null : key);
                            }}
                            className="text-rose/50 hover:text-rose transition-colors"
                            title="View size chart"
                          >
                            <Ruler size={10} />
                          </button>
                        )}
                        {(item.size_surcharge || 0) > 0 && (
                          <span className="text-[10px] md:text-[7px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm uppercase tracking-wider">+15K</span>
                        )}
                        {/* Measurement Popover */}
                        {measurementPopupItemKey === `${item.id}-${item.size}-${item.color}` && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-ink text-white border border-ink shadow-xl p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                              <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-rose">{dict.product.sizeChart}</span>
                              <button onClick={() => setMeasurementPopupItemKey(null)} className="text-white/40 hover:text-white">
                                <X size={10} />
                              </button>
                            </div>
                            <div className="grid grid-cols-[26px_0.6fr_0.6fr_0.9fr_max-content] gap-1.5 text-[9px] md:text-[7px] font-semibold text-white/50 uppercase tracking-wider mb-1 border-b border-white/10 pb-1 min-w-[240px]">
                              <span>Size</span>
                              <span className="text-center">{isPants ? 'Waist' : 'Chest'}</span>
                              <span className="text-center">Length</span>
                              <span className="text-center">{isPants ? 'Thgh/Hp' : 'Shldr/Slv'}</span>
                              <span className="text-right whitespace-nowrap">Fit Rec</span>
                            </div>
                            {displayMeasurements.map((m: any, idx: number) => {
                              const wh = getWeightAndHeight(m.size);
                              const col3 = isPants 
                                ? `${m.thigh || '-'} / ${m.hip || '-'}`
                                : `${m.shoulder || '-'} / ${m.sleeve || '-'}`;
                              return (
                                <div key={idx} className={cn(
                                  "grid grid-cols-[26px_0.6fr_0.6fr_0.9fr_max-content] gap-1.5 text-[10px] md:text-[8px] font-medium py-1 border-b border-white/5 min-w-[240px]",
                                  m.size.toUpperCase() === (item.size || '').toUpperCase() ? "text-rose font-bold" : "text-white/80"
                                )}>
                                  <span className="font-bold">{m.size}</span>
                                  <span className="text-center font-mono">{isPants ? (m.waist || '-') : (m.chest || '-')}</span>
                                  <span className="text-center font-mono">{m.length || '-'}</span>
                                  <span className="text-center font-mono text-[9px]">{col3}</span>
                                  <span className="text-right text-white/50 font-mono text-[9px] whitespace-nowrap">{wh.w} / {wh.h}</span>
                                </div>
                              );
                            })}
                            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-ink rotate-45 border-l border-t border-ink" />
                          </div>
                        )}
                      </div>

                      <motion.div variants={textVariants} className="flex items-center justify-between mt-2 pt-2 border-t border-ink/5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(item.id, item.size, item.color);
                              } else {
                                updateQuantity(item.id, item.quantity - 1, item.size, item.color);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center text-ink/60 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm md:text-[11px] font-medium w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                            disabled={item.maxStock ? item.quantity >= item.maxStock : false}
                            className="w-6 h-6 flex items-center justify-center text-ink/60 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs md:text-[9px] font-medium text-rose">
                            IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID')}
                          </span>
                          {(item.size_surcharge || 0) > 0 && (
                            <span className="text-[10px] md:text-[7px] text-ink/50 font-medium">
                              incl. +{(item.size_surcharge * item.quantity).toLocaleString('id-ID')} surcharge
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
            </div>

            <motion.div variants={textVariants} className="border-t border-ink/10 px-4 py-3 space-y-3 bg-ink/[0.01]">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/60">{dict.product.total}</span>
                <span className="text-sm md:text-[11px] font-medium text-ink">IDR {totalPrice().toLocaleString('id-ID')}</span>
              </div>

              <div className="flex flex-col gap-2">
                <motion.button
                  variants={textVariants}
                  onClick={() => router.push('/checkout')}
                  className="active:scale-[0.97] w-full py-3 bg-rose text-white text-xs md:text-[10px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-all text-center shadow-md shadow-rose/20"
                >
                  {dict.product.checkout}
                </motion.button>
                <motion.button
                  variants={textVariants}
                  onClick={() => clearCart()}
                  className="active:scale-[0.97] w-full py-2.5 bg-transparent text-ink/60 text-xs md:text-[9px] uppercase font-medium tracking-[0.2em] hover:text-rose hover:bg-rose/5 transition-all text-center border border-ink/5 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={12} />
                  {dict.product.clearCart}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
