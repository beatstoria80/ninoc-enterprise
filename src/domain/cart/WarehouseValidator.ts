export interface WarehouseItem {
  id: string;
  name: string;
  warehouse_id?: string | null;
  origin_postal_code?: string;
}

export class WarehouseValidator {
  /**
   * Evaluates if items span across multiple physical warehouses or geographical facility boundaries.
   * Centralizes business logic to prevent multiple packages with incompatible shipping costs in one order.
   */
  public static validateWarehouseConflict(items: WarehouseItem[]): { isValid: boolean; error?: string } {
    if (!items || items.length <= 1) {
      return { isValid: true };
    }

    const firstItem = items[0];
    const baseWarehouseId = firstItem.warehouse_id;
    const basePostal = firstItem.origin_postal_code;

    for (let i = 1; i < items.length; i++) {
      const targetItem = items[i];
      const targetWarehouseId = targetItem.warehouse_id;
      const targetPostal = targetItem.origin_postal_code;

      let isConflict = false;

      if (baseWarehouseId || targetWarehouseId) {
        if (baseWarehouseId !== targetWarehouseId) {
          isConflict = true;
        }
      } else {
        if (basePostal && targetPostal && basePostal !== targetPostal) {
          isConflict = true;
        }
      }

      if (isConflict) {
        return {
          isValid: false,
          error: 'Anda tidak dapat menggabungkan produk dari lokasi fasilitas/gudang yang berbeda dalam satu pesanan. Selesaikan atau kosongkan pesanan sebelumnya.'
        };
      }
    }

    return { isValid: true };
  }
}
