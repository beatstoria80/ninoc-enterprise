import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useHydratedCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';

export function useProductSelection(initialProduct: any, initialReviews: any[]) {
  const [product, setProduct] = useState(initialProduct || null);
  const [reviews] = useState(initialReviews);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const { addItem } = useHydratedCart();

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
        // 1. Prioritaskan produk dengan sub_category yang persis sama (misal: sesama Unisex)
        let { data: exactMatches } = await supabase
          .from('products')
          .select('*')
          .eq('sub_category', product.sub_category || product.category)
          .neq('id', product.id)
          .limit(14);
          
        let related = exactMatches || [];

        // 2. Jika produk kurang dari 10, isi kekurangannya dengan produk dari kategori utama (misal: sesama pakaian)
        if (related.length < 10) {
          const { data: categoryMatches } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', product.id)
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
            .neq('id', product.id)
            .limit(16);

          if (allOther) {
            const existingIds = new Set(related.map(p => p.id));
            const extra = allOther.filter(p => !existingIds.has(p.id));
            related = [...related, ...extra].slice(0, 14);
          }
        }

        setRelatedProducts(related);
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

  const { items: cartItems } = useHydratedCart();

  const availableStock = useMemo(() => {
    const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
    const selectedVariant = safeVariants.find((v: any) => 
      (!hasSizes ? !v?.size : v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && 
      (!effectiveColor ? !v?.color : v?.color?.toUpperCase() === effectiveColor?.toUpperCase())
    );
    if (selectedVariant) {
      return typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : (parseInt(selectedVariant.stock_quantity) || 0);
    }
    if (product && 'stock_quantity' in product) {
      return typeof (product as any).stock_quantity === 'number' ? (product as any).stock_quantity : (parseInt((product as any).stock_quantity) || 0);
    }
    return 0; // Default to 0 instead of 999 to prevent overselling of null-stock items
  }, [product, hasSizes, effectiveSize, effectiveColor]);

  const itemInCartQty = useMemo(() => {
    return cartItems
      .filter(item => item.id === product?.id && item.size === effectiveSize && item.color === effectiveColor)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product?.id, effectiveSize, effectiveColor]);

  const remainingStock = Math.max(0, availableStock - itemInCartQty);

  const handleAddToCart = () => {
    if (!product) return false;
    if (remainingStock <= 0) return false;

    let sizeSurcharge = 0;
    if (SURCHARGE_SIZES.includes(effectiveSize.toUpperCase())) {
      sizeSurcharge = SIZE_SURCHARGE_AMOUNT;
    }

    const qtyToAdd = Math.min(quantity, remainingStock);

    // Resolve accurate photo for selected color from specifications or variants
    let colorImageUrl = product.image_url;
    if (effectiveColor) {
      const safeColor = effectiveColor.trim().toUpperCase();
      const safeSpecs = Array.isArray(product.specifications) ? product.specifications : [];
      
      const mainSpec = safeSpecs.find((spec: any) => {
        if (!spec?.label || typeof spec.label !== 'string') return false;
        const match = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
        return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
      });

      if (mainSpec?.value?.trim()) {
        colorImageUrl = mainSpec.value.trim();
      } else {
        const p1Spec = safeSpecs.find((spec: any) => {
          if (!spec?.label || typeof spec.label !== 'string') return false;
          const match = spec.label.match(/^color\s*(p1)\s*:\s*(.+)$/i);
          return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
        });
        if (p1Spec?.value?.trim()) {
          colorImageUrl = p1Spec.value.trim();
        } else {
          const safeVariants = Array.isArray(product.variants) ? product.variants : [];
          const varMatch = safeVariants.find((v: any) => v.color?.trim().toUpperCase() === safeColor && v.image_url);
          if (varMatch?.image_url) {
            colorImageUrl = varMatch.image_url;
          }
        }
      }
    }

    // Single atomic call — passing availableStock so cart store enforces max limit
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: colorImageUrl,
      weight_grams: product.weight_grams,
      department_id: product.department_id,
      category: product.category,
      is_perishable: product.is_perishable,
      warehouse_id: product.warehouse_id,
      origin_postal_code: product.warehouses?.postal_code,
    }, effectiveSize, effectiveColor, sizeSurcharge, qtyToAdd, availableStock);
    
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
    availableStock,
    itemInCartQty,
    remainingStock,
    handleAddToCart,
  };
}
