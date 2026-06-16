"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, ShieldCheck, Lock, ArrowLeft, RefreshCw, Plus, Minus, ArrowRight, PackageOpen } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useBrandColor } from '@/components/BrandProvider';

// ═══════════════════════════════════════════════════════════════
// ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
};

const DURATION = {
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.medium, ease: EASING.out } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATION.fast } }
};

// ═══════════════════════════════════════════════════════════════
// CART ITEM ROW
// ═══════════════════════════════════════════════════════════════

function CartItemRow({ item }: { item: any }) {
  const { updateQuantity, removeItem } = useCart();
  const brandColor = useBrandColor();

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="flex flex-col sm:flex-row gap-4 py-6 border-b border-ink/5 group"
    >
      {/* Product Image */}
      <div className="relative w-24 h-32 bg-ink/5 shrink-0 overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink/10">
            <PackageOpen size={24} />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-1">
                {item.category || 'Apparel'}
              </p>
              <h3 className="text-sm md:text-base font-display font-medium italic text-ink uppercase tracking-tight">
                {item.name}
              </h3>
            </div>
            <button
              onClick={() => removeItem(item.id, item.size, item.color)}
              className="text-ink/30 hover:text-rose transition-colors p-1"
              aria-label="Remove item"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Variants (Size/Color) */}
          <div className="flex flex-wrap gap-3 mt-3">
            {item.size ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-ink/5 text-[10px] uppercase tracking-widest text-ink">
                <span className="text-ink/40">Size:</span> {item.size}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-ink/5 text-[10px] uppercase tracking-widest text-ink">
                <span className="text-ink/40">Size:</span> All Size
              </span>
            )}
            {item.color && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-ink/5 text-[10px] uppercase tracking-widest text-ink">
                <span className="text-ink/40">Color:</span> {item.color}
              </span>
            )}
          </div>
        </div>

        {/* Price & Quantity Controls */}
        <div className="flex items-end justify-between mt-6">
          <div className="flex items-center border border-ink/10">
            <button
              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.size, item.color)}
              className="w-8 h-8 flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <Minus size={12} strokeWidth={2} />
            </button>
            <span className="w-8 text-center text-xs font-medium text-ink">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
              className="w-8 h-8 flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <Plus size={12} strokeWidth={2} />
            </button>
          </div>

          <div className="text-right">
            {(item.size_surcharge > 0) && (
              <p className="text-[9px] text-rose uppercase tracking-widest mb-1">
                + Surcharge: IDR {item.size_surcharge.toLocaleString('id-ID')}
              </p>
            )}
            <p className="text-base font-display font-medium italic text-ink">
              IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CART PAGE CLIENT
// ═══════════════════════════════════════════════════════════════

export default function CartClient() {
  const { items, totalPrice } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const brandColor = useBrandColor();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = totalPrice();

  return (
    <main className="min-h-screen bg-cr noise pt-24 md:pt-32 px-4 md:px-12 pb-24">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 md:mb-16">
          <Link href="/shop" className="inline-flex items-center gap-2 text-ink/40 hover:text-ink transition-colors mb-6 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em]">Continue Shopping</span>
          </Link>
          <h1 className="text-4xl md:text-6xl font-display font-medium italic uppercase tracking-tight text-ink">
            Your Cart
          </h1>
          <p className="text-xs md:text-sm text-ink/50 mt-2 uppercase tracking-widest">
            {items.length} {items.length === 1 ? 'item' : 'items'} curated
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* LEFT: Items List */}
          <div className="flex-1">
            {items.length > 0 ? (
              <motion.div
                variants={staggerVariants}
                initial="hidden"
                animate="visible"
                className="border-t border-ink/10"
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <CartItemRow key={`${item.id}-${item.size}-${item.color}`} item={item} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-ink/20 bg-white/50"
              >
                <PackageOpen size={48} strokeWidth={1} className="text-ink/20 mb-6" />
                <h2 className="text-xl font-display font-medium italic uppercase tracking-tight text-ink mb-2">
                  Your cart is empty
                </h2>
                <p className="text-xs text-ink/50 uppercase tracking-widest mb-8">
                  Discover our latest archival drops
                </p>
                <button
                  onClick={() => router.push('/shop')}
                  className="px-8 py-4 bg-ink text-white text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-rose transition-colors"
                >
                  Explore Catalog
                </button>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Sticky Summary */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-32 space-y-6">
              
              <div className="bg-white p-6 md:p-8 border border-ink/10 shadow-sm">
                <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-ink/40 mb-6 border-b border-ink/5 pb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink/60 uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-medium text-ink">IDR {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink/60 uppercase tracking-widest text-[10px]">Shipping Estimate</span>
                    <span className="font-medium text-ink/50 text-xs italic">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-ink/10 pt-4 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink">Total</span>
                    <span className="text-2xl font-display font-medium italic text-ink" style={{ color: brandColor.color }}>
                      IDR {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[9px] text-ink/40 uppercase tracking-widest text-right mt-1">
                    Taxes included
                  </p>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  disabled={items.length === 0}
                  className="w-full py-4 px-6 bg-ink text-white text-xs font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="relative z-10">Proceed to Guest Checkout</span>
                  <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center p-4 bg-ink/5 border border-ink/5">
                  <Lock size={16} strokeWidth={1.5} className="text-ink/60 mb-2" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/70">Secure & Encrypted</span>
                  <span className="text-[8px] text-ink/40 mt-1 uppercase tracking-wider">SSL Processing</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-ink/5 border border-ink/5">
                  <RefreshCw size={16} strokeWidth={1.5} className="text-ink/60 mb-2" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/70">Easy Returns</span>
                  <span className="text-[8px] text-ink/40 mt-1 uppercase tracking-wider">Terms Applied</span>
                </div>
              </div>

              {/* Secure Checkout Banner */}
              <div className="flex items-center justify-center gap-2 text-ink/30 mt-8">
                <ShieldCheck size={14} />
                <span className="text-[8px] uppercase tracking-[0.3em] font-medium">100% Secure Checkout Guaranteed</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
