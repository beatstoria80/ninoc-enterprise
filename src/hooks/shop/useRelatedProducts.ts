import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRelatedProducts(productId: string | undefined, category: string | undefined, subCategory: string | undefined) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) return;
    
    const fetchRelated = async () => {
      try {
        // 1. Prioritaskan produk dengan sub_category yang persis sama (misal: sesama Unisex)
        let { data: exactMatches } = await supabase
          .from('products')
          .select('*')
          .eq('sub_category', subCategory || category)
          .neq('id', productId)
          .limit(14);
          
        let related = exactMatches || [];

        // 2. Jika produk kurang dari 10, isi kekurangannya dengan produk dari kategori utama
        if (related.length < 10) {
          const { data: categoryMatches } = await supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .neq('id', productId)
            .limit(14);
            
          if (categoryMatches) {
            const existingIds = new Set(related.map(p => p.id));
            const extra = categoryMatches.filter(p => !existingIds.has(p.id));
            related = [...related, ...extra].slice(0, 14);
          }
        }

        // 3. Jika masih kurang dari 10, ambil produk acak dari seluruh katalog agar rak tidak kosong
        if (related.length < 10) {
          const { data: allOther } = await supabase
            .from('products')
            .select('*')
            .neq('id', productId)
            .limit(16);

          if (allOther) {
            const existingIds = new Set(related.map(p => p.id));
            const extra = allOther.filter(p => !existingIds.has(p.id));
            related = [...related, ...extra].slice(0, 14);
          }
        }

        setRelatedProducts(related);
      } catch (e) {
        console.error('Failed to fetch related products', e);
      }
    };
    
    fetchRelated();
  }, [productId, category, subCategory]);

  return relatedProducts;
}
