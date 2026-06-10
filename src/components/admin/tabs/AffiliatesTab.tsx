"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Shield, Users, DollarSign, Activity } from 'lucide-react';

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
}

export default function AffiliatesTab() {
  const [activeTab, setActiveTab] = useState<'applications' | 'active'>('applications');
  const [applications, setApplications] = useState<AffiliateApp[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: apps } = await supabase
        .from('affiliate_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: affs } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (apps) setApplications(apps);
      if (affs) setAffiliates(affs);
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
    
    // Generate a unique code (e.g., firstname+random)
    // eslint-disable-next-line react-hooks/purity
    const code = (app.full_name.split(' ')[0] + Date.now().toString().slice(-4)).toUpperCase();

    // In a real app we need their user_id, but applications might not have user_id if they apply without logging in.
    // For now, we will assume user_id is the same as application id to satisfy the schema or just use a dummy UUID if they aren't registered,
    // Actually, user_id references auth.users. It must be valid. 
    // If not valid, it might fail. Since this is an admin dashboard preview:
    alert("Approval logic requires user registration first (linking app to auth.users). Marking as approved in DB only.");
    
    await supabase.from('affiliate_applications').update({ status: 'approved' }).eq('id', app.id);
    fetchData();
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject application?')) return;
    await supabase.from('affiliate_applications').update({ status: 'rejected' }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="p-8 text-ink/50 text-sm font-medium uppercase tracking-widest">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
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
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Tier / Rate</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Balance</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-ink/60">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[10px] uppercase tracking-widest text-ink/40">No active affiliates yet.</td>
                  </tr>
                ) : affiliates.map((aff) => (
                  <tr key={aff.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-bold text-ink tracking-widest">{aff.code}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] font-bold text-ink uppercase tracking-widest">{aff.tier}</p>
                      <p className="text-[10px] text-ink/50 mt-0.5">{aff.commission_rate}%</p>
                    </td>
                    <td className="p-4 text-xs font-medium text-ink">
                      Rp {aff.balance.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                        aff.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose/10 text-rose'
                      }`}>
                        {aff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
