"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, ShieldCheck, RefreshCw, Printer, AlertTriangle } from 'lucide-react';
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
  notes?: string | null;
  refund_bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    submitted_at: string;
  } | null;
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
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const handleSubmitBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_name) {
      alert('Mohon lengkapi semua data rekening.');
      return;
    }
    setIsSubmittingBank(true);
    try {
      const res = await fetch('/api/orders/refund-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          user_id: userId,
          ...bankForm
        })
      });
      if (!res.ok) throw new Error('Gagal mengirim data rekening');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingBank(false);
    }
  };

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
    <main className="min-h-screen bg-white text-ink font-sans pb-24 md:pb-12">
      <div className="max-w-[600px] mx-auto md:border-x border-gray-100 min-h-screen">
        
        {/* Header Navigation */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-3 text-ink/80 hover:text-ink">
            <ArrowLeft size={18} />
            <span className="text-sm font-bold">Detail Pesanan</span>
          </Link>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{order.id}</p>
          </div>
        </div>

        <div className="flex flex-col">
          
          {/* Cancellation Notice */}
          {order.status === 'cancelled' && (
            <>
              <div className="p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <h2 className="text-sm font-bold text-red-800">Pesanan Dibatalkan</h2>
                </div>
                <p className="text-xs text-red-700 leading-relaxed mb-3">
                  Pesanan ini telah dibatalkan oleh pihak NINOC.
                  {order.notes && (
                    <span className="block mt-1">Alasan: <span className="font-semibold">{order.notes.split('Refund Status')[0].replace(/Cancelled on.*:/, '').trim()}</span></span>
                  )}
                </p>
                <div className="pt-3 border-t border-red-200/60">
                  <p className="text-[10px] text-red-800 leading-relaxed">
                    <strong className="block mb-0.5">Tindak Lanjut:</strong> 
                    Jika Anda sudah melakukan pembayaran, dana Anda akan dikembalikan (Refund) 100%. Tim Finance kami akan menghubungi Anda segera, atau silakan hubungi Customer Service kami jika ada pertanyaan lebih lanjut.
                  </p>
                  {order.notes?.includes('Manual Refund') && !order.refund_bank_details && (
                    <form onSubmit={handleSubmitBank} className="mt-3 bg-white p-3 rounded border border-red-100 shadow-sm space-y-2">
                      <p className="text-[11px] font-semibold text-ink">Formulir Rekening Refund</p>
                      <input type="text" placeholder="Nama Bank (BCA, Mandiri, dll)" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-red-400" required />
                      <input type="text" placeholder="Nomor Rekening" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-red-400" required />
                      <input type="text" placeholder="Nama Pemilik Rekening" value={bankForm.account_name} onChange={e => setBankForm({...bankForm, account_name: e.target.value})} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-red-400" required />
                      <button type="submit" disabled={isSubmittingBank} className="w-full bg-red-600 text-white py-1.5 rounded text-[11px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors tracking-widest uppercase">
                        {isSubmittingBank ? 'Mengirim...' : 'Kirim Data Rekening'}
                      </button>
                    </form>
                  )}
                  {order.refund_bank_details && (
                    <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-sm flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Data Rekening Diterima</p>
                        <p className="text-[10px] text-green-700 mt-1">Refund sedang diproses ke rekening <strong>{order.refund_bank_details.bank_name} - {order.refund_bank_details.account_number}</strong> (a.n {order.refund_bank_details.account_name}).</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-50" />
            </>
          )}
          
          {/* Status & Tracking */}
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold">Status Pengiriman</h2>
              <span className="text-xs font-semibold px-2 py-1 bg-ink/5 rounded text-ink uppercase tracking-wider">
                {order.status}
              </span>
            </div>
            
            <div className="py-2">
              <AnimatedShippingMap currentStepIndex={currentStepIndex} isCancelled={order.status === 'cancelled'} />
            </div>

            {order.tracking_id && (
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Kurir</p>
                  <p className="text-xs font-bold text-rose uppercase">{order.courier}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Nomor Resi</p>
                  <p className="text-xs font-bold text-ink">{order.tracking_id}</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-1.5 w-full bg-gray-50" />

          {/* Rincian Pesanan */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold">Rincian Pesanan</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-100 shrink-0 rounded border border-gray-200" />
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-xs font-semibold line-clamp-1">{item.product_name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Var: {item.size} • Qty: {item.quantity}</p>
                    <p className="text-xs font-bold mt-1">Rp {(item.unit_price ?? item.price_at_purchase).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 flex justify-between items-center border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600">Total Pesanan</p>
              <p className="text-sm font-bold text-rose">Rp {order.total_price.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="h-1.5 w-full bg-gray-50" />

          {/* Alamat Pengiriman */}
          <div className="p-4 space-y-2">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" /> Alamat Pengiriman
            </h2>
            <div className="pl-5 space-y-0.5">
              <p className="text-xs font-bold">{order.shipping_address?.name || order.shipping_address?.phone}</p>
              <p className="text-[10px] text-gray-500">{order.shipping_address?.phone}</p>
              <p className="text-xs text-gray-700 leading-snug mt-1">
                {order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
              </p>
            </div>
          </div>

          <div className="h-1.5 w-full bg-gray-50" />

          {/* Riwayat Pengiriman */}
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold">Riwayat Lacak</h2>
            <div className="space-y-3 border-l-2 border-gray-100 ml-2 pl-3">
              {trackingLogs.length === 0 ? (
                <p className="text-xs text-gray-500">Menunggu info kurir...</p>
              ) : (
                trackingLogs.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 bg-gray-300 rounded-full ring-4 ring-white" />
                    <p className="text-xs font-semibold capitalize text-ink">
                      {log.biteship_status?.replace(/_/g, ' ').toLowerCase() || log.status.toLowerCase()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 pt-2 space-y-3">
            {order.status === 'delivered' && !returnRequest && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Ajukan Tukar / Retur
              </button>
            )}

            {returnRequest && (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">Status Retur</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded capitalize">
                  {returnRequest.status}
                </span>
              </div>
            )}
            
            <button
              onClick={printInvoice}
              className="w-full py-2.5 bg-ink text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 hover:bg-ink/90"
            >
              <Printer size={14} /> Unduh Invoice
            </button>
          </div>

        </div>
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

      <PrintableInvoice order={order as any} />
    </main>
  );
}
