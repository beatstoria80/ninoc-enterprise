import { useState, useMemo } from 'react';
import { useHydratedCart, useCartUI, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { 
  hasSizes, 
  getAvailableSizes, 
  resolveEffectiveSize, 
  getAvailableColorsForSize, 
  resolveEffectiveColor, 
  findVariant,
  Product
} from '@/lib/domain/product';
import { useRelatedProducts } from './useRelatedProducts';
import { useProductRealtime } from './useProductRealtime';

export function useProductSelection(initialProduct: any, initialReviews: any[]) {
  const [product, setProduct] = useState(initialProduct || null);
  const [reviews] = useState(initialReviews);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { addItem, items: cartItems } = useHydratedCart();
  const setConflictInfo = useCartUI(state => state.setConflictInfo);

  // Derived state: hasProductSizes, availableSizes
  const hasProductSizes = useMemo(() => hasSizes(product), [product]);
  const availableSizes = useMemo(() => getAvailableSizes(product), [product]);

  const effectiveSize = useMemo(() => resolveEffectiveSize(product, selectedSize), [product, selectedSize]);
  const effectiveColor = useMemo(() => resolveEffectiveColor(product, effectiveSize, selectedColor), [product, effectiveSize, selectedColor]);

  const productId = product?.id;
  const productCategory = product?.category;
  const productSubCategory = product?.sub_category;

  // Use Atomic Hooks for side effects (Clean Architecture)
  const relatedProducts = useRelatedProducts(productId, productCategory, productSubCategory);
  useProductRealtime(productId, setProduct);

  const availableStock = useMemo(() => {
    const selectedVariant = findVariant(product, effectiveSize, effectiveColor);
    if (selectedVariant) {
      return typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : (parseInt(selectedVariant.stock_quantity) || 0);
    }
    if (product && 'stock_quantity' in product) {
      return typeof (product as any).stock_quantity === 'number' ? (product as any).stock_quantity : (parseInt((product as any).stock_quantity) || 0);
    }
    return 0; // Default to 0 instead of 999 to prevent overselling of null-stock items
  }, [product, effectiveSize, effectiveColor]);

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
    if ((SURCHARGE_SIZES as readonly string[]).includes(effectiveSize.toUpperCase())) {
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
    const result = addItem({
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
      warehouse_name: product.warehouses?.city ? `Fasilitas ${product.warehouses.city}` : (product.warehouses?.name || undefined),
    }, effectiveSize, effectiveColor, sizeSurcharge, qtyToAdd, availableStock);
    
    if (result && (result as any).success === false) {
      const currentWarehouseName = cartItems[0]?.warehouse_name || 'lokasi saat ini';
      const newWarehouseName = product.warehouses?.city ? `Fasilitas ${product.warehouses.city}` : (product.warehouses?.name || 'lokasi lain');
      
      setConflictInfo({
        isOpen: true,
        currentWarehouseName,
        newWarehouseName,
        product: {
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
          warehouse_name: newWarehouseName,
        },
        options: {
          size: effectiveSize || undefined,
          color: effectiveColor || undefined,
          sizeSurcharge,
          qty: qtyToAdd,
          maxStock: availableStock,
        }
      });
      return false;
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
    hasSizes: hasProductSizes,
    availableSizes,
    effectiveSize,
    effectiveColor,
    availableStock,
    itemInCartQty,
    remainingStock,
    handleAddToCart,
  };
}
