import React from 'react';
import { FinanceSummary, Product, Order } from '../types';
import { StatusBadge } from '../StatusBadge';
import { OverviewMetrics, OverviewAnalytics } from './OverviewMetrics';

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
    <div className="flex flex-col h-full pb-4 space-y-3">

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-sm p-3 border border-ink/10 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-widest text-ink/40 mb-1">Total Revenue</p>
          <p className="text-base font-medium text-ink tracking-tight">IDR {finance.totalRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-sm p-3 border border-ink/10 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-widest text-ink/40 mb-1">Today Revenue</p>
          <p className="text-base font-medium text-ink tracking-tight">IDR {finance.todayRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-sm p-3 border border-ink/10 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-widest text-ink/40 mb-1">Total Products</p>
          <p className="text-base font-medium text-ink tracking-tight">{products.length}</p>
        </div>
        <div className="bg-white rounded-sm p-3 border border-ink/10 flex flex-col justify-center">
          <p className="text-[8px] uppercase tracking-widest text-ink/40 mb-1">Pending Orders</p>
          <p className="text-base font-medium text-ink tracking-tight">{pendingOrders}</p>
        </div>
      </div>

      {/* Charts */}
      <React.Suspense fallback={<div className="h-[280px] bg-ink/[0.02] animate-pulse rounded-sm border border-ink/10" />}>
        <LazyCharts salesData={salesChartData} profitData={profitChartData} />
      </React.Suspense>

      {/* Real-time Indicators */}
      <OverviewMetrics orders={orders} products={products} />

      {/* 7-Day Trend + Top Products */}
      <OverviewAnalytics orders={orders} />

      {/* Recent Orders */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-sm border border-ink/10 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.02]">
          <h3 className="text-[9px] font-medium text-ink uppercase tracking-widest">Recent Orders</h3>
          <button onClick={() => setActiveTab('orders')} className="text-[8px] font-medium uppercase tracking-wider text-rose hover:text-rose/80">View All</button>
        </div>
        <div className="flex-1 overflow-y-auto minimal-scroll divide-y divide-ink/5">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-ink/[0.02] cursor-pointer transition-colors" onClick={() => openOrderDetail(order)}>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Order ID</p>
                  <p className="text-[10px] font-medium text-ink font-mono tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Customer</p>
                  <p className="text-[10px] font-medium text-ink">{order.shipping_address?.name || 'Guest'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Amount</p>
                  <p className="text-[10px] font-medium text-ink whitespace-nowrap">IDR {order.total_price.toLocaleString('id-ID')}</p>
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
