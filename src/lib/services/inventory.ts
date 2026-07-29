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
