import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Box, X, Calendar, Printer, MapPin, Phone, Package, CreditCard, Truck, Clock, User, Hash, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, Product } from '../types';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// ─── Dropdown Component ──────────────────────────────────
function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  icon?: React.ReactNode;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const activeLabel = options.find(o => o.id === value)?.label;
  const isFiltered = value !== 'all';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs md:text-[10px] font-medium uppercase tracking-wider transition-colors",
          isFiltered
            ? "bg-rose/10 border border-rose/30 text-rose"
            : "bg-ink/5 text-ink/60 hover:bg-ink/10"
        )}
      >
        {icon}
        {isFiltered ? activeLabel : label}
        <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-white border border-ink/10 rounded-sm shadow-lg"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); onClose(); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider transition-colors",
                  value === opt.id
                    ? "bg-rose/5 text-rose"
                    : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Date Range Dropdown ─────────────────────────────────
function DateRangeDropdown({
  dateFrom,
  dateTo,
  onChangeFrom,
  onChangeTo,
  onClear,
  isOpen,
  onToggle,
  onClose,
}: {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const isFiltered = dateFrom || dateTo;
  const displayLabel = isFiltered
    ? `${dateFrom || '...'} — ${dateTo || '...'}`
    : 'Date Range';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs md:text-[10px] font-medium uppercase tracking-wider transition-colors",
          isFiltered
            ? "bg-rose/10 border border-rose/30 text-rose"
            : "bg-ink/5 text-ink/60 hover:bg-ink/10"
        )}
      >
        <Calendar size={10} />
        {displayLabel}
        <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 z-50 w-[260px] bg-white border border-ink/10 rounded-sm shadow-lg p-3 space-y-3"
          >
            <div>
              <label className="text-xs md:text-[9px] uppercase tracking-widest text-ink/40 mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => onChangeFrom(e.target.value)}
                className="w-full px-2 py-1.5 border border-ink/10 rounded-sm text-xs md:text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div>
              <label className="text-xs md:text-[9px] uppercase tracking-widest text-ink/40 mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => onChangeTo(e.target.value)}
                className="w-full px-2 py-1.5 border border-ink/10 rounded-sm text-xs md:text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-ink/5">
              <button
                onClick={() => { onClear(); onClose(); }}
                className="text-xs md:text-[9px] uppercase tracking-wider font-medium text-ink/40 hover:text-ink transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="text-xs md:text-[9px] uppercase tracking-wider font-medium text-rose hover:text-rose/80 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export function OrdersTab({
  orders,
  products,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  openOrderDetail,
  onUpdateOrderPrinted
}: {
  orders: Order[];
  products: Product[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  openOrderDetail: (o: Order) => void;
  onUpdateOrderPrinted?: (orderId: string, printedAt: string) => void;
}) {
  // ── Filter states ──
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Print Modal State ──
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintOrders, setSelectedPrintOrders] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Fraud Warning State ──
  const [fraudWarningOrders, setFraudWarningOrders] = useState<Order[]>([]);
  const [isFraudWarningOpen, setIsFraudWarningOpen] = useState(false);

  // ── Expanded Order (accordion) ──
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // ── Dropdown open states (only one at a time) ──
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  // ── Barcode Scanner Listener ──
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentTime = Date.now();
      // If time between keystrokes is more than 50ms, it's a human typing, not a scanner. Reset buffer.
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        const scannedCode = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';

        if (scannedCode) {
          // Check if scanned code matches an order ID or Tracking ID
          const matchedOrder = orders.find(o => 
            o.id.toLowerCase() === scannedCode.toLowerCase() || 
            (o.tracking_id && o.tracking_id.toLowerCase() === scannedCode.toLowerCase())
          );

          if (matchedOrder) {
            // Only update if it's not already shipped or delivered
            if (['pending', 'paid'].includes(matchedOrder.status)) {
              try {
                await supabase
                  .from('orders')
                  .update({ status: 'shipped', updated_at: new Date().toISOString() })
                  .eq('id', matchedOrder.id);
                // Trigger visual feedback (could just use alert for now)
                alert(`📦 Order ${matchedOrder.id.slice(0, 8).toUpperCase()} otomatis diubah menjadi SHIPPED.`);
                // Optimistic update
                matchedOrder.status = 'shipped';
                // Trigger a re-render by calling setStatusFilter with the same value
                setStatusFilter(statusFilter);
              } catch (err) {
                console.error('Failed to update order via scanner', err);
              }
            } else {
              alert(`⚠️ Order ${matchedOrder.id.slice(0, 8).toUpperCase()} sudah berstatus ${matchedOrder.status.toUpperCase()}.`);
            }
          } else {
            console.log('Barcode not found in orders:', scannedCode);
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders]);

  // ── Derive unique courier options from data ──
  const courierOptions = useMemo(() => {
    const unique = new Set<string>();
    orders.forEach(o => { if (o.courier) unique.add(o.courier); });
    return [
      { id: 'all', label: 'All Couriers' },
      ...Array.from(unique).sort().map(c => ({ id: c, label: c }))
    ];
  }, [orders]);

  // ── Count active filters ──
  const activeFilterCount = [
    paymentFilter !== 'all',
    courierFilter !== 'all',
    dateFrom || dateTo,
    sortBy !== 'all',
  ].filter(Boolean).length;

  // ── Clear all filters ──
  const clearAllFilters = useCallback(() => {
    setPaymentFilter('all');
    setCourierFilter('all');
    setSortBy('all');
    setDateFrom('');
    setDateTo('');
    closeDropdown();
  }, [closeDropdown]);

  // ── Filtering + Sorting ──
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      // Status tab filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = order.id.toLowerCase().includes(q) ||
          order.shipping_address?.name.toLowerCase().includes(q) ||
          order.shipping_address?.phone.includes(q);
        if (!match) return false;
      }
      // Payment status filter
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
      // Courier filter
      if (courierFilter !== 'all' && order.courier !== courierFilter) return false;
      // Date range filter
      if (dateFrom) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate < dateFrom) return false;
      }
      if (dateTo) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (orderDate > dateTo) return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.total_price - a.total_price);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.total_price - b.total_price);
    }

    return result;
  }, [orders, statusFilter, searchQuery, paymentFilter, courierFilter, dateFrom, dateTo, sortBy]);

  // ── Handle Bulk Print Resi ──
  const handlePrintResi = () => {
    // Filter only valid orders ready for shipping (e.g., Paid or Shipped)
    const validOrders = filteredOrders.filter(o => o.status === 'paid' || o.status === 'shipped');
    
    if (validOrders.length === 0) {
      alert('Tidak ada order valid (Status: Paid/Sent) pada filter saat ini untuk dicetak.');
      return;
    }
    
    // Set all valid orders as selected by default and open modal
    setSelectedPrintOrders(validOrders.map(o => o.id));
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    if (selectedPrintOrders.length === 0) return;
    setIsPrinting(true);

    const ordersToPrint = orders.filter(o => selectedPrintOrders.includes(o.id));

    // ── FRAUD DETECTION: Check for already-shipped orders ──
    const fraudOrders = ordersToPrint.filter(o =>
      o.status === 'shipped' || o.status === 'delivered'
    );

    if (fraudOrders.length > 0) {
      setIsPrinting(false);
      setFraudWarningOrders(fraudOrders);
      setIsFraudWarningOpen(true);
      return;
    }

    // ── LOG PRINTED TIMESTAMP TO DB ──
    const now = new Date().toISOString();
    Promise.all(ordersToPrint.map(async (order) => {
      await supabase.from('orders').update({ printed_at: now }).eq('id', order.id);
    })).then(() => {
      if (onUpdateOrderPrinted) {
        ordersToPrint.forEach(o => onUpdateOrderPrinted(o.id, now));
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsPrinting(false);
      alert('Jendela cetak diblokir oleh browser. Mohon izinkan pop-up (Pop-up Blocker) untuk website ini lalu coba lagi.');
      return;
    }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Label Pengiriman - NINOC Archive</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap');
              
              body { 
                font-family: 'Courier Prime', monospace; 
                margin: 0; 
                padding: 20px; 
                background: #e5e7eb; 
                color: #000;
              }
              
              /* Thermal Label Standard Size (approx 100x150mm) */
              .label { 
                background: white; 
                width: 100mm; 
                min-height: 120mm;
                padding: 4mm;
                margin: 0 auto 20px auto; 
                box-sizing: border-box;
                page-break-after: always;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }

              .label-inner {
                border: 2px solid #000;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
              }

              /* Header Section */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4mm;
                border-bottom: 2px solid #000;
              }
              .brand {
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 900;
                font-style: italic;
                letter-spacing: -0.5px;
              }
              .brand span {
                font-size: 8px;
                font-weight: 600;
                margin-left: 4px;
                font-style: normal;
                letter-spacing: 1px;
              }
              .courier-box {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .courier-badge {
                background: #000;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-weight: 800;
                font-size: 10px;
                padding: 2px 4px;
                letter-spacing: 0.5px;
              }

              /* Barcode Section */
              .barcode-section {
                padding: 4mm;
                text-align: center;
                border-bottom: 2px solid #000;
              }
              .barcode-section img {
                width: 100%;
                height: 50px;
                display: block;
                margin: 0 auto;
              }
              .awb-text {
                font-family: 'Courier Prime', monospace;
                font-weight: 700;
                font-size: 14px;
                margin-top: 4px;
                letter-spacing: 2px;
              }

              /* Address Grid */
              .address-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-bottom: 2px solid #000;
              }
              .address-box {
                padding: 4mm;
              }
              .address-box.left {
                border-right: 2px solid #000;
              }
              .box-title {
                font-family: 'Inter', sans-serif;
                font-size: 8px;
                font-weight: 700;
                letter-spacing: 1px;
                margin-bottom: 4px;
                text-decoration: underline;
              }
              .person-name {
                font-weight: 700;
                font-size: 12px;
                margin-bottom: 2px;
                font-family: 'Inter', sans-serif;
              }
              .person-phone {
                font-size: 10px;
                margin-bottom: 6px;
              }
              .person-address {
                font-size: 9px;
                line-height: 1.3;
              }

              /* Content Grid */
              .content-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                border-bottom: 2px solid #000;
                flex: 1;
              }
              .content-box {
                padding: 4mm;
              }
              .content-box.left {
                border-right: 2px solid #000;
              }
              .item-line {
                font-size: 10px;
                line-height: 1.4;
                margin-bottom: 2px;
              }
              
              .order-id-box {
                text-align: center;
                padding-top: 4mm;
              }
              .order-id-val {
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                font-weight: 800;
                margin-top: 4px;
              }
              .qty-val {
                font-size: 9px;
                margin-top: 8px;
                display: flex;
                justify-content: space-between;
                padding: 0 4px;
              }

              /* Footer */
              .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2mm 4mm;
                font-size: 8px;
              }
              .fragile-badge {
                background: #000;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-weight: 800;
                padding: 2px 6px;
                font-size: 10px;
                letter-spacing: 1px;
              }

              @media print {
                body { background: white; padding: 0; margin: 0; }
                .label { margin: 0; box-shadow: none; border: none; break-after: page; page-break-after: always; }
                @page { margin: 0; size: 100mm 150mm; }
              }
            </style>
          </head>
          <body>
            ${ordersToPrint.map(order => {
              const maskPhone = (phone: string | undefined) => {
                if (!phone || phone.length < 8) return phone || '-';
                return phone.slice(0, 4) + '-****-' + phone.slice(-4);
              };
              return `
              <div class="label">
                <div class="label-inner">
                  
                  <div class="header">
                    <div class="brand">NINOC <span>ARCHIVE</span></div>
                    <div class="courier-box">
                      <div class="courier-badge">${(order.courier || 'STD').toUpperCase().slice(0, 5)}</div>
                    </div>
                  </div>

                  <div class="barcode-section">
                    <svg class="barcode"
                      jsbarcode-format="CODE128"
                      jsbarcode-value="${order.tracking_id || 'NNC' + order.id.slice(0,8).toUpperCase()}"
                      jsbarcode-textmargin="0"
                      jsbarcode-fontoptions="bold"
                      jsbarcode-height="50"
                      jsbarcode-displayvalue="false"
                      jsbarcode-width="2"
                      jsbarcode-margin="0">
                    </svg>
                    <div class="awb-text">${order.tracking_id || 'NNC' + order.id.slice(0,8).toUpperCase()}</div>
                  </div>

                  <div class="address-grid">
                    <div class="address-box left">
                      <div class="box-title">PENERIMA / TO</div>
                      <div class="person-name">${order.shipping_address?.name || 'GUEST'}</div>
                      <div class="person-phone">${maskPhone(order.shipping_address?.phone)}</div>
                      <div class="person-address">
                        ${order.shipping_address?.address || '-'}<br/>
                        ${order.shipping_address?.city || '-'}
                      </div>
                    </div>
                    <div class="address-box">
                      <div class="box-title">PENGIRIM / FROM</div>
                      <div class="person-name">NINOC STUDIO</div>
                      <div class="person-phone">0812-XXXX-XXXX</div>
                      <div class="person-address">
                        Jl. Gudang Selatan No. 22<br/>
                        Bandung, Jawa Barat<br/>
                        40113
                      </div>
                    </div>
                  </div>

                  <div class="content-grid">
                    <div class="content-box left">
                      <div class="box-title">ISI PAKET / CONTENTS</div>
                      ${order.order_items?.map(i => `
                        <div class="item-line">${i.product_name} ${i.size ? `(Sz: ${i.size})` : ''} x${i.quantity}</div>
                      `).join('') || '<div class="item-line">No items found</div>'}
                    </div>
                    <div class="content-box">
                      <div class="order-id-box">
                        <div class="box-title" style="text-decoration:none;">ORDER ID</div>
                        <div class="order-id-val">#${order.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div class="qty-val">
                        <span>Qty: ${order.order_items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0}</span>
                        <span>~500g</span>
                      </div>
                    </div>
                  </div>

                  <div class="footer">
                    <div>${new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                    <div>NINOC ARCHIVE - BANDUNG, INDONESIA</div>
                    <div class="fragile-badge">FRAGILE</div>
                  </div>

                </div>
              </div>
            `}).join('')}
            
            <script>
              JsBarcode(".barcode").init();
              window.onload = () => { setTimeout(() => { window.print(); }, 800); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Reset state and close modal
      setIsPrinting(false);
      setIsPrintModalOpen(false);
  };

  const handleExportData = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NINOC STORE - TAX REPORT (CSV/PDF)</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; color: #141414; }
            .header { text-align: center; border-bottom: 2px solid #141414; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
            .subtitle { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: #666; text-transform: uppercase; margin-top: 5px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
            th, td { border: 1px solid #e5e5e5; padding: 10px; text-align: left; }
            th { background-color: #141414; color: white; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
            tr:nth-child(even) { background-color: #fafafa; }
            .total-row { font-weight: 800; background-color: #f1f1f1 !important; }
            .footer { font-size: 10px; color: #666; text-align: center; margin-top: 50px; border-top: 1px solid #e5e5e5; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">NINOC STORE</div>
            <div class="subtitle">Official Transaction & Tax Report</div>
          </div>
          <div class="meta">
            <div>REPORT GENERATED: ${new Date().toLocaleString('id-ID')}</div>
            <div>TOTAL RECORDS: ${filteredOrders.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total Amount (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                const tax = order.total_price * 0.11;
                return (
                  '<tr>' +
                    '<td>' + new Date(order.created_at).toLocaleString('id-ID') + '</td>' +
                    '<td style="font-family: monospace;">' + order.id.slice(0, 8).toUpperCase() + '</td>' +
                    '<td>' + (order.shipping_address?.name || '-') + '</td>' +
                    '<td>' + order.status.toUpperCase() + '</td>' +
                    '<td>' + order.payment_status.toUpperCase() + '</td>' +
                    '<td>' + order.total_price.toLocaleString('id-ID') + '</td>' +
                  '</tr>'
                );
              }).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">GRAND TOTAL</td>
                <td>${filteredOrders.reduce((acc, order) => acc + order.total_price, 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            CONFIDENTIAL - Internal Use Only - System Generated Document
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintSingleLabel = (order: Order) => {
    setSelectedPrintOrders([order.id]);
    setIsPrintModalOpen(true);
  };

  return (
    <>
      <motion.div
        key="orders"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full space-y-4"
      >
        <div className="shrink-0 flex items-center justify-between border-b border-ink/5 pb-4">
          <div>
            <h2 className="text-xl font-medium text-ink tracking-tight">Online Order</h2>
            <p className="text-xs md:text-[10px] uppercase tracking-wider text-ink/40 mt-1">Transaction History &amp; Management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintResi}
              className="flex items-center gap-2 px-4 py-2 border border-ink/10 text-ink/70 text-xs md:text-[10px] uppercase font-medium tracking-wider rounded hover:bg-ink/5 hover:text-ink transition-colors"
            >
              <Printer size={12} />
              Print Bulk Labels
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-xs md:text-[10px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>

      {/* Status Tabs */}
      <div className="shrink-0 flex items-center gap-1 border-b border-ink/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Order', count: orders.length },
          { id: 'pending', label: 'New Order', count: orders.filter(o => o.status === 'pending').length },
          { id: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
          { id: 'shipped', label: 'Sent', count: orders.filter(o => o.status === 'shipped').length },
          { id: 'delivered', label: 'Completed', count: orders.filter(o => o.status === 'delivered').length },
          { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "relative px-4 py-3 text-xs md:text-[10px] uppercase font-medium tracking-wider whitespace-nowrap transition-colors",
              statusFilter === tab.id ? "text-rose" : "text-ink/40 hover:text-ink/70"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-2 px-1.5 py-0.5 text-[11px] md:text-[8px] rounded",
              statusFilter === tab.id ? "bg-rose/10 text-rose" : "bg-ink/5 text-ink/40"
            )}>
              {tab.count}
            </span>
            {statusFilter === tab.id && (
              <motion.div layoutId="orderTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose" />
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Master Filter Button */}
          <button
            onClick={activeFilterCount > 0 ? clearAllFilters : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-sm text-xs md:text-[10px] font-medium uppercase tracking-wider transition-colors",
              activeFilterCount > 0
                ? "border-rose/30 bg-rose/10 text-rose hover:bg-rose/20"
                : "border-ink/10 text-ink/60"
            )}
          >
            {activeFilterCount > 0 ? (
              <>
                <X size={10} />
                Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Filter size={12} /> Filter
              </>
            )}
          </button>

          <div className="h-4 w-px bg-ink/10 mx-1" />

          {/* Payment Method Dropdown */}
          <FilterDropdown
            label="Payment Method"
            options={[
              { id: 'all', label: 'All Payment' },
              { id: 'pending', label: 'Pending' },
              { id: 'success', label: 'Success' },
              { id: 'failed', label: 'Failed' },
              { id: 'expired', label: 'Expired' },
            ]}
            value={paymentFilter}
            onChange={setPaymentFilter}
            isOpen={openDropdown === 'payment'}
            onToggle={() => toggleDropdown('payment')}
            onClose={closeDropdown}
          />

          {/* Courier Dropdown */}
          <FilterDropdown
            label="Courier"
            options={courierOptions}
            value={courierFilter}
            onChange={setCourierFilter}
            isOpen={openDropdown === 'courier'}
            onToggle={() => toggleDropdown('courier')}
            onClose={closeDropdown}
          />

          {/* Date Range Dropdown */}
          <DateRangeDropdown
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeFrom={setDateFrom}
            onChangeTo={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
            isOpen={openDropdown === 'date'}
            onToggle={() => toggleDropdown('date')}
            onClose={closeDropdown}
          />

          {/* Sort By Dropdown */}
          <FilterDropdown
            label="Sort By"
            options={[
              { id: 'all', label: 'Default' },
              { id: 'newest', label: 'Newest First' },
              { id: 'oldest', label: 'Oldest First' },
              { id: 'highest', label: 'Highest Amount' },
              { id: 'lowest', label: 'Lowest Amount' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            isOpen={openDropdown === 'sort'}
            onToggle={() => toggleDropdown('sort')}
            onClose={closeDropdown}
          />
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-ink/10 rounded-sm text-xs md:text-[10px] font-medium focus:outline-none focus:border-rose/50 transition-colors placeholder:text-ink/20"
          />
        </div>
      </div>

      {/* Order Table */}
      <div className="flex-1 min-h-0 flex flex-col border border-ink/10 rounded-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center">
            <Box size={24} className="text-ink/20 mb-2" />
            <p className="text-xs md:text-[10px] uppercase tracking-wider font-medium text-ink/40">No orders found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto minimal-scroll relative bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-ink/[0.03] border-b border-ink/10">
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Order ID</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Date</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Product</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Courier</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap text-right">Amount</th>
                  <th className="px-3 py-2 text-xs md:text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap w-[1%]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={cn(
                          "border-b border-ink/5 hover:bg-ink/[0.02] transition-colors cursor-pointer group",
                          isExpanded && "bg-ink/[0.02] border-b-0"
                        )}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="px-3 py-2">
                          <span className="text-xs md:text-[10px] font-medium text-ink font-mono tracking-wider">#{order.id.slice(0, 10).toUpperCase()}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs md:text-[10px] font-medium text-ink/50 whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="max-w-[120px]">
                            <p className="text-xs md:text-[10px] font-medium text-ink truncate">{order.shipping_address?.name || '—'}</p>
                            <p className="text-xs md:text-[9px] text-ink/40 font-mono truncate">{order.shipping_address?.phone || ''}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="max-w-[160px]">
                            <p className="text-xs md:text-[10px] font-medium text-ink line-clamp-2">{order.order_items?.[0]?.product_name || '—'}</p>
                            {order.order_items && order.order_items.length > 1 && (
                              <span className="text-xs md:text-[9px] text-rose font-medium">+{order.order_items.length - 1} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "inline-block text-[11px] md:text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
                            order.status === 'pending' ? "bg-amber-50 text-amber-600" :
                            order.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                            order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                            order.status === 'delivered' ? "bg-teal-50 text-teal-600" :
                            "bg-red-50 text-red-600"
                          )}>
                            {order.status === 'pending' ? 'Waiting' : order.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "text-xs md:text-[9px] uppercase tracking-wider font-medium",
                            order.payment_status === 'success' ? "text-emerald-600" :
                            order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                          )}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs md:text-[10px] font-medium text-ink/50 uppercase">{order.courier || '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs md:text-[10px] font-medium text-ink whitespace-nowrap">{order.total_price.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {isExpanded ? <ChevronUp size={12} className="text-rose" /> : <ChevronDown size={12} className="text-ink/30 group-hover:text-ink/60 transition-colors" />}
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDABLE DETAIL ROW ── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0 border-b border-ink/10">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="bg-ink/[0.015] border-t border-ink/10 px-4 py-5">
                                  <div className="grid grid-cols-12 gap-4">

                                    {/* LEFT: Product Items with Images */}
                                    <div className="col-span-5">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <Package size={11} className="text-ink/40" />
                                        <span className="text-xs md:text-[9px] uppercase tracking-widest font-medium text-ink/40">Ordered Items</span>
                                      </div>
                                      <div className="space-y-2">
                                        {order.order_items?.map((item, idx) => {
                                          const foundProduct = products.find(p => p.id === item.product_id);
                                          return (
                                            <div key={idx} className="flex items-center gap-3 bg-white border border-ink/5 p-2.5 rounded-sm">
                                              <div className="w-12 h-12 bg-ink/5 border border-ink/10 rounded-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                                                {foundProduct?.image_url ? (
                                                  <Image src={foundProduct.image_url} alt={item.product_name || 'Product'} fill className="object-cover" />
                                                ) : (
                                                  <Package size={16} className="text-ink/20" />
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm md:text-[11px] font-medium text-ink line-clamp-2">{item.product_name || 'Product'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  {item.size && <span className="text-xs md:text-[9px] font-medium text-ink/50 bg-ink/5 px-1.5 py-0.5 rounded-sm">Size: {item.size}</span>}
                                                  <span className="text-xs md:text-[9px] font-medium text-ink/50">×{item.quantity}</span>
                                                </div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <p className="text-xs md:text-[10px] font-medium text-ink">IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                                                <p className="text-xs md:text-[9px] text-ink/40">per item</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {/* Total */}
                                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-ink/10">
                                        <span className="text-xs md:text-[10px] font-medium text-ink/50 uppercase tracking-wider">Total ({order.order_items?.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                        <span className="text-[13px] font-medium text-ink">IDR {order.total_price.toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>

                                    {/* MIDDLE: Customer & Shipping */}
                                    <div className="col-span-4">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <User size={11} className="text-ink/40" />
                                        <span className="text-xs md:text-[9px] uppercase tracking-widest font-medium text-ink/40">Customer &amp; Shipping</span>
                                      </div>
                                      <div className="bg-white border border-ink/5 p-3 rounded-sm space-y-3">
                                        <div className="flex items-start gap-2">
                                          <User size={10} className="text-ink/30 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-sm md:text-[11px] font-medium text-ink">{order.shipping_address?.name || '—'}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <Phone size={8} className="text-ink/30" />
                                              <span className="text-xs md:text-[9px] text-ink/50 font-mono">
                                                {order.shipping_address?.phone
                                                  ? (order.shipping_address.phone.length >= 8
                                                    ? order.shipping_address.phone.slice(0, 4) + '-****-' + order.shipping_address.phone.slice(-4)
                                                    : order.shipping_address.phone)
                                                  : '—'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-start gap-2">
                                          <MapPin size={10} className="text-ink/30 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-xs md:text-[10px] text-ink/70 leading-relaxed">{order.shipping_address?.address || '—'}</p>
                                            <p className="text-xs md:text-[10px] font-medium text-ink mt-0.5">
                                              {order.shipping_address?.city}, {order.shipping_address?.province || ''}
                                            </p>
                                            <p className="text-xs md:text-[10px] font-medium text-ink">{order.shipping_address?.postal_code}</p>
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-start gap-2">
                                          <Truck size={10} className="text-ink/30 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-xs md:text-[10px] font-medium text-ink uppercase">{order.courier || 'Not Assigned'}</p>
                                            {order.tracking_id && (
                                              <p className="text-xs md:text-[9px] text-ink/50 font-mono mt-0.5">Resi: {order.tracking_id}</p>
                                            )}
                                            {order.courier_driver_name && (
                                              <p className="text-xs md:text-[9px] text-emerald-600 font-medium mt-1">Driver: {order.courier_driver_name}</p>
                                            )}
                                            {order.courier_link && (
                                              <a href={order.courier_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-[11px] md:text-[8px] text-rose uppercase tracking-widest font-medium hover:underline">
                                                Track on Courier ↗
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* RIGHT: Order Meta & Status */}
                                    <div className="col-span-3">
                                      <div className="flex items-center gap-1.5 mb-3">
                                        <Hash size={11} className="text-ink/40" />
                                        <span className="text-xs md:text-[9px] uppercase tracking-widest font-medium text-ink/40">Order Meta</span>
                                      </div>
                                      <div className="bg-white border border-ink/5 p-3 rounded-sm space-y-3">
                                        <div>
                                          <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-1">Order ID</p>
                                          <p className="text-xs md:text-[10px] font-medium text-ink font-mono">#{order.id.slice(0, 16).toUpperCase()}</p>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div>
                                          <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-1">Date &amp; Time</p>
                                          <p className="text-xs md:text-[10px] font-medium text-ink">
                                            {new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-center gap-2">
                                          <CreditCard size={10} className="text-ink/30" />
                                          <div>
                                            <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-0.5">Payment</p>
                                            <span className={cn(
                                              "text-xs md:text-[9px] uppercase tracking-wider font-medium",
                                              order.payment_status === 'success' ? "text-emerald-600" :
                                              order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                                            )}>{order.payment_status}</span>
                                          </div>
                                        </div>
                                        <div className="h-px bg-ink/5" />
                                        <div className="flex items-center gap-2">
                                          <Clock size={10} className="text-ink/30" />
                                          <div>
                                            <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-0.5">Status</p>
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                "inline-block text-xs md:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium",
                                                order.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                order.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                                                order.status === 'delivered' ? "bg-teal-50 text-teal-600" :
                                                "bg-red-50 text-red-600"
                                              )}>{order.status === 'pending' ? 'Waiting' : order.status}</span>
                                              
                                              {/* MANUAL OVERRIDE BUTTON FOR DEV TESTING */}
                                              {order.status === 'pending' && (
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if(confirm('Tandai sebagai PAID? (Simulasi Webhook)')) {
                                                      await supabase.from('orders').update({ status: 'paid', payment_status: 'success' }).eq('id', order.id);
                                                      alert('Berhasil! Silakan refresh halaman.');
                                                      window.location.reload();
                                                    }
                                                  }}
                                                  className="text-[8px] uppercase tracking-wider bg-ink text-white px-2 py-0.5 rounded-sm hover:bg-rose transition-colors"
                                                >
                                                  Mark Paid
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {order.midtrans_id && (
                                          <>
                                            <div className="h-px bg-ink/5" />
                                            <div>
                                              <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30 mb-1">Transaction ID</p>
                                              <p className="text-xs md:text-[9px] font-medium text-ink/50 font-mono break-all">{order.midtrans_id}</p>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      <div className="mt-4">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handlePrintSingleLabel(order); }}
                                          disabled={order.status === 'pending' || order.payment_status === 'pending'}
                                          className="w-full flex justify-center items-center gap-2 bg-ink text-white py-2.5 rounded-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-[10px] font-medium uppercase tracking-widest"
                                        >
                                          <Printer size={12} />
                                          Print Shipping Label
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="shrink-0 flex items-center justify-between py-4 border-t border-ink/5">
          <div className="flex items-center gap-2 text-xs md:text-[10px] uppercase font-medium tracking-wider text-ink/40">
            Show
            <select className="bg-transparent border border-ink/10 rounded-sm px-2 py-1 outline-none text-ink">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            per page
          </div>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-rose bg-rose text-white rounded-sm text-xs md:text-[10px] font-medium transition-colors">
              1
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors text-xs md:text-[10px] font-medium">
              2
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </motion.div>

    {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !isPrinting && setIsPrintModalOpen(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-ink/10 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between bg-ink/[0.02]">
              <div>
                <h3 className="text-sm font-medium text-ink uppercase tracking-wide">Select Orders to Print</h3>
                <p className="text-xs md:text-[10px] text-ink/50 uppercase tracking-widest mt-1">Thermal Label (100x150mm)</p>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                disabled={isPrinting}
                className="p-2 text-ink/40 hover:text-ink transition-colors disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body / List */}
            <div className="flex-1 overflow-y-auto minimal-scroll p-6 bg-white">
              <div className="space-y-2">
                {(() => {
                  const validOrders = filteredOrders.filter(o => o.status === 'paid');
                  const validCount = validOrders.length;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-ink/5 mb-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedPrintOrders.length === validCount && validCount > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPrintOrders(validOrders.map(o => o.id));
                              else setSelectedPrintOrders([]);
                            }}
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                            selectedPrintOrders.length === validCount && validCount > 0
                              ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/40"
                          )}>
                            {selectedPrintOrders.length === validCount && validCount > 0 && <Box size={10} className="text-white" />}
                          </div>
                          <span className="text-xs md:text-[10px] uppercase font-medium tracking-wider text-ink">Select All ({validCount})</span>
                        </label>
                      </div>

                      {validOrders.map((order) => (
                        <label key={order.id} className="flex items-center gap-4 p-3 border border-ink/5 rounded-sm hover:border-ink/20 cursor-pointer transition-colors group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedPrintOrders.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPrintOrders(prev => [...prev, order.id]);
                              else setSelectedPrintOrders(prev => prev.filter(id => id !== order.id));
                            }}
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0",
                            selectedPrintOrders.includes(order.id) ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/40"
                          )}>
                            {selectedPrintOrders.includes(order.id) && <Box size={10} className="text-white" />}
                          </div>
                          
                          <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-ink font-mono tracking-wider">#{order.id.slice(0, 10).toUpperCase()}</p>
                                <span className="text-xs md:text-[9px] text-ink/70 font-medium font-mono bg-ink/5 px-1.5 py-0.5 rounded-sm border border-ink/10">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-sm md:text-[11px] font-medium text-ink mt-1 truncate">
                                {order.shipping_address?.name || 'Guest'} <span className="text-ink/30 mx-1">•</span> <span className="text-ink/70">{order.shipping_address?.city || 'Unknown City'}</span>
                              </p>
                              <p className="text-xs md:text-[10px] text-ink/60 mt-0.5 truncate">
                                <span className="font-medium text-ink/80">{order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0} items</span> — {order.order_items?.[0]?.product_name || 'Product'} {order.order_items && order.order_items.length > 1 ? `+${order.order_items.length - 1} more` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "inline-block text-[11px] md:text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
                                order.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {order.status}
                              </span>
                              <span className="text-xs md:text-[10px] font-medium text-ink/50 uppercase w-16 text-right">{order.courier || 'STD'}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                      
                      {validCount === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/40">No valid orders found in current filter</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-ink/10 bg-ink/[0.02] flex justify-between items-center shrink-0">
              <span className="text-xs md:text-[10px] uppercase font-medium tracking-wider text-ink/50">
                {selectedPrintOrders.length} Orders Selected
              </span>
              
              <button
                onClick={executePrint}
                disabled={selectedPrintOrders.length === 0 || isPrinting}
                className="relative flex items-center justify-center gap-2 px-6 py-2.5 bg-ink text-white text-xs md:text-[10px] uppercase font-medium tracking-wider rounded-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden min-w-[160px]"
              >
                {isPrinting ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Generating...
                  </motion.div>
                ) : (
                  <>
                    <Printer size={12} />
                    Print Labels
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    {/* FRAUD WARNING MODAL */}
    <AnimatePresence>
      {isFraudWarningOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose/20 backdrop-blur-sm"
            onClick={() => setIsFraudWarningOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border-2 border-rose overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-rose flex items-center gap-3">
              <AlertTriangle size={20} className="text-white" />
              <div>
                <h3 className="text-sm font-medium text-white uppercase tracking-widest">Fraud Alert</h3>
                <p className="text-xs md:text-[10px] text-white/80 uppercase tracking-wider mt-0.5">Duplicate Print Blocked</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm md:text-[11px] text-ink/70 leading-relaxed">
                <span className="font-medium text-rose">{fraudWarningOrders.length} order(s)</span> yang Anda coba cetak sudah memiliki status <span className="font-medium">SHIPPED / DELIVERED</span>. Ini mengindikasikan <span className="font-medium text-rose">DUPLICATE PRINT ATTEMPT</span>.
              </p>
              <div className="bg-rose/5 border border-rose/20 rounded-lg overflow-hidden">
                <table className="w-full text-xs md:text-[10px]">
                  <thead>
                    <tr className="bg-rose/10">
                      <th className="px-3 py-2 text-left font-medium text-ink/60 uppercase tracking-widest">Order ID</th>
                      <th className="px-3 py-2 text-left font-medium text-ink/60 uppercase tracking-widest">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-ink/60 uppercase tracking-widest">Printed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose/10">
                    {fraudWarningOrders.map(o => (
                      <tr key={o.id}>
                        <td className="px-3 py-2 font-mono font-medium text-ink">{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium uppercase text-xs md:text-[9px] rounded">{o.status}</span>
                        </td>
                        <td className="px-3 py-2 text-ink/50 font-mono">
                          {o.printed_at ? new Date(o.printed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs md:text-[10px] text-ink/40 text-center">
                Hubungi supervisor jika Anda yakin perlu mencetak ulang label ini.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-ink/5 flex justify-end gap-3">
              <button
                onClick={() => setIsFraudWarningOpen(false)}
                className="px-5 py-2 text-xs md:text-[10px] uppercase font-medium tracking-widest bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}
