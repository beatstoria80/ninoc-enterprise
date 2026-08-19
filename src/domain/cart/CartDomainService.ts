import { CartItem } from '@/store/useCart';

export class CartDomainService {
  /**
   * Validates if a new item can be added to the current cart based on warehouse constraints.
   * Ensures that items in a single checkout do not span across multiple isolated physical facilities.
   */
  public static validateWarehouseConflict(currentItems: CartItem[], newItem: Partial<CartItem>): { isValid: boolean; error?: string } {
    if (!currentItems || currentItems.length === 0) {
      return { isValid: true };
    }

    const firstItem = currentItems[0];
    
    const existingWarehouseId = firstItem.warehouse_id;
    const existingPostal = firstItem.origin_postal_code;
    
    const newWarehouseId = newItem.warehouse_id;
    const newPostal = newItem.origin_postal_code;

    let isConflict = false;
    
    if (existingWarehouseId || newWarehouseId) {
      // Strict enforcement: if AT LEAST ONE item has a warehouse_id, they MUST match.
      if (existingWarehouseId !== newWarehouseId) {
        isConflict = true;
      }
    } else {
      // Fallback: neither item has a warehouse_id.
      if (existingPostal && newPostal && existingPostal !== newPostal) {
        isConflict = true;
      }
    }

    if (isConflict) {
      return { 
        isValid: false, 
        error: 'Anda tidak dapat menggabungkan produk dari lokasi fasilitas/gudang yang berbeda dalam satu pesanan. Selesaikan atau kosongkan pesanan sebelumnya.' 
      };
    }

    return { isValid: true };
  }
}
