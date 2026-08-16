import { redirect } from 'next/navigation';
import { Truck, Package, Clock, ChevronLeft, MapPin, CheckCircle2, User, FileText } from 'lucide-react';
import Link from 'next/link';
import PickupRequestModalClient from './PickupRequestModalClient';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { OrderStatus } from '@/domain/supplier/OrderStatus';
import { obfuscatePhone, obfuscateName } from '@/lib/logistics-utils';
import { format } from 'date-fns';

export const metadata = {
  title: 'Order Logistics - Supplier Hub | NINOC',
};

// --------------------------------------------------------------------------
// Status Stepper Configuration (Single Source of Truth)
// --------------------------------------------------------------------------
const TRACKING_STEPS = [
  { id: OrderStatus.PAID, label: 'Paid', icon: CheckCircle2 },
  { id: OrderStatus.PENDING_PACKING, label: 'Packing', icon: Package },
  { id: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Pickup', icon: Clock },
  { id: OrderStatus.ALLOCATED, label: 'Courier Allocated', icon: Truck },
  { id: OrderStatus.SHIPPED, label: 'Shipped', icon: CheckCircle2 },
] as const;

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  [OrderStatus.PAID]: 0,
  [OrderStatus.PENDING_PACKING]: 1,
  [OrderStatus.READY_FOR_PICKUP]: 2,
  [OrderStatus.ALLOCATED]: 3,
  [OrderStatus.SHIPPED]: 4,
  [OrderStatus.DELIVERED]: 4,
  [OrderStatus.COMPLETED]: 4,
};

function resolveStepIndex(status: string): number {
  return STATUS_TO_STEP_INDEX[status] ?? 0;
}

// --------------------------------------------------------------------------
// Page Component
// --------------------------------------------------------------------------
export default async function SupplierLogisticsOrderDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;

  // 1. Fetch Order via singleton Admin Client (avoids connection pool exhaustion)
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    return (
      <div className="p-12 text-center text-ink/60">
        Order not found or you don&apos;t have permission to view it.
      </div>
    );
  }

  // 2. Fetch Order Items specifically for this supplier
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('supplier_id', supplierUser.supplier_id);

  if (itemsError || !orderItems || orderItems.length === 0) {
    return (
      <div className="p-12 text-center text-ink/60">
        No items from your inventory found in this order.
      </div>
    );
  }

  // 3. Extract & obfuscate buyer data
  const shippingAddr = orderData.shipping_address as Record<string, any> | null;
  const buyerName = obfuscateName(orderData.customer_name || shippingAddr?.name || 'N/A');
  const buyerPhone = obfuscatePhone(orderData.customer_phone || shippingAddr?.phone || 'N/A');
  const buyerAddress = shippingAddr?.full_address || JSON.stringify(orderData.shipping_address);
  const orderDate = orderData.created_at ? format(new Date(orderData.created_at), 'dd MMM yyyy, HH:mm') : '-';

  // 4. Stepper state
  const currentStepIndex = resolveStepIndex(orderData.status);
  const progressWidth = `${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}%`;

  // 5. Status flags (using enum for type safety)
  const isPacking = orderData.status === OrderStatus.PAID || orderData.status === OrderStatus.PENDING_PACKING;
  const isWaitingPickup = orderData.status === OrderStatus.READY_FOR_PICKUP 
    || orderData.status === OrderStatus.ALLOCATED 
    || (orderData.status === OrderStatus.SHIPPED && !orderData.tracking_id);
  const hasTrackingLabel = (orderData.status === OrderStatus.READY_FOR_PICKUP || orderData.status === OrderStatus.SHIPPED) && orderData.tracking_id;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/supplier/logistics" className="p-2 -ml-2 text-ink/50 hover:text-ink hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-display font-medium text-ink flex items-center gap-2">
                Order <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-base">#{orderData.id.slice(0, 8).toUpperCase()}</span>
              </h1>
              {isPacking && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                   <Package size={12} />
                  To Pack
                </span>
              )}
              {isWaitingPickup && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                  <Clock size={12} />
                  Waiting Pickup
                </span>
              )}
            </div>
            <p className="text-sm text-ink/60 mt-1">Placed on {orderDate}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {isPacking && (
            <PickupRequestModalClient 
              orderId={orderData.id} 
              courierName={orderData.courier || 'Kurir'} 
              warehouseName={supplierUser.assignedWarehouse?.name || 'Your Main Warehouse (Configured Location)'} 
            />
          )}
          {hasTrackingLabel && (
            <button className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-ink text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <FileText size={16} />
              Print Label
            </button>
          )}
        </div>
      </div>

      {/* Biteship / Logistics Realtime Tracker */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full overflow-hidden">
        <h3 className="font-medium text-ink text-sm flex items-center gap-2 mb-6">
          <Truck size={16} className="text-ink/60" />
          Logistics Tracking Status
        </h3>
        
        <div className="relative px-4">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-100 -translate-y-1/2 z-0 hidden sm:block"></div>
          <div className="absolute top-4 left-8 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block" style={{ width: progressWidth }}></div>
          
          <div className="relative z-10 flex justify-between flex-wrap gap-4 sm:flex-nowrap sm:gap-0">
            {TRACKING_STEPS.map((s, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = s.icon;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-blue-500 border-blue-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-300'
                  } ${isCurrent ? 'ring-4 ring-blue-50' : ''}`}>
                    <Icon size={14} />
                  </div>
                  <span className={`text-xs font-medium text-center ${isCompleted ? 'text-ink' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                <Package size={16} className="text-ink/60" />
                Items to Pack
              </h3>
              <span className="text-xs text-ink/60">{orderItems.length} items total</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-y border-gray-100 text-xs uppercase tracking-wider text-ink/50 font-medium">
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Variant</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                            <Package className="text-gray-300" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-ink text-sm leading-tight max-w-[250px] md:max-w-sm truncate">
                              {item.product_name || (item.products as any)?.name}
                            </div>
                            <div className="text-xs text-ink/50 mt-0.5 font-mono">
                              ID: {item.product_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(item.size || item.color) ? (
                          <div className="text-xs font-medium text-ink/80 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 inline-block">
                            {[item.size, item.color].filter(Boolean).join(' - ')}
                          </div>
                        ) : (
                          <span className="text-xs text-ink/40">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex text-sm font-bold text-rose bg-rose/10 px-3 py-1 rounded-md border border-rose/20 min-w-[3rem] justify-center shadow-sm">
                          {item.quantity}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar - Logistics Info */}
        <div className="space-y-6">
          {/* Shipping Info */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                <Truck size={16} className="text-ink/60" />
                Logistics Detail
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-ink/50 uppercase tracking-wider block mb-1">Courier</span>
                <div className="text-sm font-medium text-ink">{orderData.courier || 'TBD'}</div>
              </div>
              
              {orderData.tracking_id && (
                <div>
                  <span className="text-xs text-ink/50 uppercase tracking-wider block mb-1">Tracking ID (Waybill)</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono font-medium text-ink bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {orderData.tracking_id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                <MapPin size={16} className="text-ink/60" />
                Destination
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <User size={16} className="text-ink/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-ink">{buyerName}</div>
                  <div className="text-xs text-ink/60 mt-0.5 font-mono">{buyerPhone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-ink/40 shrink-0 mt-0.5" />
                <div className="text-sm text-ink/80 leading-relaxed">
                  {buyerAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
