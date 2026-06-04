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
  // ── Total Orders & Breakdown ──
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  // ── Most Sold Product (from order_items) ──
  const mostSoldProduct = useMemo(() => {
    const productSales: Record<string, { id: string; name: string; totalQty: number; totalRevenue: number }> = {};

    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            id: item.product_id,
            name: item.product_name || 'Unknown Product',
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productSales[item.product_id].totalQty += item.quantity;
        productSales[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });

    const sorted = Object.values(productSales).sort((a, b) => b.totalQty - a.totalQty);
    return sorted[0] || null;
  }, [orders]);

  // ── Top Products by Revenue (top 5) ──
  const topProductsByRevenue = useMemo(() => {
    const productSales: Record<string, { id: string; name: string; totalQty: number; totalRevenue: number }> = {};

    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            id: item.product_id,
            name: item.product_name || 'Unknown Product',
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productSales[item.product_id].totalQty += item.quantity;
        productSales[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [orders]);

  // ── Order Trend (last 7 days) ──
  const ordersLast7Days = useMemo(() => {
    const now = new Date();
    const days = [];
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
    <div className="space-y-4">
      {/* ── Summary Indicators Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Total Orders */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-sm bg-rose/10 flex items-center justify-center">
              <ShoppingBag size={14} className="text-rose" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-ink tracking-tight">{totalOrders}</p>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-ink/5">
            <span className="text-[8px] text-ink/40">
              <span className="font-bold text-amber-600">{pendingCount}</span> pending
            </span>
            <span className="text-[8px] text-ink/40">
              <span className="font-bold text-emerald-600">{shippedCount}</span> shipped
            </span>
            <span className="text-[8px] text-ink/40">
              <span className="font-bold text-teal-600">{deliveredCount}</span> done
            </span>
          </div>
        </div>

        {/* Total Views (placeholder — connect to analytics later) */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-sm bg-blue-50 flex items-center justify-center">
              <Eye size={14} className="text-blue-600" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-ink tracking-tight">—</p>
          <div className="mt-2 pt-2 border-t border-ink/5">
            <span className="text-[8px] text-ink/40">Hubungkan Vercel Analytics</span>
          </div>
        </div>

        {/* Order Conversion */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-sm bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">Conversion</span>
          </div>
          <p className="text-2xl font-bold text-ink tracking-tight">
            {totalOrders > 0 ? `${Math.round((paidCount + shippedCount + deliveredCount) / totalOrders * 100)}%` : '0%'}
          </p>
          <div className="mt-2 pt-2 border-t border-ink/5">
            <span className="text-[8px] text-ink/40">{paidCount + shippedCount + deliveredCount} dari {totalOrders} orders</span>
          </div>
        </div>

        {/* Most Sold Product */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-sm bg-amber-50 flex items-center justify-center">
              <Package size={14} className="text-amber-600" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">Best Seller</span>
          </div>
          <p className="text-[11px] font-bold text-ink truncate leading-tight">{mostSoldProduct?.name || '—'}</p>
          <div className="mt-2 pt-2 border-t border-ink/5 flex justify-between">
            <span className="text-[8px] text-ink/40">{mostSoldProduct?.totalQty || 0}x sold</span>
            <span className="text-[8px] font-bold text-rose">
              IDR {mostSoldProduct?.totalRevenue?.toLocaleString('id-ID') || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: 7-Day Trend + Top Products ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* 7-Day Order Trend */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink">7-Day Order Trend</h3>
            <span className="text-[8px] text-ink/40">Last 7 days</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {ordersLast7Days.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max((day.count / maxDaily) * 64, day.count > 0 ? 4 : 0)}px`,
                    backgroundColor: idx === ordersLast7Days.length - 1 ? '#E8527A' : '#141414',
                    opacity: idx === ordersLast7Days.length - 1 ? 1 : 0.2,
                  }}
                />
                <span className="text-[7px] text-ink/40">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Products by Revenue */}
        <div className="bg-white rounded-sm border border-ink/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink">Top Products</h3>
            <span className="text-[8px] text-ink/40">by revenue</span>
          </div>
          <div className="space-y-2">
            {topProductsByRevenue.length > 0 ? (
              topProductsByRevenue.slice(0, 5).map((product, idx) => {
                const maxRev = topProductsByRevenue[0]?.totalRevenue || 1;
                const pct = Math.round((product.totalRevenue / maxRev) * 100);
                return (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="text-[8px] font-bold text-ink/30 w-4 text-right">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-medium text-ink truncate">{product.name}</span>
                        <span className="text-[8px] font-bold text-rose shrink-0 ml-2">
                          IDR {product.totalRevenue.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-ink/40 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}