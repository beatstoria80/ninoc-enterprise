export const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  stock_quantity: number;
  sku?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  variants?: ProductVariant[];
}

/**
 * Checks if a product has any variants with sizes.
 */
export function hasSizes(product: Product | null | undefined): boolean {
  if (!product || !Array.isArray(product.variants)) return false;
  return product.variants.some((v) => v.size && v.size.trim() !== '');
}

/**
 * Gets a uniquely sorted list of available sizes for a product.
 */
export function getAvailableSizes(product: Product | null | undefined): string[] {
  if (!product || !Array.isArray(product.variants) || !hasSizes(product)) return [];
  
  const sizes = Array.from(
    new Set(product.variants.map((v) => v.size).filter(Boolean))
  ) as string[];
  
  sizes.sort((a, b) => {
    const idxA = SIZE_ORDER.indexOf(a.toUpperCase());
    const idxB = SIZE_ORDER.indexOf(b.toUpperCase());
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return sizes;
}

/**
 * Resolves the effective size based on user selection or defaults to the first available.
 */
export function resolveEffectiveSize(product: Product | null | undefined, selectedSize: string): string {
  if (!hasSizes(product)) return '';
  const available = getAvailableSizes(product);
  if (available.length === 0) return '';
  
  const match = available.find((s) => s.toUpperCase() === selectedSize.toUpperCase());
  return match || available[0];
}

/**
 * Gets available colors for a specific size.
 */
export function getAvailableColorsForSize(product: Product | null | undefined, effectiveSize: string): string[] {
  if (!product || !Array.isArray(product.variants)) return [];
  
  const hasProductSizes = hasSizes(product);
  
  return Array.from(
    new Set(
      product.variants
        .filter((v) => (!hasProductSizes || v.size?.toUpperCase() === effectiveSize.toUpperCase()) && v.color)
        .map((v) => v.color as string)
    )
  );
}

/**
 * Resolves the effective color based on user selection or defaults to the first available for the effective size.
 */
export function resolveEffectiveColor(product: Product | null | undefined, effectiveSize: string, selectedColor: string): string {
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return selectedColor;
  
  const colorsForSize = getAvailableColorsForSize(product, effectiveSize);
  if (colorsForSize.length === 0) return selectedColor;

  const match = colorsForSize.find((c) => c.toUpperCase() === selectedColor.toUpperCase());
  return match || colorsForSize[0];
}

/**
 * Finds the specific variant based on size and color.
 */
export function findVariant(product: Product | null | undefined, size: string, color: string): ProductVariant | undefined {
  if (!product || !Array.isArray(product.variants)) return undefined;
  
  return product.variants.find((v) => 
    (!size || v.size?.toUpperCase() === size.toUpperCase()) &&
    (!color || v.color?.toUpperCase() === color.toUpperCase())
  );
}
