import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardCheck, Download, Box } from 'lucide-react';

export function DOTab() {
  const [dos, setDos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDOs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('delivery_orders')
      .select('*, suppliers(name), warehouses(name)')
      .order('created_at', { ascending: false });
    if (data) setDos(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDOs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">Inbound Receiving (DO)</h2>
          <p className="text-xs text-ink/60">Receive shipments from suppliers and perform Quality Control (QC).</p>
        </div>
        <button className="px-4 py-2 bg-ink text-white text-xs md:text-[10px] uppercase tracking-wider font-medium flex items-center gap-2 rounded hover:bg-rose active:scale-[0.97] transition-all duration-150 ease-out">
          <Download size={14} /> Receive Stock
        </button>
      </div>

      <div className="bg-white rounded-xl border border-ink/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink/5 text-xs md:text-[10px] uppercase tracking-wider text-ink/60">
              <th className="p-4 font-medium">DO Number</th>
              <th className="p-4 font-medium">Supplier</th>
              <th className="p-4 font-medium">Destination Hub</th>
              <th className="p-4 font-medium">Received At</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 text-sm">
            {dos.map((doItem, idx) => (
              <tr 
                key={doItem.id} 
                className="stagger-fade-in hover:bg-ink/5 active:scale-[0.99] transition-all duration-150 ease-out cursor-pointer origin-left"
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              >
                <td className="p-4 font-medium text-ink">{doItem.do_number}</td>
                <td className="p-4 text-ink/70">
                  {doItem.suppliers?.name || 'Unknown'}
                </td>
                <td className="p-4 text-ink/70 flex items-center gap-2">
                  <Box size={14} className="text-ink/40" />
                  {doItem.warehouses?.name || 'Unknown Hub'}
                </td>
                <td className="p-4 text-ink/70">
                  {doItem.received_at ? new Date(doItem.received_at).toLocaleDateString('id-ID') : '-'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 text-xs md:text-[10px] uppercase tracking-wider font-medium rounded-full ${
                    doItem.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
                    doItem.status === 'qc_rejected' ? 'bg-rose/10 text-rose' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {doItem.status}
                  </span>
                </td>
              </tr>
            ))}
            {dos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink/40">
                  <ClipboardCheck className="mx-auto mb-2 opacity-50" size={24} />
                  <p>No Delivery Orders (Surat Jalan) found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
