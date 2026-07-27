import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Truck, Package, Clock, ChevronLeft, MapPin, CheckCircle2, User, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import PickupRequestModalClient from './PickupRequestModalClient';

export const metadata = {
  title: 'Order Logistics - Supplier Hub | NINOC',
};

export default async function SupplierLogisticsOrderDetail({ params }: { params: { orderId: string } }) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Get supplier ID
  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('supplier_id')
    .eq('user_id', session.user.id)
    .single();

  if (!supplierUser) {
    redirect('/supplier/apply');
  }

  // Mock data for UI/UX
  const orderId = params.orderId;
  const mockOrder = {
    id: orderId,
    status: 'pending_packing', // 'pending_packing', 'ready_for_pickup', 'shipped'
    date: '2026-07-27 14:30',
    buyer: {
      name: 'John Doe',
      phone: '+62 812 3456 7890',
      address: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan, 12110',
    },
    courier: {
      name: 'JNE Reguler',
      tracking_id: null, // 'JNE123456789' if ready_for_pickup
    },
    items: [
      {
        id: 'item-1',
        name: 'Ceramic Vase (Set of 2)',
        sku: 'VSE-CRM-001',
        variant: 'White, Large',
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: 'item-2',
        name: 'Woven Bamboo Basket',
        sku: 'BSK-BMB-003',
        variant: 'Natural, Medium',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=200&auto=format&fit=crop',
      }
    ]
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/supplier/logistics" className="p-2 -ml-2 text-ink/50 hover:text-ink hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-display font-medium text-ink">Order {mockOrder.id}</h1>
              {mockOrder.status === 'pending_packing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                  <Package size={12} />
                  To Pack
                </span>
              )}
              {mockOrder.status === 'ready_for_pickup' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                  <Clock size={12} />
                  Waiting Pickup
                </span>
              )}
            </div>
            <p className="text-sm text-ink/60 mt-1">Placed on {mockOrder.date}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {mockOrder.status === 'pending_packing' && (
            <PickupRequestModalClient orderId={mockOrder.id} courierName={mockOrder.courier.name} />
          )}
          {mockOrder.status === 'ready_for_pickup' && mockOrder.courier.tracking_id && (
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
              <span className="text-xs text-ink/60">{mockOrder.items.length} items total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {mockOrder.items.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-ink text-sm">{item.name}</h4>
                        <p className="text-xs text-ink/60 mt-1">SKU: {item.sku}</p>
                      </div>
                      <div className="text-sm font-medium text-ink bg-gray-50 px-2 py-1 rounded">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-ink/70 bg-gray-50 inline-block px-2.5 py-1 rounded border border-gray-100">
                      Variant: {item.variant}
                    </div>
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
                <div className="text-sm font-medium text-ink">{mockOrder.courier.name}</div>
              </div>
              
              {mockOrder.courier.tracking_id && (
                <div>
                  <span className="text-xs text-ink/50 uppercase tracking-wider block mb-1">Tracking ID (Waybill)</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono font-medium text-ink bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {mockOrder.courier.tracking_id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                <MapPin size={16} className="text-ink/60" />
                Destination
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <User size={16} className="text-ink/40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-ink">{mockOrder.buyer.name}</div>
                  <div className="text-xs text-ink/60 mt-0.5">{mockOrder.buyer.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-ink/40 shrink-0 mt-0.5" />
                <div className="text-sm text-ink/80 leading-relaxed">
                  {mockOrder.buyer.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
