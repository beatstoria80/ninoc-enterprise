import { CheckoutItem } from './CheckoutValidator';
import { DatabaseProduct } from './PricingEngine';
import { VariantMatcher } from './VariantMatcher';

export interface StockValidationResult {
  isValid: boolean;
  error?: string;
  outOfStockItemId?: string;
}

export class StockValidator {
  /**
   * Validates stock availability for requested items against database product records.
   * Enforces strict case-insensitive variant matching and type safety.
   */
  public static validateStock(
    items: CheckoutItem[],
    dbProducts: DatabaseProduct[]
  ): StockValidationResult {
    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.id);
      if (!dbProd) continue;

      const currentStock = VariantMatcher.resolveAvailableStock(dbProd, item.size, item.color);

      if (item.quantity > currentStock) {
        return {
          isValid: false,
          error: `Stok "${item.name}" ${item.size ? `(${item.size})` : ''} hanya tersisa ${currentStock} unit`,
          outOfStockItemId: item.id,
        };
      }
    }

    return { isValid: true };
  }
}
