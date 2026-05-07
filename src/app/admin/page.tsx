"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, Plus, Search, 
  MoreVertical, TrendingUp, Box, BarChart3, Bell, LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
      active ? "bg-ink text-white shadow-lg shadow-ink/20" : "text-ink/40 hover:bg-ink/5 hover:text-ink"
    )}
  >
    <Icon size={18} className={cn("transition-transform group-hover:scale-110", active ? "text-rose" : "text-current")} />
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    {active && <motion.div layoutId="activeTab" className="ml-auto w-1 h-4 bg-rose rounded-full" />}
  </button>
);

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch('https://esiapizmdpylhotojfij.supabase.co/rest/v1/products?select=*', {
            headers: {
              'apikey': 'sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK',
              'Authorization': 'Bearer sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK'
            }
          }),
          fetch('https://esiapizmdpylhotojfij.supabase.co/rest/v1/orders?select=*', {
            headers: {
              'apikey': 'sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK',
              'Authorization': 'Bearer sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK'
            }
          })
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (orderRes.ok) setOrders(await orderRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = orders.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink font-sans flex selection:bg-rose/20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-ink/5 bg-white p-6 flex-col gap-8 hidden lg:flex sticky top-0 h-screen">
        <div className="px-2">
          <div className="font-display font-black text-2xl italic tracking-tighter text-rose leading-none">NINOC</div>
          <div className="text-[7px] font-black tracking-[0.5em] text-ink/20 -mt-0.5 ml-0.5 uppercase">Atelier Control</div>
        </div>
        <nav className="flex flex-col gap-2">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarItem icon={ShoppingCart} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </nav>
        <div className="mt-auto pt-8 border-t border-ink/5 flex flex-col gap-2">
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={LogOut} label="Logout" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-ink/5 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-[110]">
          <h1 className="text-sm font-black uppercase tracking-[0.3em]">System / <span className="text-rose">{activeTab}</span></h1>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/20" size={14} />
              <input type="text" placeholder="Search archive..." className="bg-ink/5 border-none rounded-full py-2 pl-10 pr-4 text-[10px] font-bold focus:ring-1 focus:ring-rose/30 w-64" />
            </div>
            <button className="p-2 text-ink/40 hover:text-rose transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose to-orange-400 border-2 border-white shadow-lg" />
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: `Rp ${(totalRevenue / 1000000).toFixed(1)}M`, trend: 'Live', icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Total Orders', value: orders.length, trend: 'Sync', icon: ShoppingCart, color: 'text-blue-500' },
              { label: 'Inventory', value: products.length, trend: 'Sync', icon: Box, color: 'text-rose' },
              { label: 'Conversion', value: '4.2%', trend: '+0.5%', icon: BarChart3, color: 'text-purple-500' },
            ].map((stat, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}
                className="bg-white p-6 rounded-[2rem] border border-ink/5 shadow-dashboard hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl bg-ink/5", stat.color)}><stat.icon size={20} /></div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{stat.trend}</span>
                </div>
                <p className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className="text-2xl font-display font-black italic mt-1">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2.5rem] border border-ink/5 shadow-dashboard overflow-hidden">
                <div className="p-8 border-b border-ink/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-display font-black italic">Inventory Archive</h2>
                    <p className="text-[10px] text-muted-text font-medium uppercase tracking-widest mt-1">Manage your premium collections</p>
                  </div>
                  <button className="bg-ink text-white px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20">
                    <Plus size={16} className="text-rose" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Product</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-ink/[0.02] text-[10px] font-black text-ink/40 uppercase tracking-widest">
                        <th className="px-8 py-6">Product</th>
                        <th className="px-8 py-6">Category</th>
                        <th className="px-8 py-6">Price</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {isLoading ? [1,2,3].map(i => (
                        <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-6 h-20 bg-ink/[0.01]" /></tr>
                      )) : products.map((p) => (
                        <tr key={p.id} className="hover:bg-ink/[0.01] transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-ink/5 overflow-hidden flex items-center justify-center">
                                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-ink/10" />}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-tight">{p.name}</p>
                                <p className="text-[9px] text-muted-text font-medium">{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink/60 bg-ink/5 px-3 py-1 rounded-full">{p.category} / {p.sub_category || 'General'}</span>
                          </td>
                          <td className="px-8 py-6 text-xs font-black text-rose">Rp {p.price.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <button className="p-2 hover:bg-ink/5 rounded-lg transition-colors text-ink/20 hover:text-ink"><MoreVertical size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2.5rem] border border-ink/5 shadow-dashboard overflow-hidden">
                <div className="p-8 border-b border-ink/5">
                  <h2 className="text-lg font-display font-black italic">Sales Archive</h2>
                  <p className="text-[10px] text-muted-text font-medium uppercase tracking-widest mt-1">Monitor real-time customer transactions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-ink/[0.02] text-[10px] font-black text-ink/40 uppercase tracking-widest">
                        <th className="px-8 py-6">Order ID</th>
                        <th className="px-8 py-6">Customer</th>
                        <th className="px-8 py-6">Amount</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {orders.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-20 text-center text-ink/20 italic font-medium">No transactions recorded yet.</td></tr>
                      ) : orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-ink/[0.01] transition-colors">
                          <td className="px-8 py-6 font-mono text-[10px] font-bold text-rose">#{o.id.split('-')[0].toUpperCase()}</td>
                          <td className="px-8 py-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink">Customer</p>
                            <p className="text-[9px] text-muted-text">{o.user_id || 'Guest'}</p>
                          </td>
                          <td className="px-8 py-6 text-xs font-black">Rp {o.total_price.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-6">
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                              o.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>{o.status}</span>
                          </td>
                          <td className="px-8 py-6 text-[9px] font-medium text-ink/40">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {(activeTab === 'overview' || activeTab === 'analytics') && (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-64 flex items-center justify-center bg-ink/[0.02] rounded-[2.5rem] border border-dashed border-ink/10">
                <p className="label-caps text-ink/20">Module Under Expansion</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
