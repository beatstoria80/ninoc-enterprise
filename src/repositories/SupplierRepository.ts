import { SupabaseClient } from '@supabase/supabase-js';

export class SupplierRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches orders associated with a supplier's products.
   * Optimized for the dashboard table view:
   * 1. Uses a limit to prevent memory crashes on massive order volumes
   * 2. Only selects minimal required fields from order_items (id, quantity) to prevent over-fetching
   * 3. Sanitizes shipping_address to prevent data leakage of sensitive PII to the client
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
        order_items!inner(id, supplier_id, quantity)
      `)
      .eq('order_items.supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(500); // Pagination failsafe for extreme loads

    if (error) {
      console.error('[SupplierRepository] Error fetching supplier logistics orders:', error);
      throw new Error(error.message);
    }

    if (!rawOrders || rawOrders.length === 0) return [];

    // Map over the orders, calculate true items count, and sanitize shipping_address
    return rawOrders.map((order: any) => {
      // 1. Calculate items count
      const trueItemsCount = order.order_items?.reduce((total: number, item: any) => {
        return total + (item.quantity || 1);
      }, 0) || 0;

      // 2. Data Minimization (Sanitize PII)
      // The dashboard UI only needs the city for the DESTINATION column.
      // We strip out full_address, name, phone, etc.
      let safeShippingAddress = null;
      if (order.shipping_address) {
        safeShippingAddress = {
          city: order.shipping_address.city || '-'
        };
      }

      // 3. Remove order_items array entirely before sending to client
      // (The table view doesn't display items, only the detail page does)
      const { order_items, shipping_address, ...orderWithoutItems } = order;

      return {
        ...orderWithoutItems,
        itemsCount: trueItemsCount,
        shipping_address: safeShippingAddress
      };
    });
  }
}
