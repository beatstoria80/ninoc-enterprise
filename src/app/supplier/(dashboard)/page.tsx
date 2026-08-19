import { getCurrentSupplier } from '@/lib/services/supplier';
import { getSupplierInventoryStats, getSupplierDashboardMetrics } from '@/lib/services/inventory';
import { Package, LineChart, TrendingUp, DollarSign, UtensilsCrossed, ArrowUpRight, Activity, Truck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { SupplierSalesChart } from '@/components/supplier/SupplierSalesChart';

export default async function SupplierDashboard() {
  const supplierContext = await getCurrentSupplier();

  if (!supplierContext) {
    redirect('/login');
  }

  const supplierId = supplierContext.supplier_id;
  const supplierName = supplierContext.suppliers?.name || 'Partner';
  const pillar = supplierContext.pillar || 'FASHION';

  // Fetch actual data
  let pendingPayouts = 0;
  let itemsSold = 0;
  let activeAllocations = 0;
  let recentMovements: any[] = [];
  let validItems: any[] = [];

  if (supplierId) {
    try {
      const stats = await getSupplierInventoryStats(supplierId);
      activeAllocations = stats.activeAllocations;
      
      const metrics = await getSupplierDashboardMetrics(supplierId);
      itemsSold = metrics.itemsSold;
      pendingPayouts = metrics.pendingPayouts;
      recentMovements = metrics.recentMovements;
      validItems = metrics.validItems;
    } catch (e) {
      console.error(e);
    }
  }
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6 mb-6 mt-2">
        <div>
          <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">Overview</p>
          <h1 className="text-2xl font-bold font-display text-gray-900">Welcome back, {supplierName}</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Monitor your logistics, allocations, and financial performance seamlessly. NINOC enterprise systems handle the heavy lifting.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">System Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-y border-gray-200 bg-white mb-6">
        <div className="py-6 px-4 md:px-6 hover:bg-gray-50/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <DollarSign size={14} /> Pending Payouts
            </div>
            <h3 className="text-2xl font-medium text-gray-900">
              Rp {pendingPayouts.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        <div className="py-6 px-4 md:px-6 hover:bg-gray-50/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <TrendingUp size={14} /> Items Sold (30d)
            </div>
            <h3 className="text-2xl font-medium text-gray-900">{itemsSold}</h3>
          </div>
        </div>

        <div className="py-6 px-4 md:px-6 hover:bg-gray-50/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package size={80} />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <Package size={14} /> Active Allocations
            </div>
            <h3 className="text-2xl font-medium text-gray-900">{activeAllocations}</h3>
          </div>
        </div>
        
        <div className="py-6 px-4 md:px-6 hover:bg-gray-50/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <Activity size={14} /> Fulfillment Rate
            </div>
            <h3 className="text-2xl font-medium text-gray-900">100%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Sales Performance</h3>
            <span className="text-[9px] uppercase tracking-widest font-medium px-2 py-1 bg-gray-100 text-gray-600">Managed by Ninoc</span>
          </div>
          <div className="flex-1 flex flex-col min-h-[300px]">
            <SupplierSalesChart data={validItems || []} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Recent Logistics</h3>
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex-1">
            {recentMovements.length > 0 ? (
              <div className="space-y-0 divide-y divide-gray-100">
                {recentMovements.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 group-hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-100">
                        <Package size={12} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">{m.name}</p>
                        <p className="text-[10px] text-gray-500">{m.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-900">+ Rp{m.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                  <Truck size={16} className="text-gray-300" />
                </div>
                <p className="text-xs font-medium text-gray-500 text-center">No recent movements</p>
                <p className="text-[10px] text-gray-400 text-center mt-1">Pending incoming shipments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
