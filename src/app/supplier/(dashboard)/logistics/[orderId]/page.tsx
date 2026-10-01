import { redirect } from 'next/navigation';
import { Truck, Package, Clock, ChevronLeft, MapPin, User, FileText, Calendar, Hash, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import PickupRequestModalClient from './PickupRequestModalClient';
import PrintWaybillButton from './PrintWaybillButton';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { OrderStatus } from '@/domain/supplier/OrderStatus';
import { obfuscatePhone, formatOrderAge } from '@/lib/logistics-utils';
import { format } from 'date-fns';

export const metadata = {
  title: 'Order Command - Supplier Hub | NINOC',
};

// --------------------------------------------------------------------------
// Status Configuration
// --------------------------------------------------------------------------
const TRACKING_STEPS = [
  { id: OrderStatus.PAID, label: 'PAID' },
  { id: OrderStatus.PENDING_PACKING, label: 'PACKING' },
  { id: OrderStatus.READY_FOR_PICKUP, label: 'READY' },
  { id: OrderStatus.ALLOCATED, label: 'ALLOCATED' },
  { id: OrderStatus.SHIPPED, label: 'SHIPPED' },
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

  // 1. Fetch Order via singleton Admin Client
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        ORDER NOT FOUND OR ACCESS DENIED.
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
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        NO ITEMS FOUND FOR YOUR INVENTORY.
      </div>
    );
  }

  // 3. Extract buyer data (NO NAME OBFUSCATION, ONLY PHONE)
  const shippingAddr = orderData.shipping_address as Record<string, any> | null;
  const buyerName = orderData.customer_name || shippingAddr?.name || 'Pelanggan';
  
  const rawPhone = orderData.customer_phone || shippingAddr?.phone || '';
  const buyerPhone = rawPhone && rawPhone !== 'UNKNOWN' ? obfuscatePhone(rawPhone) : '-';
  
  let buyerAddress = '-';
  if (shippingAddr?.full_address) {
    buyerAddress = shippingAddr.full_address;
  } else if (shippingAddr?.address) {
    buyerAddress = shippingAddr.address;
  } else if (shippingAddr && Object.keys(shippingAddr).length > 0) {
    // If it's a non-empty object but lacks full_address/address
    buyerAddress = JSON.stringify(shippingAddr);
  }
  
  const orderDate = orderData.created_at ? format(new Date(orderData.created_at), 'dd MMM yyyy, HH:mm:ss') : '-';
  const orderAgeStr = formatOrderAge(orderData.created_at);

  // 4. Stepper state
  const currentStepIndex = resolveStepIndex(orderData.status);

  // 5. Status flags
  const isPacking = orderData.status === OrderStatus.PAID || orderData.status === OrderStatus.PENDING_PACKING;
  const isWaitingPickup = orderData.status === OrderStatus.READY_FOR_PICKUP 
    || orderData.status === OrderStatus.ALLOCATED 
    || (orderData.status === OrderStatus.SHIPPED && !orderData.tracking_id);
  const hasTrackingLabel = (orderData.status === OrderStatus.READY_FOR_PICKUP || orderData.status === OrderStatus.SHIPPED || orderData.status === OrderStatus.ALLOCATED) && orderData.tracking_id;

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans p-4">
      {/* COMMAND CENTER HEADER */}
      <div className="bg-white border border-gray-300 shadow-sm mb-4 flex flex-col md:flex-row justify-between items-stretch text-xs">
        
        {/* Left: Identity */}
        <div className="flex flex-1">
          <Link href="/supplier/logistics" className="p-4 border-r border-gray-200 text-gray-400 hover:text-black hover:bg-gray-50 transition-colors flex items-center justify-center">
            <ChevronLeft size={16} />
          </Link>
          <div className="p-3 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-400 tracking-widest text-[10px]">ORDER ID</span>
              <span className="font-mono font-bold text-black text-sm uppercase">#{orderData.id.slice(0, 8)}</span>
              {isPacking && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest ml-2">TO PACK</span>}
              {isWaitingPickup && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest ml-2">WAITING PICKUP</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1"><Calendar size={10} /> {orderDate}</span>
              <span className="flex items-center gap-1 text-rose-500 font-bold"><Clock size={10} /> AGE: {orderAgeStr}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50/50">
          {isPacking && (
            <div className="border-r border-gray-200 p-2 flex items-center">
              <PickupRequestModalClient 
                orderId={orderData.id} 
                courierName={orderData.courier || 'Kurir'} 
                warehouseName={supplierUser.assignedWarehouse?.name || 'Main Warehouse'} 
              />
            </div>
          )}
          {hasTrackingLabel && (
            <div className="p-2 flex items-center">
              <PrintWaybillButton disabled={orderData.status === OrderStatus.CANCELLED} />
            </div>
          )}
        </div>
      </div>

      {/* DENSE GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: ITEMS & TIMELINE (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Timeline Bar (Ultra Compact) */}
          <div className="bg-white border border-gray-300 p-2 flex items-center shadow-sm">
            <span className="text-[9px] font-bold tracking-widest text-gray-400 w-16 uppercase shrink-0">STATUS</span>
            <div className="flex-1 relative pt-2 pb-5 px-4">
              {/* Connecting Line */}
              <div className="absolute left-6 right-6 top-3 h-px bg-gray-200 z-0"></div>
              {/* Active Progress Line */}
              <div className="absolute left-6 top-3 h-px bg-blue-500 z-0 transition-all" style={{ width: `calc(${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}% - 12px)` }}></div>
              
              <div className="flex justify-between relative z-10">
                {TRACKING_STEPS.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-[2px] bg-white ring-4 ring-white ${idx <= currentStepIndex ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}></div>
                    <span className={`absolute top-4 text-[8px] font-bold tracking-widest uppercase whitespace-nowrap ${idx <= currentStepIndex ? 'text-black' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table (Data-Dense) */}
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="border-b border-gray-300 p-2 bg-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase flex items-center gap-1.5">
                <Package size={12} /> ORDER ITEMS ({orderItems.length})
              </span>
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[9px] text-gray-400 tracking-widest uppercase border-b border-gray-200 bg-gray-50/50">
                <tr>
                  <th className="py-1.5 px-3 font-medium">SKU / ID</th>
                  <th className="py-1.5 px-3 font-medium">PRODUCT</th>
                  <th className="py-1.5 px-3 font-medium">VARIANT</th>
                  <th className="py-1.5 px-3 font-medium text-center">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderItems.map((item) => (
                  <tr key={item.id} className="hover:bg-yellow-50/50 transition-colors">
                    <td className="py-2 px-3 text-[10px] text-gray-400">{item.product_id.split('-')[0].toUpperCase()}</td>
                    <td className="py-2 px-3 text-black font-sans font-medium text-xs leading-tight">
                      {item.product_name || (item.products as any)?.name}
                    </td>
                    <td className="py-2 px-3">
                      {(item.size || item.color) ? (
                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 border border-gray-200 text-[10px] font-bold tracking-widest uppercase">
                          {[item.size, item.color].filter(Boolean).join(' - ')}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="bg-black text-white px-2 py-0.5 text-xs font-bold rounded-sm inline-block min-w-[24px]">
                        {item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGISTICS & BUYER (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Logistics Data */}
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="border-b border-gray-300 p-2 bg-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase flex items-center gap-1.5">
                <Truck size={12} /> DISPATCH INFO
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] text-gray-400 tracking-widest uppercase block mb-0.5">COURIER</span>
                <span className="font-bold text-black uppercase bg-gray-100 px-1.5 py-0.5 border border-gray-200">
                  {orderData.courier || 'TBD'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 tracking-widest uppercase block mb-0.5">WAYBILL/RESI</span>
                {orderData.tracking_id ? (
                  <span className="font-bold text-black bg-yellow-100 px-1.5 py-0.5 border border-yellow-300 select-all">
                    {orderData.tracking_id}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[10px]">PENDING</span>
                )}
              </div>
            </div>
          </div>

          {/* Destination Data */}
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="border-b border-gray-300 p-2 bg-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase flex items-center gap-1.5">
                <MapPin size={12} /> DESTINATION
              </span>
            </div>
            <div className="p-3 text-xs font-mono space-y-3">
              <div>
                <span className="text-[9px] text-gray-400 tracking-widest uppercase block mb-0.5">RECIPIENT</span>
                <div className="font-bold text-black text-sm uppercase leading-tight font-sans">
                  {buyerName}
                </div>
                <div className="text-gray-500 mt-0.5">{buyerPhone}</div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[9px] text-gray-400 tracking-widest uppercase block mb-1">ADDRESS</span>
                <div className="text-gray-700 leading-relaxed text-[11px] font-sans">
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
