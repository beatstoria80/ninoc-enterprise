"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface OrderItem {
  id: string;
  product_name: string;
  size: string | null;
  quantity: number;
  price_at_purchase: number;
}

interface TrackingLog {
  id: string;
  biteship_status: string | null;
  internal_status: string | null;
  description: string | null;
  location: string | null;
  courier_company: string | null;
  courier_driver_name: string | null;
  courier_driver_phone: string | null;
  courier_link: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_price: number;
  courier: string | null;
  tracking_id: string | null;
  created_at: string;
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
  } | null;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  logs: TrackingLog[];
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', sub: 'Pesanan diterima' },
  { key: 'paid', label: 'Payment Verified', sub: 'Pembayaran terkonfirmasi' },
  { key: 'processing', label: 'Processing', sub: 'Sedang diolah di studio' },
  { key: 'shipped', label: 'In Transit', sub: 'Dalam perjalanan' },
  { key: 'delivered', label: 'Delivered', sub: 'Sudah diterima' },
  { key: 'cancelled', label: 'Cancelled', sub: 'Dibatalkan' },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    paid: { label: 'Paid', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    processing: { label: 'Processing', cls: 'bg-violet-50 text-violet-600 border-violet-200' },
    shipped: { label: 'In Transit', cls: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-500 border-red-200' },
  };
  const info = map[status] || { label: status, cls: 'bg-ink/5 text-ink/50 border-ink/10' };
  return (
    <span className={`text-[8px] uppercase tracking-widest font-semibold px-2 py-1 border rounded-sm ${info.cls}`}>
      {info.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/track?order_number=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Gagal mengambil data pesanan.');
        setOrder(null);
      } else {
        setOrder({ ...json.order, items: json.items, logs: json.logs });
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? getStepIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white pb-24">
      <div className="pt-20 max-w-[800px] mx-auto px-4 sm:px-6">
        {/* Page Title */}
        <div className="border-b border-ink/5 pb-4 mb-6">
          <div className="flex items-baseline gap-4">
            <h1 className="font-display font-medium italic text-2xl tracking-tighter uppercase text-ink">Track Order</h1>
            <span className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold">GUEST ACCESS</span>
          </div>
          <p className="text-[9px] text-ink/30 mt-2 uppercase tracking-widest">Lacak status pesanan tanpa perlu login</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-ink/10 bg-ink/[0.01]">
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest font-semibold text-ink/40">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="NC-20250604-XXXX"
                className="w-full px-3 py-2 text-[11px] font-medium border border-ink/10 bg-white focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 placeholder:text-ink/20 uppercase tracking-wider"
                aria-label="Order number"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest font-semibold text-ink/40">Nomor WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 text-[11px] font-medium border border-ink/10 bg-white focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 placeholder:text-ink/20"
                aria-label="Phone number"
              />
            </div>
          </div>
          {error && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-[9px] text-red-500 font-semibold uppercase tracking-wider">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !phone.trim()}
            className="mt-3 w-full py-3 bg-rose text-white text-[10px] uppercase tracking-[0.3em] font-semibold hover:bg-rose/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2"
          >
            {loading ? 'Loading…' : 'Lacak Pesanan'}
          </button>
        </form>

        {/* Order Result */}
        {!loading && searched && order && (
          <div className="space-y-6">
            {/* Order Meta */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink/5">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-ink/30 mb-1">Order Number</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider">{order.order_number}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              <p className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold">Status Pengiriman</p>
              <div className="flex items-center gap-0">
                {STATUS_STEPS.filter(s => s.key !== 'cancelled').map((step, idx) => {
                  const done = currentStep > idx;
                  const active = currentStep === idx;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                          ${done ? 'bg-rose border-rose' : active ? 'bg-white border-rose' : 'bg-white border-ink/10'}
                        `}>
                          {done && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {!done && active && <div className="w-2 h-2 rounded-full bg-rose" />}
                        </div>
                        <div className="text-center">
                          <p className={`text-[7px] font-semibold uppercase tracking-wider ${active ? 'text-rose' : done ? 'text-ink/50' : 'text-ink/20'}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                      {idx < STATUS_STEPS.filter(s => s.key !== 'cancelled').length - 1 && (
                        <div className={`flex-1 h-px mx-1 mb-4 ${done ? 'bg-rose' : 'bg-ink/10'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking Log */}
            {order.logs.length > 0 && (
              <div className="space-y-3">
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold">Logistics History</p>
                <div className="space-y-2">
                  {order.logs.map((log) => (
                    <div key={log.id} className="flex gap-3 p-3 border border-ink/5 bg-ink/[0.01]">
                      <div className="w-3 h-3 rounded-full bg-rose/30 border border-rose/30 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-semibold uppercase tracking-widest text-rose/60">{log.biteship_status || log.internal_status || '—'}</span>
                          <span className="text-[7px] text-ink/20">{formatDate(log.created_at)}</span>
                        </div>
                        {log.description && <p className="text-[9px] text-ink/50 font-medium">{log.description}</p>}
                        {log.location && <p className="text-[8px] text-ink/30 uppercase tracking-wider mt-0.5">{log.location}</p>}
                        {log.courier_company && (
                          <div className="mt-1 pt-1 border-t border-ink/5">
                            <span className="text-[7px] text-ink/20 uppercase tracking-widest">
                              {log.courier_company}
                              {log.courier_driver_name ? ` · ${log.courier_driver_name}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking ID */}
            {order.tracking_id && (
              <div className="p-4 border border-ink/10 bg-ink/[0.01]">
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-2">Nomor Resi</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{order.tracking_id}</span>
                    {order.courier && <span className="text-[8px] text-ink/30 ml-3 uppercase tracking-widest">via {order.courier}</span>}
                  </div>
                  {order.tracking_id && (
                    <button
                      onClick={() => navigator.clipboard.writeText(order.tracking_id!)}
                      className="text-[8px] font-semibold uppercase tracking-widest text-rose hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm"
                      aria-label="Copy tracking ID"
                    >
                      Copy
                    </button>
                  )}
                </div>
                {order.logs.find(l => l.courier_link) && (
                  <a
                    href={order.logs.find(l => l.courier_link)?.courier_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-rose uppercase tracking-widest hover:underline"
                  >
                    Lacak di Website Kurir
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Order Items */}
            {order.items.length > 0 && (
              <div className="space-y-3">
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold">Item Pesanan</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-ink/5 bg-ink/[0.01]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-ink">{item.product_name}</p>
                        <p className="text-[8px] text-ink/30 uppercase tracking-wider mt-0.5">
                          {item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-ink/70 shrink-0 ml-3">
                        {formatPrice(item.price_at_purchase)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-ink/40">Total</span>
                  <span className="text-[12px] font-semibold text-ink">{formatPrice(order.total_price)}</span>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="p-4 border border-ink/5 bg-ink/[0.01]">
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-2">Alamat Pengiriman</p>
                <p className="text-[10px] font-semibold">{order.shipping_address.name}</p>
                <p className="text-[9px] text-ink/50 mt-1">{order.shipping_address.address}</p>
                <p className="text-[9px] text-ink/30 mt-0.5">{order.shipping_address.city} {order.shipping_address.postal_code}</p>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3 pt-2">
              <Link href="/help" className="flex-1 py-3 text-[9px] uppercase tracking-widest font-semibold text-center border border-ink/10 text-ink/50 hover:border-ink/20 hover:text-ink transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm">
                Help Guide
              </Link>
              <button onClick={() => { setOrder(null); setSearched(false); setOrderNumber(''); setPhone(''); }} className="flex-1 py-3 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold text-center hover:bg-rose/90 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-sm">
                Lacak Pesanan Lain
              </button>
            </div>
          </div>
        )}

        {/* Empty State — not searched yet */}
        {!loading && !searched && (
          <div className="flex flex-col items-center py-16 gap-4 text-ink/20">
            <div className="w-12 h-12 border border-ink/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1"/>
                <path d="M10 6v5M10 14v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest font-semibold mb-1">Input Required</p>
              <p className="text-[8px] text-ink/30 max-w-xs">
                Masukkan nomor pesanan dan nomor WhatsApp yang digunakan saat checkout untuk melacak pesanan Anda.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}