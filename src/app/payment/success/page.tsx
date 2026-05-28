"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Package, Truck, Clock, Printer } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SuccessPage() {
  const { isMobile, isIPhone } = useDevice();
  const searchParams = useSearchParams();
  const courierName = searchParams.get('courier') || 'Standard Shipping';
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
        .then(({ data }) => {
          if (data) setOrder(data);
        });
    }
  }, [orderId]);

  return (
    <>
    <main className={cn(
      "min-h-screen bg-cr noise flex flex-col md:flex-row md:items-center md:justify-center px-4 md:px-6 print:hidden",
      isMobile ? "pt-14 pb-12" : "py-6",
      isIPhone && "pt-[calc(env(safe-area-inset-top,0px)+60px)]"
    )}>
      {/* MOBILE NAV BAR */}
      {isMobile && (
        <nav className={cn(
          "fixed top-0 inset-x-0 z-[150] bg-white/95 backdrop-blur-xl border-b border-ink/5",
          isIPhone && "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="flex items-center justify-center py-3">
            <div className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</div>
          </div>
        </nav>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-start text-left">
          
          {/* ===== COLUMN 1: HEADERS & ACTIONS ===== */}
          <div className="lg:col-span-3 flex flex-col space-y-4 order-1">
            <div className="space-y-4">
              <h1 className="text-xl md:text-3xl font-display font-medium italic text-ink tracking-tighter flex items-center gap-3">
                Payment Successful.
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={14} />
                </motion.div>
              </h1>
              <p className="text-[11px] text-ink/50 font-medium uppercase tracking-[0.1em] leading-relaxed max-w-sm">
                Thank you for your purchase. We are now processing your order.
              </p>
            </div>

            {/* DESKTOP BUTTONS (Hidden on mobile) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="hidden lg:flex flex-col space-y-4 pt-8 border-t border-ink/5"
            >
              <Link href="/shop" className="w-full bg-ink text-white px-6 py-4 rounded-none text-[10px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose active:scale-[0.98] transition-all shadow-xl shadow-ink/5 group">
                Continue Collecting
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => window.print()} className="w-full px-6 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ink hover:text-rose transition-colors flex items-center justify-center gap-2 border border-ink/10 hover:border-rose/20 bg-white">
                <Printer size={14} />
                Save as PDF
              </button>
              <div className="text-center pt-2">
                <Link href="/" className="inline-block px-8 py-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose transition-colors border border-transparent hover:border-rose/20">
                  Return to Atelier
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ===== COLUMN 2: VISIBLE INVOICE / RECEIPT ===== */}
          <div className="lg:col-span-4 w-full order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-ink/5 shadow-xl shadow-ink/5 overflow-hidden"
            >
              <div className="px-4 md:px-8 py-3 md:py-5 border-b border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ink/[0.03] flex items-center justify-center">
                    <Printer size={14} className="text-ink/40" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink">Transaction Receipt</h3>
                    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60 mt-0.5">
                      {order?.id ? order.id.toUpperCase() : 'Awaiting Order ID'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/60">
                    {order?.created_at
                      ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    }
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 md:px-8 py-3 md:py-4 border-b border-ink/5">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60 mb-2">Purchased Items</p>
                <div className="space-y-3">
                  {order?.order_items ? (
                    order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-ink truncate">{item.product_name}</p>
                          <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/60 mt-0.5">
                            {item.size ? `Size ${item.size}` : 'One Size'} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-[11px] font-mono font-medium text-ink ml-4 shrink-0">
                          IDR {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-ink/60 italic">Loading order details...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="px-4 md:px-8 py-3 md:py-4 space-y-1.5 md:space-y-2">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60 mb-2">Financial Breakdown</p>
                {(() => {
                  const sub = order?.order_items?.reduce((acc: number, item: any) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                  const tax = Math.round(sub * 0.11);
                  const platform = 2500;
                  const shipping = order ? Math.max(0, order.total_price - sub - tax - platform) : 0;
                  const total = order?.total_price || 0;

                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink/70">Subtotal</span>
                        <span className="text-[11px] font-mono font-medium text-ink">{sub > 0 ? `IDR ${sub.toLocaleString('id-ID')}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink/70">Logistics ({courierName})</span>
                        <span className="text-[11px] font-mono font-medium text-ink">{shipping > 0 ? `+ IDR ${shipping.toLocaleString('id-ID')}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink/70">VAT (11%)</span>
                        <span className="text-[11px] font-mono font-medium text-ink">{tax > 0 ? `+ IDR ${tax.toLocaleString('id-ID')}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink/70">Platform Fee</span>
                        <span className="text-[11px] font-mono font-medium text-ink">+ IDR 2.500</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-2 border-t border-ink/10">
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/80">Total</span>
                        <span className="text-lg font-display font-medium italic text-rose">{total > 0 ? `IDR ${total.toLocaleString('id-ID')}` : '—'}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Shipping Info */}
              {order?.shipping_address && (
                <div className="px-4 md:px-8 py-3 md:py-4 border-t border-ink/5 bg-ink/[0.01]">
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/60 mb-1.5">Shipping To</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink">{order.shipping_address.name || order.customer_name}</p>
                  <p className="text-[10px] font-medium text-ink/70 mt-0.5">{order.shipping_address.address}</p>
                  <p className="text-[10px] font-medium text-ink/70">{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ===== COLUMN 3: TIMELINE ===== */}
          <div className="lg:col-span-5 w-full flex flex-col space-y-8 order-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-ink/5 p-6 md:p-8 shadow-xl shadow-ink/5 relative overflow-hidden"
            >
               <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-8 flex items-center justify-between border-b border-ink/5 pb-4">
                  <span>Shipment Status</span>
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-[8px] text-emerald-600 uppercase">Live Update</span>
                  </div>
               </h3>
               
               <div className="relative pl-8 md:pl-10 border-l-2 border-ink/5 ml-6 md:ml-8 mt-6 flex flex-col gap-0 md:gap-8">
                  
                  {/* Step 1: Active */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="relative group"
                  >
                     <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <ShieldCheck size={18} strokeWidth={2.5} className="animate-pulse" />
                     </div>
                     <div className="bg-emerald-50/50 border border-emerald-500/20 p-5 md:p-6 rounded-none relative overflow-hidden border-b-0 md:border-b">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                        <div className="flex items-center gap-3 mb-1.5 relative">
                          <h4 className="text-[12px] font-bold uppercase tracking-widest text-emerald-700">Payment Confirmed</h4>
                          <span className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-[9px] font-medium tracking-[0.15em] text-emerald-600/70 uppercase flex items-center gap-1.5 relative">
                          <Clock size={12} strokeWidth={2} /> Just Now • System Authenticated
                        </p>
                     </div>
                  </motion.div>

                  {/* Step 2: Processing */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="relative group hover:scale-[1.01] transition-transform"
                  >
                     <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                        <Package size={18} strokeWidth={2} />
                     </div>
                     <div className="p-5 md:p-6 border border-ink/5 rounded-none bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all border-b-0 md:border-b">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 group-hover:text-ink/70 transition-colors">Processing in Atelier</h4>
                        </div>
                        <p className="text-[9px] font-medium tracking-[0.15em] text-ink/30 uppercase">Pending Quality Control</p>
                     </div>
                  </motion.div>

                  {/* Step 3: Logistics */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                    className="relative group hover:scale-[1.01] transition-transform"
                  >
                     <div className="absolute -left-[44px] md:-left-[54px] p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                        <Truck size={18} strokeWidth={2} />
                     </div>
                     <div className="p-5 md:p-6 border border-ink/5 rounded-none bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="text-[12px] font-bold uppercase tracking-widest text-ink/40 group-hover:text-ink/70 transition-colors">Handed to Logistics</h4>
                        </div>
                        <p className="text-[9px] font-medium tracking-[0.15em] text-ink/30 uppercase">Courier: <span className="text-ink/60">{courierName}</span></p>
                     </div>
                  </motion.div>
               </div>
            </motion.div>
          </div>

          {/* ===== MOBILE BUTTONS (Visible only on mobile at the bottom) ===== */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="lg:hidden w-full flex flex-col space-y-4 pt-4 border-t border-ink/5 order-4"
          >
            <Link href="/shop" className="w-full bg-ink text-white px-6 py-4 rounded-none text-[10px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose active:scale-[0.98] transition-all shadow-xl shadow-ink/5 group">
              Continue Collecting
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => window.print()} className="w-full px-6 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ink hover:text-rose transition-colors flex items-center justify-center gap-2 border border-ink/10 hover:border-rose/20 bg-white">
              <Printer size={14} />
              Save as PDF
            </button>
            <div className="text-center pt-2">
              <Link href="/" className="inline-block px-8 py-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose transition-colors border border-transparent hover:border-rose/20">
                Return to Atelier
              </Link>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </main>

    {/* ===== PRINTABLE INVOICE ===== */}
    <div className="hidden print:block bg-white text-black p-8 w-full h-full max-w-4xl mx-auto font-sans m-0">
       <InvoiceMockup courierName={courierName} order={order} />
    </div>
    </>
  );
}

function InvoiceMockup({ courierName, order }: { courierName: string, order?: any }) {
  const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border border-black p-8 bg-white">
      {/* Header */}
      <div className="flex justify-between items-start border-b-[3px] border-black pb-6 mb-6">
        <div>
          <h1 className="font-display font-medium text-4xl italic uppercase tracking-tighter mb-1">NINOC</h1>
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold">Archival Studio Investment</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Invoice</h2>
          <p className="text-xs font-mono">{order?.id ? order.id.toUpperCase() : 'INV-82390192'}</p>
          <p className="text-[10px] uppercase mt-1">{order?.created_at ? new Date(order.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : `${date} ${time}`}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-12 mb-8 text-sm">
        <div>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-2 border-b border-black/20 pb-1">Billed To</p>
          <p className="font-bold">{order?.customer_name || 'Customer Name'}</p>
          <p className="text-xs mt-1">{order?.shipping_address?.email || 'customer@email.com'}</p>
          <p className="text-xs font-mono">{order?.shipping_address?.phone || '+62 812-XXXX-XXXX'}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-2 border-b border-black/20 pb-1">Shipped To</p>
          <p className="text-xs">{order?.shipping_address?.address || 'Jakarta Selatan, DKI Jakarta'}</p>
          <p className="text-xs">{order?.shipping_address?.city || '12345'}, {order?.shipping_address?.postal_code || 'Indonesia'}</p>
          <p className="text-[10px] font-bold mt-2 uppercase tracking-wider">Via <span className="font-bold underline">{order?.courier || courierName}</span></p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8 text-sm border-collapse">
        <thead>
          <tr className="border-b-[3px] border-black text-[9px] uppercase tracking-widest text-left">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {order?.order_items ? (
            order.order_items.map((item: any) => (
              <tr key={item.id} className="border-b border-black/10">
                <td className="py-4 font-sans font-bold text-sm uppercase">{item.product_name} {item.size ? `(Size ${item.size})` : ''}</td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right">IDR {item.price_at_purchase.toLocaleString('id-ID')}</td>
                <td className="py-4 text-right">IDR {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}</td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-black/10">
              <td className="py-4 font-sans font-bold text-sm uppercase">Origin Specification Garment (Mockup)</td>
              <td className="py-4 text-center">1</td>
              <td className="py-4 text-right">IDR 1,499,000</td>
              <td className="py-4 text-right">IDR 1,499,000</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2 space-y-2 text-sm">
          {order ? (
            <>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Subtotal</span>
                <span className="font-mono">IDR {(() => {
                  const sub = order.order_items?.reduce((acc: number, item: any) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                  return sub.toLocaleString('id-ID');
                })()}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Logistics</span>
                <span className="font-mono">IDR {(() => {
                  const sub = order.order_items?.reduce((acc: number, item: any) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                  const tax = Math.round(sub * 0.11);
                  const platform = 2500;
                  const shipping = order.total_price - sub - tax - platform;
                  return shipping > 0 ? shipping.toLocaleString('id-ID') : '0';
                })()}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">VAT (11%)</span>
                <span className="font-mono">IDR {(() => {
                  const sub = order.order_items?.reduce((acc: number, item: any) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                  return Math.round(sub * 0.11).toLocaleString('id-ID');
                })()}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Platform Fee</span>
                <span className="font-mono">IDR 2,500</span>
              </div>
              <div className="flex justify-between pt-2 border-b-[3px] border-black pb-2 mt-2">
                <span className="font-bold uppercase tracking-widest">Total Investment</span>
                <span className="font-bold font-mono text-lg">IDR {order.total_price.toLocaleString('id-ID')}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Subtotal</span>
                <span className="font-mono">IDR 1,499,000</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Logistics</span>
                <span className="font-mono">IDR 25,000</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">VAT (11%)</span>
                <span className="font-mono">IDR 164,890</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold">Platform Fee</span>
                <span className="font-mono">IDR 2,500</span>
              </div>
              <div className="flex justify-between pt-2 border-b-[3px] border-black pb-2 mt-2">
                <span className="font-bold uppercase tracking-widest">Total Investment</span>
                <span className="font-bold font-mono text-lg">IDR 1,691,390</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-black/20 text-center">
        <p className="text-[8px] uppercase tracking-[0.3em] font-bold">This document is a valid proof of transaction generated electronically.</p>
      </div>
    </div>
  );
}
