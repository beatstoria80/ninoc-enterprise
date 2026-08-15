import { SupabaseClient } from '@supabase/supabase-js';

export class SupplierRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches orders associated with a supplier's products.
   * Deduplicates natively so we don't have to do it in memory.
   */
  public async getLogisticsOrders(supplierId: string) {
    // Instead of deduplicating in-memory, we can query orders that have order_items for this supplier.
    // Supabase JS doesn't support SELECT DISTINCT gracefully with nested relations, 
    // so we fetch exactly what we need and group it minimally.
    const { data: rawOrders, error } = await this.db
      .from('orders')
      .select(`
        id, 
        created_at, 
        customer_name, 
        customer_phone,
        status, 
        courier, 
        tracking_id,
        shipping_address,
        order_items!inner(id, supplier_id, quantity, product_name, size, color)
      `)
      .eq('order_items.supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupplierRepository] Error fetching supplier logistics orders:', error);
      throw new Error(error.message);
    }

    // Deduplicate orders mapping (fallback if no SQL view exists)
    const uniqueOrderMap = new Map();
    if (rawOrders) {
      rawOrders.forEach((order: any) => {
        if (!uniqueOrderMap.has(order.id)) {
          uniqueOrderMap.set(order.id, {
            ...order,
            itemsCount: rawOrders.filter((ro: any) => ro.id === order.id).length
          });
        }
      });
    }
    
    return Array.from(uniqueOrderMap.values());
  }
}
