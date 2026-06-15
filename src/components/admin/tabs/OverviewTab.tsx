import React from 'react';
import { FinanceSummary, Product, Order } from '../types';
import { StatusBadge } from '../StatusBadge';
import { OverviewMetrics } from './OverviewMetrics';

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-3 flex flex-col justify-center">
          <p className="text-xs md:text-[9px] uppercase tracking-[0.12em] text-ink/50 font-medium mb-1.5">Total Revenue</p>
          <p className="text-[15px] font-semibold text-ink tracking-tight leading-tight">
            {finance.totalRevenue > 0
              ? `IDR ${(finance.totalRevenue / 1000000).toFixed(1)}M`
              : 'IDR 0'}
          </p>
          <p className="text-[11px] md:text-[8px] text-ink/30 mt-1 leading-none">All time earnings</p>
        </div>
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-3 flex flex-col justify-center">
          <p className="text-xs md:text-[9px] uppercase tracking-[0.12em] text-ink/50 font-medium mb-1.5">Today Revenue</p>
          <p className="text-[15px] font-semibold text-ink tracking-tight leading-tight">
            {finance.todayRevenue > 0
              ? `IDR ${(finance.todayRevenue / 1000).toFixed(0)}K`
              : 'IDR 0'}
          </p>
          <p className="text-[11px] md:text-[8px] text-ink/30 mt-1 leading-none">Today&apos;s sales</p>
        </div>
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-3 flex flex-col justify-center">
          <p className="text-xs md:text-[9px] uppercase tracking-[0.12em] text-ink/50 font-medium mb-1.5">Total Products</p>
          <p className="text-[15px] font-semibold text-ink tracking-tight leading-tight">{products.length}</p>
          <p className="text-[11px] md:text-[8px] text-ink/30 mt-1 leading-none">Garment catalog</p>
        </div>
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-3 flex flex-col justify-center">
          <p className="text-xs md:text-[9px] uppercase tracking-[0.12em] text-ink/50 font-medium mb-1.5">Pending Orders</p>
          <p className="text-[15px] font-semibold text-ink tracking-tight leading-tight">{pendingOrders}</p>
          <p className="text-[11px] md:text-[8px] text-ink/30 mt-1 leading-none">Awaiting payment</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {(() => {
        const lowStockItems = products.flatMap(p => 
          (p.variants || []).filter(v => v.stock_quantity <= (v.reorder_point || 5))
            .map(v => ({ productName: p.name, size: v.size, qty: v.stock_quantity, sku: v.sku }))
        );
        if (lowStockItems.length === 0) return null;
        
        return (
          <div className="bg-rose/5 border border-rose/20 rounded-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-rose">⚠️</span>
              <h3 className="text-xs font-bold text-rose uppercase tracking-widest">Low Stock Alert ({lowStockItems.length} items)</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.slice(0, 5).map((item, idx) => (
                <span key={idx} className="bg-white/50 border border-rose/10 px-2 py-1 text-[10px] text-rose font-medium rounded-sm">
                  {item.productName} ({item.size}) - <span className="font-bold">Sisa {item.qty}</span>
                </span>
              ))}
              {lowStockItems.length > 5 && (
                <span className="bg-white/50 border border-rose/10 px-2 py-1 text-[10px] text-rose font-medium rounded-sm">
                  +{lowStockItems.length - 5} lainnya
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Charts */}
      <React.Suspense fallback={<div className="h-[260px] bg-ink/[0.02] animate-pulse rounded-sm border border-ink/10" />}>
        <LazyCharts salesData={salesChartData} profitData={profitChartData} />
      </React.Suspense>

      {/* Real-time Indicators + Analytics */}
      <OverviewMetrics orders={orders} products={products} />

      {/* Recent Orders */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-sm border border-ink/10 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.015]">
          <h3 className="text-xs md:text-[9px] font-semibold text-ink uppercase tracking-[0.1em]">Recent Orders</h3>
          <button onClick={() => setActiveTab('orders')} className="text-[11px] md:text-[8px] font-medium text-rose uppercase tracking-wider hover:text-rose/70 transition-colors">View All</button>
        </div>
        <div className="flex-1 overflow-y-auto minimal-scroll divide-y divide-ink/5">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-ink/[0.015] cursor-pointer transition-colors"
              onClick={() => openOrderDetail(order)}
            >
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] md:text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Order ID</p>
                  <p className="text-xs md:text-[10px] font-semibold text-ink font-mono tracking-wide">#{order.id.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Customer</p>
                  <p className="text-xs md:text-[10px] font-medium text-ink leading-none">{order.shipping_address?.name || 'Guest'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] md:text-[7px] uppercase tracking-widest text-ink/40 mb-0.5">Amount</p>
                  <p className="text-xs md:text-[10px] font-semibold text-ink whitespace-nowrap leading-none">
                    {order.total_price >= 1000
                      ? `IDR ${(order.total_price / 1000).toFixed(0)}K`
                      : `IDR ${order.total_price.toLocaleString('id-ID')}`}
                  </p>
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