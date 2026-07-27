import { redirect } from 'next/navigation';
import { Truck, Package, Clock, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export const metadata = {
  title: 'Logistics & Packing - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsPage() {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  // Fetch orders that contain this supplier's products
  // Using an inner join to ensure we only get orders with at least one item from this supplier
  const { data: rawOrders, error } = await supabase
    .from('orders')
    .select(`
      id, 
      created_at, 
      customer_name, 
      status, 
      courier, 
      tracking_id,
      order_items!inner(id, supplier_id)
    `)
    .eq('order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier orders:', error);
  }

  // Deduplicate orders since inner join might return multiple rows per order if they have multiple items
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

  // Currently viewing 'to pack' as default for this UI design
  const displayOrders = [...toPackOrders, ...readyOrders]; 

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-ink">Logistics & Packing</h1>
          <p className="text-sm text-ink/60 mt-1">Manage packing and request courier pickups for your allocations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
            <input 
              type="text" 
              placeholder="Search order ID..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 overflow-x-auto">
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-rose text-rose whitespace-nowrap">
          Action Required ({toPackOrders.length + readyOrders.length})
        </button>
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-ink/60 hover:text-ink whitespace-nowrap">
          In Transit ({inTransitOrders.length})
        </button>
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-ink/60 hover:text-ink whitespace-nowrap">
          Completed ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Buyer</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Courier</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-ink">{order.id}</div>
                  <div className="text-xs text-ink/50 mt-0.5">{order.itemsCount} your items</div>
                </td>
                <td className="px-6 py-4 text-sm text-ink/70">
                  {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, HH:mm') : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-ink/70">{order.customer_name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-ink/70">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-ink/40" />
                    {order.courier || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(order.status === 'paid' || order.status === 'pending_packing') && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                      <Package size={12} />
                      To Pack
                    </span>
                  )}
                  {(order.status === 'ready_for_pickup' || order.status === 'allocated' || (order.status === 'shipped' && !order.tracking_id)) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                      <Clock size={12} />
                      Waiting Pickup
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/supplier/logistics/${order.id}`}
                    className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 text-ink/60 hover:text-ink transition-colors"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayOrders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-ink/60 text-sm">No action required at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
