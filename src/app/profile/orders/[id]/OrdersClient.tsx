"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, ShieldCheck, RefreshCw, Printer } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import AnimatedShippingMap from '../../_components/AnimatedShippingMap';
import { ReturnModal } from './_components/ReturnModal';
import { PrintableInvoice } from '@/components/Invoice';

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
  const [order] = useState<Order>(initialOrder);
  const [items] = useState<OrderItem[]>(initialItems);
  const [trackingLogs] = useState<TrackingLog[]>(initialLogs);
  const [returnRequest, setReturnRequest] = useState<{ id: string; status: string } | null>(initialReturnRequest);
  const [showReturnModal, setShowReturnModal] = useState(false);

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
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white pb-32">
      <div className="max-w-[1000px] mx-auto px-6 pt-4 md:pt-40">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-16">
          <Link href="/profile" className="flex items-center gap-2 text-ink/30 hover:text-ink transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs md:text-[10px] uppercase tracking-[0.2em]">Exit to Order Log</span>
          </Link>
          <div className="text-right">
            <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-1">Origin Specification ID</p>
            <p className="text-xs uppercase tracking-wider">{order.id}</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* LEFT COLUMN: Logistics Situation Report */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tracking Visualizer */}
            <section className="space-y-4">
              <h2 className="text-xs md:text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Logistics Situation Report</h2>
              
              <AnimatedShippingMap currentStepIndex={currentStepIndex} />

              {/* Waybill / Tracking Card */}
              {order.tracking_id && (
                <div className="bg-ink/[0.01] border border-ink/5 p-6 flex items-center justify-between rounded-[4px]">
                  <div className="space-y-1">
                    <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Active Waybill Reference</p>
                    <p className="text-xs tracking-wider">{order.tracking_id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Carrier Entity</p>
                    <p className="text-xs uppercase tracking-wider text-rose">{order.courier}</p>
                  </div>
                </div>
              )}

              {/* Detailed Tracking Logs (from Biteship Webhook) */}
              <div className="space-y-4">
                <h3 className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Event Logs (Temporal Log)</h3>
                <div className="border border-ink/5 rounded-[4px] divide-y divide-ink/5">
                  {trackingLogs.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-xs md:text-[9px] italic text-ink/30 uppercase tracking-widest">Initial handshake pending...</p>
                    </div>
                  ) : (
                    trackingLogs.map((log, idx) => (
                      <div key={idx} className="p-3 flex items-start justify-between group hover:bg-ink/[0.01] transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-xs md:text-[9px] text-ink/80 tracking-wide">
                            {log.biteship_status?.replace(/_/g, ' ').toUpperCase() || log.status}
                          </p>
                          <p className="text-[10px] md:text-[7px] text-ink/30 font-medium uppercase tracking-tight">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] md:text-[7px] border border-ink/10 px-1 py-0.5 rounded text-ink/40 uppercase tracking-widest group-hover:border-rose/30 group-hover:text-rose transition-all">Verified</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Unit Specification Details */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Order Items */}
            <section className="space-y-6">
              <h2 className="text-xs md:text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Origin Specification Items</h2>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-ink/5 rounded-[4px]">
                    <div className="w-16 h-20 bg-ink/5 flex-shrink-0 border border-ink/5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs md:text-[10px] uppercase tracking-wider">{item.product_name}</p>
                      <p className="text-[11px] md:text-[8px] text-ink/40 uppercase tracking-widest">Size {item.size} • Qty {item.quantity}</p>
                      <p className="text-xs md:text-[10px] text-ink/70">IDR {(item.unit_price ?? item.price_at_purchase).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-ink/5 flex justify-between items-end">
                <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Total Investment Value</p>
                <p className="text-xl font-display italic tracking-tight">IDR {order.total_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              {/* Return Request CTA — only for delivered orders without active return */}
              {order.status === 'delivered' && !returnRequest && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-3 border border-rose/30 text-rose hover:bg-rose/5 text-xs md:text-[9px] font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} />
                  Ajukan Retur / Exchange
                </button>
              )}

              {/* Return Request Status */}
              {returnRequest && (
                <div className="border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={12} className="text-amber-500" />
                      <p className="text-xs md:text-[9px] font-semibold uppercase tracking-widest text-amber-600">Retur Pending</p>
                    </div>
                    <span className="text-[11px] md:text-[8px] uppercase tracking-widest px-2 py-0.5 bg-amber-200 text-amber-700">
                      {returnRequest.status}
                    </span>
                  </div>
                  <p className="text-xs md:text-[9px] text-amber-600/70">
                    Retur sedang diproses oleh tim kami. Kami akan menghubungi Anda segera.
                  </p>
                </div>
              )}
            </section>

            {/* Shipping Metadata */}
            <section className="space-y-6 bg-ink/[0.01] p-6 border border-ink/5 rounded-[4px]">
              <h2 className="text-xs md:text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4 flex items-center gap-2">
                <MapPin size={12} className="text-rose" />
                Shipping Target
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 italic">Registered Consignee</p>
                  <p className="text-sm md:text-[11px] leading-relaxed uppercase tracking-tight">{order.shipping_address?.name || order.shipping_address?.phone || 'Unknown Recipient'}</p>
                  <p className="text-xs md:text-[9px] text-ink/40">{order.shipping_address?.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 italic">Dest. Node Specification</p>
                  <p className="text-xs md:text-[10px] leading-relaxed text-ink/60 uppercase">
                    {order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
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
          className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-full shadow-lg hover:bg-rose transition-colors text-xs md:text-[9px] font-semibold uppercase tracking-widest"
        >
          <Printer size={12} />
          Invoice A5
        </button>
      </div>

      {/* Printable Invoice (hidden, triggered by window.print()) */}
      <PrintableInvoice order={order as any} />

    </main>
  );
}
