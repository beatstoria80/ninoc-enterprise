import { CartItem } from '@/store/useCart';
import { WarehouseValidator, WarehouseItem } from './WarehouseValidator';

export class CartDomainService {
  /**
   * Validates if a new item can be added to the current cart based on warehouse constraints.
   * Delegates the logic to the centralized WarehouseValidator to ensure architectural consistency.
   */
  public static validateWarehouseConflict(currentItems: CartItem[], newItem: Partial<CartItem>): { isValid: boolean; error?: string } {
    const itemsToValidate: WarehouseItem[] = [
      ...currentItems,
      {
        id: newItem.id || '',
        name: newItem.name || '',
        warehouse_id: newItem.warehouse_id,
        origin_postal_code: newItem.origin_postal_code
      }
    ];
    return WarehouseValidator.validateWarehouseConflict(itemsToValidate);
  }
}
