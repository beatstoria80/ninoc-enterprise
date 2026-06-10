"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Shield, Users, DollarSign, Activity, ChevronRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AffiliateApp {
  id: string;
  full_name: string;
  email: string;
  channel_name: string;
  instagram_link: string;
  tiktok_link: string;
  status: string;
  created_at: string;
}

interface AffiliateData {
  id: string;
  code: string;
  tier: string;
  commission_rate: number;
  balance: number;
  status: string;
  user_id: string;
  customer_discount_type?: 'percentage' | 'fixed_amount';
  customer_discount_value?: number;
  auto_approve_withdrawals?: boolean;
}

export default function AffiliatesTab() {
  const [activeTab, setActiveTab] = useState<'applications' | 'active' | 'withdrawals'>('applications');
  const [applications, setApplications] = useState<AffiliateApp[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [clicksData, setClicksData] = useState<any[]>([]);
  const [commissionsData, setCommissionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const updateConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAffiliate) return;
    const form = e.currentTarget;
    const type = (form.elements.namedItem('discount_type') as HTMLSelectElement).value;
    const value = (form.elements.namedItem('discount_value') as HTMLInputElement).value;
    const autoApprove = (form.elements.namedItem('auto_approve') as HTMLInputElement).checked;

    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/affiliates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAffiliate.id,
          customer_discount_type: type,
          customer_discount_value: value,
          auto_approve_withdrawals: autoApprove
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      const json = await res.json();
      setSelectedAffiliate(json.data);
      setAffiliates(prev => prev.map(a => a.id === json.data.id ? json.data : a));
      alert('Configuration saved!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: apps },
        { data: affs },
        { data: clicks },
        { data: commissions },
        { data: wds }
      ] = await Promise.all([
        supabase.from('affiliate_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_clicks').select('affiliate_id'),
        supabase.from('affiliate_commissions').select('affiliate_id, sales_amount, commission_amount, status, created_at, order_id').order('created_at', { ascending: false }),
        supabase.from('affiliate_withdrawals').select('*, affiliates(code)').order('created_at', { ascending: false })
      ]);
      
      if (apps) setApplications(apps);
      if (affs) setAffiliates(affs);
      if (clicks) setClicksData(clicks);
      if (commissions) setCommissionsData(commissions);
      if (wds) setWithdrawals(wds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      setTimeout(() => fetchData(), 0);
    }
    return () => { mounted = false; };
  }, []);

  const handleApprove = async (app: AffiliateApp) => {
    if (!confirm(`Approve ${app.full_name} as affiliate?`)) return;
    
    // eslint-disable-next-line react-hooks/purity
    const code = (app.full_name.split(' ')[0] + Date.now().toString().slice(-4)).toUpperCase();

    alert("Approval logic requires user registration first (linking app to auth.users). Marking as approved in DB only.");
    
    await supabase.from('affiliate_applications').update({ status: 'approved' }).eq('id', app.id);
    fetchData();
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject application?')) return;
    await supabase.from('affiliate_applications').update({ status: 'rejected' }).eq('id', id);
    fetchData();
  };

  // Aggregation Helpers
  const getMetrics = (affId: string) => {
    const affiliateClicks = clicksData.filter(c => c.affiliate_id === affId).length;
    const affiliateComms = commissionsData.filter(c => c.affiliate_id === affId);
    
    const validOrders = affiliateComms.filter(c => c.status !== 'cancelled' && c.status !== 'rejected');
    const totalOrders = validOrders.length;
    const salesGenerated = validOrders.reduce((sum, c) => sum + (c.sales_amount || 0), 0);
    const totalCommission = validOrders.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    
    const conversionRate = affiliateClicks > 0 ? ((totalOrders / affiliateClicks) * 100).toFixed(1) : '0.0';
    
    return { clicks: affiliateClicks, totalOrders, salesGenerated, totalCommission, conversionRate, history: affiliateComms };
  };

  if (loading) return <div className="p-8 text-ink/50 text-sm font-medium uppercase tracking-widest">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-medium italic text-ink uppercase">Affiliates</h2>
          <p className="text-xs font-medium uppercase tracking-widest text-ink/40 mt-1">
            Manage partners and tracking
          </p>
        </div>

        <div className="flex p-1 bg-ink/5 rounded-none">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'applications' ? 'bg-white text-ink shadow-sm' : 'text-ink/40 hover:text-ink'
            }`}
          >
            Applications ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'active' ? 'bg-white text-ink shadow-sm' : 'text-ink/40 hover:text-ink'
            }`}
          >
            Active Partners ({affiliates.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'withdrawals' ? 'bg-white text-ink shadow-sm' : 'text-ink/40 hover:text-ink'
            }`}
          >
            Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
        </div>
      </div>

      {activeTab === 'applications' && (
        <div className="bg-white border border-ink/5 shadow-dashboard overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/5">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Applicant</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Channel</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[10px] uppercase tracking-widest text-ink/40">No applications found.</td>
                  </tr>
                ) : applications.map((app) => (
                  <tr key={app.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-medium text-ink uppercase tracking-tight">{app.full_name}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5">{app.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-medium text-ink uppercase tracking-tight">{app.channel_name}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5 max-w-[150px] truncate">IG: {app.instagram_link}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                        app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose/10 text-rose'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleApprove(app)} className="w-7 h-7 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors" title="Approve">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleReject(app.id)} className="w-7 h-7 bg-rose/5 text-rose flex items-center justify-center hover:bg-rose/10 transition-colors" title="Reject">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="bg-white border border-ink/5 shadow-dashboard overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/5">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Partner Code</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-center">Clicks</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-center">Orders</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Sales Generated</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Balance</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[10px] uppercase tracking-widest text-ink/40">No active affiliates yet.</td>
                  </tr>
                ) : affiliates.map((aff) => {
                  const metrics = getMetrics(aff.id);
                  return (
                  <tr key={aff.id} className="hover:bg-ink/[0.02] transition-colors cursor-pointer group" onClick={() => setSelectedAffiliate(aff)}>
                    <td className="p-4">
                      <p className="text-xs font-bold text-ink tracking-widest">{aff.code}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5">{aff.tier} • {aff.commission_rate}%</p>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-xs font-medium text-ink">{metrics.clicks}</p>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-xs font-medium text-ink">{metrics.totalOrders}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-xs font-medium text-emerald-600">Rp {metrics.salesGenerated.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-xs font-bold text-ink">Rp {aff.balance.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-[10px] uppercase tracking-widest font-bold text-rose opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end w-full gap-1">
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-ink/5 shadow-dashboard overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/5">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Partner Code</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Bank Account</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Amount</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-center">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[10px] uppercase tracking-widest text-ink/40">No withdrawal requests found.</td>
                  </tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-bold text-ink tracking-widest">{w.affiliates?.code}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5">{new Date(w.created_at).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-medium text-ink uppercase">{w.bank_name}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5">{w.account_number} a/n {w.account_name}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-xs font-bold text-ink">Rp {w.amount.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                        w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        w.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        w.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-rose/10 text-rose'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={async () => {
                             if(confirm('Process this withdrawal?')) {
                               await supabase.from('affiliate_withdrawals').update({ status: 'completed' }).eq('id', w.id);
                               fetchData();
                             }
                           }} className="w-7 h-7 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors" title="Mark Completed">
                            <Check size={14} />
                          </button>
                          <button onClick={async () => {
                             if(confirm('Reject this withdrawal? (Balance will be returned to affiliate manually)')) {
                               await supabase.from('affiliate_withdrawals').update({ status: 'rejected' }).eq('id', w.id);
                               fetchData();
                             }
                           }} className="w-7 h-7 bg-rose/5 text-rose flex items-center justify-center hover:bg-rose/10 transition-colors" title="Reject">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PERFORMANCE MODAL */}
      <AnimatePresence>
        {selectedAffiliate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6"
            onClick={() => setSelectedAffiliate(null)}
          >
            <motion.div
              layout
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {(() => {
                const metrics = getMetrics(selectedAffiliate.id);
                return (
                  <>
                    <div className="p-6 border-b border-ink/10 flex items-center justify-between bg-ink/5 shrink-0">
                      <div>
                        <h3 className="text-xl font-display font-medium text-ink uppercase">Performance: {selectedAffiliate.code}</h3>
                        <p className="text-xs text-ink/50 uppercase tracking-widest mt-1">
                          {selectedAffiliate.tier} Affiliate • {selectedAffiliate.commission_rate}% Rate
                        </p>
                      </div>
                      <button onClick={() => setSelectedAffiliate(null)} className="p-2 text-ink/40 hover:text-ink hover:bg-white rounded-full transition-all">
                        <XCircle size={24} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {/* Metric Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-ink/10 p-4 rounded-lg shadow-sm">
                          <p className="text-[10px] text-ink/50 uppercase tracking-widest mb-1">Total Clicks</p>
                          <p className="text-2xl font-bold text-ink">{metrics.clicks}</p>
                        </div>
                        <div className="bg-white border border-ink/10 p-4 rounded-lg shadow-sm">
                          <p className="text-[10px] text-ink/50 uppercase tracking-widest mb-1">Total Orders</p>
                          <p className="text-2xl font-bold text-ink">{metrics.totalOrders}</p>
                        </div>
                        <div className="bg-white border border-ink/10 p-4 rounded-lg shadow-sm">
                          <p className="text-[10px] text-ink/50 uppercase tracking-widest mb-1">Conversion</p>
                          <p className="text-2xl font-bold text-emerald-600">{metrics.conversionRate}%</p>
                        </div>
                        <div className="bg-white border border-ink/10 p-4 rounded-lg shadow-sm">
                          <p className="text-[10px] text-ink/50 uppercase tracking-widest mb-1">Sales Generated</p>
                          <p className="text-2xl font-bold text-ink">Rp {metrics.salesGenerated.toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      {/* Affiliate Configuration */}
                      <div>
                        <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Configuration</h4>
                        <form onSubmit={updateConfig} className="bg-white border border-ink/10 p-5 rounded-lg shadow-sm space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-ink/60 mb-1">Customer Discount Type</label>
                              <select name="discount_type" defaultValue={selectedAffiliate.customer_discount_type || 'percentage'} className="w-full bg-ink/5 border-none text-xs p-2.5 outline-none rounded-sm">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed_amount">Fixed Amount (Rp)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-ink/60 mb-1">Discount Value</label>
                              <input type="number" name="discount_value" defaultValue={selectedAffiliate.customer_discount_value || 0} className="w-full bg-ink/5 border-none text-xs p-2.5 outline-none rounded-sm" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="auto_approve" name="auto_approve" defaultChecked={selectedAffiliate.auto_approve_withdrawals} className="accent-ink" />
                            <label htmlFor="auto_approve" className="text-xs font-medium text-ink">Auto-Approve Withdrawals</label>
                          </div>
                          <div className="flex justify-end pt-2 border-t border-ink/10">
                            <button type="submit" disabled={savingConfig} className="px-6 py-2 bg-ink text-white text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-ink/80 transition-colors">
                              {savingConfig ? 'Saving...' : 'Save Configuration'}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Transaction History */}
                      <div>
                        <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Transaction History</h4>
                        <div className="border border-ink/10 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-ink/5 border-b border-ink/10">
                              <tr>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ink/60">Date</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ink/60">Order ID</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Sales</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-right">Commission</th>
                                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ink/60 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/5">
                              {metrics.history.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-6 text-center text-xs text-ink/40 uppercase tracking-widest">No transactions yet</td>
                                </tr>
                              ) : metrics.history.map((h: any, i: number) => (
                                <tr key={i} className="hover:bg-ink/[0.02]">
                                  <td className="p-3 text-xs text-ink/70">{new Date(h.created_at).toLocaleDateString('id-ID')}</td>
                                  <td className="p-3 text-xs font-medium text-ink">{h.order_id?.slice(0, 8)}...</td>
                                  <td className="p-3 text-xs text-right text-ink/70">Rp {h.sales_amount?.toLocaleString('id-ID') || 0}</td>
                                  <td className="p-3 text-xs text-right font-medium text-emerald-600">Rp {h.commission_amount?.toLocaleString('id-ID') || 0}</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                      h.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                      h.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                      'bg-rose/10 text-rose'
                                    }`}>
                                      {h.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
