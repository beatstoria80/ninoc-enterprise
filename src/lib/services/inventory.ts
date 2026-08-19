import { createClient } from '@/utils/supabase/server';

export interface SupplierInventoryStats {
  activeAllocations: number;
}

export async function getSupplierInventoryStats(supplierId: string): Promise<SupplierInventoryStats> {
  const supabase = await createClient();
  
  // Aggregate stock from variants of the supplier's products
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      stock_quantity,
      products!inner(supplier_id)
    `)
    .eq('products.supplier_id', supplierId);

  if (error) {
    console.error('Error fetching inventory stats:', error);
    return { activeAllocations: 0 };
  }

  const activeAllocations = variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) || 0;

  return {
    activeAllocations
  };
}

export async function getSupplierProductsWithVariants(supplierId: string) {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      price, 
      stock, 
      image_url, 
      category, 
      is_perishable,
      created_at,
      product_variants (
        id,
        size,
        color,
        stock_quantity,
        sku
      )
    `)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier products:', error);
    return [];
  }

  return products || [];
}

export async function getSupplierDashboardMetrics(supplierId: string) {
  const supabase = await createClient();
  
  // Clean Architecture: Limit fetching to only non-cancelled orders to prevent OOM
  // We use inner join and `.neq` to push the filtering down to Postgres rather than Node.js memory.
  const { data: soldItems, error } = await supabase
    .from('order_items')
    .select('id, quantity, price, created_at, products(name), orders!inner(status)')
    .eq('supplier_id', supplierId)
    .neq('orders.status', 'cancelled')
    .neq('orders.status', 'refunded')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { itemsSold: 0, pendingPayouts: 0, recentMovements: [], validItems: [] };
  }

  const validItems = soldItems || [];
  const itemsSold = validItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const pendingPayouts = validItems.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 1)), 0);
  
  const recentMovements = validItems.slice(0, 5).map(item => ({
    name: (item.products as any)?.name || 'Unknown Product',
    desc: `Sold on ${new Date(item.created_at).toLocaleDateString()}`,
    amount: (item.price || 0) * (item.quantity || 1)
  }));

  return {
    itemsSold,
    pendingPayouts,
    recentMovements,
    validItems
  };
}
