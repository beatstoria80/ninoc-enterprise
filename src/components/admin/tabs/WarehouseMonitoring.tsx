import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Package, Truck, CheckCircle, AlertTriangle, MapPin, Box, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface HubMonitoringProps {
  hubId: string;
  onBack: () => void;
}

export function WarehouseMonitoring({ hubId, onBack }: HubMonitoringProps) {
  const [hubData, setHubData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Get hub info
      const { data: hub } = await supabase.from('warehouses').select('*').eq('id', hubId).single();
      if (hub) setHubData(hub);

      // Get orders from this hub
      // In a real scenario we'd filter by supplier's assigned_hub_id, 
      // but for now let's just fetch recent orders to simulate the view
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          created_at,
          shipping_courier,
          shipping_service,
          biteship_waybill_id,
          shipping_cost,
          customer_name
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (orderData) {
        setOrders(orderData);
      }
      setLoading(false);
    }
    fetchData();
  }, [hubId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink/50">
        <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest font-medium">Loading Logistics Data...</p>
      </div>
    );
  }

  const pending = orders.filter(o => o.status === 'paid').length;
  const inTransit = orders.filter(o => o.status === 'shipped').length;
  const completed = orders.filter(o => o.status === 'delivered').length;
  const issues = orders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink/60 hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Hubs
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-display font-medium text-ink">{hubData?.name || 'Warehouse Hub'}</h2>
            {hubData?.is_primary && (
              <span className="px-2 py-0.5 bg-rose/10 text-rose text-[9px] uppercase tracking-wider font-bold rounded-full">
                Main Hub
              </span>
            )}
          </div>
          <p className="text-xs text-ink/60 flex items-center gap-1.5">
            <MapPin size={12} /> {hubData?.city}, {hubData?.province} (ZIP: {hubData?.postal_code})
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider font-bold text-ink/40 mb-1">Hub ID</p>
          <p className="text-xs font-mono bg-ink/5 px-2 py-1 rounded text-ink/70">{hubData?.code || hubId.slice(0,8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-xl border border-ink/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Package size={14} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Active Orders</span>
            </div>
            <span className="text-xl font-display font-medium text-ink">{pending}</span>
          </div>
          <span className="text-[9px] text-ink/50">Waiting to be processed</span>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-ink/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-blue-500">
              <Truck size={14} />
              <span className="text-[9px] uppercase tracking-wider font-bold">In-Transit</span>
            </div>
            <span className="text-xl font-display font-medium text-ink">{inTransit}</span>
          </div>
          <span className="text-[9px] text-ink/50">Shipping via Biteship</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-ink/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle size={14} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Completed</span>
            </div>
            <span className="text-xl font-display font-medium text-ink">{completed}</span>
          </div>
          <span className="text-[9px] text-ink/50">Successfully delivered</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-ink/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-rose">
              <AlertTriangle size={14} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Disputes / Retur</span>
            </div>
            <span className="text-xl font-display font-medium text-ink">{issues}</span>
          </div>
          <span className="text-[9px] text-ink/50">Requires attention</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xs uppercase tracking-widest font-bold text-ink">Live Outbound Logistics</h3>
          <button className="text-[10px] uppercase tracking-wider font-bold text-ink/50 hover:text-ink flex items-center gap-1">
            <Eye size={12} /> View All
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 font-medium">Order ID</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Courier</th>
                <th className="px-3 py-2 font-medium">AWB / Resi</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-xs text-ink/80">
              {orders.slice(0,10).map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 font-mono font-medium text-ink text-[11px]">#{o.id.slice(0,8)}</td>
                  <td className="px-3 py-2 text-ink/60 text-[10px] whitespace-nowrap">{format(new Date(o.created_at), 'dd MMM yy HH:mm')}</td>
                  <td className="px-3 py-2 font-medium text-[11px] truncate max-w-[120px]">{o.customer_name || 'Guest'}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink/5 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">
                      {o.shipping_courier || '-'} {o.shipping_service ? `(${o.shipping_service})` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] whitespace-nowrap">
                    {o.biteship_waybill_id ? o.biteship_waybill_id : <span className="text-ink/30 italic">Not generated</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
                      ${o.status === 'paid' ? 'bg-amber-100 text-amber-700' : 
                        o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-gray-100 text-gray-500'}
                    `}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {o.status === 'paid' ? (
                      <button className="bg-ink hover:bg-rose text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap">
                        Process Order
                      </button>
                    ) : (
                      <button className="bg-ink/5 hover:bg-ink text-ink hover:text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap">
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink/50 font-medium">
                    No outbound logistics data found for this hub.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
