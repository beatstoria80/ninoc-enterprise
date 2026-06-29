"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, ShieldCheck, RefreshCw, Printer } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import AnimatedShippingMap from '../../_components/AnimatedShippingMap';
import { ReturnModal } from './_components/ReturnModal';
import { PrintableInvoice } from '@/components/Invoice';
import { supabase } from '@/lib/supabase';

export interface Order {
  id: string;
  user_id: string | null;
  total_price: number;
  status: string;
  payment_status: string;
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    province?: string;
  } | null;
  courier: string | null;
  tracking_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id: string | null;
  size?: string;
  quantity: number;
  price_at_purchase: number;
  unit_price?: number;
}

export interface TrackingLog {
  id: string;
  order_id: string;
  status: string;
  description: string | null;
  location: string | null;
  biteship_status?: string;
  created_at: string;
}

export default function OrdersClient({
  userId,
  initialOrder,
  initialItems,
  initialLogs,
  initialReturnRequest
}: {
  userId: string;
  initialOrder: Order;
  initialItems: OrderItem[];
  initialLogs: TrackingLog[];
  initialReturnRequest: { id: string; status: string } | null;
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [items] = useState<OrderItem[]>(initialItems);
  const [trackingLogs, setTrackingLogs] = useState<TrackingLog[]>(initialLogs);
  const [returnRequest, setReturnRequest] = useState<{ id: string; status: string } | null>(initialReturnRequest);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Realtime subscription
  React.useEffect(() => {
    if (!order.id) return;

    const channel = supabase
      .channel(`profile-orders-${order.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, async () => {
        const { data } = await supabase.from('orders').select('*').eq('id', order.id).single();
        if (data) setOrder(data);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tracking_logs',
        filter: `order_id=eq.${order.id}`
      }, async () => {
        const { data } = await supabase.from('tracking_logs').select('*').eq('order_id', order.id).order('created_at', { ascending: false });
        if (data) setTrackingLogs(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const printInvoice = () => { window.print(); };

  const steps = [
    { label: 'Order Registered', status: 'pending', icon: <Clock size={14} /> },
    { label: 'Payment Verified', status: 'paid', icon: <ShieldCheck size={14} /> },
    { label: 'In Logistics Storage', status: 'processing', icon: <Package size={14} /> },
    { label: 'Carrier Pickup', status: 'shipped', icon: <Truck size={14} /> },
    { label: 'Studio Delivery', status: 'delivered', icon: <CheckCircle size={14} /> },
  ];

  const currentStepIndex = Math.max(0, steps.findIndex(s => s.status === order.status));

  return (
    <main className="min-h-screen bg-gray-50 text-ink font-sans selection:bg-ink selection:text-white pb-32">
      <div className="max-w-[800px] mx-auto md:px-6 pt-4 md:pt-10">
        
        {/* Header Navigation */}
        <div className="bg-white px-4 py-4 mb-4 shadow-sm md:rounded-lg flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2 text-ink/70 hover:text-ink transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Kembali</span>
          </Link>
          <div className="text-right">
            <p className="text-xs text-ink/50 mb-0.5">ID Pesanan</p>
            <p className="text-sm font-semibold uppercase">{order.id}</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 md:px-0"
        >
          {/* LEFT COLUMN: Logistics Situation Report */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tracking Visualizer */}
            <section className="bg-white p-5 rounded-lg shadow-sm space-y-5">
              <h2 className="text-sm font-bold border-b border-gray-100 pb-3">Status Pengiriman</h2>
              
              <div className="py-2">
                <AnimatedShippingMap currentStepIndex={currentStepIndex} />
              </div>

              {/* Waybill / Tracking Card */}
              {order.tracking_id && (
                <div className="bg-gray-50 border border-gray-100 p-4 flex items-center justify-between rounded-lg mt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Nomor Resi</p>
                    <p className="text-sm font-semibold text-ink">{order.tracking_id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-gray-500">Kurir</p>
                    <p className="text-sm font-semibold uppercase text-rose">{order.courier}</p>
                  </div>
                </div>
              )}

              {/* Detailed Tracking Logs (from Biteship Webhook) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Riwayat Pengiriman</h3>
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                  {trackingLogs.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Menunggu pembaruan status kurir...</p>
                    </div>
                  ) : (
                    trackingLogs.map((log, idx) => (
                      <div key={idx} className="p-3.5 flex items-start justify-between group hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm text-ink font-medium capitalize">
                            {log.biteship_status?.replace(/_/g, ' ').toLowerCase() || log.status.toLowerCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Unit Specification Details */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Order Items */}
            <section className="bg-white p-5 rounded-lg shadow-sm space-y-4">
              <h2 className="text-sm font-bold border-b border-gray-100 pb-3">Rincian Pesanan</h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0 rounded-md border border-gray-200" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-ink line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-gray-500">Variasi: {item.size} • x{item.quantity}</p>
                      <p className="text-sm font-bold text-ink">Rp {(item.unit_price ?? item.price_at_purchase).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-2">
                <p className="text-sm font-semibold text-gray-600">Total Pesanan</p>
                <p className="text-lg font-bold text-rose">Rp {order.total_price.toLocaleString('id-ID')}</p>
              </div>

              {/* Return Request CTA — only for delivered orders without active return */}
              {order.status === 'delivered' && !returnRequest && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full mt-4 py-2.5 border border-rose/30 text-rose hover:bg-rose/5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  Ajukan Retur / Tukar
                </button>
              )}

              {/* Return Request Status */}
              {returnRequest && (
                <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="text-amber-600" />
                      <p className="text-sm font-bold text-amber-700">Status Retur</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-200 text-amber-800 rounded-full capitalize">
                      {returnRequest.status}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Pengajuan retur Anda sedang diproses. Kami akan segera menghubungi Anda.
                  </p>
                </div>
              )}
            </section>

            {/* Shipping Metadata */}
            <section className="bg-white p-5 rounded-lg shadow-sm space-y-4">
              <h2 className="text-sm font-bold border-b border-gray-100 pb-3 flex items-center gap-2">
                <MapPin size={16} className="text-rose" />
                Alamat Pengiriman
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{order.shipping_address?.name || order.shipping_address?.phone || 'Tidak diketahui'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.shipping_address?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {order.shipping_address?.address}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
                  </p>
                </div>
              </div>
            </section>

          </div>
        </motion.div>
      </div>

      {/* Return Request Modal */}
      <AnimatePresence>
        {showReturnModal && userId && (
          <ReturnModal
            orderId={order.id}
            userId={userId}
            items={items.map(i => ({
              id: i.id,
              product_name: i.product_name || 'Unknown Product',
              size: i.size || '',
              quantity: i.quantity,
              price_at_purchase: i.price_at_purchase,
            }))}
            onClose={() => setShowReturnModal(false)}
            onSuccess={() => {
              setReturnRequest({ id: 'pending', status: 'requested' });
              setShowReturnModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Download Invoice */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={printInvoice}
          className="flex items-center gap-2 px-4 py-3 bg-ink text-white rounded-full shadow-lg hover:bg-ink/90 transition-colors text-sm font-semibold"
        >
          <Printer size={16} />
          Cetak Invoice
        </button>
      </div>

      {/* Printable Invoice (hidden, triggered by window.print()) */}
      <PrintableInvoice order={order as any} />

    </main>
  );
}
