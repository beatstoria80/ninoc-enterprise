import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Factory, Clock, AlertCircle } from 'lucide-react';

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (data) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this supplier as ${newStatus}?`)) return;
    await supabase.from('suppliers').update({ status: newStatus }).eq('id', id);
    fetchSuppliers();
  };

  if (loading) return <div className="p-8 text-center text-ink/40">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Supplier Partner Review</h2>
          <p className="text-xs text-ink/60">Approve or reject B2B manufacturer applications.</p>
        </div>
        <div className="bg-ink/5 p-3 rounded-lg flex gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Pending</p>
            <p className="text-xl font-bold text-amber-600">{suppliers.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="w-px bg-ink/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Active</p>
            <p className="text-xl font-bold text-emerald-600">{suppliers.filter(s => s.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-[10px] uppercase tracking-wider text-ink/60">
              <th className="p-4 font-medium">Factory / Company</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Applied Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-sm">
            {suppliers.map(sup => (
              <tr key={sup.id} className="hover:bg-ink/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-ink/5 flex items-center justify-center text-ink/40">
                      <Factory size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-ink">{sup.name}</p>
                      <p className="text-[10px] text-ink/40 font-mono">{sup.id.split('-')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-ink">{sup.contact_email}</p>
                  <p className="text-xs text-ink/50">{sup.contact_phone}</p>
                </td>
                <td className="p-4 text-ink/70">
                  {new Date(sup.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    sup.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    sup.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {sup.status === 'active' ? <Check size={10} /> : sup.status === 'pending' ? <Clock size={10} /> : <X size={10} />}
                    {sup.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {sup.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateStatus(sup.id, 'active')} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => updateStatus(sup.id, 'suspended')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors" title="Reject">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {sup.status === 'active' && (
                    <button onClick={() => updateStatus(sup.id, 'suspended')} className="text-[10px] text-red-500 hover:underline uppercase tracking-wider font-medium">
                      Suspend
                    </button>
                  )}
                  {sup.status === 'suspended' && (
                    <button onClick={() => updateStatus(sup.id, 'active')} className="text-[10px] text-emerald-500 hover:underline uppercase tracking-wider font-medium">
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink/40">
                  <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No supplier applications yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
