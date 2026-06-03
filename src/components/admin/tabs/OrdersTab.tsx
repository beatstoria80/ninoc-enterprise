import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Box, X, Calendar, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '../types';

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
          "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-medium uppercase tracking-wider transition-colors",
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
                  "w-full text-left px-3 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors",
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
          "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-medium uppercase tracking-wider transition-colors",
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
              <label className="text-[9px] uppercase tracking-widest text-ink/40 mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => onChangeFrom(e.target.value)}
                className="w-full px-2 py-1.5 border border-ink/10 rounded-sm text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-ink/40 mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => onChangeTo(e.target.value)}
                className="w-full px-2 py-1.5 border border-ink/10 rounded-sm text-[10px] font-medium text-ink focus:outline-none focus:border-rose/50"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-ink/5">
              <button
                onClick={() => { onClear(); onClose(); }}
                className="text-[9px] uppercase tracking-wider font-medium text-ink/40 hover:text-ink transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="text-[9px] uppercase tracking-wider font-medium text-rose hover:text-rose/80 transition-colors"
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
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  openOrderDetail
}: {
  orders: Order[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  openOrderDetail: (o: Order) => void;
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

  // ── Dropdown open states (only one at a time) ──
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null);
  }, []);

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

    // Simulate label generation for UI/UX polish
    setTimeout(() => {
      setIsPrinting(false);
      setIsPrintModalOpen(false);

      const ordersToPrint = orders.filter(o => selectedPrintOrders.includes(o.id));
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

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
    }, 1500);
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
          <p className="text-[10px] uppercase tracking-wider text-ink/40 mt-1">Transaction History & Management</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrintResi}
            className="flex items-center gap-2 px-4 py-2 border border-ink/10 text-ink/70 text-[10px] uppercase font-medium tracking-wider rounded hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <Printer size={12} />
            Print Label
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-[10px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors">
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
              "relative px-4 py-3 text-[10px] uppercase font-medium tracking-wider whitespace-nowrap transition-colors",
              statusFilter === tab.id ? "text-rose" : "text-ink/40 hover:text-ink/70"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-2 px-1.5 py-0.5 text-[8px] rounded",
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
              "flex items-center gap-2 px-3 py-1.5 border rounded-sm text-[10px] font-medium uppercase tracking-wider transition-colors",
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
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-ink/10 rounded-sm text-[10px] font-medium focus:outline-none focus:border-rose/50 transition-colors placeholder:text-ink/20"
          />
        </div>
      </div>

      {/* Order Table */}
      <div className="flex-1 min-h-0 flex flex-col border border-ink/10 rounded-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center">
            <Box size={24} className="text-ink/20 mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-medium text-ink/40">No orders found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto minimal-scroll relative bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-ink/[0.03] border-b border-ink/10">
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Order ID</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Date</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Product</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap">Courier</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap text-right">Amount</th>
                  <th className="px-3 py-2 text-[9px] uppercase tracking-widest text-ink/40 font-medium whitespace-nowrap w-[1%]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors cursor-pointer group"
                    onClick={() => openOrderDetail(order)}
                  >
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-medium text-ink font-mono tracking-wider">#{order.id.slice(0, 10).toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-medium text-ink/50 whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[120px]">
                        <p className="text-[10px] font-medium text-ink truncate">{order.shipping_address?.name || '—'}</p>
                        <p className="text-[9px] text-ink/40 font-mono truncate">{order.shipping_address?.phone || ''}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[160px]">
                        <p className="text-[10px] font-medium text-ink truncate">{order.order_items?.[0]?.product_name || '—'}</p>
                        {order.order_items && order.order_items.length > 1 && (
                          <span className="text-[9px] text-rose font-medium">+{order.order_items.length - 1} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        "inline-block text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
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
                        "text-[9px] uppercase tracking-wider font-medium",
                        order.payment_status === 'success' ? "text-emerald-600" :
                        order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                      )}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-medium text-ink/50 uppercase">{order.courier || '—'}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-[10px] font-medium text-ink whitespace-nowrap">{order.total_price.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}
                        className="text-[9px] font-medium uppercase tracking-wider text-rose opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="shrink-0 flex items-center justify-between py-4 border-t border-ink/5">
          <div className="flex items-center gap-2 text-[10px] uppercase font-medium tracking-wider text-ink/40">
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
            <button className="w-6 h-6 flex items-center justify-center border border-rose bg-rose text-white rounded-sm text-[10px] font-medium transition-colors">
              1
            </button>
            <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors text-[10px] font-medium">
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
    <AnimatePresence>
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
                <p className="text-[10px] text-ink/50 uppercase tracking-widest mt-1">Thermal Label (100x150mm)</p>
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
                  const validOrders = filteredOrders.filter(o => o.status === 'paid' || o.status === 'shipped');
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
                          <span className="text-[10px] uppercase font-medium tracking-wider text-ink">Select All ({validCount})</span>
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
                            <div>
                              <p className="text-[11px] font-medium text-ink font-mono tracking-wider">#{order.id.slice(0, 10).toUpperCase()}</p>
                              <p className="text-[10px] text-ink/50 mt-0.5">{order.shipping_address?.name || 'Guest'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "inline-block text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap",
                                order.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {order.status}
                              </span>
                              <span className="text-[10px] font-medium text-ink/50 uppercase w-16 text-right">{order.courier || 'STD'}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                      
                      {validCount === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">No valid orders found in current filter</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-ink/10 bg-ink/[0.02] flex justify-between items-center shrink-0">
              <span className="text-[10px] uppercase font-medium tracking-wider text-ink/50">
                {selectedPrintOrders.length} Orders Selected
              </span>
              
              <button
                onClick={executePrint}
                disabled={selectedPrintOrders.length === 0 || isPrinting}
                className="relative flex items-center justify-center gap-2 px-6 py-2.5 bg-ink text-white text-[10px] uppercase font-medium tracking-wider rounded-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden min-w-[160px]"
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
    </AnimatePresence>
  </>
  );
}
