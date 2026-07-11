import React, { useMemo } from 'react';
import { Eye, ShoppingCart, TrendingUp, Package, BarChart2, TrendingDown } from 'lucide-react';

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

// ── Card wrapper ────────────────────────────────────────────────────────
function MetricCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  subColor,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number | React.ReactNode;
  sub?: string;
  subColor?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-1.5 flex items-start gap-3">
      <div className={`w-8 h-8 rounded-sm ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink/90 font-medium leading-none mb-1.5">{label}</p>
        <p className="text-lg font-semibold text-ink leading-tight tracking-tight">{value}</p>
        {sub && (
          <p className={`text-[11px] mt-1 leading-none ${subColor || 'text-ink/90'}`}>{sub}</p>
        )}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

// ── Mini Bar (for sparklines) ─────────────────────────────────────────
function MiniBar({ value, max, active }: { value: number; max: number; active?: boolean }) {
  return (
    <div
      className="rounded-[2px] transition-all"
      style={{
        height: `${Math.max((value / max) * 28, value > 0 ? 4 : 0)}px`,
        width: '100%',
        backgroundColor: active ? '#E8527A' : '#141414',
        opacity: active ? 1 : 0.18,
      }}
    />
  );
}

// ── Overview Metrics: KPI + Order Stats ───────────────────────────────
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
  const conversionRate = totalOrders > 0
    ? Math.round((paidCount + shippedCount + deliveredCount) / totalOrders * 100)
    : 0;

  const mostSoldProduct = useMemo(() => {
    const map: Record<string, { id: string; name: string; totalQty: number; totalRevenue: number }> = {};
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!map[item.product_id]) {
          map[item.product_id] = { id: item.product_id, name: item.product_name || 'Unknown Product', totalQty: 0, totalRevenue: 0 };
        }
        map[item.product_id].totalQty += item.quantity;
        map[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty)[0] || null;
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

  const topProductsByRevenue = useMemo(() => {
    const map: Record<string, { id: string; name: string; totalRevenue: number }> = {};
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!map[item.product_id]) {
          map[item.product_id] = { id: item.product_id, name: item.product_name || 'Unknown Product', totalRevenue: 0 };
        }
        map[item.product_id].totalRevenue += item.price_at_purchase * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-2">

      {/* Row 1: Core KPIs + Orders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">

        {/* Total Orders */}
        <MetricCard
          icon={<ShoppingCart size={14} className="text-rose" />}
          iconBg="bg-rose/10"
          iconColor="text-rose"
          label="Total Orders"
          value={totalOrders}
          sub={`${pendingCount} wait · ${shippedCount} sent · ${deliveredCount} done`}
          subColor="text-ink/80"
        />

        {/* Views */}
        <MetricCard
          icon={<Eye size={14} className="text-blue-500" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          label="Total Views"
          value="—"
          sub="Hubungkan Vercel Analytics"
          subColor="text-ink/25"
        />

        {/* Conversion */}
        <MetricCard
          icon={<TrendingUp size={14} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Conversion"
          value={`${conversionRate}%`}
          sub={`${paidCount + shippedCount + deliveredCount} dari ${totalOrders} orders`}
          subColor="text-ink/80"
        />

        {/* Best Seller */}
        <MetricCard
          icon={<Package size={14} className="text-amber-600" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Best Seller"
          value={
            <span className="text-sm font-semibold text-ink leading-tight tracking-tight truncate block max-w-[140px]">
              {mostSoldProduct?.name || '—'}
            </span>
          }
          sub={
            mostSoldProduct
              ? `${mostSoldProduct.totalQty}x sold · IDR ${mostSoldProduct.totalRevenue.toLocaleString('id-ID')}`
              : 'Tidak ada data'
          }
          subColor={mostSoldProduct ? 'text-ink/80' : 'text-ink/25'}
        />
      </div>

      {/* Row 2: 7-Day Trend + Top Products */}
      <div className="grid grid-cols-2 gap-2">

        {/* 7-Day Order Trend */}
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-1.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">7-Day Order Trend</h3>
            <span className="text-[11px] text-ink/90">Last 7 days</span>
          </div>
          <div className="flex items-end gap-[5px] h-7">
            {ordersLast7Days.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-[3px]">
                <MiniBar value={day.count} max={maxDaily} active={idx === ordersLast7Days.length - 1} />
                <span className="text-[11px] text-ink/90 leading-none">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Products by Revenue */}
        <div className="bg-white rounded-sm border border-ink/10 px-3.5 py-1.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">Top Products</h3>
            <span className="text-[11px] text-ink/90">by revenue</span>
          </div>
          <div className="space-y-[5px]">
            {topProductsByRevenue.length > 0 ? topProductsByRevenue.slice(0, 4).map((product, idx) => {
              const maxRev = topProductsByRevenue[0]?.totalRevenue || 1;
              const pct = Math.round((product.totalRevenue / maxRev) * 100);
              return (
                <div key={product.id} className="flex items-center gap-2">
                  <span className="text-xs md:text-xs font-medium text-ink/25 w-3 text-right leading-none">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-ink line-clamp-2 leading-none">{product.name}</span>
                      <span className="text-[11px] font-semibold text-rose shrink-0 leading-none">
                        {product.totalRevenue >= 1000
                          ? `IDR ${(product.totalRevenue / 1000).toFixed(0)}K`
                          : `IDR ${product.totalRevenue.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="h-[2px] bg-ink/5 rounded-full mt-[3px]">
                      <div className="h-full bg-rose rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-8">
                <p className="text-[11px] text-ink/25">Belum ada data penjualan</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
