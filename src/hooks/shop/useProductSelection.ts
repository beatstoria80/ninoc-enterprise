import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';

export function useProductSelection(initialProduct: any, initialReviews: any[]) {
  const [product, setProduct] = useState(initialProduct || null);
  const [reviews] = useState(initialReviews);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const addItem = useCart(state => state.addItem);

  // Derived state: hasSizes, availableSizes
  const hasSizes = useMemo(() => {
    return product?.variants?.some((v: any) => v.size && v.size.trim() !== '');
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product?.variants?.length || !hasSizes) return [];
    const sizes = Array.from(new Set(product.variants.map((v: any) => v.size).filter(Boolean))) as string[];
    
    const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
    sizes.sort((a, b) => {
      const idxA = SIZE_ORDER.indexOf(a.toUpperCase());
      const idxB = SIZE_ORDER.indexOf(b.toUpperCase());
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sizes;
  }, [product, hasSizes]);

  const effectiveSize = useMemo((): string => {
    if (!hasSizes) return '';
    const match = availableSizes.find(s => s.toUpperCase() === selectedSize.toUpperCase());
    if (match) return match;
    return availableSizes[0] || '';
  }, [hasSizes, availableSizes, selectedSize]);

  const effectiveColor = useMemo((): string => {
    if (!product?.variants?.length) return selectedColor;
    const colorsForSize = Array.from<string>(new Set(
      product.variants
        .filter((v: any) => (!hasSizes || v.size?.toUpperCase() === effectiveSize.toUpperCase()) && v.color)
        .map((v: any) => v.color as string)
    ));
    const match = colorsForSize.find((c: string) => c.toUpperCase() === selectedColor.toUpperCase());
    if (match) return match;
    return (colorsForSize[0] as string) || '';
  }, [product, hasSizes, effectiveSize, selectedColor]);

  // Realtime Stock & Related Products
  useEffect(() => {
    if (!product) return;
    
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const fetchRelated = async () => {
      try {
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', product.category)
          .neq('id', product.id)
          .limit(4);
        setRelatedProducts(related || []);
      } catch (e) {
        console.error('Failed to fetch related', e);
      }
    };
    
    fetchRelated();
    
    try {
      channel = supabase
        .channel(`variants-stock-${product.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'variants',
          filter: `product_id=eq.${product.id}`
        }, async () => {
          const { data } = await supabase
            .from('products')
            .select('*, variants(*)')
            .eq('id', product.id)
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
  }, [product, product?.id, product?.category]);

  const handleAddToCart = () => {
    if (!product) return false;
    let sizeSurcharge = 0;
    if (SURCHARGE_SIZES.includes(effectiveSize.toUpperCase())) {
      sizeSurcharge = SIZE_SURCHARGE_AMOUNT;
    }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: product.image_url,
    }, effectiveSize, effectiveColor, sizeSurcharge);
    
    // Additional quantity beyond 1
    for (let i = 1; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image_url: product.image_url,
      }, effectiveSize, effectiveColor, sizeSurcharge);
    }
    
    setQuantity(1);
    return true;
  };

  return {
    product,
    reviews,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    quantity,
    setQuantity,
    relatedProducts,
    hasSizes,
    availableSizes,
    effectiveSize,
    effectiveColor,
    handleAddToCart,
  };
}
