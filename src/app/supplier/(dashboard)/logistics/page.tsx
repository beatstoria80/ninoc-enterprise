import { redirect } from 'next/navigation';
import { Truck, Package, Clock, CheckCircle2, ChevronRight, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { createClient } from '@/utils/supabase/server';
import ExportCSVButton from '@/components/supplier/ExportCSVButton';
import { format } from 'date-fns';
import LogisticsTableClient from './LogisticsTableClient';
export const metadata = {
  title: 'Logistics & Packing - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsPage() {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  const supabase = await createClient();

  // Fetch orders that contain this supplier's products
  const { data: rawOrders, error } = await supabase
    .from('orders')
    .select(`
      id, 
      created_at, 
      customer_name, 
      status, 
      courier, 
      tracking_id,
      order_items!inner(id, supplier_id, quantity, product_name, size, color)
    `)
    .eq('order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier orders:', error);
  }

  // Deduplicate orders
  const uniqueOrderMap = new Map();
  if (rawOrders) {
    rawOrders.forEach(order => {
      if (!uniqueOrderMap.has(order.id)) {
        uniqueOrderMap.set(order.id, {
          ...order,
          itemsCount: rawOrders.filter(ro => ro.id === order.id).length
        });
      }
    });
  }
  const orders = Array.from(uniqueOrderMap.values());

  const toPackOrders = orders.filter(o => o.status === 'paid' || o.status === 'pending_packing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup' || o.status === 'allocated' || (o.status === 'shipped' && !o.tracking_id));
  const inTransitOrders = orders.filter(o => o.status === 'shipped' && o.tracking_id);
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

  const displayOrders = [...toPackOrders, ...readyOrders]; 

  return (
    <LogisticsTableClient orders={orders} />
  );
}
