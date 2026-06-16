import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Search, Building } from 'lucide-react';

export function POTab() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false });
    if (data) setPos(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPOs();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Purchase Orders (PO)</h2>
          <p className="text-xs text-ink/80">Manage supply requests to your partner factories.</p>
        </div>
        <button className="px-2 py-1 bg-ink text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-2 rounded hover:bg-rose active:scale-[0.97] transition-all duration-150 ease-out">
          <Plus size={14} /> Create PO
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-[10px] uppercase tracking-wider text-ink/80">
              <th className="p-2 font-medium">PO Number</th>
              <th className="p-2 font-medium">Supplier</th>
              <th className="p-2 font-medium">Date</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-xs">
            {pos.map((po, idx) => (
              <tr 
                key={po.id} 
                className="stagger-fade-in hover:bg-ink/5 active:scale-[0.99] transition-all duration-150 ease-out cursor-pointer origin-left"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              >
                <td className="p-2 font-medium text-ink">{po.po_number}</td>
                <td className="p-2 text-ink/90 flex items-center gap-2">
                  <Building size={14} className="text-ink/80" />
                  {po.suppliers?.name || 'Unknown'}
                </td>
                <td className="p-2 text-ink/90">
                  {new Date(po.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="p-2">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded-full ${
                    po.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    po.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {po.status}
                  </span>
                </td>
                <td className="p-2 text-right font-medium text-ink">
                  Rp {po.total_amount?.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
            {pos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink/80">
                  <FileText className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No Purchase Orders found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
