import { supabase } from '@/lib/supabase';
import { Package, LineChart, TrendingUp, DollarSign } from 'lucide-react';

export default async function SupplierDashboard() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Dummy logic for prototype: we would fetch real stats here
  // based on the supplier's allocated items in the `products` table
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">Live updating...</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
              <h3 className="text-2xl font-bold text-gray-900">Rp 12.5M</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Items Sold (30d)</p>
              <h3 className="text-2xl font-bold text-gray-900">342</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Allocations</p>
              <h3 className="text-2xl font-bold text-gray-900">1,200</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Performance (Managed by Ninoc)</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-400">Chart rendering area</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Movement</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-md"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Black T-Shirt Elite</p>
                    <p className="text-xs text-gray-500">Shipped via Biteship</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">+ Rp 140.000</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
