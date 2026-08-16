import { redirect } from 'next/navigation';
import { Truck, Package, Clock, ChevronLeft, MapPin, CheckCircle2, User, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import PickupRequestModalClient from './PickupRequestModalClient';
import AntiFraudDataVault from '@/components/supplier/AntiFraudDataVault';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { format } from 'date-fns';

export const metadata = {
  title: 'Order Logistics - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsOrderDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;
  
  // We use the admin client here because standard RLS restricts supplier access to orders
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Order via Admin Client
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

  // 2. Fetch Order Items specifically for this supplier (using product_name column directly to avoid PGRST200)
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

  const rawBuyerName = orderData.customer_name || (orderData.shipping_address as any)?.name || 'N/A';
  const rawBuyerPhone = orderData.customer_phone || (orderData.shipping_address as any)?.phone || 'N/A';
  const buyerAddress = (orderData.shipping_address as any)?.full_address || JSON.stringify(orderData.shipping_address);
  const orderDate = orderData.created_at ? format(new Date(orderData.created_at), 'dd MMM yyyy, HH:mm') : '-';

  // Obfuscation Logic
  // Hide full phone number (e.g. 081234567890 -> 0812-****-7890)
  const obfuscatePhone = (phone: string) => {
    if (phone.length < 8 || phone === 'N/A') return phone;
    const first4 = phone.slice(0, 4);
    const last4 = phone.slice(-4);
    return `${first4}-****-${last4}`;
  };

  const buyerName = rawBuyerName; 
  const buyerPhone = obfuscatePhone(rawBuyerPhone);

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
              <h1 className="text-xl font-display font-medium text-ink">Order {orderData.id}</h1>
              {(orderData.status === 'paid' || orderData.status === 'pending_packing') && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                  <Package size={12} />
                  To Pack
                </span>
              )}
              {(orderData.status === 'ready_for_pickup' || orderData.status === 'allocated' || (orderData.status === 'shipped' && !orderData.tracking_id)) && (
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
          {(orderData.status === 'paid' || orderData.status === 'pending_packing') && (
            <PickupRequestModalClient 
              orderId={orderData.id} 
              courierName={orderData.courier || 'Kurir'} 
              warehouseName={supplierUser.assignedWarehouse?.name || 'Your Main Warehouse (Configured Location)'} 
            />
          )}
          {(orderData.status === 'ready_for_pickup' || orderData.status === 'shipped') && orderData.tracking_id && (
            <button className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-ink text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <FileText size={16} />
              Print Label
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                <Package size={16} className="text-ink/60" />
                Items to Pack
              </h3>
              <span className="text-xs text-ink/60">{orderItems.length} items total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {orderItems.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                    {/* Placeholder for real images if not joined */}
                    <Package className="text-gray-300" size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-ink text-sm">{item.product_name || (item.products as any)?.name}</h4>
                        <p className="text-xs text-ink/60 mt-1">Product ID: {item.product_id}</p>
                      </div>
                      <div className="text-base font-bold text-rose bg-rose/10 px-3 py-1.5 rounded-md border border-rose/20 shadow-sm flex items-center justify-center min-w-[3rem]">
                        x{item.quantity}
                      </div>
                    </div>
                    {(item.size || item.color) && (
                      <div className="mt-3 text-xs text-ink/70 bg-gray-50 inline-block px-2.5 py-1 rounded border border-gray-100">
                        Variant: {[item.size, item.color].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Confidential</span>
            </div>
            <AntiFraudDataVault supplierId={supplierUser.supplier_id}>
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
            </AntiFraudDataVault>
          </div>
        </div>
      </div>
    </div>
  );
}
