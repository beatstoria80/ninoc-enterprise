import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Box, CreditCard, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '../types';

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
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return order.id.toLowerCase().includes(q) || 
             order.shipping_address?.name.toLowerCase().includes(q) ||
             order.shipping_address?.phone.includes(q);
    }
    return true;
  });

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
        <button className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-[10px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors">
          Export Data
        </button>
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
          <button className="flex items-center gap-2 px-3 py-1.5 border border-ink/10 rounded-sm text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:border-rose/50 hover:text-rose transition-colors">
            <Filter size={12} /> Filter
          </button>
          <div className="h-4 w-px bg-ink/10 mx-1" />
          {['Payment Method', 'Courier', 'Date Range', 'Sort By'].map((filter, i) => (
            <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 rounded-sm text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:bg-ink/10 transition-colors">
              {filter} <ChevronDown size={10} />
            </button>
          ))}
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

      {/* Order Cards List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-ink/10 rounded-md">
            <Box size={32} className="text-ink/20 mb-3" />
            <p className="text-[10px] uppercase tracking-wider font-medium text-ink/40">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-ink/10 rounded-sm overflow-hidden hover:border-ink/20 transition-colors">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-ink/5 border-b border-ink/10">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-ink">#{order.id.slice(0, 12).toUpperCase()}</span>
                  <span className="text-[10px] font-medium text-ink/40">{new Date(order.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider px-2 py-1 border rounded-sm font-medium",
                    order.status === 'pending' ? "border-amber-200 bg-amber-50 text-amber-600" :
                    order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-600" :
                    order.status === 'shipped' ? "border-blue-200 bg-blue-50 text-blue-600" :
                    order.status === 'delivered' ? "border-teal-200 bg-teal-50 text-teal-600" :
                    "border-red-200 bg-red-50 text-red-600"
                  )}>
                    {order.status === 'pending' ? 'Waiting Payment' : order.status}
                  </span>
                  <button onClick={() => openOrderDetail(order)} className="text-[10px] font-medium uppercase tracking-wider text-rose hover:text-rose/80 transition-colors">
                    View Detail
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
                {/* Product Info */}
                <div className="col-span-1 md:col-span-1 space-y-3">
                  <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Product Info</p>
                  {order.order_items?.slice(0, 2).map((item, idx) => (
                    <div key={item.id || idx} className="flex gap-3">
                      <div className="w-12 h-12 bg-ink/5 rounded-sm shrink-0 border border-ink/5">
                        {/* Thumbnail placeholder or image */}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-ink line-clamp-2 leading-tight">{item.product_name}</p>
                        <p className="text-[9px] text-ink/40 mt-1 uppercase">Size: {item.size || '-'} | Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.order_items && order.order_items.length > 2 && (
                    <button className="text-[9px] text-rose uppercase tracking-wider font-medium">+{order.order_items.length - 2} more items</button>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="col-span-1 md:col-span-1">
                  <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Shipping To</p>
                  <p className="text-[11px] font-medium text-ink">{order.shipping_address?.name || 'Guest User'}</p>
                  <p className="text-[10px] font-medium text-ink/60 font-mono mt-1">{order.shipping_address?.phone || '-'}</p>
                  <p className="text-[10px] font-medium text-ink/40 mt-1 line-clamp-2 leading-relaxed">{order.shipping_address?.address}</p>
                  <p className="text-[10px] font-medium text-ink/40 mt-1 uppercase">{order.shipping_address?.city}</p>
                </div>

                {/* Payment */}
                <div className="col-span-1 md:col-span-1">
                  <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Payment</p>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} className="text-ink/40" />
                    <span className="text-[11px] font-medium text-ink uppercase tracking-wider">Midtrans</span>
                  </div>
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-medium",
                    order.payment_status === 'success' ? "text-emerald-600" :
                    order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                  )}>
                    {order.payment_status}
                  </span>
                </div>

                {/* Courier */}
                <div className="col-span-1 md:col-span-1">
                  <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Courier</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={14} className="text-ink/40" />
                    <span className="text-[11px] font-medium text-ink uppercase tracking-wider">{order.courier || 'Standard'}</span>
                  </div>
                  <p className="text-[10px] font-medium text-ink/40 font-mono mt-1">{order.tracking_id || 'No tracking ID'}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-end px-4 py-3 bg-ink/5 border-t border-ink/10">
                <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40 mr-4">Total Amount</p>
                <p className="text-sm font-medium text-ink">IDR {order.total_price.toLocaleString('id-ID')}</p>
              </div>
            </div>
          ))
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
