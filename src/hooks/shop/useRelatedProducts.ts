import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { classifyDepartment } from '@/lib/departmentDomain';

// REFACTOR: Standardize catalogue formation sorting (display_order ASC, then created_at DESC)
function sortCatalogueFormation(products: any[]) {
  return [...products].sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

export function useRelatedProducts(productId: string | undefined, category: string | undefined, subCategory?: string | undefined) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) return;
    
    const fetchRelated = async () => {
      try {
        const currentPillar = classifyDepartment(category);

        // 1. Ambil produk yang konsisten dengan formasi katalog resmi (display_order ASC, created_at DESC)
        const { data: allCatalog } = await supabase
          .from('products')
          .select('*, variants(*)')
          .neq('id', productId)
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(30);

        if (!allCatalog || allCatalog.length === 0) {
          setRelatedProducts([]);
          return;
        }

        // 2. Filter produk yang berada dalam pilar departemen yang sama (misal: Apparel/Pakaian)
        const samePillar = allCatalog.filter(p => classifyDepartment(p.category) === currentPillar);
        const otherPillar = allCatalog.filter(p => classifyDepartment(p.category) !== currentPillar);

        // 3. Prioritaskan produk dari pilar yang sama, lalu lengkapi dari pilar lain jika kurang dari 12
        const combined = [...samePillar, ...otherPillar];
        const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());

        // 4. Kunci formasi produk agar tepat identik dengan urutan katalog toko (display_order ASC lalu created_at DESC)
        const sorted = sortCatalogueFormation(unique).slice(0, 14);

        setRelatedProducts(sorted);
      } catch (e) {
        console.error('Failed to fetch related products', e);
      }
    };
    
    fetchRelated();
  }, [productId, category, subCategory]);

  return relatedProducts;
}
