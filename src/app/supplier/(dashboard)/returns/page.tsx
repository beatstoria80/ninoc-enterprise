import { redirect } from 'next/navigation';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { createClient } from '@/utils/supabase/server';
import ReturnsClient from './ReturnsClient';

export const metadata = {
  title: 'Returns & Cancellations - Supplier Hub | NINOC',
};

export default async function SupplierReturnsPage() {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  const supabase = await createClient();

  // Fetch Return Requests
  const { data: rawReturns } = await supabase
    .from('retur_requests')
    .select(`
      id,
      created_at,
      status,
      reason_label,
      video_url,
      admin_notes,
      order:orders!inner(
        id,
        status,
        customer_name,
        order_items!inner(id, supplier_id, product_name, quantity, size, color)
      )
    `)
    .eq('order.order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  // Filter out items not belonging to this supplier
  const processedReturns = (rawReturns || []).map((ret: any) => ({
    ...ret,
    supplierItems: ret.order.order_items.filter((item: any) => item.supplier_id === supplierUser.supplier_id)
  })).filter((ret: any) => ret.supplierItems.length > 0);

  // Fetch cancelled orders
  const { data: rawCancellations } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      order_items!inner(
        id,
        product_name,
        quantity,
        supplier_id
      )
    `)
    .eq('status', 'cancelled')
    .eq('order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  const processedCancellations = (rawCancellations || []).map((order: any) => ({
    ...order,
    supplierItems: order.order_items.filter((item: any) => item.supplier_id === supplierUser.supplier_id)
  })).filter((order: any) => order.supplierItems.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ReturnsClient 
        initialReturns={processedReturns} 
        initialCancellations={processedCancellations} 
        supplierId={supplierUser.supplier_id}
      />
    </div>
  );
}
