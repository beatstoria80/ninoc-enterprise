'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ACTION_REQUIRED_STATUSES, WAITING_PICKUP_STATUSES, COMPLETED_STATUSES, OrderStatus } from '@/domain/supplier/OrderStatus';
import { Scan } from 'lucide-react';

type TabStatus = 'all' | 'pending' | 'transit' | 'done';

export default function LogisticsTableClient({ 
  orders,
  senderOverride
}: { 
  orders: any[];
  senderOverride?: {
    name: string;
    phone: string;
    city: string;
    province: string;
  };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status groupings
  const readyOrders = orders.filter(o => 
    ACTION_REQUIRED_STATUSES.includes(o.status as OrderStatus) || 
    WAITING_PICKUP_STATUSES.includes(o.status as OrderStatus) ||
    (o.status === OrderStatus.SHIPPED && !o.tracking_id)
  );
  
  const transitOrders = orders.filter(o => o.status === OrderStatus.SHIPPED && o.tracking_id);
  const deliveredOrders = orders.filter(o => COMPLETED_STATUSES.includes(o.status as OrderStatus));
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  let displayOrders = activeTab === 'all' ? orders
                    : activeTab === 'pending' ? readyOrders 
                    : activeTab === 'transit' ? transitOrders 
                    : deliveredOrders;

  if (searchQuery.trim()) {
    displayOrders = displayOrders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.courier && o.courier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.tracking_id && o.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  return (
    <div className="w-full bg-white min-h-screen text-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
          <span className="font-bold tracking-widest uppercase text-xs">LOGISTICS COMMAND</span>
          <span className="text-gray-300">&mdash;</span>
          <span className="text-gray-500 font-medium text-xs">shipment operations center</span>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative w-48 sm:w-64">
            <input 
              type="text" 
              placeholder="Cari pesanan, produk, atau resi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:border-gray-400 font-mono transition-colors"
            />
          </div>
          <div className="hidden md:block text-[10px] text-gray-400 font-mono tracking-wide">
            {format(new Date(), 'EEE, dd MMM yyyy')} &bull; {orders.length} active
          </div>
          <button className="bg-black text-white px-3 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1.5 rounded uppercase tracking-widest hover:bg-gray-800 transition-colors shrink-0">
            <Scan size={12} /> SCAN TO DISPATCH
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-y border-gray-200 mb-6">
        <div className="py-4 px-2 md:px-6 hover:bg-gray-50/50 transition-colors">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">SIAP KIRIM</div>
          <div className="text-xl font-medium text-amber-600">{readyOrders.length}</div>
        </div>
        <div className="py-4 px-2 md:px-6 hover:bg-gray-50/50 transition-colors">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">IN TRANSIT</div>
          <div className="text-xl font-medium text-blue-600">{transitOrders.length}</div>
        </div>
        <div className="py-4 px-2 md:px-6 hover:bg-gray-50/50 transition-colors">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">DELIVERED</div>
          <div className="text-xl font-medium text-emerald-600">{deliveredOrders.length}</div>
        </div>
        <div className="py-4 px-2 md:px-6 hover:bg-gray-50/50 transition-colors">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest mb-1">CANCELLED</div>
          <div className="text-xl font-medium text-rose-600">{cancelledOrders.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-0 px-2 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ALL ACTIVE
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          PENDING
        </button>
        <button 
          onClick={() => setActiveTab('transit')}
          className={`pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'transit' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          TRANSIT
        </button>
        <button 
          onClick={() => setActiveTab('done')}
          className={`pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'done' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
          DONE
        </button>
        <div className="ml-auto pb-3 text-[10px] text-gray-400 font-mono tracking-widest hidden sm:block">
          {displayOrders.length} results
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap font-mono">
          <thead className="text-[10px] tracking-widest text-gray-400 border-b border-gray-100 uppercase">
            <tr>
              <th className="py-4 px-2 font-medium">ORDER</th>
              <th className="py-4 px-2 font-medium">STATUS</th>
              <th className="py-4 px-2 font-medium">DESTINATION</th>
              <th className="py-4 px-2 font-medium">COURIER</th>
              <th className="py-4 px-2 font-medium">RESI</th>
              <th className="py-4 px-2 font-medium text-right">VALUE</th>
              <th className="py-4 px-2 font-medium text-right">AGE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/70">
            {displayOrders.length > 0 ? (
              displayOrders.map(order => {
                const isDelivered = order.status === 'delivered' || order.status === 'completed';
                const isShipped = order.status === 'shipped';
                const isReady = order.status === 'ready_for_pickup' || order.status === 'allocated';
                const isCancelled = order.status === 'cancelled';
                
                // Calculate age in hours
                const diffMs = new Date().getTime() - new Date(order.created_at).getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                
                // Format destination city
                const city = (order.shipping_address as any)?.city || '-';

                // Format value (e.g. 289K)
                const valueK = order.total_price ? Math.round(order.total_price / 1000) + 'K' : '-';

                // Format Order Date
                const orderDateFormatted = order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy').toUpperCase() : '-';

                // Normalize courier name
                const courierLabel = order.courier ? (
                  order.courier.toLowerCase().includes('jnt') ? 'JNT' :
                  order.courier.toLowerCase().includes('jne') ? 'JNE' :
                  order.courier.toLowerCase().includes('sicepat') ? 'SICEPAT' :
                  order.courier.toLowerCase().includes('grab') ? 'GRAB' :
                  order.courier.toLowerCase().includes('gojek') ? 'GOJEK' :
                  order.courier.toLowerCase().includes('anteraja') ? 'ANTERAJA' :
                  order.courier.substring(0, 10).toUpperCase()
                ) : '--';

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => router.push(`/supplier/logistics/${order.id}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    {/* ORDER */}
                    <td className="py-4 px-2 text-gray-500 font-mono tracking-tighter text-[10px]">
                      #{order.id.toUpperCase()}
                    </td>
                    
                    {/* STATUS (Dual Badge) */}
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1 items-start">
                        {isDelivered ? (
                          <>
                            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">DELIVERED</span>
                            <span className="text-gray-400 text-[9px] tracking-widest">{orderDateFormatted}</span>
                          </>
                        ) : isCancelled ? (
                          <>
                            <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">CANCELLED</span>
                            <span className="text-gray-400 text-[9px] tracking-widest">{orderDateFormatted}</span>
                          </>
                        ) : isShipped && order.tracking_id ? (
                          <>
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SHIPPED</span>
                            <span className="text-gray-400 text-[9px] tracking-widest">{orderDateFormatted}</span>
                          </>
                        ) : isReady ? (
                          <>
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SIAP KIRIM</span>
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">WAITING PICKUP</span>
                          </>
                        ) : (
                          <>
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SIAP KIRIM</span>
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">KIRIM LUSA</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* DESTINATION */}
                    <td className="py-4 px-2 text-gray-400 font-sans text-xs capitalize truncate max-w-[150px]">
                      {city}
                    </td>

                    {/* COURIER */}
                    <td className="py-4 px-2">
                      <span className="font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest">
                        {courierLabel}
                      </span>
                    </td>

                    {/* RESI */}
                    <td className="py-4 px-2 text-gray-400 text-[11px]">
                      {order.tracking_id || '--'}
                    </td>

                    {/* VALUE */}
                    <td className="py-4 px-2 text-right text-gray-700 font-medium">
                      {valueK}
                    </td>

                    {/* AGE */}
                    <td className="py-4 px-2 text-right text-gray-400">
                      {diffHours}h
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-gray-400 font-sans text-xs">No orders found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
