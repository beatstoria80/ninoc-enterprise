import { SupabaseClient } from '@supabase/supabase-js';

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  variant_id: string | null;
  flash_sale_price: number;
  allocated_stock: number;
  sold_count: number;
  max_qty_per_user: number;
  flash_sales?: {
    title: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
  };
}

export class FlashSaleService {
  /**
   * Fetches all currently active flash sale items across the platform.
   */
  static async getActiveFlashSales(supabase: SupabaseClient): Promise<FlashSaleItem[]> {
    const now = new Date().toISOString();
    
    // Step 1: Find active flash sales
    const { data: sales, error: saleErr } = await supabase
      .from('flash_sales')
      .select('id, title, start_time, end_time, is_active')
      .eq('is_active', true)
      .lte('start_time', now)
      .gt('end_time', now);
      
    if (saleErr || !sales || sales.length === 0) return [];
    
    const saleIds = sales.map((s) => s.id);
    
    // Step 2: Get items for those sales
    const { data: items, error: itemErr } = await supabase
      .from('flash_sale_items')
      .select('*')
      .in('flash_sale_id', saleIds);
      
    if (itemErr || !items) return [];
    
    // Attach sale metadata
    return items.map(item => ({
      ...item,
      flash_sales: sales.find(s => s.id === item.flash_sale_id)
    }));
  }

  /**
   * Evaluates if a given product/variant is currently in an active flash sale,
   * and returns the active flash sale item if it has remaining stock.
   */
  static evaluateFlashSalePricing(
    productId: string,
    variantId: string | null,
    activeFlashSales: FlashSaleItem[]
  ): FlashSaleItem | null {
    if (!activeFlashSales || activeFlashSales.length === 0) return null;
    
    // Find matching item (prioritize specific variant, then product-wide)
    const match = activeFlashSales.find(
      (item) => item.product_id === productId && (item.variant_id === variantId || !item.variant_id)
    );
    
    if (!match) return null;
    
    // Ensure stock remains
    const remainingStock = match.allocated_stock - match.sold_count;
    if (remainingStock <= 0) return null;
    
    return match;
  }
}
