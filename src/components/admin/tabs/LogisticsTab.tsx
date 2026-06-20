import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, X, Package, Truck, Box, ScanBarcode, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { cn, getShippingSLA } from '@/lib/utils';
import { format } from 'date-fns';
import CourierLogo from '@/components/CourierLogo';
import { Order } from '../types';
import { supabase } from '@/lib/supabase';
import MapTracker from '@/components/MapTracker';

export function LogisticsTab({
  orders,
  logisticsFilter,
  setLogisticsFilter,
  logisticsSelectedOrder,
  setLogisticsSelectedOrder,
  openOrderDetail,
  onOrderUpdated
}: {
  orders: Order[];
  logisticsFilter: string;
  setLogisticsFilter: (s: string) => void;
  logisticsSelectedOrder: Order | null;
  setLogisticsSelectedOrder: (o: Order | null) => void;
  openOrderDetail: (o: Order) => void;
  onOrderUpdated?: (o: Order) => void;
}) {
  const logisticsOrders = logisticsFilter === 'all'
    ? orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))
    : orders.filter(o => o.status === logisticsFilter);

  const pendingCount = orders.filter(o => o.status === 'paid').length;
  const inTransitCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const formattedDate = now 
    ? new Date(now).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  // ===== SCANNER STATE =====
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isScannerOpen && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [isScannerOpen]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    setScanStatus('loading');
    setScanMessage('Verifying shipping label...');
    
    const query = scanInput.trim().toUpperCase();
    
    // Find in local orders
    const targetOrder = orders.find(o => 
      o.id.toUpperCase() === query || 
      o.id.toUpperCase().startsWith(query.replace('NNC', '')) ||
      (o.tracking_id && o.tracking_id.toUpperCase() === query)
    );

    if (!targetOrder) {
      setScanStatus('error');
      setScanMessage('Barcode not recognized in database.');
      setScanInput('');
      setTimeout(() => setScanStatus('idle'), 4000);
      return;
    }

    if (targetOrder.status === 'shipped' || targetOrder.status === 'delivered') {
      setScanStatus('error');
      setScanMessage(`Already Dispatched (ID: #${targetOrder.id.slice(0,8).toUpperCase()})`);
      setScanInput('');
      setTimeout(() => setScanStatus('idle'), 4000);
      return;
    }

    if (targetOrder.status !== 'paid') {
      setScanStatus('error');
      setScanMessage(`Cannot Dispatch. Current Status: ${targetOrder.status.toUpperCase()}`);
      setScanInput('');
      setTimeout(() => setScanStatus('idle'), 4000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', targetOrder.id)
        .eq('status', 'paid')
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Pesanan ini sudah diproses oleh staf lain!');
      }

      setScanStatus('success');
      setScanMessage(`Success! Order #${targetOrder.id.slice(0,8).toUpperCase()} Dispatched.`);
      
      // Optimistic update
      targetOrder.status = 'shipped';
      if (onOrderUpdated) onOrderUpdated({ ...targetOrder });
      
    } catch (err: any) {
      setScanStatus('error');
      setScanMessage(err.message || 'Failed to communicate with archive server.');
    }
    
    setScanInput('');
    setTimeout(() => {
      setScanStatus(prev => prev === 'success' || prev === 'error' ? 'idle' : prev);
    }, 4000);
  };

  const [isDispatching, setIsDispatching] = useState(false);

  const handleRequestPickup = async (order: Order) => {
    if (!order || !['paid', 'shipped'].includes(order.status)) return;
    setIsDispatching(true);
    
    try {
      // Basic split for courier string (e.g. "SICEPAT REG")
      const parts = (order.courier || 'sicepat reg').split(' ');
      const courierCompany = parts[0].toLowerCase();
      const courierType = parts.slice(1).join(' ').toLowerCase() || 'reg';
      
      const payload = {
        order_id: order.id,
        courier_company: courierCompany,
        courier_type: courierType,
        destination: {
          contact_name: order.shipping_address?.name || 'Customer',
          contact_phone: order.shipping_address?.phone || '0800000000',
          address: order.shipping_address?.address || 'Alamat tidak diketahui',
          postal_code: order.shipping_address?.postal_code || 12345,
          note: `Pesanan NINOC #${order.id}`
        },
        origin: {
          contact_name: "NINOC Warehouse",
          contact_phone: "081234567890",
          address: "Jalan Contoh Gudang No. 1",
          postal_code: 12345,
          note: "Gudang Utama NINOC"
        },
        items: order.order_items?.map(item => ({
          name: item.product_name || 'Garment Item',
          value: item.price_at_purchase || 0,
          quantity: item.quantity || 1,
          weight: 500 // default 500g
        })) || []
      };

      const res = await fetch('/api/biteship/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch order via Biteship');
      }

      // Optimistic Update
      const updatedOrder = {
        ...order,
        status: 'shipped' as const,
        tracking_id: data.tracking_id || data.waybill_id,
        print_count: (order.print_count || 0) + 1,
        courier: `${data.courier_company} ${data.courier_type}`.toUpperCase()
      };
      setLogisticsSelectedOrder(updatedOrder);
      if (onOrderUpdated) onOrderUpdated(updatedOrder);
      
      alert(`Berhasil! Nomor Resi: ${data.tracking_id || data.waybill_id}`);

    } catch (err: any) {
      console.error('Dispatch error:', err);
      alert(`Gagal request pickup: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!order) return;
    
    // Warning prompt
    const confirmCancel = window.confirm(`PEMBATALAN ORDER #${order.id.toUpperCase()}\n\nPERINGATAN FINANCE:\nMidtrans akan mengembalikan dana penuh ke Customer. Biaya admin (MDR) akan DITANGGUNG oleh Ninoc.\nJika Customer membayar via Transfer Bank/VA, Anda wajib melakukan REFUND MANUAL!\n\nLanjutkan Pembatalan?`);
    
    if (!confirmCancel) return;
    
    const reason = window.prompt("Alasan pembatalan (opsional):", "Dibatalkan sepihak oleh Admin");
    if (reason === null) return; // User cancelled the prompt

    try {
      const res = await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, reason })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      
      alert(`Sukses membatalkan pesanan.\nStatus Refund: ${data.refund_status}`);
      
      // Optimistic Update
      const updatedOrder = { ...order, status: 'cancelled' as const };
      setLogisticsSelectedOrder(updatedOrder);
      if (onOrderUpdated) onOrderUpdated(updatedOrder);
      
    } catch (err: any) {
      alert(`Gagal membatalkan pesanan: ${err.message}`);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!now) return '-';
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <motion.div
      key="logistics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full pb-2 space-y-0"
    >
      {/* HEADER BAR */}
      <div className="shrink-0 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-gray-900 uppercase tracking-wide">Logistics Command</h2>
          <span className="text-[11px] text-gray-800">— shipment operations center</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-gray-800 font-mono">
            {formattedDate}
            {' • '}
            <span className="text-rose">{pendingCount + inTransitCount}</span> active
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 bg-ink text-white rounded-sm text-[11px] uppercase tracking-wider font-medium hover:bg-ink/90 transition-colors"
          >
            <ScanBarcode size={12} />
            Scan to Dispatch
          </button>
        </div>
      </div>

      {/* STAT CELLS — 4 compact cells, no gap, cell-block */}
      <div className="shrink-0 grid grid-cols-4 border border-gray-200 bg-white">
        {[
          { label: 'Siap Kirim', count: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', filterKey: 'paid' },
          { label: 'In Transit', count: inTransitCount, color: 'text-blue-600', bg: 'bg-blue-50', filterKey: 'shipped' },
          { label: 'Delivered', count: deliveredCount, color: 'text-emerald-600', bg: 'bg-emerald-50', filterKey: 'delivered' },
          { label: 'Cancelled', count: cancelledCount, color: 'text-red-500', bg: 'bg-red-50', filterKey: 'cancelled' },
        ].map((stat, i) => (
          <button
            key={stat.filterKey}
            onClick={() => setLogisticsFilter(logisticsFilter === stat.filterKey ? 'all' : stat.filterKey)}
            className={cn(
              "px-1.5 py-1.5 text-left transition-colors relative",
              i < 3 && "border-r border-gray-200",
              logisticsFilter === stat.filterKey ? stat.bg : "hover:bg-gray-50"
            )}
          >
            {logisticsFilter === stat.filterKey && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose" />
            )}
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-800 mb-1">{stat.label}</p>
            <p className={cn("text-lg font-medium font-mono", stat.color)}>{stat.count}</p>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT: TABLE + DETAIL PANEL */}
      <div className="flex-1 min-h-0 flex border border-t-0 border-gray-200 bg-white">
        {/* LEFT: MASTER TABLE */}
        <div className={cn(
          "flex flex-col transition-all duration-300",
          logisticsSelectedOrder ? "w-[55%]" : "w-full"
        )}>
          {/* Table sub-header with filter & search */}
          <div className="flex items-center justify-between px-1.5 py-1 border-b border-gray-200 bg-gray-50/80 shrink-0">
            <div className="flex items-center gap-1">
              {['all', 'paid', 'shipped', 'delivered'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogisticsFilter(f)}
                  className={cn(
                    "px-2 py-1 text-[11px] uppercase tracking-[0.15em] transition-colors",
                    logisticsFilter === f
                      ? "bg-ink text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {f === 'all' ? 'All Active' : f === 'paid' ? 'Pending' : f === 'shipped' ? 'Transit' : 'Done'}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-gray-800">{logisticsOrders.length} results</span>
          </div>

          {/* Dense table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e5e7eb]">
                <tr>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap w-[15%]">Order</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap w-[15%]">Status</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap w-[25%]">Destination</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap w-[15%]">Courier</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap w-[10%]">Resi</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap text-right w-[10%]">Value</th>
                  <th className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 whitespace-nowrap text-right w-[10%]">Age</th>
                </tr>
              </thead>
              <tbody>
                {logisticsOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    onClick={() => setLogisticsSelectedOrder(logisticsSelectedOrder?.id === order.id ? null : order)}
                    className={cn(
                      "cursor-pointer transition-colors border-b border-gray-100",
                      logisticsSelectedOrder?.id === order.id
                        ? "bg-rose/5 border-l-2 border-l-rose"
                        : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"
                    )}
                  >
                    <td className="px-2 py-1">
                      <span className="font-mono text-xs text-gray-900 whitespace-nowrap">#{order.id.toUpperCase()}</span>
                    </td>
                    <td className="px-2 py-1">
                      <span className={cn(
                        "text-[11px] uppercase tracking-[0.1em] px-1.5 py-0.5 inline-block",
                        order.status === 'paid' && "bg-amber-100 text-amber-700",
                        order.status === 'shipped' && "bg-blue-100 text-blue-700",
                        order.status === 'delivered' && "bg-emerald-100 text-emerald-700",
                        order.status === 'cancelled' && "bg-red-100 text-red-600",
                      )}>
                        {order.status === 'paid' ? 'SIAP KIRIM' : order.status.toUpperCase()}
                      </span>
                      {order.status === 'paid' && (
                        <span className={cn("block mt-1 text-xs font-bold px-1 py-0.5 rounded-sm border uppercase w-fit tracking-wider", getShippingSLA(order.created_at, order.courier).badgeClass)}>
                          {getShippingSLA(order.created_at, order.courier).label}
                        </span>
                      )}
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="text-xs text-gray-900 truncate max-w-[120px]">{order.shipping_address?.name}</div>
                      <div className="text-[11px] text-gray-800 truncate max-w-[120px]">{order.shipping_address?.city}</div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <CourierLogo courier={order.courier || ''} className="h-3.5" />
                        <span className="text-[11px] text-gray-800 uppercase">{order.courier || '—'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      {order.tracking_id ? (
                        <span className="font-mono text-[11px] bg-gray-100 text-gray-800 px-1 py-0.5">{order.tracking_id.slice(-8)}</span>
                      ) : (
                        <span className="text-[11px] text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="font-mono text-sm font-medium text-gray-900">{(order.total_price / 1000).toFixed(0)}K</span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-sm font-bold text-gray-900 font-mono">{getTimeAgo(order.created_at)}</span>
                    </td>
                  </tr>
                ))}
                {logisticsOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-xs text-gray-500 uppercase tracking-[0.3em]">
                      No orders in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: DETAIL + MAP PANEL */}
        <AnimatePresence>
          {logisticsSelectedOrder && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="border-l border-gray-200 flex flex-col overflow-hidden bg-white shadow-xl z-20 relative"
            >
              <div className="w-full h-full flex flex-col overflow-y-auto p-2 gap-3 custom-scrollbar">
                {/* 1. Header / Client Info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
                      {logisticsSelectedOrder.shipping_address?.name ? (
                        <span className="text-[14px] font-medium text-gray-800">
                          {logisticsSelectedOrder.shipping_address.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User size={16} className="text-gray-800" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs md:text-[11px] font-medium text-gray-900 leading-tight">{logisticsSelectedOrder.shipping_address?.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Client ID: {logisticsSelectedOrder.user_id?.slice(0, 8) || 'GUEST'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openOrderDetail(logisticsSelectedOrder)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-ink transition-colors"
                      title="View Full Order"
                    >
                      <Eye size={12} />
                    </button>
                    <button 
                      onClick={() => setLogisticsSelectedOrder(null)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-rose transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* 2. Order Details Grid */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-800 mb-1">Order ID</p>
                    <p className="text-xs font-medium text-gray-900">{logisticsSelectedOrder.id.toUpperCase()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-gray-800 mb-1">Shipping Address</p>
                    <p className="text-xs text-gray-900 leading-tight">
                      {logisticsSelectedOrder.shipping_address?.address}
                      {!(logisticsSelectedOrder.shipping_address?.address || '').toUpperCase().includes((logisticsSelectedOrder.shipping_address?.city || '').toUpperCase()) && logisticsSelectedOrder.shipping_address?.city ? `, ${logisticsSelectedOrder.shipping_address.city}` : ''}
                      {logisticsSelectedOrder.shipping_address?.postal_code && !(logisticsSelectedOrder.shipping_address?.address || '').includes(logisticsSelectedOrder.shipping_address.postal_code) ? `, ${logisticsSelectedOrder.shipping_address.postal_code}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-800 mb-1">Shipped</p>
                    <p className="text-xs text-gray-900 leading-tight">
                      {new Date(logisticsSelectedOrder.created_at).toLocaleDateString('id-ID')}<br/>
                      <span className="text-gray-500">{new Date(logisticsSelectedOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                {/* 3 & 4. 2-Grid Layout: Ordered Products (Left) & Map (Right) */}
                <div className="grid grid-cols-[1.2fr_1fr] gap-2 pt-1 mt-2">
                  {/* Left Side: Ordered Products */}
                  <div className="flex flex-col">
                    <p className="text-[11px] font-medium text-gray-900 mb-2">Ordered Products (IDR {logisticsSelectedOrder.total_price.toLocaleString('id-ID')})</p>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px] custom-scrollbar pr-2">
                      {logisticsSelectedOrder.order_items?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 p-2.5 border border-gray-200 rounded-xl items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                            <Package size={16} className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-900 line-clamp-2 font-medium">{item.product_name || 'Garment Item'}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{item.quantity} item • {[item.color, item.size ? `SZ:${item.size}` : null].filter(Boolean).join(' / ') || 'OS'}</p>
                            <p className="text-xs font-mono font-medium text-gray-900 mt-1">IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Map Visualization */}
                  <div className="flex flex-col">
                    <p className="text-[11px] font-medium text-gray-900 mb-2 flex items-center gap-1.5"><MapPin size={10} className="text-rose"/> Live Logistics Tracking</p>
                    <div className="relative w-full h-[160px] bg-[#f8f9fa] rounded-2xl border border-gray-200 overflow-hidden shrink-0">
                      <MapTracker 
                        destinationCity={logisticsSelectedOrder.shipping_address?.city || ''} 
                        status={logisticsSelectedOrder.status} 
                        className="w-full h-full relative z-[1]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Timeline */}
                <div className="mt-0 pt-2 flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">Timeline</span>
                      <span className="text-[11px] text-gray-800">Updated 5 mins ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['pending', 'paid', 'shipped'].includes(logisticsSelectedOrder.status) && (
                        <button 
                          onClick={() => handleCancelOrder(logisticsSelectedOrder)}
                          className="px-2 py-1 text-[11px] font-medium rounded border transition-all flex items-center gap-1.5 bg-white text-rose border-rose hover:bg-rose hover:text-white"
                        >
                          <X size={10} /> Cancel Order
                        </button>
                      )}
                      {['paid', 'shipped'].includes(logisticsSelectedOrder.status) && (
                        <button 
                          onClick={() => handleRequestPickup(logisticsSelectedOrder)}
                          disabled={isDispatching || logisticsSelectedOrder.status === 'pending' || logisticsSelectedOrder.payment_status === 'pending'}
                          className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded border transition-all flex items-center gap-1.5",
                            (isDispatching || logisticsSelectedOrder.status === 'pending' || logisticsSelectedOrder.payment_status === 'pending')
                              ? "bg-gray-100 text-gray-800 border-gray-200 cursor-not-allowed opacity-50"
                              : logisticsSelectedOrder.status === 'shipped'
                                ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                                : "bg-ink text-white border-ink hover:bg-ink/90"
                          )}
                        >
                          {isDispatching ? (
                            <>
                              <div className="w-2.5 h-2.5 border border-white/20 border-t-white rounded-full animate-spin" />
                              Memproses...
                            </>
                          ) : logisticsSelectedOrder.status === 'shipped' || (logisticsSelectedOrder.print_count && logisticsSelectedOrder.print_count > 0) ? (
                            <>
                              <Truck size={10} />
                              Request Pickup (Sudah {logisticsSelectedOrder.print_count || 1}x Print)
                            </>
                          ) : (
                            <>
                              <Truck size={10} />
                              Request Pickup (Dispatch)
                            </>
                          )}
                        </button>
                      )}
                      <button className="px-2 py-1 bg-gray-50 text-[11px] font-medium text-gray-800 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                        Refresh
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const activeIndex: number = logisticsSelectedOrder.status === 'delivered' ? 3 : 
                                                logisticsSelectedOrder.status === 'shipped' ? 2 : 0;
                    
                    const skeletonSteps = [
                      {
                        index: 3,
                        title: 'Pesanan Selesai (Tiba di Tujuan)',
                        desc: 'Paket telah berhasil dikirimkan ke alamat tujuan.',
                        icon: <MapPin size={10} />,
                        location: logisticsSelectedOrder.shipping_address?.city || 'Destination',
                        isReached: activeIndex >= 3,
                        isActive: activeIndex === 3,
                        time: activeIndex >= 3 ? new Date((logisticsSelectedOrder as any).updated_at || logisticsSelectedOrder.created_at) : null
                      },
                      {
                        index: 2,
                        title: 'Dalam Pengiriman (Transit)',
                        desc: 'Paket sedang dalam perjalanan menuju kota tujuan.',
                        icon: <Truck size={10} />,
                        location: `${logisticsSelectedOrder.courier || 'Expedition'} Hub`,
                        isReached: activeIndex >= 2,
                        isActive: activeIndex === 2,
                        time: activeIndex >= 2 ? new Date(new Date((logisticsSelectedOrder as any).updated_at || logisticsSelectedOrder.created_at).getTime() - 3600000) : null
                      },
                      {
                        index: 1,
                        title: 'Dijemput Kurir / Proses Sortir',
                        desc: 'Paket telah diserahkan kepada kurir dan sedang disortir.',
                        icon: <Box size={10} />,
                        location: 'Origin Sorting Center',
                        isReached: activeIndex >= 2,
                        isActive: activeIndex === 1,
                        time: activeIndex >= 2 ? new Date(new Date((logisticsSelectedOrder as any).updated_at || logisticsSelectedOrder.created_at).getTime() - 7200000) : null
                      },
                      {
                        index: 0,
                        title: 'Pesanan Dibuat (Gudang NINOC)',
                        desc: 'Pemesanan telah diterima dan paket mulai disiapkan oleh tim NINOC.',
                        icon: <Package size={10} />,
                        location: 'Gudang NINOC, Bandung',
                        isReached: true,
                        isActive: activeIndex === 0,
                        time: new Date(logisticsSelectedOrder.created_at)
                      }
                    ];

                    return (
                      <div className="relative pl-6 border-l border-ink/10 space-y-3 ml-2 pb-2">
                        {skeletonSteps.map((step) => (
                          <div key={step.index} className={`relative transition-opacity duration-300 ${!step.isReached ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 bg-white border-2 rounded-full flex items-center justify-center ${step.isActive ? 'border-rose' : step.isReached ? 'border-ink/40 bg-ink/5' : 'border-ink/20'}`}>
                              {step.isActive && <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />}
                              {step.isReached && !step.isActive && <div className="w-1.5 h-1.5 bg-ink/40 rounded-full" />}
                            </div>
                            
                            {/* Timeline Content */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                              <div className="w-24 shrink-0 pt-0.5">
                                <span className={`text-[11px] md:text-[11px] font-semibold tracking-widest uppercase ${step.isActive ? 'text-rose' : 'text-ink/80'}`}>
                                  {step.time ? step.time.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '---'}
                                </span>
                                <div className="text-xs md:text-xs text-ink/80 mt-0.5 font-medium">
                                  {step.time ? step.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </div>
                              </div>
                              <div className="flex-1 mt-1 sm:mt-0 bg-ink/[0.01] sm:bg-transparent p-3 sm:p-0 rounded-sm border sm:border-none border-ink/5">
                                <p className={`text-[12px] md:text-xs font-bold uppercase tracking-wider mb-1 ${step.isActive ? 'text-ink' : step.isReached ? 'text-ink/90' : 'text-ink/80'}`}>
                                  {step.title}
                                </p>
                                <p className={`text-[11px] md:text-[11px] leading-relaxed mb-2 ${step.isActive ? 'text-ink/80 font-medium' : 'text-ink/90'}`}>
                                  {step.desc}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-ink/5">
                                  <p className={`text-xs md:text-xs uppercase tracking-widest flex items-center gap-1.5 ${step.isActive ? 'text-ink/80' : 'text-ink/90'}`}>
                                    {React.cloneElement(step.icon as React.ReactElement<{ className?: string }>, { className: step.isActive ? "text-rose/50" : "text-ink/90" })} {step.location}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SCANNER MODAL */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-2">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setIsScannerOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-sm shadow-2xl border border-ink/10 overflow-hidden flex flex-col"
            >
              <div className="px-1.5 py-1 border-b border-ink/10 flex items-center justify-between bg-ink/[0.02]">
                <div className="flex items-center gap-2">
                  <ScanBarcode size={16} className="text-ink" />
                  <div>
                    <h3 className="text-xs font-medium text-ink uppercase tracking-wide">Dispatch Verification</h3>
                    <p className="text-[11px] text-ink/90 uppercase tracking-widest mt-0.5">Barcode Scanner Input</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-2 text-ink/80 hover:text-ink transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center justify-center text-center">
                <form onSubmit={handleScanSubmit} className="w-full">
                  <input
                    ref={scannerInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan Barcode Here..."
                    className="w-full text-center px-2 py-1.5 bg-ink/[0.02] border-2 border-dashed border-ink/20 rounded-sm text-xs font-mono focus:outline-none focus:border-rose/50 transition-colors uppercase"
                    disabled={scanStatus === 'loading'}
                    autoComplete="off"
                  />
                  <button type="submit" className="hidden">Submit</button>
                </form>

                <div className="mt-6 h-[80px] flex items-center justify-center w-full">
                  {scanStatus === 'idle' && (
                    <div className="flex flex-col items-center text-ink/80">
                      <ScanBarcode size={24} className="mb-2 opacity-30 animate-pulse" />
                      <p className="text-[11px] uppercase tracking-widest font-medium">Ready to scan next label</p>
                    </div>
                  )}
                  {scanStatus === 'loading' && (
                    <div className="flex flex-col items-center text-ink">
                      <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin mb-2" />
                      <p className="text-[11px] uppercase tracking-widest font-medium animate-pulse">{scanMessage}</p>
                    </div>
                  )}
                  {scanStatus === 'success' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-emerald-600">
                      <CheckCircle size={28} className="mb-2" />
                      <p className="text-xs uppercase tracking-widest font-medium">{scanMessage}</p>
                    </motion.div>
                  )}
                  {scanStatus === 'error' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-rose">
                      <AlertCircle size={28} className="mb-2" />
                      <p className="text-xs uppercase tracking-widest font-medium">{scanMessage}</p>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="px-1.5 py-1 border-t border-ink/10 bg-ink/[0.02] text-center">
                <p className="text-[11px] uppercase tracking-widest text-ink/80">Physical barcode scanner will automatically submit upon successful read.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

