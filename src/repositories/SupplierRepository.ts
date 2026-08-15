import { SupabaseClient } from '@supabase/supabase-js';

export class SupplierRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches orders associated with a supplier's products.
   * Supabase (PostgREST) naturally returns nested JSON, so rawOrders is already 
   * uniquely grouped by order.id.
   * 
   * Note: We execute a concurrent split query to resolve product images 
   * because there is no explicit foreign key relationship in the DB schema between 
   * order_items and products, preventing direct nested selects.
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
        order_items!inner(id, product_id, supplier_id, quantity, product_name, size, color, price_at_purchase)
      `)
      .eq('order_items.supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupplierRepository] Error fetching supplier logistics orders:', error);
      throw new Error(error.message);
    }

    if (!rawOrders || rawOrders.length === 0) return [];

    // 1. Collect all unique product IDs from order items
    const productIds = Array.from(
      new Set(
        rawOrders.flatMap(o => o.order_items?.map((oi: any) => oi.product_id).filter(Boolean) || [])
      )
    );

    // 2. Query products in a separate concurrent request to avoid PGRST200 schema cache error
    const productsMap = new Map<string, string | null>();
    if (productIds.length > 0) {
      try {
        const { data: productsData } = await this.db
          .from('products')
          .select('id, image_url')
          .in('id', productIds);
        
        if (productsData) {
          productsData.forEach((p: any) => {
            productsMap.set(p.id, p.image_url || null);
          });
        }
      } catch (pErr) {
        console.error('[SupplierRepository] Failed to fetch product images:', pErr);
      }
    }

    // 3. Map over the orders, calculate true items count, and enrich with product images
    return rawOrders.map((order: any) => {
      const trueItemsCount = order.order_items?.reduce((total: number, item: any) => {
        return total + (item.quantity || 1);
      }, 0) || 0;

      const enrichedItems = order.order_items?.map((item: any) => ({
        ...item,
        products: {
          image_url: productsMap.get(item.product_id) || null
        }
      })) || [];

      return {
        ...order,
        itemsCount: trueItemsCount,
        order_items: enrichedItems
      };
    });
  }
}
