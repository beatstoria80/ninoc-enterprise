"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { toast } from 'sonner';

interface CheckoutViaWhatsAppButtonProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export default function CheckoutViaWhatsAppButton({
  className = '',
  variant = 'full',
}: CheckoutViaWhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Kill switch: hide button when WA Commerce is disabled
  if (process.env.NEXT_PUBLIC_WA_COMMERCE_ENABLED !== 'true') {
    return null;
  }

  const handleWhatsAppCheckout = async () => {
    // 1. Get current cart state
    const { items, totalPrice } = useCart.getState();

    if (!items || items.length === 0) {
      toast.error('Keranjang belanja kosong');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Prepare CartSnapshot payload
      const cartSnapshot = {
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          variant_label: item.size
            ? `${item.color ? item.color + ' / ' : ''}${item.size}`
            : item.color || undefined,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price + (item.size_surcharge || 0),
          image_url: item.image_url || undefined,
          weight_grams: item.weight_grams || 100,
          is_perishable: item.is_perishable || false,
          origin_postal_code: item.origin_postal_code,
          warehouse_id: item.warehouse_id || undefined,
        })),
        subtotal: totalPrice,
        currency: 'IDR',
      };

      // 3. Call backend API to generate token & redirect URL
      const response = await fetch('/api/whatsapp/commerce/order-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart: cartSnapshot }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses checkout via WhatsApp');
      }

      if (!data.deepLink) {
        throw new Error('Tidak mendapatkan URL redirect ke WhatsApp');
      }

      // 4. Redirect user to WhatsApp Deep Link
      window.location.href = data.deepLink;
      
    } catch (error: any) {
      console.error('[WA Checkout Error]:', error);
      toast.error(error.message || 'Terjadi kesalahan sistem');
      setIsLoading(false); // Reset on error
    }
  };

  const isCompact = variant === 'compact';

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleWhatsAppCheckout}
      disabled={isLoading}
      className={`relative w-full flex items-center justify-center gap-2 overflow-hidden
        bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors
        shadow-lg shadow-[#25D366]/20 disabled:opacity-70 disabled:cursor-not-allowed
        ${isCompact ? 'py-2.5 text-[10px]' : 'py-3.5 text-xs'} 
        font-bold uppercase tracking-widest ${className}`}
    >
      {isLoading ? (
        <Loader2 size={isCompact ? 14 : 16} className="animate-spin" />
      ) : (
        <MessageCircle size={isCompact ? 14 : 16} className="fill-current" />
      )}
      
      <span>
        {isLoading ? 'Menghubungkan...' : 'Lanjut via WhatsApp'}
      </span>

      {/* Subtle shine effect overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
    </motion.button>
  );
}
