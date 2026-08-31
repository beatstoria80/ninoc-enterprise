"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { useHydratedCart } from '@/store/useCart';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRouter } from 'next/navigation';
import CheckoutViaWhatsAppButton from '@/components/shop/CheckoutViaWhatsAppButton';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
};

export default function CartPage() {
  const router = useRouter();
  const { isMobile } = useDevice();
  const { items, removeItem, updateQuantity, totalPrice, isHydrated } = useHydratedCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-cr flex items-center justify-center pt-24 pb-12">
        <div className="w-6 h-6 border border-ink/10 border-t-rose animate-spin rounded-none" />
      </main>
    );
  }

  const cartItemsCount = isHydrated ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  return (
    <main className="min-h-screen bg-cr flex flex-col pt-16 md:pt-24 pb-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full selection:bg-ink selection:text-white">
      {/* Breadcrumb & Luxury Title */}
      <div className="w-full flex flex-col gap-1.5 mb-6 md:mb-8 border-b border-ink/10 pb-4">
        <div className="flex gap-2 text-[9px] font-bold uppercase tracking-widest text-ink/40">
          <Link href="/" className="hover:text-rose transition-colors">HOME</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-rose transition-colors">COLLECTION</Link>
          <span>/</span>
          <span className="text-ink">SHOPPING BAG</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
          <h1 className="text-xl md:text-3xl font-display font-medium italic uppercase tracking-tight text-ink">
            Shopping Bag
          </h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50 bg-ink/5 px-2.5 py-1 w-fit">
            [ {cartItemsCount} {cartItemsCount === 1 ? 'UNIT' : 'UNITS'} ]
          </span>
        </div>
      </div>

      {isHydrated && items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Left Column: Compact Bag Items */}
          <div className="lg:col-span-8 flex flex-col space-y-0">
            <div className="hidden md:grid grid-cols-12 pb-2.5 border-b border-ink/10 text-[9px] font-bold uppercase tracking-widest text-ink/40">
              <div className="col-span-6">Product Details</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-4 text-right">Subtotal</div>
            </div>

            {/* Scrollable container when >6 items on PC */}
            <div className={cn(
              "flex flex-col",
              items.length > 6 && "md:max-h-[420px] md:overflow-y-auto md:overscroll-contain md:[&::-webkit-scrollbar]:w-[3px] md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-ink/15 md:hover:[&::-webkit-scrollbar-thumb]:bg-ink/30 md:[&::-webkit-scrollbar-thumb]:rounded-full"
            )}>

              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.04, duration: 0.2, ease: EASING.out }}
                    className="grid grid-cols-2 md:grid-cols-12 gap-x-2 gap-y-3 md:gap-2 items-center py-2.5 border-b border-ink/5 group relative px-2 -mx-2 hover:bg-ink/[0.015] transition-colors duration-200 rounded-sm"
                  >
                  {/* Image & Product info */}
                    {/* Image & Product info */}
                    <div className="col-span-2 md:col-span-6 flex gap-3 min-w-0">
                      <div className="w-12 h-16 bg-white border border-ink/10 overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-ink/5">
                            <ShoppingBag size={14} className="text-ink/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center py-0.5 min-w-0 gap-1">
                        <div>
                          <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-ink truncate group-hover:text-rose transition-colors duration-200">
                            {item.name}
                          </h3>
                          <p className="text-[7px] font-mono text-ink/35 mt-0.5 uppercase">REF: #{item.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {item.warehouse_name && (
                            <span className="text-[8px] font-bold uppercase tracking-widest text-ink/45 flex items-center gap-1">
                              <Truck size={9} className="text-ink/40" /> {item.warehouse_name.toUpperCase()}
                            </span>
                          )}
                          <div className="flex gap-2.5 text-[7px] font-bold uppercase tracking-widest text-ink/55">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity selector */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center mt-1 md:mt-0">
                      <div className="flex items-center gap-2 bg-ink/[0.03] px-2 py-1 border border-ink/5 w-fit">
                        <button
                          type="button"
                          onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          disabled={item.quantity <= 1}
                          className="text-ink/50 hover:text-rose p-0.5 disabled:opacity-30 cursor-pointer active:scale-90 transition-transform duration-100"
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-bold w-4 text-center text-ink tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          disabled={item.maxStock ? item.quantity >= item.maxStock : false}
                          className="text-ink/50 hover:text-rose p-0.5 disabled:opacity-30 cursor-pointer active:scale-90 transition-transform duration-100"
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal & Remove trigger */}
                    <div className="col-span-1 md:col-span-4 flex items-center justify-end md:justify-end gap-4 mt-1 md:mt-0 relative">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.size, item.color)}
                        className="absolute -top-16 right-0 md:static text-ink/25 hover:text-rose transition-all p-1.5 cursor-pointer active:scale-90 duration-100"
                        title="Remove item"
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="text-[10px] md:text-[12px] font-display font-semibold italic text-rose pr-1 md:pr-0">
                        IDR {(item.price * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Sticky Summary Panel */}
          <div className="lg:col-span-4 w-full lg:sticky lg:top-28">
            <div className="bg-white border border-ink/15 p-6 shadow-sm flex flex-col gap-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink pb-4 border-b border-ink/10 flex items-center justify-between">
                <span>Summary</span>
                <ShoppingBag size={13} className="text-ink/40" />
              </h2>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-ink/75">
                  <span>Bag Subtotal</span>
                  <span>IDR {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-ink/75">
                  <span>Platform Fee</span>
                  <span>IDR 2.500</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-ink/75">
                  <span>Tax (VAT 11% Included)</span>
                  <span className="text-ink/40 italic">Nett / Included</span>
                </div>
                
                {/* Shipping Notice */}
                <div className="mt-2 bg-ink/[0.02] border border-ink/5 p-3 flex gap-2.5 items-start">
                  <Truck size={14} className="text-ink/60 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-ink">Ongkos Kirim</h4>
                    <p className="text-[9px] text-ink/50 leading-relaxed mt-0.5">
                      Tarif ekspedisi/logistik akan dihitung secara langsung setelah Anda memasukkan kecamatan tujuan pada halaman Checkout.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-ink/10 my-2" />

                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Est. Total</span>
                  <span className="text-lg font-display font-semibold italic text-rose">
                    IDR {(totalPrice + 2500).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full bg-ink text-white py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose transition-all shadow-xl shadow-ink/5 text-center group cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-ink/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[9px] font-bold text-ink/40 uppercase tracking-widest">Atau</span>
                  <div className="flex-grow border-t border-ink/10"></div>
                </div>

                <CheckoutViaWhatsAppButton />

                <Link
                  href="/shop"
                  className="w-full border border-ink/15 text-ink hover:border-ink py-3 text-xs font-bold uppercase tracking-widest text-center transition-colors cursor-pointer mt-2"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 opacity-40 pt-2">
                <ShieldCheck size={13} className="text-ink" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-ink">Secure Transactions & Checkout</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-20 md:py-32 gap-6"
        >
          <div className="w-16 h-16 rounded-none bg-ink/5 flex items-center justify-center text-ink/30 mb-2">
            <ShoppingBag size={28} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.4em] text-ink">Your Shopping Bag is Empty</h2>
            <p className="text-xs text-ink/50 leading-relaxed max-w-sm mx-auto">
              You currently have no active selections in your cart. Choose from our luxury apparel collection to fill your bag.
            </p>
          </div>
          <Link
            href="/shop"
            className="mt-4 px-8 py-3.5 bg-ink text-white text-xs font-bold uppercase tracking-widest hover:bg-rose transition-colors cursor-pointer"
          >
            Shop the Collection
          </Link>
        </motion.div>
      )}
    </main>
  );
}
