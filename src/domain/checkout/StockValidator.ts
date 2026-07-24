import { CheckoutItem } from './CheckoutValidator';
import { DatabaseProduct } from './PricingEngine';

export class StockValidator {
  /**
   * Validates stock availability for the requested items against the database products.
   * Enforces strict case-insensitive variant matching.
   */
  public static validateStock(items: CheckoutItem[], dbProducts: DatabaseProduct[]): { isValid: boolean; error?: string; outOfStockItemId?: string } {
    for (const item of items) {
      const dbProd = dbProducts.find((p: any) => p.id === item.id);
      if (!dbProd) continue;
      
      const effectiveSize = (item.size || '').toUpperCase().trim();
      const effectiveColor = (item.color || '').toUpperCase().trim();
      const safeVariants = Array.isArray(dbProd.variants) ? dbProd.variants : [];
      
      let variant = undefined;
      if (effectiveSize || effectiveColor) {
        variant = safeVariants.find((v: any) => 
          (!effectiveSize ? true : (v?.size || '').toUpperCase().trim() === effectiveSize) &&
          (!effectiveColor ? true : (v?.color || '').toUpperCase().trim() === effectiveColor)
        );
        if (!variant && effectiveSize) {
          variant = safeVariants.find((v: any) => (v?.size || '').toUpperCase().trim() === effectiveSize);
        }
      }
      
      const currentStock = variant && (variant as any).stock_quantity != null 
        ? (variant as any).stock_quantity 
        : ((dbProd as any).stock_quantity != null ? (dbProd as any).stock_quantity : 0);

      if (item.quantity > currentStock) {
        return { 
          isValid: false,
          error: `Stok "${item.name}" ${item.size ? `(${item.size})` : ''} hanya tersisa ${currentStock} unit`,
          outOfStockItemId: item.id 
        };
      }
    }

    return { isValid: true };
  }
}
