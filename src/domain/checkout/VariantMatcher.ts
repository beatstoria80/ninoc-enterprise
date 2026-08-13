import { DatabaseProduct } from './PricingEngine';

export interface ProductVariant {
  id?: string;
  size?: string | null;
  color?: string | null;
  stock_quantity?: number | null;
  sku?: string | null;
}

export class VariantMatcher {
  /**
   * Finds matching variant in a product case-insensitively.
   */
  public static findVariant(
    product: DatabaseProduct,
    size?: string | null,
    color?: string | null
  ): ProductVariant | undefined {
    const effectiveSize = (size || '').toUpperCase().trim();
    const effectiveColor = (color || '').toUpperCase().trim();
    const safeVariants: ProductVariant[] = Array.isArray(product.variants) ? product.variants : [];

    if (!effectiveSize && !effectiveColor) {
      return undefined;
    }

    // 1. Exact match on both size and color (if provided)
    let variant = safeVariants.find((v) => {
      const vSize = (v.size || '').toUpperCase().trim();
      const vColor = (v.color || '').toUpperCase().trim();
      const matchesSize = !effectiveSize || vSize === effectiveSize;
      const matchesColor = !effectiveColor || vColor === effectiveColor;
      return matchesSize && matchesColor;
    });

    // 2. Fallback match on size only
    if (!variant && effectiveSize) {
      variant = safeVariants.find((v) => (v.size || '').toUpperCase().trim() === effectiveSize);
    }

    return variant;
  }

  /**
   * Resolves effective stock quantity for a given product and optional size/color selection.
   */
  public static resolveAvailableStock(
    product: DatabaseProduct,
    size?: string | null,
    color?: string | null
  ): number {
    const variant = this.findVariant(product, size, color);
    if (variant && typeof variant.stock_quantity === 'number') {
      return variant.stock_quantity;
    }
    if (typeof product.stock_quantity === 'number') {
      return product.stock_quantity;
    }
    return 0;
  }
}
