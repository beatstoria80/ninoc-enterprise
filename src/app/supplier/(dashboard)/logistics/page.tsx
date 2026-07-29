import { redirect } from 'next/navigation';
import { Truck, Package, Clock, CheckCircle2, ChevronRight, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { createClient } from '@/utils/supabase/server';
import ExportCSVButton from '@/components/supplier/ExportCSVButton';
import { format } from 'date-fns';

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Logistics & Packing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage packing, tracking, and courier pickups for your allocations.</p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton orders={orders} />
          <button className="bg-ink text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
            <FileText size={16} />
            Print Packing Slips
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-ink text-white whitespace-nowrap">
              Action Required ({toPackOrders.length + readyOrders.length})
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100 whitespace-nowrap transition-colors">
              In Transit ({inTransitOrders.length})
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100 whitespace-nowrap transition-colors">
              Completed ({completedOrders.length})
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search order ID..." 
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Courier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayOrders.length > 0 ? (
                displayOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.id}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.itemsCount} your items</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{order.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Truck size={14} className="text-gray-400" />
                        {order.courier || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(order.status === 'paid' || order.status === 'pending_packing') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Package size={12} />
                          To Pack
                        </span>
                      )}
                      {(order.status === 'ready_for_pickup' || order.status === 'allocated' || (order.status === 'shipped' && !order.tracking_id)) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={12} />
                          Waiting Pickup
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/supplier/logistics/${order.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-ink hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Package size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">No action required at the moment</p>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        New orders needing your attention will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
