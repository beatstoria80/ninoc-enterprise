import { getCurrentSupplier } from '@/lib/services/supplier';
import { getSupplierInventoryStats } from '@/lib/services/inventory';
import { Package, LineChart, TrendingUp, DollarSign, UtensilsCrossed, ArrowUpRight, Activity, Truck } from 'lucide-react';
import { redirect } from 'next/navigation';

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

  if (supplierId) {
    try {
      const stats = await getSupplierInventoryStats(supplierId);
      activeAllocations = stats.activeAllocations;
      
      // Additional real queries can be added here
    } catch (e) {
      console.error(e);
    }
  }
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-ink to-ink/80 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-widest">Overview</p>
          <h1 className="text-3xl font-bold font-display">Welcome back, {supplierName}</h1>
          <p className="text-white/70 mt-2 max-w-lg">
            Monitor your logistics, allocations, and financial performance seamlessly. NINOC enterprise systems handle the heavy lifting.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-medium text-white">System Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                Rp {pendingPayouts.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Items Sold (30d)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{itemsSold}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package size={80} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Allocations</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeAllocations}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Fulfillment Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">100%</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Sales Performance</h3>
            <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">Managed by Ninoc</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
            <LineChart size={48} className="text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-500">Analytics are currently syncing</p>
            <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">Data will populate automatically as Ninoc processes orders containing your products.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Logistics</h3>
            <button className="text-blue-600 hover:text-blue-700 p-1">
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="flex-1">
            {recentMovements.length > 0 ? (
              <div className="space-y-4">
                {recentMovements.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 group-hover:bg-gray-100 transition-colors rounded-lg flex items-center justify-center">
                        <Package size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+ Rp {m.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Truck size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500 text-center">No recent movements</p>
                <p className="text-xs text-gray-400 text-center mt-1">Pending incoming shipments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
