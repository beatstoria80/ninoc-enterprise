import React from 'react';
import { FinanceSummary, Product, Order } from '../types';
import { StatusBadge } from '../StatusBadge';

// Lazy load the charts to prevent the freeze issue caused by Recharts + Framer Motion
const LazyCharts = React.lazy(() => import('./OverviewCharts'));

export function OverviewTab({
  finance,
  products,
  pendingOrders,
  orders,
  setActiveTab,
  openOrderDetail,
  salesChartData,
  profitChartData
}: {
  finance: FinanceSummary;
  products: Product[];
  pendingOrders: number;
  orders: Order[];
  setActiveTab: (tab: string) => void;
  openOrderDetail: (order: Order) => void;
  salesChartData: any[];
  profitChartData: any[];
}) {
  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Total Revenue</p>
          <p className="text-sm font-medium text-gray-900">IDR {finance.totalRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Today Revenue</p>
          <p className="text-sm font-medium text-gray-900">IDR {finance.todayRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Total Products</p>
          <p className="text-sm font-medium text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Pending Orders</p>
          <p className="text-sm font-medium text-gray-900">{pendingOrders}</p>
        </div>
      </div>

      {/* Restored Charts (Lazy Loaded) */}
      <React.Suspense fallback={<div className="h-[320px] bg-ink/[0.02] animate-pulse rounded-xl border border-gray-100" />}>
        <LazyCharts salesData={salesChartData} profitData={profitChartData} />
      </React.Suspense>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 uppercase tracking-wide">Recent Orders</h3>
          <button onClick={() => setActiveTab('orders')} className="text-[10px] uppercase tracking-wider text-rose hover:underline">View All</button>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openOrderDetail(order)}>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Order ID</p>
                  <p className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Customer</p>
                  <p className="text-sm text-gray-700">{order.shipping_address?.name || 'Guest'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Amount</p>
                  <p className="text-sm font-medium">IDR {order.total_price.toLocaleString('id-ID')}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
