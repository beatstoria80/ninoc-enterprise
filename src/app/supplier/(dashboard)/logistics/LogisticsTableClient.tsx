'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ACTION_REQUIRED_STATUSES, WAITING_PICKUP_STATUSES, COMPLETED_STATUSES, OrderStatus } from '@/domain/supplier/OrderStatus';
import { normalizeCourierLabel, formatValueK, formatOrderAge } from '@/lib/logistics-utils';
import { Scan } from 'lucide-react';

type TabStatus = 'all' | 'pending' | 'transit' | 'done';

// --------------------------------------------------------------------------
// Status Badge Renderer (extracted to avoid inline conditional soup)
// --------------------------------------------------------------------------
function StatusBadge({ order }: { order: any }) {
  const status = order.status as string;
  const dateLabel = order.created_at
    ? format(new Date(order.created_at), 'dd MMM yyyy').toUpperCase()
    : '-';

  if (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">DELIVERED</span>
        <span className="text-gray-400 text-[9px] tracking-widest">{dateLabel}</span>
      </div>
    );
  }

  if (status === OrderStatus.CANCELLED) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">CANCELLED</span>
        <span className="text-gray-400 text-[9px] tracking-widest">{dateLabel}</span>
      </div>
    );
  }

  if (status === OrderStatus.SHIPPED && order.tracking_id) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SHIPPED</span>
        <span className="text-gray-400 text-[9px] tracking-widest">{dateLabel}</span>
      </div>
    );
  }

  if (status === OrderStatus.READY_FOR_PICKUP || status === OrderStatus.ALLOCATED) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SIAP KIRIM</span>
        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">WAITING PICKUP</span>
      </div>
    );
  }

  // Default: paid / pending_packing
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">SIAP KIRIM</span>
      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest">KIRIM LUSA</span>
    </div>
  );
}

// --------------------------------------------------------------------------
// Tab Configuration (Single Source of Truth)
// --------------------------------------------------------------------------
const TABS: { id: TabStatus; label: string }[] = [
  { id: 'all', label: 'ALL ACTIVE' },
  { id: 'pending', label: 'PENDING' },
  { id: 'transit', label: 'TRANSIT' },
  { id: 'done', label: 'DONE' },
];

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------
export default function LogisticsTableClient({ 
  orders,
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

  // Memoized status groupings (avoids re-filtering on every render)
  const { readyOrders, transitOrders, deliveredOrders, cancelledOrders } = useMemo(() => {
    const ready = orders.filter(o => 
      ACTION_REQUIRED_STATUSES.includes(o.status as OrderStatus) || 
      WAITING_PICKUP_STATUSES.includes(o.status as OrderStatus) ||
      (o.status === OrderStatus.SHIPPED && !o.tracking_id)
    );
    const transit = orders.filter(o => o.status === OrderStatus.SHIPPED && o.tracking_id);
    const delivered = orders.filter(o => COMPLETED_STATUSES.includes(o.status as OrderStatus));
    const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED);
    return { readyOrders: ready, transitOrders: transit, deliveredOrders: delivered, cancelledOrders: cancelled };
  }, [orders]);

  // Memoized filtered display orders
  const displayOrders = useMemo(() => {
    let filtered = activeTab === 'all' ? orders
                 : activeTab === 'pending' ? readyOrders 
                 : activeTab === 'transit' ? transitOrders 
                 : deliveredOrders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) || 
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.courier && o.courier.toLowerCase().includes(q)) ||
        (o.tracking_id && o.tracking_id.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [orders, readyOrders, transitOrders, deliveredOrders, activeTab, searchQuery]);

  // Cache current timestamp once per render (not per row)
  const todayFormatted = format(new Date(), 'EEE, dd MMM yyyy');

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
            {todayFormatted} &bull; {orders.length} active
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
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.label}
          </button>
        ))}
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
              displayOrders.map(order => (
                <tr 
                  key={order.id} 
                  onClick={() => router.push(`/supplier/logistics/${order.id}`)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-2 text-gray-500 font-mono tracking-tighter text-[10px]">
                    #{order.id.toUpperCase()}
                  </td>
                  
                  <td className="py-4 px-2">
                    <StatusBadge order={order} />
                  </td>

                  <td className="py-4 px-2 text-gray-400 font-sans text-xs capitalize truncate max-w-[150px]">
                    {(order.shipping_address as any)?.city || '-'}
                  </td>

                  <td className="py-4 px-2">
                    <span className="font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest">
                      {normalizeCourierLabel(order.courier)}
                    </span>
                  </td>

                  <td className="py-4 px-2 text-gray-400 text-[11px]">
                    {order.tracking_id || '--'}
                  </td>

                  <td className="py-4 px-2 text-right text-gray-700 font-medium">
                    {formatValueK(order.total_price)}
                  </td>

                  <td className="py-4 px-2 text-right text-gray-400">
                    {formatOrderAge(order.created_at)}
                  </td>
                </tr>
              ))
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
