import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useProductRealtime(productId: string | undefined, setProduct: (product: any) => void) {
  useEffect(() => {
    if (!productId) return;
    
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel(`variants-stock-${productId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'variants',
          filter: `product_id=eq.${productId}`
        }, async () => {
          const { data } = await supabase
            .from('products')
            .select('*, variants(*)')
            .eq('id', productId)
            .single();
          if (data) setProduct(data);
        })
        .subscribe();
    } catch {
      console.warn('Realtime subscription unavailable');
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, [productId, setProduct]);
}
