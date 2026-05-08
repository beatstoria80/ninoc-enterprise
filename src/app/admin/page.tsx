"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, Plus, Search,
  TrendingUp, Box, BarChart3, LogOut, X, Save, ShieldCheck, ClipboardList, Database,
  MessageSquare, Truck, Globe, Zap, CheckCircle2, Clock, AlertCircle, Key, Link as LinkIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-b border-ink/5",
      active ? "bg-ink text-white" : "text-ink/40 hover:bg-ink/5 hover:text-ink"
    )}
  >
    <Icon size={16} className={cn(active ? "text-rose" : "text-current")} />
    <span className="text-[10px] font-medium uppercase tracking-[0.4em]">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-rose rounded-full shadow-[0_0_10px_rgba(232,82,122,0.5)]" />}
  </button>
);

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  slug: string;
  image_url: string;
}

interface Order {
  id: string;
  customer_name?: string;
  total_price: number;
  status: string;
  created_at: string;
  courier?: string;
  tracking_id?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [selectedOrderLogs, setSelectedOrderLogs] = useState<any[]>([]);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    const { data: logs } = await supabase.from('tracking_logs').select('*').eq('order_id', order.id).order('created_at', { ascending: false });
    if (items) setSelectedOrderItems(items);
    if (logs) setSelectedOrderLogs(logs);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white noise flex overflow-hidden font-medium">
      
      {/* SIDEBAR ARCHIVE CONTROL */}
      <aside className="w-80 bg-white border-r border-ink/10 flex flex-col z-[100] relative">
        <div className="p-10 border-b border-ink/10">
          <div className="font-display font-medium text-3xl italic tracking-tighter text-rose uppercase leading-none">Ninoc</div>
          <p className="text-[8px] uppercase tracking-[0.5em] text-ink/30 mt-3">Atelier Control Center</p>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-6">
          <div className="px-10 mb-6">
            <p className="text-[8px] uppercase tracking-[0.3em] text-ink/20">Operational</p>
          </div>
          <SidebarItem icon={LayoutDashboard} label="Situation Report" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={ClipboardList} label="Fulfillment Logs" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={Truck} label="Logistics Dispatch" active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} />
          
          <div className="px-10 mt-12 mb-6">
            <p className="text-[8px] uppercase tracking-[0.3em] text-ink/20">Configuration</p>
          </div>
          <SidebarItem icon={Settings} label="Atelier Config" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <button className="w-full flex items-center gap-4 px-6 py-4 text-ink/40 hover:bg-rose/5 hover:text-rose transition-all mt-auto border-t border-ink/10">
            <LogOut size={16} />
            <span className="text-[10px] uppercase tracking-[0.4em]">Exit Center</span>
          </button>
        </nav>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-24 bg-white border-b border-ink/10 px-12 flex items-center justify-between z-50">
          <div className="flex items-center gap-4">
             <span className="text-[10px] uppercase tracking-[0.4em] text-ink/20">Atelier /</span>
             <h2 className="text-xl font-display italic uppercase tracking-tighter text-ink">{activeTab.replace('_', ' ')}</h2>
          </div>

          <div className="flex items-center gap-8">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full border transition-all",
              logisticsConfig.is_live ? "bg-emerald-50 border-emerald-100" : "bg-rose/5 border-rose/10"
            )}>
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", logisticsConfig.is_live ? "bg-emerald-500" : "bg-rose-500")} />
               <span className={cn("text-[8px] uppercase tracking-widest", logisticsConfig.is_live ? "text-emerald-700" : "text-rose-700")}>
                 {logisticsConfig.is_live ? "Network Live" : "Dev Instance"}
               </span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="flex-1 overflow-y-auto no-scrollbar bg-ink/[0.01] p-12">
          
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex items-end justify-between border-b border-ink/5 pb-8">
                  <div className="space-y-1">
                    <h3 className="text-4xl font-display italic uppercase tracking-tighter">Active Shipments</h3>
                    <p className="text-[9px] uppercase tracking-widest text-ink/30">Real-time status of all origin specifications in transit.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-[1px] bg-ink/5 border border-ink/5">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => openOrderDetails(order)}
                      className="bg-white p-8 flex items-center justify-between hover:bg-ink/[0.01] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-12 flex-1">
                        <div className="space-y-1 w-40">
                          <p className="text-[8px] uppercase tracking-widest text-ink/30">Reference ID</p>
                          <p className="text-[11px] uppercase tracking-wider">{order.id}</p>
                        </div>
                        <div className="space-y-1 w-48">
                          <p className="text-[8px] uppercase tracking-widest text-ink/30">Consignee</p>
                          <p className="text-[11px] uppercase tracking-tight truncate">{order.customer_name || 'Individual Entity'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase tracking-widest text-ink/30">Status</p>
                          <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                            order.status === 'shipped' ? 'bg-rose/5 text-rose' : 'bg-ink/5 text-ink/40'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-12 text-right">
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase tracking-widest text-ink/30">Value</p>
                          <p className="text-[11px]">Rp {order.total_price.toLocaleString()}</p>
                        </div>
                        <Truck size={14} className="text-ink/10 group-hover:text-rose transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-ink/5 border border-ink/5">
                   {[
                     { label: 'Gross Investment', value: 'Rp 142.8M', icon: TrendingUp, color: 'text-rose' },
                     { label: 'Archival Catalog', value: products.length.toString(), icon: Package, color: 'text-ink' },
                     { label: 'Support Tickets', value: tickets.length.toString(), icon: MessageSquare, color: 'text-ink' },
                     { label: 'Dispatch Pending', value: orders.filter(o => o.status === 'pending').length.toString(), icon: Truck, color: 'text-rose' }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white p-10 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className={cn("w-10 h-10 bg-ink/5 rounded-full flex items-center justify-center", stat.color)}>
                              <stat.icon size={18} />
                           </div>
                           <span className="text-[7px] uppercase tracking-widest text-emerald-500">Live</span>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] uppercase tracking-[0.4em] text-ink/20">{stat.label}</p>
                           <p className="text-2xl font-display italic text-ink">{stat.value}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-12 pb-20">
                 <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-ink/20">Operational</p>
                    <h3 className="text-4xl font-display italic uppercase tracking-tighter">Logistics Infrastructure</h3>
                 </div>
                 <div className="bg-white border border-ink/5 p-12 space-y-12">
                    <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-ink/30">Biteship API Token</h4>
                          <input type="password" value={logisticsConfig.jne_api_key} onChange={(e) => setLogisticsConfig({...logisticsConfig, jne_api_key: e.target.value})} className="w-full bg-ink/5 py-4 px-6 text-[11px] outline-none border border-transparent focus:border-rose/20 transition-all" />
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-ink/30">Webhook Secret</h4>
                          <input type="password" value={logisticsConfig.jnt_api_key} onChange={(e) => setLogisticsConfig({...logisticsConfig, jnt_api_key: e.target.value})} className="w-full bg-ink/5 py-4 px-6 text-[11px] outline-none border border-transparent focus:border-rose/20 transition-all" />
                       </div>
                    </div>
                    <div className="pt-12 border-t border-ink/5 flex items-center justify-between">
                       <button onClick={() => setLogisticsConfig({...logisticsConfig, is_live: !logisticsConfig.is_live})} className={cn("w-10 h-5 rounded-full relative transition-all", logisticsConfig.is_live ? "bg-emerald-500" : "bg-ink/10")}>
                          <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", logisticsConfig.is_live ? "left-5.5" : "left-0.5")} />
                       </button>
                       <button onClick={saveLogisticsConfig} className="bg-ink text-white px-10 py-4 text-[9px] uppercase tracking-[0.4em] hover:bg-rose transition-all flex items-center gap-3">
                          <Save size={14} /> Commit Settings
                       </button>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </section>
      </div>

      {/* DETAIL MODAL: Technical Specification Inspection */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] bg-ink/40 backdrop-blur-sm flex items-center justify-end"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-[600px] h-full bg-white shadow-2xl p-12 overflow-y-auto no-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-16">
                <div className="space-y-1">
                  <h4 className="text-[9px] uppercase tracking-widest text-ink/30 italic">Technical Inspection</h4>
                  <h2 className="text-2xl font-display italic uppercase tracking-tighter">{selectedOrder.id}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-ink/5 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-12">
                {/* Items */}
                <section className="space-y-6">
                  <h5 className="text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Origin Specification</h5>
                  <div className="space-y-4">
                    {selectedOrderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <p className="uppercase tracking-wide">{item.product_name} ({item.size})</p>
                        <p className="text-ink/40">x{item.quantity} • Rp {item.unit_price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Logistics Log */}
                <section className="space-y-6">
                  <h5 className="text-[10px] uppercase tracking-[0.4em] border-b border-ink/5 pb-4">Temporal Archive (Tracking)</h5>
                  <div className="space-y-6">
                    {selectedOrderLogs.length === 0 ? (
                      <p className="text-[10px] italic text-ink/30 uppercase tracking-widest">No logistics events recorded yet.</p>
                    ) : (
                      selectedOrderLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-6">
                          <div className="w-px bg-ink/10 relative">
                            <div className="absolute top-1 -left-1 w-2.5 h-2.5 rounded-full bg-white border border-ink/20" />
                          </div>
                          <div className="space-y-1 pb-4">
                            <p className="text-[10px] uppercase tracking-wide">{log.biteship_status.replace(/_/g, ' ')}</p>
                            <p className="text-[8px] uppercase tracking-widest text-ink/30">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Address */}
                <section className="bg-ink/[0.01] border border-ink/5 p-8 space-y-4">
                  <h5 className="text-[10px] uppercase tracking-[0.4em]">Dispatch Node</h5>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-tight">{selectedOrder.shipping_address?.name}</p>
                    <p className="text-[10px] text-ink/40 leading-relaxed uppercase">{selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.city}</p>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
            
            {/* OTHER TABS OMITTED FOR BREVITY BUT KEPT IN LOGIC */}
          </AnimatePresence>
          
        </section>
      </div>
    </main>
  );
}
