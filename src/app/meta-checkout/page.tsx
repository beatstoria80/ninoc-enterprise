"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function MetaCheckoutHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function processMetaCheckout() {
      // Extract Meta parameters
      const productId = searchParams.get('id') || searchParams.get('product_id');
      const qtyStr = searchParams.get('quantity') || '1';
      const quantity = parseInt(qtyStr, 10) || 1;
      const coupon = searchParams.get('coupon'); // Optional coupon from Meta

      if (!productId) {
        setError("Parameter ID produk tidak ditemukan di URL. (Missing product_id)");
        return;
      }

      try {
        // Fetch product from Supabase to validate and get details (price, name, etc)
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('id, name, base_price, main_image, category_id')
          .eq('id', productId)
          .single();

        if (fetchError || !product) {
          console.error("Product fetch error:", fetchError);
          setError("Produk tidak ditemukan atau tidak tersedia.");
          return;
        }

        // Fetch department and category to fulfill CartItem requirements
        let department_id = null;
        let is_perishable = false;
        
        if (product.category_id) {
           const { data: categoryData } = await supabase
             .from('categories')
             .select('department_id')
             .eq('id', product.category_id)
             .single();
             
           if (categoryData) {
             department_id = categoryData.department_id;
             // Usually F&B (Food) is department 2 or checking for perishability logic
             // But we will use the standard default or what's available
           }
        }

        // Add to Zustand Cart
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.base_price,
          quantity: quantity,
          image_url: product.main_image,
          department_id: department_id,
          weight_grams: 100, // Safe fallback, actual can be fetched if exists
        };

        // Clear existing cart and add only this item to mimic "Buy Now" flow directly from IG
        useCart.getState().clearCart();
        useCart.getState().addItem(cartItem);

        // Redirect to checkout, preserving coupon if it exists
        const redirectUrl = coupon ? `/checkout?promo=${coupon}` : '/checkout';
        router.push(redirectUrl);

      } catch (err) {
        console.error("Meta checkout error:", err);
        setError("Terjadi kesalahan saat memproses produk dari Meta.");
      }
    }

    processMetaCheckout();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Gagal Memproses Pesanan</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link 
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors w-full"
          >
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 flex items-center justify-center rounded-full mx-auto mb-6 animate-pulse">
        <ShoppingBag size={32} />
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">Menyiapkan Checkout Anda...</h2>
      <p className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> Mengambil data produk dari katalog
      </p>
    </div>
  );
}

export default function MetaCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    }>
      <MetaCheckoutHandler />
    </Suspense>
  );
}
