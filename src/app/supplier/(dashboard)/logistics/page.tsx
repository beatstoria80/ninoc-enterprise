import { redirect } from 'next/navigation';
import { Truck, Package, Clock, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { getCurrentSupplier } from '@/lib/services/supplier';

export const metadata = {
  title: 'Logistics & Packing - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsPage() {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  // Fetch orders that contain this supplier's products
  // We'll mock the data for UI design right now based on the plan
  const mockOrders = [
    {
      id: 'ORD-12345-ABC',
      status: 'pending_packing',
      buyer: 'John Doe',
      date: '2026-07-27',
      courier: 'JNE Reguler',
      items: 3,
    },
    {
      id: 'ORD-98765-XYZ',
      status: 'ready_for_pickup',
      buyer: 'Jane Smith',
      date: '2026-07-26',
      courier: 'Grab Instant',
      items: 1,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-ink">Logistics & Packing</h1>
          <p className="text-sm text-ink/60 mt-1">Manage packing and request courier pickups for your allocations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
            <input 
              type="text" 
              placeholder="Search order ID..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-rose text-rose">
          To Pack (1)
        </button>
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-ink/60 hover:text-ink">
          Ready for Pickup (1)
        </button>
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-ink/60 hover:text-ink">
          In Transit (0)
        </button>
        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-ink/60 hover:text-ink">
          Completed (0)
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Buyer</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Courier</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-medium text-ink/60 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-ink">{order.id}</div>
                  <div className="text-xs text-ink/50 mt-0.5">{order.items} items</div>
                </td>
                <td className="px-6 py-4 text-sm text-ink/70">{order.date}</td>
                <td className="px-6 py-4 text-sm text-ink/70">{order.buyer}</td>
                <td className="px-6 py-4 text-sm text-ink/70">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-ink/40" />
                    {order.courier}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {order.status === 'pending_packing' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                      <Package size={12} />
                      To Pack
                    </span>
                  )}
                  {order.status === 'ready_for_pickup' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                      <Clock size={12} />
                      Waiting Pickup
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/supplier/logistics/${order.id}`}
                    className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 text-ink/60 hover:text-ink transition-colors"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mockOrders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-ink/60 text-sm">No orders found in this status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
