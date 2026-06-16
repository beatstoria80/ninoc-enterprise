import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Factory, Clock, AlertCircle, FileText, Download, ShieldCheck } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this supplier as ${newStatus}?`)) return;
    await supabase.from('suppliers').update({ status: newStatus }).eq('id', id);
    fetchSuppliers();
  };

  const viewDocument = async (path: string) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from('supplier_documents').createSignedUrl(path, 60 * 5); // 5 minutes
    if (error) {
      alert('Error fetching document: ' + error.message);
    } else if (data) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center text-ink/80">Loading suppliers...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Supplier Partner Review (KYC)</h2>
          <p className="text-xs text-ink/80">Approve or reject B2B manufacturer applications and verify legal integrity.</p>
        </div>
        <div className="bg-ink/5 p-3 rounded-lg flex gap-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/90">Pending</p>
            <p className="text-xl font-bold text-amber-600">{suppliers.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="w-px bg-ink/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink/90">Active</p>
            <p className="text-xl font-bold text-emerald-600">{suppliers.filter(s => s.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-[10px] uppercase tracking-wider text-ink/80">
              <th className="p-2 font-medium">Factory / Company</th>
              <th className="p-2 font-medium">Legal Identity (KYC)</th>
              <th className="p-2 font-medium">Legal Documents</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-xs">
            {suppliers.map(sup => (
              <tr key={sup.id} className="hover:bg-ink/5 transition-colors">
                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-ink/5 flex items-center justify-center text-ink/80 shrink-0">
                      <Factory size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-ink">{sup.name}</p>
                      <p className="text-[10px] text-ink/80 font-mono">{sup.contact_email}</p>
                      <p className="text-[10px] text-ink/80 font-mono">{sup.contact_phone}</p>
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      {sup.legal_entity_type || 'Unknown'} {sup.legal_name || 'No Data'}
                    </p>
                    <p className="text-[10px] text-ink/80">Dir: {sup.director_name || '-'}</p>
                    <p className="text-[10px] text-ink/80">NPWP: {sup.tax_id || '-'}</p>
                    <p className="text-[10px] text-ink/80">NIB: {sup.business_registration_number || '-'}</p>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col gap-1.5">
                    {sup.id_card_url ? (
                      <button onClick={() => viewDocument(sup.id_card_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors">
                        <FileText size={12} /> KTP Direktur
                      </button>
                    ) : <span className="text-[10px] text-rose/50">No KTP</span>}
                    
                    {sup.tax_id_url ? (
                      <button onClick={() => viewDocument(sup.tax_id_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors">
                        <FileText size={12} /> NPWP
                      </button>
                    ) : <span className="text-[10px] text-rose/50">No NPWP</span>}

                    {sup.business_license_url ? (
                      <button onClick={() => viewDocument(sup.business_license_url)} className="flex items-center gap-2 text-[10px] uppercase font-medium text-ink/80 hover:text-rose transition-colors">
                        <FileText size={12} /> NIB
                      </button>
                    ) : <span className="text-[10px] text-rose/50">No NIB</span>}
                  </div>
                </td>
                <td className="p-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    sup.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    sup.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {sup.status === 'active' ? <Check size={10} /> : sup.status === 'pending' ? <Clock size={10} /> : <X size={10} />}
                    {sup.status}
                  </span>
                </td>
                <td className="p-2 text-right">
                  {sup.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateStatus(sup.id, 'active')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold tracking-widest hover:bg-emerald-100 rounded transition-colors" title="Approve">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(sup.id, 'suspended')} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] uppercase font-bold tracking-widest hover:bg-red-100 rounded transition-colors" title="Reject">
                        Reject
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
                <td colSpan={5} className="p-8 text-center text-ink/80">
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
