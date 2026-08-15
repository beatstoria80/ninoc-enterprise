'use client';

import { useState } from 'react';
import { Truck, Package, Clock, ChevronRight, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import ExportCSVButton from '@/components/supplier/ExportCSVButton';
import PrintPackingSlipsModal from '@/components/supplier/logistics/PrintPackingSlipsModal';

type OrderStatus = 'action_required' | 'in_transit' | 'completed';

export default function LogisticsTableClient({ orders }: { orders: any[] }) {
  const [activeTab, setActiveTab] = useState<OrderStatus>('action_required');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const toPackOrders = orders.filter(o => o.status === 'paid' || o.status === 'pending_packing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup' || o.status === 'allocated' || (o.status === 'shipped' && !o.tracking_id));
  const inTransitOrders = orders.filter(o => o.status === 'shipped' && o.tracking_id);
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

  const actionRequiredOrders = [...toPackOrders, ...readyOrders];

  let displayOrders = activeTab === 'action_required' ? actionRequiredOrders 
                    : activeTab === 'in_transit' ? inTransitOrders 
                    : completedOrders;

  if (searchQuery.trim()) {
    displayOrders = displayOrders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.courier && o.courier.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Logistics & Packing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage packing, tracking, and courier pickups for your allocations.</p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton orders={orders} />
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-ink text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            Print Packing Slips
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <button 
              onClick={() => setActiveTab('action_required')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'action_required' ? 'bg-ink text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              Action Required ({actionRequiredOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('in_transit')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'in_transit' ? 'bg-ink text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              In Transit ({inTransitOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'completed' ? 'bg-ink text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              Completed ({completedOrders.length})
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search order ID, buyer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      {(order.status === 'shipped' && order.tracking_id) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Truck size={12} />
                          In Transit
                        </span>
                      )}
                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Clock size={12} />
                          Completed
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
                      <p className="text-gray-900 font-medium mb-1">No orders found</p>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Try adjusting your search query or check a different tab.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrintPackingSlipsModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        orders={orders} 
      />
    </div>
  );
}
