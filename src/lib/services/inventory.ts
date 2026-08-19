import { createClient } from '@/utils/supabase/server';

export interface SupplierInventoryStats {
  activeAllocations: number;
}

export async function getSupplierInventoryStats(supplierId: string): Promise<SupplierInventoryStats> {
  const supabase = await createClient();
  
  let activeAllocations = 0;
  let hasMore = true;
  let offset = 0;
  const BATCH_SIZE = 1000;

  while (hasMore) {
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('stock_quantity, products!inner(supplier_id)')
      .eq('products.supplier_id', supplierId)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching inventory stats:', error);
      break;
    }

    if (!variants || variants.length === 0) {
      hasMore = false;
    } else {
      activeAllocations += variants.reduce((acc, v) => acc + (v.stock_quantity ?? 0), 0);
      
      if (variants.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }
  }

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
  let allSoldItems: any[] = [];
  let hasMore = true;
  let offset = 0;
  const BATCH_SIZE = 1000;

  while (hasMore) {
    const { data: soldItems, error } = await supabase
      .from('order_items')
      .select('id, quantity, price, created_at, products(name), orders!inner(status)')
      .eq('supplier_id', supplierId)
      .neq('orders.status', 'cancelled')
      .neq('orders.status', 'refunded')
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error fetching dashboard metrics:', error);
      break;
    }

    if (!soldItems || soldItems.length === 0) {
      hasMore = false;
    } else {
      allSoldItems = allSoldItems.concat(soldItems);
      
      if (soldItems.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }
  }

  const itemsSold = allSoldItems.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
  const pendingPayouts = allSoldItems.reduce((acc, curr) => acc + ((curr.price ?? 0) * (curr.quantity ?? 0)), 0);
  
  const recentMovements = allSoldItems.slice(0, 5).map(item => ({
    name: (item.products as any)?.name || 'Unknown Product',
    desc: `Sold on ${new Date(item.created_at).toLocaleDateString()}`,
    amount: (item.price ?? 0) * (item.quantity ?? 0)
  }));

  return {
    itemsSold,
    pendingPayouts,
    recentMovements,
    validItems: allSoldItems
  };
}
