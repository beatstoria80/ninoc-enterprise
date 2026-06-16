"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from '@/components/LocalizedLink';
import Footer from '@/components/Footer';
import { X, MapPin, Truck } from 'lucide-react';
import dynamic from 'next/dynamic';
import CourierLogo from '@/components/CourierLogo';
import { supabase } from '@/lib/supabase';
import jsQR from 'jsqr';

const MapTracker = dynamic(() => import('@/components/MapTracker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-ink/5 animate-pulse flex items-center justify-center text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-semibold border border-ink/10">
      Initializing Live Map...
    </div>
  )
});

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
  { key: 'paid', label: 'Paid', sub: 'Pembayaran terkonfirmasi' },
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
    <span className={`text-[11px] md:text-[8px] uppercase tracking-widest font-semibold px-2 py-1 border rounded-sm ${info.cls}`}>
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

export default function TrackClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order_number') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  
  // QR Scan State
  const [mode, setMode] = useState<'manual' | 'qr'>('manual');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const phoneInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qOrder = searchParams.get('order_number');
    const qPhone = searchParams.get('phone');
    if (qOrder && qPhone) {
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleTrack(mockEvent, qOrder, qPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleTrack(e: React.FormEvent, directOrder?: string, directPhone?: string) {
    e.preventDefault();
    const trackOrder = directOrder || orderNumber;
    const trackPhone = directPhone || phone;
    
    if (!trackOrder.trim() || !trackPhone.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/track?order_number=${encodeURIComponent(trackOrder.trim())}&phone=${encodeURIComponent(trackPhone.trim())}`);
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

  // Realtime subscription
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`track-${order.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, () => {
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        handleTrack(mockEvent, orderNumber, phone);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tracking_logs',
        filter: `order_id=eq.${order.id}`
      }, () => {
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        handleTrack(mockEvent, orderNumber, phone);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, orderNumber, phone]);

  const currentStep = order ? getStepIndex(order.status) : -1;
  const scrollbarStyles = "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-ink/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-ink/20";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('scanning');
    setScanMessage('Menganalisis Gambar...');
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setScanStatus('error');
          setScanMessage('Gagal memproses gambar. Silakan isi manual.');
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          setOrderNumber(code.data);
          setScanStatus('success');
          setScanMessage('QR Ditemukan! Silakan masukkan Nomor WA Anda.');
          // Switch to manual mode so they can enter phone
          setTimeout(() => {
            setMode('manual');
            phoneInputRef.current?.focus();
          }, 1500);
        } else {
          setScanStatus('error');
          setScanMessage('QR Tidak Terbaca. Pastikan gambar jelas atau isi manual.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderForm = () => (
    <div className="bg-ink/[0.01] border border-ink/5 p-4 flex flex-col gap-4">
      {/* TABS */}
      <div className="flex border-b border-ink/10">
        <button 
          onClick={() => setMode('manual')}
          className={`flex-1 pb-2 text-xs md:text-[10px] uppercase tracking-widest font-semibold transition-colors ${mode === 'manual' ? 'text-rose border-b-2 border-rose' : 'text-ink/40 hover:text-ink/70'}`}
        >
          Manual Input
        </button>
        <button 
          onClick={() => setMode('qr')}
          className={`flex-1 pb-2 text-xs md:text-[10px] uppercase tracking-widest font-semibold transition-colors ${mode === 'qr' ? 'text-rose border-b-2 border-rose' : 'text-ink/40 hover:text-ink/70'}`}
        >
          Upload Invoice (QR)
        </button>
      </div>

      {mode === 'manual' ? (
        <form onSubmit={handleTrack} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs md:text-[10px] uppercase tracking-widest font-semibold text-ink">Order Number</label>
            <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} onPaste={e => { const pasted = e.clipboardData.getData('text'); if (pasted) { e.preventDefault(); setOrderNumber(pasted.trim()); } }} placeholder="NC-20250604-XXXX" className="w-full px-3 py-2 text-[13px] font-medium border border-ink/20 bg-white focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 placeholder:text-ink/60 uppercase tracking-wider text-ink" aria-label="Order number" />
          </div>
          <div className="space-y-1">
            <label className="text-xs md:text-[10px] uppercase tracking-widest font-semibold text-ink">Nomor WhatsApp</label>
            <input ref={phoneInputRef} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full px-3 py-2 text-[13px] font-medium border border-ink/20 bg-white focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 placeholder:text-ink/60 text-ink" aria-label="Phone number" />
            <p className="text-[10px] md:text-[8px] text-ink/40 uppercase tracking-widest mt-1 italic">*Wajib diisi demi keamanan data pengiriman.</p>
          </div>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 text-xs md:text-[9px] text-red-500 font-semibold uppercase tracking-wider">{error}</div>}
          <button type="submit" disabled={loading || !orderNumber.trim() || !phone.trim()} className="w-full py-3 bg-rose text-white text-xs md:text-[10px] uppercase tracking-[0.3em] font-semibold hover:bg-rose/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 mt-2">
            {loading ? 'Loading…' : 'Lacak Pesanan'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-xs md:text-[10px] text-ink/60 leading-relaxed uppercase tracking-widest">Unggah *screenshot* atau foto Invoice Anda. Sistem akan otomatis memindai QR Code untuk mendapatkan Nomor Pesanan.</p>
          
          <label className="border-2 border-dashed border-ink/20 bg-white p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-rose/50 hover:bg-rose/5 transition-colors group">
            <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleFileUpload} />
            <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-rose/10 group-hover:text-rose text-ink/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <span className="text-xs md:text-[10px] uppercase tracking-widest font-semibold text-ink/60 group-hover:text-rose">Pilih Gambar Invoice (PNG/JPG)</span>
          </label>

          {scanStatus !== 'idle' && (
            <div className={`px-3 py-2 border text-xs md:text-[9px] font-semibold uppercase tracking-wider ${
              scanStatus === 'scanning' ? 'bg-blue-50 border-blue-200 text-blue-600' :
              scanStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
              'bg-red-50 border-red-200 text-red-500'
            }`}>
              {scanMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col bg-white text-ink font-medium selection:bg-ink selection:text-white">
      <div className="flex-1 pt-20 max-w-[1600px] w-full mx-auto px-4 sm:px-6 flex flex-col">
        <div className="border-b border-ink/5 pb-4 mb-6 flex justify-between items-start shrink-0 sticky top-14 lg:static bg-white z-30 pt-4 -mt-4">
          <div>
            <div className="flex items-baseline gap-4">
              <h1 className="font-display font-medium italic text-2xl tracking-tighter uppercase text-ink">Track Order</h1>
              <span className="text-xs md:text-[10px] uppercase tracking-widest text-ink font-semibold bg-ink/5 px-2 py-0.5 rounded-sm">GUEST ACCESS</span>
            </div>
            <p className="text-sm md:text-[11px] text-ink mt-2 uppercase tracking-widest">Sistem Pelacakan Real-Time</p>
          </div>
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 text-ink/40 hover:bg-rose/10 hover:text-rose transition-colors flex-shrink-0" title="Kembali ke Beranda">
            <X size={14} strokeWidth={1.5} />
          </Link>
        </div>

        {!loading && searched && order ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 items-stretch flex-1 lg:h-[calc(100vh-180px)] pb-10 lg:pb-0">
            {/* GRID 1: Form & Overview */}
            <div className={`flex flex-col gap-4 lg:overflow-y-auto pr-1 ${scrollbarStyles}`}>
              {renderForm()}
              
              <div className="bg-ink/[0.01] border border-ink/5 p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-ink/5">
                  <div>
                    <p className="text-xs md:text-[10px] uppercase tracking-widest text-ink mb-1 font-semibold">Order Number</p>
                    <p className="text-[13px] font-semibold uppercase tracking-wider text-ink">{order.order_number}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {order.shipping_address && (
                  <div>
                    <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-2">Alamat Pengiriman</p>
                    <p className="text-xs md:text-[10px] font-semibold uppercase">{order.shipping_address.name}</p>
                    <p className="text-xs md:text-[9px] text-ink/50 mt-1 leading-relaxed uppercase">{order.shipping_address.address}</p>
                    <p className="text-xs md:text-[9px] text-ink/40 mt-0.5 uppercase">{order.shipping_address.city} {order.shipping_address.postal_code}</p>
                  </div>
                )}

                {order.tracking_id && (
                  <div className="pt-4 border-t border-ink/5 mt-2">
                    <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-2">Nomor Resi</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-[11px] font-semibold uppercase tracking-wider">{order.tracking_id}</span>
                        {order.courier && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-[11px] md:text-[8px] text-ink/30 uppercase tracking-widest">via</span>
                            <CourierLogo courier={order.courier} className="h-3" />
                            <span className="text-[11px] md:text-[8px] text-ink/30 uppercase tracking-widest">{order.courier}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(order.tracking_id!)} className="text-[11px] md:text-[8px] font-semibold uppercase tracking-widest text-rose hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1 rounded-sm" aria-label="Copy tracking ID">Copy</button>
                    </div>
                    {order.logs.find(l => l.courier_link) && (
                      <a href={order.logs.find(l => l.courier_link)?.courier_link || '#'} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-xs md:text-[9px] font-semibold text-rose uppercase tracking-widest hover:underline">
                        Lacak di Website Kurir <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-ink/5 mt-auto">
                  <Link href="/help" className="flex-1 py-2 text-[10px] md:text-[8px] uppercase tracking-widest font-semibold text-center border border-ink/10 text-ink/50 hover:border-ink/20 hover:text-ink transition-colors cursor-pointer rounded-sm">Help Guide</Link>
                  <button onClick={() => { setOrder(null); setSearched(false); setOrderNumber(''); setPhone(''); }} className="flex-1 py-2 bg-ink/5 text-ink text-[10px] md:text-[8px] uppercase tracking-widest font-semibold text-center hover:bg-ink/10 transition-colors cursor-pointer rounded-sm">Reset</button>
                </div>
              </div>
            </div>

            {/* GRID 2: Status & Items */}
            <div className={`flex flex-col gap-4 lg:overflow-y-auto pr-1 ${scrollbarStyles}`}>
              <div className="bg-ink/[0.01] border border-ink/5 p-5">
                <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-6">Status Pengiriman</p>
                <div className="flex flex-col gap-0">
                  {STATUS_STEPS.filter(s => s.key !== 'cancelled').map((step, idx) => {
                    const done = currentStep > idx;
                    const active = currentStep === idx;
                    const isLast = idx === STATUS_STEPS.filter(s => s.key !== 'cancelled').length - 1;
                    return (
                      <div key={step.key} className="flex items-stretch">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${done ? 'bg-rose border-rose' : active ? 'bg-white border-rose' : 'bg-white border-ink/10'}`}>
                            {done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            {!done && active && <div className="w-2 h-2 rounded-full bg-rose" />}
                          </div>
                          {!isLast && <div className={`w-px flex-1 my-1 min-h-[20px] ${done ? 'bg-rose' : 'bg-ink/10'}`} />}
                        </div>
                        <div className={`pb-6 pt-0.5`}>
                           <p className={`text-[11px] md:text-[9px] font-bold uppercase tracking-wider ${active ? 'text-rose' : done ? 'text-ink/80' : 'text-ink/30'}`}>{step.label}</p>
                           <p className={`text-[10px] md:text-[8px] mt-1 ${active ? 'text-ink/60' : done ? 'text-ink/40' : 'text-ink/20'}`}>{step.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.items.length > 0 && (
                <div className="bg-ink/[0.01] border border-ink/5 p-5 flex-1">
                  <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-5">Item Pesanan</p>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex flex-col gap-1 pb-4 border-b border-ink/5 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] md:text-[10px] font-semibold text-ink leading-tight">{item.product_name}</p>
                          <span className="text-[11px] md:text-[9px] font-semibold text-ink/70 shrink-0">{formatPrice(item.price_at_purchase)}</span>
                        </div>
                        <p className="text-[10px] md:text-[8px] text-ink/40 uppercase tracking-wider">{item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-ink/10">
                    <span className="text-xs md:text-[9px] uppercase tracking-widest font-semibold text-ink/40">Total Tagihan</span>
                    <span className="text-[14px] font-bold text-ink">{formatPrice(order.total_price)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* GRID 3: History */}
            <div className={`bg-ink/[0.01] border border-ink/5 p-5 lg:overflow-y-auto pr-2 ${scrollbarStyles}`}>
              <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 font-semibold mb-6">Logistics History</p>
              {order.logs.length > 0 ? (
                <div className="relative pl-5 border-l border-ink/10 space-y-7 ml-2 pb-4">
                  {order.logs.map((log, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={log.id} className="relative">
                        <div className={`absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center bg-white ${isLatest ? 'border-rose' : 'border-ink/20'}`}>
                          {isLatest && <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div>
                            <span className={`text-[10px] md:text-[8px] font-bold tracking-widest uppercase ${isLatest ? 'text-rose' : 'text-ink/40'}`}>
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <div>
                            <p className={`text-[11px] md:text-[9px] font-bold uppercase tracking-wider mb-1.5 ${isLatest ? 'text-ink' : 'text-ink/60'}`}>
                              {log.biteship_status || log.internal_status || 'UPDATE'}
                            </p>
                            {log.description && (
                              <p className={`text-[11px] md:text-[9px] leading-relaxed mb-2.5 ${isLatest ? 'text-ink/80' : 'text-ink/50'}`}>
                                {log.description}
                              </p>
                            )}
                            {(log.location || log.courier_company) && (
                              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-ink/5">
                                {log.location && (
                                  <p className="text-[9px] md:text-[7.5px] text-ink/40 uppercase tracking-widest flex items-center gap-1.5">
                                    <MapPin size={10} className={isLatest ? "text-rose/50" : "text-ink/30"} /> {log.location}
                                  </p>
                                )}
                                {log.courier_company && (
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[9px] md:text-[7.5px] text-ink/40 uppercase tracking-widest flex items-center gap-1.5">
                                      <Truck size={10} className={isLatest ? "text-rose/50" : "text-ink/30"} /> 
                                      <CourierLogo courier={log.courier_company} className="h-2.5" />
                                      {log.courier_company}{log.courier_driver_name ? ` — ${log.courier_driver_name}` : ''}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <p className="text-[10px] md:text-[8px] uppercase tracking-widest font-semibold">Menunggu Update</p>
                   <p className="text-[10px] md:text-[8px] text-ink/40 text-center mt-2">Belum ada history perjalanan dari kurir.</p>
                </div>
              )}
            </div>

            {/* GRID 4: Map */}
            <div className="border border-ink/5 bg-ink/[0.01] h-[400px] lg:h-full relative overflow-hidden flex flex-col">
              <div className="p-3 border-b border-ink/5 bg-white/80 backdrop-blur-md z-10 shrink-0 shadow-sm shadow-ink/5">
                <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/60 font-bold flex items-center gap-2">
                  <MapPin size={12} className="text-rose" /> Live Map Tracker
                </p>
              </div>
              <div className="flex-1 relative w-full h-full">
                <MapTracker 
                  destinationCity={order.shipping_address?.city} 
                  status={order.status}
                  logs={order.logs}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[500px] w-full mx-auto mt-10">
            {renderForm()}
            {!loading && !searched && (
              <div className="flex flex-col items-center py-16 gap-4 text-ink/20 mt-8 border border-ink/5 bg-ink/[0.01]">
                <div className="w-12 h-12 border border-ink/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1"/><path d="M10 6v5M10 14v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs md:text-[9px] uppercase tracking-widest font-semibold mb-2">Input Required</p>
                  <p className="text-[11px] md:text-[9px] text-ink/40 max-w-xs leading-relaxed">Masukkan nomor pesanan dan nomor WhatsApp yang digunakan saat checkout untuk melacak pesanan Anda.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Hide footer when order is displayed to save space for 4-grids layout */}
      {(!searched || !order) && <Footer />}
    </main>
  );
}
