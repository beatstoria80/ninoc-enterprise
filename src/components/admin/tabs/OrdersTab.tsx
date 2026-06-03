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

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resi Massal - NINOC Archive</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f9fafb; color: #141414; }
            .label-card { 
              background: white; 
              border: 1px dashed #d1d5db; 
              padding: 24px; 
              margin-bottom: 24px; 
              border-radius: 8px;
              width: 100%;
              max-width: 500px;
              page-break-inside: avoid;
            }
            .header { border-bottom: 2px solid #141414; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-size: 18px; font-weight: 600; font-style: italic; letter-spacing: -0.05em; text-transform: uppercase; }
            .order-info { font-size: 11px; text-transform: uppercase; font-weight: 500; text-align: right; }
            .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
            .address-box { margin-bottom: 16px; }
            .address-text { font-size: 13px; font-weight: 600; margin: 0 0 4px 0; }
            .address-detail { font-size: 12px; color: #374151; margin: 0; line-height: 1.5; }
            .footer { border-top: 1px dashed #d1d5db; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #374151; }
            .item-line { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .courier-badge { display: inline-block; padding: 4px 8px; border: 1px solid #141414; font-size: 10px; font-weight: 600; text-transform: uppercase; border-radius: 4px; margin-bottom: 12px; }
            @media print {
              body { background: white; padding: 0; }
              .label-card { border: 1px solid #141414; margin: 0 0 24px 0; border-radius: 0; page-break-after: always; max-width: none; }
            }
          </style>
        </head>
        <body>
          ${validOrders.map(order => `
            <div class="label-card">
              <div class="header">
                <div class="brand">NINOC</div>
                <div class="order-info">
                  <div>ORDER #${order.id.slice(0, 10).toUpperCase()}</div>
                  <div style="color: #6b7280; margin-top: 2px;">${new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                </div>
              </div>
              <div class="courier-badge">
                ${order.courier || 'STANDARD COURIER'}
              </div>
              <div class="address-box">
                <div class="section-title">Recipient (Penerima)</div>
                <p class="address-text">${order.shipping_address?.name || 'GUEST'}</p>
                <p class="address-detail font-mono">${order.shipping_address?.phone || '-'}</p>
                <p class="address-detail mt-1">${order.shipping_address?.address || '-'}</p>
                <p class="address-detail text-transform: uppercase;">${order.shipping_address?.city || '-'}</p>
              </div>
              <div class="footer">
                <div class="section-title" style="margin-bottom: 8px;">Order Items</div>
                ${order.order_items?.map(i => `
                  <div class="item-line">
                    <span>${i.quantity}x ${i.product_name}</span>
                    <span>${i.size ? `Size: ${i.size}` : ''}</span>
                  </div>
                `).join('') || '<div class="item-line">No items found</div>'}
              </div>
            </div>
          `).join('')}
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between border-b border-ink/5 pb-4">
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
            Print Resi Massal
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-[10px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors">
            Export Data
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-ink/5 overflow-x-auto no-scrollbar">
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
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
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
      <div className="border border-ink/10 rounded-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Box size={24} className="text-ink/20 mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-medium text-ink/40">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
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
        <div className="flex items-center justify-between py-4 border-t border-ink/5 mt-4">
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
  );
}
