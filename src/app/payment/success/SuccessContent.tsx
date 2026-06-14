"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Package, Truck, Clock, Printer, FileText, X, Copy, Check, AlertCircle } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Invoice } from '@/components/Invoice';

import { toBlob } from 'html-to-image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderItem { id: string; product_name: string; size: string | null; quantity: number; price_at_purchase: number; }
interface ShippingAddress { name?: string; phone?: string; address: string; city: string; postal_code: string; province?: string; email?: string; shipping_cost?: number; }
interface Order {
  id: string;
  order_number?: string;
  created_at: string;
  total_price: number;
  courier?: string;
  shipping_address: ShippingAddress;
  customer_name?: string;
  order_items: OrderItem[];
  midtrans_id?: string;
  snap_token?: string;
  status?: string;
  payment_status?: string;
}

interface Props {
  order: Order | null;
  courierName: string;
  isInvalid: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-ink/5 rounded transition-colors text-ink/30 hover:text-ink/60"
      title="Copy to clipboard"
    >
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </button>
  );
}

export default function SuccessContent({ order, courierName, isInvalid }: Props) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const displayId = order?.order_number ? String(order.order_number).toUpperCase() : String(order?.id || '').toUpperCase();

  const handleDownloadImage = async () => {
    const element = document.getElementById('responsive-invoice-container');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      // Use html-to-image to render the element directly into a Blob.
      // This is much more reliable in React/Next.js than html2canvas.
      const blob = await toBlob(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          transform: 'scale(1)',
        }
      });
      
      if (!blob) throw new Error("Gagal membuat blob gambar");
      
      try {
        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
          const file = new File([blob], `Invoice_NINOC_${displayId}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Invoice NINOC ${displayId}`
            });
            setIsDownloading(false);
            return;
          }
        }
      } catch (shareError) {
        console.error('Web Share API gagal, fallback ke download biasa', shareError);
      }

      // Fallback download standar via Object URL
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `Invoice_NINOC_${displayId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setIsDownloading(false);
      
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Gagal mengunduh gambar invoice. Silakan coba lagi.');
      setIsDownloading(false);
    }
  };

  if (isInvalid || !order) {
    return (
      <div className="min-h-screen bg-cr noise flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.4em] text-rose mb-3">Invalid Order</p>
          <h1 className="text-xl md:text-2xl font-display font-medium italic uppercase tracking-tight text-ink mb-3">Order Not Found</h1>
          <p className="text-[11px] md:text-xs text-ink/50 font-medium leading-relaxed mb-4 md:mb-8">
            Pesanan tidak ditemukan atau belum menyelesaikan pembayaran. Jika Anda baru saja menyelesaikan pembayaran, tunggu beberapa saat lalu coba lagi.
          </p>
          <Link href="/checkout" className="inline-block px-6 py-3 bg-rose text-white text-[10px] md:text-xs font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors">
            Kembali ke Checkout
          </Link>
        </div>
      </div>
    );
  }

  const invoiceId = `NCO-${order.id.slice(0, 8).toUpperCase()}`;
  const sub = order.order_items?.reduce((acc: number, item: OrderItem) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
  const platform = 2500;
  const shipping = typeof order.shipping_address?.shipping_cost === 'number' 
    ? order.shipping_address.shipping_cost 
    : Math.max(0, order.total_price - sub - platform);

  return (
    <>
    <main className="min-h-screen bg-cr noise flex flex-col md:flex-row md:items-center md:justify-center px-3 md:px-6 py-6 md:py-0 print:hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-12 items-start text-left">

          {/* Column 1: Headers & Actions */}
          <div className="lg:col-span-3 flex flex-col space-y-2 md:space-y-4 order-1">
            <div className="space-y-1 md:space-y-4">
              <h1 className="text-lg md:text-3xl font-display font-medium italic text-ink tracking-tight flex items-center gap-2 md:gap-3">
                Payment Successful.
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  className="w-5 h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={12} />
                </motion.div>
              </h1>
              <p className="text-[11px] md:text-sm text-ink/40 font-medium leading-tight">
                Thank you for your purchase. We are now processing your order.
              </p>
            </div>

            {/* GUEST WARNING ALERT */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-amber-50/50 border border-amber-200 p-4 mt-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Simpan Bukti Pembelian</p>
                  <p className="text-[10px] md:text-xs text-amber-700/80 leading-relaxed">
                    Jika Anda berbelanja sebagai <strong className="font-bold">GUEST</strong>, sangat disarankan untuk <strong>Menyimpan (Screenshot/PDF)</strong> halaman ini atau mengunduh <strong>Full Invoice</strong> di bawah. Nomor Order (<strong className="font-mono">#{displayId}</strong>) ini merupakan kunci Anda untuk melacak pengiriman paket.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="hidden lg:flex flex-col space-y-4 pt-8 border-t border-ink/5"
            >
              <Link href="/shop" className="w-full bg-ink text-white px-6 py-4 text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose active:scale-[0.98] transition-all shadow-xl shadow-ink/5 group">
                Continue Collecting
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => setShowInvoiceModal(true)} className="w-full px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-ink hover:text-rose transition-colors flex items-center justify-center gap-2 border border-ink/10 hover:border-rose/20 bg-white">
                <FileText size={14} />
                View Full Invoice
              </button>
              <button onClick={() => window.print()} className="w-full px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-ink/50 hover:text-rose transition-colors flex items-center justify-center gap-2 border border-ink/5 hover:border-rose/20 bg-white/50">
                <Printer size={14} />
                Save as PDF
              </button>
              <div className="text-center pt-2">
                <Link href="/" className="inline-block px-8 py-3 text-[9px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose transition-colors border border-transparent hover:border-rose/20">
                  Return to Atelier
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Column 2: Receipt */}
          <div className="lg:col-span-4 w-full order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-ink/5 shadow-xl shadow-ink/5 overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="px-4 md:px-8 py-3 md:py-5 border-b border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-ink/[0.03] flex items-center justify-center">
                    <Printer size={13} className="text-ink/40" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-ink leading-none">Transaction Receipt</h3>
                    <p className="text-[10px] font-mono text-ink/50 mt-0.5">{displayId}</p>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-ink/40">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Invoice & Payment IDs */}
              <div className="px-4 md:px-8 py-2.5 md:py-3 border-b border-ink/5 bg-ink/[0.01]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-ink/30 mb-0.5">Invoice</p>
                    <div className="flex items-center">
                      <p className="text-[11px] font-mono font-semibold text-ink">{invoiceId}</p>
                      <CopyButton text={invoiceId} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-ink/30 mb-0.5">Order</p>
                    <div className="flex items-center">
                      <p className="text-[11px] font-mono font-semibold text-ink">#{displayId}</p>
                      <CopyButton text={displayId} />
                    </div>
                  </div>
                </div>
                {order.midtrans_id && (
                  <div className="mt-2 pt-2 border-t border-ink/5">
                    <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-ink/30 mb-0.5">Midtrans ID</p>
                    <div className="flex items-center">
                      <p className="text-[10px] font-mono font-medium text-ink/60 break-all">{order.midtrans_id}</p>
                      <CopyButton text={order.midtrans_id} />
                    </div>
                  </div>
                )}
              </div>

              {/* Purchased Items */}
              <div className="px-4 md:px-8 py-3 md:py-4 border-b border-ink/5">
                <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-ink/30 mb-2">Items</p>
                <div className="space-y-2">
                  {order.order_items?.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] md:text-sm font-semibold text-ink truncate leading-tight">{item.product_name}</p>
                        <p className="text-[10px] text-ink/40 mt-0.5">{item.size ? `Size ${item.size}` : 'One Size'} · ×{item.quantity}</p>
                      </div>
                      <p className="text-[11px] md:text-sm font-mono font-semibold text-ink shrink-0">IDR {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="px-4 md:px-8 py-3 md:py-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ink/50">Subtotal</span>
                  <span className="text-[11px] font-mono font-medium text-ink">{sub > 0 ? `IDR ${sub.toLocaleString('id-ID')}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ink/50">Logistics ({courierName})</span>
                  <span className="text-[11px] font-mono font-medium text-ink">{shipping > 0 ? `+ IDR ${shipping.toLocaleString('id-ID')}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-ink/50">Platform Fee</span>
                  <span className="text-[11px] font-mono font-medium text-ink">+ IDR 2.500</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-ink/10">
                  <span className="text-[11px] font-semibold text-ink">Total</span>
                  <span className="text-base md:text-lg font-display font-semibold italic text-rose">IDR {order.total_price.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="px-4 md:px-8 py-2.5 md:py-4 border-t border-ink/5 bg-ink/[0.01]">
                  <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-ink/30 mb-1">Ship To</p>
                  <p className="text-[11px] font-semibold text-ink leading-tight">{order.shipping_address.name || order.customer_name}</p>
                  <p className="text-[10px] text-ink/50 mt-0.5 leading-snug">{order.shipping_address.address}, {order.shipping_address.city} {order.shipping_address.postal_code}</p>
                </div>
              )}

              {/* View Invoice Button (inside receipt card) */}
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="w-full px-4 md:px-8 py-2.5 md:py-4 border-t border-ink/5 bg-ink/[0.02] hover:bg-rose/5 transition-colors flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink/40 hover:text-rose cursor-pointer group"
              >
                <FileText size={12} className="group-hover:scale-110 transition-transform" />
                Lihat Invoice Lengkap
              </button>
            </motion.div>
          </div>

          {/* Column 3: Timeline */}
          <div className="lg:col-span-5 w-full flex flex-col order-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-ink/5 p-4 md:p-8 shadow-xl shadow-ink/5 relative overflow-hidden"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink/30 mb-4 md:mb-8 flex items-center justify-between border-b border-ink/5 pb-3 md:pb-4">
                <span>Shipment Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] text-emerald-600">Live</span>
                </div>
              </h3>

              <div className="relative pl-7 md:pl-10 border-l-2 border-ink/5 ml-4 md:ml-8 flex flex-col gap-0 md:gap-8">

                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                  className="relative group"
                >
                  <div className="absolute -left-[36px] md:-left-[54px] p-1.5 md:p-2 bg-white rounded-full border-[3px] border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <ShieldCheck size={16} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-500/20 p-3 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center gap-2 mb-1 relative">
                      <h4 className="text-[11px] md:text-xs font-semibold text-emerald-700">Payment Confirmed</h4>
                      <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-px rounded">ACTIVE</span>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-emerald-600/60 flex items-center gap-1 relative">
                      <Clock size={10} strokeWidth={2} /> Just Now · Authenticated
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                  className="relative group hover:scale-[1.01] transition-transform"
                >
                  <div className="absolute -left-[36px] md:-left-[54px] p-1.5 md:p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                    <Package size={16} strokeWidth={2} />
                  </div>
                  <div className="p-3 md:p-6 border border-ink/5 bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all">
                    <h4 className="text-[11px] md:text-xs font-semibold text-ink/40 group-hover:text-ink/70 transition-colors mb-0.5">Processing in Atelier</h4>
                    <p className="text-[9px] md:text-[10px] text-ink/30">Pending Quality Control</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                  className="relative group hover:scale-[1.01] transition-transform"
                >
                  <div className="absolute -left-[36px] md:-left-[54px] p-1.5 md:p-2 bg-white rounded-full border-[3px] border-ink/10 text-ink/30 group-hover:border-ink/30 group-hover:text-ink/60 transition-colors">
                    <Truck size={16} strokeWidth={2} />
                  </div>
                  <div className="p-3 md:p-6 border border-ink/5 bg-ink/[0.01] group-hover:bg-white group-hover:shadow-lg transition-all">
                    <h4 className="text-[11px] md:text-xs font-semibold text-ink/40 group-hover:text-ink/70 transition-colors mb-0.5">Handed to Logistics</h4>
                    <p className="text-[9px] md:text-[10px] text-ink/30">Courier: <span className="text-ink/50">{courierName}</span></p>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </div>

          {/* Mobile Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="lg:hidden w-full flex flex-col space-y-2 pt-2 border-t border-ink/5 order-4"
          >
            <Link href="/shop" className="w-full bg-ink text-white px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose active:scale-[0.98] transition-all shadow-xl shadow-ink/5 group">
              Continue Collecting
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => setShowInvoiceModal(true)} className="w-full px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink hover:text-rose transition-colors flex items-center justify-center gap-2 border border-ink/10 hover:border-rose/20 bg-white">
              <FileText size={13} />
              View Full Invoice
            </button>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 px-4 py-2.5 text-[9px] font-medium uppercase tracking-wider text-ink/40 hover:text-rose transition-colors flex items-center justify-center gap-1.5 border border-ink/5 hover:border-rose/20 bg-white/50">
                <Printer size={12} />
                Save PDF
              </button>
              <Link href="/" className="flex-1 px-4 py-2.5 text-[9px] font-medium uppercase tracking-wider text-ink/30 hover:text-rose transition-colors flex items-center justify-center border border-ink/5 hover:border-rose/20 bg-white/50">
                Back to Home
              </Link>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </main>

    {/* ===== PRINTABLE INVOICE ===== */}
    <div className="hidden print:block bg-white text-black p-8 w-full h-full max-w-4xl mx-auto font-sans m-0">
      <PrintableInvoice order={order} courierName={courierName} />
    </div>

    {/* ===== INVOICE MODAL ===== */}
    <AnimatePresence>
      {showInvoiceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-ink/70 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-y-auto"
          onClick={() => setShowInvoiceModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white shadow-2xl mt-4 md:mt-8 max-w-[600px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-8 h-8 bg-ink text-white rounded-full flex items-center justify-center hover:bg-rose transition-colors shadow-lg z-10 cursor-pointer"
            >
              <X size={14} />
            </button>

            {/* Invoice Content */}
            <div className="overflow-auto max-h-[70vh] md:max-h-[85vh] w-full bg-ink/[0.02] p-4 md:p-8 flex justify-start md:justify-center">
              <div id="responsive-invoice-container" className="w-full shrink-0">
                <Invoice order={order as any} />
              </div>
            </div>
            
            {/* Scroll Hint for Mobile */}
            <div className="md:hidden text-center p-2 text-[9px] uppercase tracking-widest text-ink/40 bg-ink/[0.02] border-t border-ink/5">
              Geser untuk melihat lebih lengkap →
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-ink/10 p-4 flex flex-col md:flex-row gap-3">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex-1 bg-ink text-white py-3 text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                )}
                {isDownloading ? 'Menyimpan...' : 'Simpan Gambar (PNG)'}
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setTimeout(() => window.print(), 300);
                }}
                className="flex-1 bg-white border border-ink/10 text-ink py-3 text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                Cetak / Save PDF
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

function PrintableInvoice({ order, courierName }: { order: Order; courierName: string }) {
  const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const displayId = order.order_number ? String(order.order_number).toUpperCase() : String(order.id).toUpperCase();
  const sub = order.order_items?.reduce((acc: number, item: OrderItem) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
  const platform = 2500;
  const shipping = typeof order.shipping_address?.shipping_cost === 'number' 
    ? order.shipping_address.shipping_cost 
    : Math.max(0, order.total_price - sub - platform);

  return (
    <div className="border border-black p-8 bg-white">
      <div className="flex justify-between items-start border-b-[3px] border-black pb-6 mb-6">
        <div>
          <h1 className="font-display font-medium text-4xl italic uppercase tracking-tighter mb-1">NINOC</h1>
          <p className="text-[11px] md:text-xs tracking-wider uppercase font-medium">Archival Studio Investment</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-medium uppercase tracking-wider mb-2">Invoice</h2>
          <p className="text-xs font-mono">{displayId}</p>
          {order.midtrans_id && (
            <p className="text-[10px] font-mono text-ink/50 mt-1">TX: {order.midtrans_id}</p>
          )}
          <p className="text-[11px] md:text-xs uppercase mt-1">{order.created_at ? new Date(order.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : `${date} ${time}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-4 md:mb-8 text-sm">
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-widest font-medium mb-2 border-b border-black/20 pb-1">Billed To</p>
          <p className="font-medium">{order.customer_name || 'Customer Name'}</p>
          <p className="text-xs mt-1">{order.shipping_address?.email || 'customer@email.com'}</p>
          <p className="text-xs font-mono">{order.shipping_address?.name || '+62 812-XXXX-XXXX'}</p>
        </div>
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-widest font-medium mb-2 border-b border-black/20 pb-1">Shipped To</p>
          <p className="text-xs">{order.shipping_address?.address || 'Jakarta Selatan, DKI Jakarta'}</p>
          <p className="text-xs">{order.shipping_address?.city || '12345'}, {order.shipping_address?.postal_code || 'Indonesia'}</p>
          <p className="text-[11px] md:text-xs font-medium mt-2 uppercase tracking-wider">Via <span className="font-medium underline">{order.courier || courierName}</span></p>
        </div>
      </div>

      <table className="w-full mb-4 md:mb-8 text-sm border-collapse">
        <thead>
          <tr className="border-b-[3px] border-black text-[10px] md:text-xs uppercase tracking-widest text-left">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {order.order_items?.map((item: OrderItem) => (
            <tr key={item.id} className="border-b border-black/10">
              <td className="py-4 font-sans font-medium text-sm uppercase">{item.product_name} {item.size ? `(Size ${item.size})` : ''}</td>
              <td className="py-4 text-center">{item.quantity}</td>
              <td className="py-4 text-right">IDR {item.price_at_purchase.toLocaleString('id-ID')}</td>
              <td className="py-4 text-right">IDR {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-1/2 space-y-2 text-sm">
          <div className="flex justify-between border-b border-black/10 pb-1">
            <span className="text-[11px] md:text-xs uppercase tracking-widest font-medium">Subtotal</span>
            <span className="font-mono">IDR {sub.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between border-b border-black/10 pb-1">
            <span className="text-[11px] md:text-xs uppercase tracking-widest font-medium">Logistics</span>
            <span className="font-mono">IDR {shipping > 0 ? shipping.toLocaleString('id-ID') : '0'}</span>
          </div>
          <div className="flex justify-between border-b border-black/10 pb-1">
            <span className="text-[11px] md:text-xs uppercase tracking-widest font-medium">Platform Fee</span>
            <span className="font-mono">IDR 2,500</span>
          </div>
          <div className="flex justify-between pt-2 border-b-[3px] border-black pb-2 mt-2">
            <span className="font-medium uppercase tracking-widest">Total Investment</span>
            <span className="font-medium font-mono text-lg">IDR {order.total_price.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-black/20 text-center">
        <p className="text-[11px] md:text-[8px] uppercase tracking-[0.3em] font-medium">This document is a valid proof of transaction generated electronically.</p>
      </div>
    </div>
  );
}