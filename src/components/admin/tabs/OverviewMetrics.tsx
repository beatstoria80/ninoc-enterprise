import React, { useMemo } from 'react';
import { Eye, ShoppingBag, TrendingUp, Package } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  created_at: string;
  order_items?: { product_id: string; product_name?: string; quantity: number; price_at_purchase: number }[];
}

interface Product {
  id: string;
  name: string;
  image_url?: string | null;
}

interface OverviewMetricsProps {
  orders: Order[];
  products: Product[];
}

export function OverviewMetrics({ orders, products }: OverviewMetricsProps) {
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const mostSoldProduct = useMemo(() => {
    const productSales: Record<string, { id: string; name: string; totalQty: number; totalRevenue: number }> = {};
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { id: item.product_id, name: item.product_name || 'Unknown Product', totalQty: 0, totalRevenue: 0 };
        }
        productSales[item.product_id].totalQty += item.quantity;
        productSales[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });
    return Object.values(productSales).sort((a, b) => b.totalQty - a.totalQty)[0] || null;
  }, [orders]);

  const topProductsByRevenue = useMemo(() => {
    const productSales: Record<string, { id: string; name: string; totalQty: number; totalRevenue: number }> = {};
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { id: item.product_id, name: item.product_name || 'Unknown Product', totalQty: 0, totalRevenue: 0 };
        }
        productSales[item.product_id].totalQty += item.quantity;
        productSales[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });
    return Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [orders]);

  const ordersLast7Days = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = orders.filter(o => o.created_at?.startsWith(dateStr)).length;
      days.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' }), count });
    }
    return days;
  }, [orders]);

  const maxDaily = Math.max(...ordersLast7Days.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">

      {/* Total Orders */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-sm bg-rose/10 flex items-center justify-center">
            <ShoppingBag size={11} className="text-rose" />
          </div>
          <span className="text-[7px] uppercase tracking-widest text-ink/40 font-medium">Total Orders</span>
        </div>
        <p className="text-xl font-bold text-ink tracking-tight leading-none">{totalOrders}</p>
        <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-ink/5">
          <span className="text-[7px] text-ink/40"><span className="font-bold text-amber-600">{pendingCount}</span> wait</span>
          <span className="text-[7px] text-ink/40"><span className="font-bold text-blue-600">{shippedCount}</span> sent</span>
          <span className="text-[7px] text-ink/40"><span className="font-bold text-emerald-600">{deliveredCount}</span> done</span>
        </div>
      </div>

      {/* Total Views */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-sm bg-blue-50 flex items-center justify-center">
            <Eye size={11} className="text-blue-600" />
          </div>
          <span className="text-[7px] uppercase tracking-widest text-ink/40 font-medium">Total Views</span>
        </div>
        <p className="text-xl font-bold text-ink tracking-tight leading-none">—</p>
        <p className="text-[7px] text-ink/30 mt-1.5 pt-1.5 border-t border-ink/5">Hubungkan Analytics</p>
      </div>

      {/* Conversion Rate */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-sm bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={11} className="text-emerald-600" />
          </div>
          <span className="text-[7px] uppercase tracking-widest text-ink/40 font-medium">Conversion</span>
        </div>
        <p className="text-xl font-bold text-ink tracking-tight leading-none">
          {totalOrders > 0 ? `${Math.round((paidCount + shippedCount + deliveredCount) / totalOrders * 100)}%` : '0%'}
        </p>
        <p className="text-[7px] text-ink/30 mt-1.5 pt-1.5 border-t border-ink/5">
          {paidCount + shippedCount + deliveredCount}/{totalOrders} orders
        </p>
      </div>

      {/* Best Seller */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-sm bg-amber-50 flex items-center justify-center">
            <Package size={11} className="text-amber-600" />
          </div>
          <span className="text-[7px] uppercase tracking-widest text-ink/40 font-medium">Best Seller</span>
        </div>
        <p className="text-[10px] font-bold text-ink leading-tight truncate">{mostSoldProduct?.name || '—'}</p>
        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-ink/5">
          <span className="text-[7px] text-ink/40">{mostSoldProduct?.totalQty || 0}x sold</span>
          <span className="text-[7px] font-bold text-rose">IDR {mostSoldProduct?.totalRevenue?.toLocaleString('id-ID') || 0}</span>
        </div>
      </div>

    </div>
  );
}

// ── Compact Trend + Top Products Row ──────────────────────────────────
export function OverviewAnalytics({ orders }: { orders: Order[] }) {
  const ordersLast7Days = useMemo(() => {
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = orders.filter(o => o.created_at?.startsWith(dateStr)).length;
      days.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' }), count });
    }
    return days;
  }, [orders]);

  const maxDaily = Math.max(...ordersLast7Days.map(d => d.count), 1);

  const topProductsByRevenue = useMemo(() => {
    const productSales: Record<string, { id: string; name: string; totalRevenue: number }> = {};
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { id: item.product_id, name: item.product_name || 'Unknown Product', totalRevenue: 0 };
        }
        productSales[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });
    return Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [orders]);

  return (
    <div className="grid grid-cols-2 gap-2">

      {/* 7-Day Order Trend */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[8px] font-bold uppercase tracking-widest text-ink">7-Day Trend</h3>
          <span className="text-[7px] text-ink/30">Last 7 days</span>
        </div>
        <div className="flex items-end gap-1 h-10">
          {ordersLast7Days.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                style={{
                  height: `${Math.max((day.count / maxDaily) * 40, day.count > 0 ? 3 : 0)}px`,
                  width: '100%',
                  borderRadius: '2px 2px 0 0',
                  backgroundColor: idx === ordersLast7Days.length - 1 ? '#E8527A' : '#141414',
                  opacity: idx === ordersLast7Days.length - 1 ? 1 : 0.25,
                }}
              />
              <span className="text-[6px] text-ink/30">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Products by Revenue */}
      <div className="bg-white rounded-sm border border-ink/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[8px] font-bold uppercase tracking-widest text-ink">Top Products</h3>
          <span className="text-[7px] text-ink/30">by revenue</span>
        </div>
        <div className="space-y-1.5">
          {topProductsByRevenue.length > 0 ? topProductsByRevenue.slice(0, 4).map((product, idx) => {
            const maxRev = topProductsByRevenue[0]?.totalRevenue || 1;
            const pct = Math.round((product.totalRevenue / maxRev) * 100);
            return (
              <div key={product.id} className="flex items-center gap-1.5">
                <span className="text-[7px] font-bold text-ink/30 w-3 text-right">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-ink truncate">{product.name}</span>
                    <span className="text-[7px] font-bold text-rose ml-1 shrink-0">IDR {product.totalRevenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-0.5 bg-ink/5 rounded-full mt-0.5">
                    <div className="h-full bg-rose rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          }) : (
            <p className="text-[8px] text-ink/30 text-center py-2">No sales data yet</p>
          )}
        </div>
      </div>

    </div>
  );
}
