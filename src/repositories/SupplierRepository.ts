import { SupabaseClient } from '@supabase/supabase-js';

export class SupplierRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches orders associated with a supplier's products.
   * Supabase (PostgREST) naturally returns nested JSON, so rawOrders is already 
   * uniquely grouped by order.id. No in-memory deduplication is required.
   */
  public async getLogisticsOrders(supplierId: string) {
    const { data: rawOrders, error } = await this.db
      .from('orders')
      .select(`
        id, 
        created_at, 
        customer_name, 
        customer_phone,
        status, 
        payment_status,
        total_price,
        courier, 
        tracking_id,
        shipping_address,
        print_count,
        last_printed_by,
        last_printed_at,
        order_items!inner(id, supplier_id, quantity, product_name, size, color, price_at_purchase)
      `)
      .eq('order_items.supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupplierRepository] Error fetching supplier logistics orders:', error);
      throw new Error(error.message);
    }

    if (!rawOrders) return [];

    // Map over the already-unique orders to calculate the true physical items count
    return rawOrders.map((order: any) => {
      // Calculate the total physical quantity of items to pack, not just the number of DB rows.
      const trueItemsCount = order.order_items?.reduce((total: number, item: any) => {
        return total + (item.quantity || 1);
      }, 0) || 0;

      return {
        ...order,
        itemsCount: trueItemsCount
      };
    });
  }
}
