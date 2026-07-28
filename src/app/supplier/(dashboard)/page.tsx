import { createClient } from '@/utils/supabase/server';
import { Package, LineChart, TrendingUp, DollarSign } from 'lucide-react';

export default async function SupplierDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get the current supplier ID
  const { data: supplierUser } = await supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session) return { data: null };
    return await supabase
      .from('supplier_users')
      .select('supplier_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single();
  });

  const supplierId = supplierUser?.supplier_id;

  // Fetch actual data
  let pendingPayouts = 0;
  let itemsSold = 0;
  let activeAllocations = 0;
  let recentMovements: any[] = [];

  if (supplierId) {
    // Attempt to fetch real stats if tables are available
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, stock')
        .eq('supplier_id', supplierId);
      
      if (products) {
        activeAllocations = products.reduce((acc, p) => acc + (p.stock || 0), 0);
      }
      
      // In a real scenario, you'd fetch from supplier_ledgers or order_items
      // For now, we initialize to 0 to remove dummy data
    } catch (e) {
      console.error(e);
    }
  }
  
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
              <h3 className="text-2xl font-bold text-gray-900">
                Rp {pendingPayouts.toLocaleString('id-ID')}
              </h3>
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
              <h3 className="text-2xl font-bold text-gray-900">{itemsSold}</h3>
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
              <h3 className="text-2xl font-bold text-gray-900">{activeAllocations}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Performance (Managed by Ninoc)</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-400">Belum ada data penjualan</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Movement</h3>
          <div className="space-y-4">
            {recentMovements.length > 0 ? recentMovements.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-md"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">+ Rp {m.amount.toLocaleString('id-ID')}</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 py-4 text-center">Belum ada pergerakan stok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
