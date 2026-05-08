"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, ExternalLink, ShieldCheck, Box } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) return;

      // 1. Fetch Order Header
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (!orderData) {
        router.push('/profile');
        return;
      }
      setOrder(orderData);

      // 2. Fetch Order Items
      const { data: itemData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      setItems(itemData || []);

      // 3. Fetch Tracking Logs
      const { data: logData } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });
      setTrackingLogs(logData || []);

      setIsLoading(false);
    };

    fetchOrderData();
  }, [id, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border border-ink/10 border-t-rose rounded-full animate-spin" />
      </main>
    );
  }

  const steps = [
    { label: 'Order Registered', status: 'pending', icon: <Clock size={14} /> },
    { label: 'Payment Verified', status: 'paid', icon: <ShieldCheck size={14} /> },
    { label: 'In Storage Archive', status: 'processing', icon: <Package size={14} /> },
    { label: 'Carrier Pickup', status: 'shipped', icon: <Truck size={14} /> },
    { label: 'Studio Delivery', status: 'delivered', icon: <CheckCircle size={14} /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white pb-32">
      <div className="max-w-[1000px] mx-auto px-6 pt-32 md:pt-40">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-16">
          <Link href="/profile" className="flex items-center gap-2 text-ink/30 hover:text-ink transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Exit to Archive Log</span>
          </Link>
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest text-ink/30 mb-1">Origin Specification ID</p>
            <p className="text-xs uppercase tracking-wider">{order.id}</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          {/* LEFT COLUMN: Logistics Situation Report */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Tracking Visualizer */}
            <section className="space-y-8">
              <h2 className="text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Logistics Situation Report</h2>
              
              <div className="relative flex justify-between items-start pt-4">
                <div className="absolute top-[11px] left-0 right-0 h-[1px] bg-ink/5 z-0" />
                {steps.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-4 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      idx <= currentStepIndex ? 'bg-ink text-white shadow-lg' : 'bg-white border border-ink/10 text-ink/20'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="text-center">
                      <p className={`text-[8px] uppercase tracking-widest leading-tight ${
                        idx <= currentStepIndex ? 'text-ink' : 'text-ink/20'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Waybill / Tracking Card */}
              {order.tracking_id && (
                <div className="bg-ink/[0.01] border border-ink/5 p-6 flex items-center justify-between rounded-[4px]">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest text-ink/30">Active Waybill Reference</p>
                    <p className="text-xs tracking-wider">{order.tracking_id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[8px] uppercase tracking-widest text-ink/30">Carrier Entity</p>
                    <p className="text-xs uppercase tracking-wider text-rose">{order.courier}</p>
                  </div>
                </div>
              )}

              {/* Detailed Tracking Logs (from Biteship Webhook) */}
              <div className="space-y-4">
                <h3 className="text-[8px] uppercase tracking-widest text-ink/30">Event Logs (Temporal Archive)</h3>
                <div className="border border-ink/5 rounded-[4px] divide-y divide-ink/5">
                  {trackingLogs.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[9px] italic text-ink/30 uppercase tracking-widest">Initial handshake pending...</p>
                    </div>
                  ) : (
                    trackingLogs.map((log, idx) => (
                      <div key={idx} className="p-5 flex items-start justify-between group hover:bg-ink/[0.01] transition-colors">
                        <div className="space-y-1">
                          <p className="text-[10px] text-ink/80 tracking-wide">
                            {log.biteship_status.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-[8px] text-ink/30 font-medium uppercase tracking-tight">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[7px] border border-ink/10 px-1.5 py-0.5 rounded text-ink/40 uppercase tracking-widest group-hover:border-rose/30 group-hover:text-rose transition-all">Verified</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Archive Specification Details */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* Order Items */}
            <section className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Origin Specification Items</h2>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-ink/5 rounded-[4px]">
                    <div className="w-16 h-20 bg-ink/5 flex-shrink-0 border border-ink/5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider">{item.product_name}</p>
                      <p className="text-[8px] text-ink/40 uppercase tracking-widest">Size {item.size} • Qty {item.quantity}</p>
                      <p className="text-[10px] text-ink/70">Rp {item.unit_price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-ink/5 flex justify-between items-end">
                <p className="text-[8px] uppercase tracking-widest text-ink/30">Total Investment Value</p>
                <p className="text-xl font-display italic tracking-tight">Rp {order.total_price.toLocaleString()}</p>
              </div>
            </section>

            {/* Shipping Metadata */}
            <section className="space-y-6 bg-ink/[0.01] p-6 border border-ink/5 rounded-[4px]">
              <h2 className="text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4 flex items-center gap-2">
                <MapPin size={12} className="text-rose" />
                Shipping Target
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-ink/30 italic">Registered Consignee</p>
                  <p className="text-[11px] leading-relaxed uppercase tracking-tight">{order.shipping_address?.name}</p>
                  <p className="text-[9px] text-ink/40">{order.shipping_address?.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-ink/30 italic">Dest. Node Specification</p>
                  <p className="text-[10px] leading-relaxed text-ink/60 uppercase">
                    {order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
                  </p>
                </div>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
