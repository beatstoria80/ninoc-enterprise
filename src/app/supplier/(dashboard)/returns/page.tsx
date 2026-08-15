import { redirect } from 'next/navigation';
import { PackageX, AlertTriangle, Video, Search, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { createClient } from '@/utils/supabase/server';
import { format } from 'date-fns';

export const metadata = {
  title: 'Returns & Cancellations - Supplier Hub | NINOC',
};

export default async function SupplierReturnsPage() {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  const supabase = await createClient();

  // 1. Fetch Return Requests
  const { data: returRequests, error: returError } = await supabase
    .from('retur_requests')
    .select(`
      id,
      created_at,
      status,
      reason_label,
      video_url,
      admin_notes,
      order:orders!inner(
        id,
        status,
        customer_name,
        order_items!inner(id, supplier_id, product_name, quantity, size, color)
      )
    `)
    .eq('order.order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  if (returError) {
    console.error('Error fetching returns:', returError);
  }

  // Deduplicate returns if multiple order_items match
  const uniqueReturnsMap = new Map();
  if (returRequests) {
    returRequests.forEach(req => {
      if (!uniqueReturnsMap.has(req.id)) {
        // Filter order items to only show the supplier's items
        const supplierItems = req.order.order_items.filter((item: any) => item.supplier_id === supplierUser.supplier_id);
        uniqueReturnsMap.set(req.id, {
          ...req,
          supplierItems
        });
      }
    });
  }
  const returns = Array.from(uniqueReturnsMap.values());

  // 2. Fetch Cancelled Orders (no return request)
  const { data: cancelledOrders, error: cancelError } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      customer_name,
      order_items!inner(id, supplier_id, product_name, quantity, size, color)
    `)
    .eq('status', 'cancelled')
    .eq('order_items.supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false });

  if (cancelError) {
    console.error('Error fetching cancelled orders:', cancelError);
  }

  // Deduplicate cancelled orders
  const uniqueCancelledMap = new Map();
  if (cancelledOrders) {
    cancelledOrders.forEach(order => {
      // Don't show in cancelled list if there's already a return request for it
      if (!returns.some(r => r.order.id === order.id)) {
        if (!uniqueCancelledMap.has(order.id)) {
          uniqueCancelledMap.set(order.id, {
            ...order,
            supplierItems: order.order_items
          });
        }
      }
    });
  }
  const cancellations = Array.from(uniqueCancelledMap.values());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Returns & Cancellations</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor product returns, refunds, and cancelled orders handled by NINOC Admin.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-full">
              Return Requests ({returns.length})
            </div>
          </div>
          <div className="text-xs text-ink/60 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md border border-amber-200/50 flex items-center gap-2">
            <AlertTriangle size={14} />
            View-Only Access. Return approvals are managed by Central Admin.
          </div>
        </div>

        <div className="p-6">
          {returns.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <PackageX size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No return requests</p>
              <p className="text-gray-500 text-sm">Your products have a perfect satisfaction rate!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map(ret => (
                <div key={ret.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-ink">Order #{ret.order.id}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          ret.status === 'approved' || ret.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          ret.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {ret.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink/60 mt-1">Requested on {format(new Date(ret.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    {ret.video_url && (
                      <a href={ret.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md h-fit">
                        <Video size={16} />
                        View Evidence
                      </a>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-ink/50 uppercase tracking-wider block">Reason for Return</span>
                        <p className="text-sm font-medium text-ink mt-0.5">{ret.reason_label || 'Defective Product'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink/50 uppercase tracking-wider block">Admin Notes</span>
                        <p className="text-sm text-ink/80 mt-0.5">{ret.admin_notes || 'Pending admin review'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-ink/50 uppercase tracking-wider block mb-2">Affected Items</span>
                      <div className="space-y-2">
                        {ret.supplierItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start text-sm">
                            <div>
                              <p className="font-medium text-ink">{item.product_name}</p>
                              {(item.size || item.color) && (
                                <p className="text-xs text-ink/60">Var: {[item.size, item.color].filter(Boolean).join(', ')}</p>
                              )}
                            </div>
                            <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-medium text-ink">Cancelled Orders ({cancellations.length})</h2>
        </div>
        <div className="p-6">
          {cancellations.length === 0 ? (
            <div className="py-8 text-center text-ink/50 text-sm">No cancelled orders found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cancellations.map(order => (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-ink">#{order.id}</p>
                      <p className="text-xs text-ink/60">{format(new Date(order.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Cancelled</span>
                  </div>
                  <div className="space-y-1">
                    {order.supplierItems.map((item: any) => (
                      <div key={item.id} className="text-sm flex justify-between text-ink/80">
                        <span className="truncate pr-2">{item.product_name}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
